import type { BoardModel } from '../board/boardTypes';
import type { PlacedComponent } from '../components/componentDefs';
import { KICAD_DEVICE_SYMBOLS, KICAD_GENERIC_DIP8, KICAD_GENERIC_DIP14 } from './kicadSymbols';
import { KICAD_MAPPING } from './kicadMapping';
import type { Netlist } from './netlistBuilder';

const GRID_COLS = 6;
const GRID_SPACING = 25.4; // mm, 1 inch
const MARGIN = 25.4;
const STUB_LENGTH = 5.08; // mm, extra distance a wire stub extends beyond a pin

function uuid(): string {
  return crypto.randomUUID();
}

function sanitizeLabel(id: string): string {
  return id.replace(/[^A-Za-z0-9_-]/g, '_');
}

interface Placement {
  component: PlacedComponent;
  ref: string;
  x: number;
  y: number;
}

function assignPlacements(boards: BoardModel[], components: PlacedComponent[]): Placement[] {
  const refCounters: Record<string, number> = {};
  const nextRef = (prefix: string) => {
    refCounters[prefix] = (refCounters[prefix] ?? 0) + 1;
    return `${prefix}${refCounters[prefix]}`;
  };

  const placements: Placement[] = [];
  let cell = 0;

  for (const board of boards) {
    const boardComponents = components.filter((c) => c.boardId === board.id);
    for (const component of boardComponents) {
      const mapping = KICAD_MAPPING[component.type];
      const col = cell % GRID_COLS;
      const row = Math.floor(cell / GRID_COLS);
      placements.push({
        component,
        ref: nextRef(mapping.refPrefix),
        x: MARGIN + col * GRID_SPACING,
        y: MARGIN + row * GRID_SPACING,
      });
      cell += 1;
    }
  }

  return placements;
}

function symbolBlock(placement: Placement): string {
  const { component, ref, x, y } = placement;
  const mapping = KICAD_MAPPING[component.type];
  const escapedValue = component.value.replace(/"/g, "'");
  return `\t(symbol (lib_id "${mapping.libId}") (at ${x} ${y} 0) (unit 1)
\t\t(in_bom yes) (on_board yes) (dnp no)
\t\t(uuid ${uuid()})
\t\t(property "Reference" "${ref}" (at ${x + 4} ${y - 2} 0)
\t\t\t(effects (font (size 1.27 1.27)))
\t\t)
\t\t(property "Value" "${escapedValue}" (at ${x + 4} ${y + 2} 0)
\t\t\t(effects (font (size 1.27 1.27)))
\t\t)
\t\t(property "Footprint" "${mapping.footprint}" (at ${x} ${y} 0)
\t\t\t(effects (font (size 1.27 1.27)) hide)
\t\t)
\t)`;
}

function symbolInstanceEntry(placement: Placement, rootUuid: string, symbolUuid: string): string {
  const mapping = KICAD_MAPPING[placement.component.type];
  const escapedValue = placement.component.value.replace(/"/g, "'");
  return `\t\t(path "/${rootUuid}/${symbolUuid}"
\t\t\t(reference "${placement.ref}") (unit 1) (value "${escapedValue}") (footprint "${mapping.footprint}")
\t\t)`;
}

/** A pin's local (x,y) is its outward connection point in symbol space (Y-up).
 * Placing a symbol at (originX, originY) with no rotation negates Y (KiCad's
 * library-to-schematic convention, confirmed empirically against real KiCad). */
function pinAbsolute(originX: number, originY: number, localX: number, localY: number) {
  return { x: originX + localX, y: originY - localY };
}

function stubAndLabel(originX: number, originY: number, localX: number, localY: number, netName: string): string {
  const pin = pinAbsolute(originX, originY, localX, localY);
  const len = Math.hypot(localX, localY) || 1;
  const ux = localX / len;
  const uy = localY / len;
  const stubEnd = pinAbsolute(originX, originY, localX + ux * STUB_LENGTH, localY + uy * STUB_LENGTH);

  return `\t(wire (pts (xy ${pin.x} ${pin.y}) (xy ${stubEnd.x} ${stubEnd.y}))
\t\t(stroke (width 0) (type default))
\t\t(uuid ${uuid()})
\t)
\t(global_label "${netName}" (shape input) (at ${stubEnd.x} ${stubEnd.y} 0)
\t\t(effects (font (size 1.27 1.27)) (justify left bottom))
\t\t(uuid ${uuid()})
\t)`;
}

/**
 * Builds a self-contained KiCad 7 .kicad_sch file: one symbol per placed
 * component (laid out in a simple grid, not matching the breadboard layout),
 * with each pin wired to a short stub + global_label named after its netlist
 * node. Nets connect by label name rather than by point-to-point routing,
 * which is the standard KiCad approach for netlist-driven schematics and
 * avoids messy crossing wires.
 *
 * Only a handful of standard KiCad Device symbols are used (see
 * kicadMapping.ts) since a DIY pedal breadboard only ever needs a handful of
 * through-hole part types. DIP-8/14 use a hand-authored generic placeholder
 * symbol (real chip identity isn't known from a breadboard placement) --
 * swap it for the real part's symbol once you know what IC you used.
 */
export function buildKicadSchematic(boards: BoardModel[], components: PlacedComponent[], netlist: Netlist): string {
  const rootUuid = uuid();
  const placements = assignPlacements(boards, components);
  const placementByComponentId = new Map(placements.map((p) => [p.component.id, p]));

  const usedSymbolNames = new Set(placements.map((p) => KICAD_MAPPING[p.component.type].symbolName));
  const libSymbolBlocks: string[] = [];
  for (const name of usedSymbolNames) {
    if (name === 'CabalGeneric_DIP8') libSymbolBlocks.push(KICAD_GENERIC_DIP8);
    else if (name === 'CabalGeneric_DIP14') libSymbolBlocks.push(KICAD_GENERIC_DIP14);
    else libSymbolBlocks.push(KICAD_DEVICE_SYMBOLS[name]);
  }

  const symbolUuids = new Map(placements.map((p) => [p.component.id, uuid()]));

  const symbolBlocks = placements.map(symbolBlock).join('\n\n');
  const symbolInstanceBlocks = placements
    .map((p) => symbolInstanceEntry(p, rootUuid, symbolUuids.get(p.component.id)!))
    .join('\n');

  const netBlocks: string[] = [];
  for (const node of netlist.nodes) {
    if (node.connected_pins.length === 0) continue;
    const netName = sanitizeLabel(node.id);
    for (const pinRef of node.connected_pins) {
      const placement = placementByComponentId.get(pinRef.component_id);
      if (!placement) continue;
      const mapping = KICAD_MAPPING[placement.component.type];
      const pin = mapping.pins[pinRef.pin_index];
      if (!pin) continue;
      netBlocks.push(stubAndLabel(placement.x, placement.y, pin.x, pin.y, netName));
    }
  }

  return `(kicad_sch
\t(version 20230121)
\t(generator eeschema)

\t(uuid ${rootUuid})

\t(paper "A3")

\t(lib_symbols
${libSymbolBlocks.join('\n')}
\t)

${symbolBlocks}

${netBlocks.join('\n\n')}

\t(sheet_instances
\t\t(path "/" (page "1"))
\t)

\t(symbol_instances
${symbolInstanceBlocks}
\t)
)
`;
}
