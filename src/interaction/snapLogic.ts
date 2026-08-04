import type { BoardModel, Hole, Zone } from '../board/boardTypes';
import { ROW_CODES, GRID_SIZE, zoneOf, holeId } from '../board/boardTypes';
import { COMPONENT_DEFS, isFlexibleComponent, type ComponentType, type PlacedComponent } from '../components/componentDefs';
import { rotateOffset, type Rotation } from './rotation';

function zonePairKey(a: Zone, b: Zone): string {
  return [a, b].sort().join('|');
}

/** Zone pairs a component's two pins may legitimately span without a separate
 * jumper wire - i.e. physically adjacent on a real board. Rail-to-terminal
 * (e.g. a resistor leg in the +rail, the other in row a) and rail-to-rail
 * (e.g. a bypass cap straight across the two top rails) are both extremely
 * common breadboard patterns; anything further (top rail to bottom terminal,
 * top rail to bottom rail, etc.) needs an actual wire to bridge. */
const ADJACENT_ZONE_PAIRS = new Set<string>([
  zonePairKey('terminal-top', 'terminal-bottom'),
  zonePairKey('rail-top-pos', 'rail-top-neg'),
  zonePairKey('rail-bot-pos', 'rail-bot-neg'),
  zonePairKey('rail-top-pos', 'terminal-top'),
  zonePairKey('rail-top-neg', 'terminal-top'),
  zonePairKey('rail-bot-pos', 'terminal-bottom'),
  zonePairKey('rail-bot-neg', 'terminal-bottom'),
]);

export function findNearestHole(board: BoardModel, px: number, py: number, maxDist = GRID_SIZE * 0.6): Hole | null {
  let best: Hole | null = null;
  let bestDist = Infinity;
  for (const hole of board.holes) {
    const dx = hole.x * GRID_SIZE - px;
    const dy = hole.y * GRID_SIZE - py;
    const dist = Math.hypot(dx, dy);
    if (dist < bestDist) {
      bestDist = dist;
      best = hole;
    }
  }
  return bestDist <= maxDist ? best : null;
}

/** Same hole, offset by a row-track/column delta (not a rotation - used for
 * translating a whole flexible component by the same amount on every pin).
 * Returns null if the result falls off the board. */
export function translateHole(board: BoardModel, hole: Hole, dRowTrack: number, dCol: number): Hole | null {
  const rowTrack = hole.rowTrack + dRowTrack;
  const col = hole.col + dCol;
  if (rowTrack < 0 || rowTrack >= ROW_CODES.length) return null;
  if (col < 1 || col > board.numCols) return null;
  return board.holesById.get(holeId(board.id, ROW_CODES[rowTrack], col)) ?? null;
}

/** Resolves the absolute holes a *rigid* component (TO-92, pot, DIP) would occupy
 * for a given anchor + rotation. Returns null if any pin falls off the board or
 * lands on a gap (e.g. rail cosmetic gap). */
export function resolveRigidPinHoles(
  board: BoardModel,
  type: ComponentType,
  anchorHoleId: string,
  rotation: Rotation,
): Hole[] | null {
  const def = COMPONENT_DEFS[type];
  const anchor = board.holesById.get(anchorHoleId);
  if (!anchor) return null;

  const holes: Hole[] = [];
  for (const basePin of def.basePins) {
    const { dcol, drow } = rotateOffset(basePin, rotation);
    const rowTrack = anchor.rowTrack + drow;
    const col = anchor.col + dcol;
    if (rowTrack < 0 || rowTrack >= ROW_CODES.length) return null;
    if (col < 1 || col > board.numCols) return null;
    const row = ROW_CODES[rowTrack];
    const hole = board.holesById.get(holeId(board.id, row, col));
    if (!hole) return null;
    holes.push(hole);
  }
  return holes;
}

/** Resolves the absolute holes for any *placed* component, rigid or flexible. */
export function resolveComponentPinHoles(board: BoardModel, comp: PlacedComponent): Hole[] | null {
  if (isFlexibleComponent(comp)) {
    const holes = comp.pinHoleIds.map((id) => board.holesById.get(id));
    return holes.every((h): h is Hole => h !== undefined) ? holes : null;
  }
  return resolveRigidPinHoles(board, comp.type, comp.anchorHoleId, comp.rotation);
}

export interface PlacementResult {
  valid: boolean;
  pinHoleIds?: string[];
  reason?: string;
}

/** Shared by both placement paths: rejects spans into non-adjacent board
 * zones, and rejects any hole already occupied by another component. */
function checkZonesAndOccupancy(
  board: BoardModel,
  holes: Hole[],
  existingComponents: PlacedComponent[],
): PlacementResult | null {
  const zones = [...new Set(holes.map((h) => zoneOf(h.rowTrack)))];
  if (zones.length > 1) {
    const isAdjacentPair = zones.length === 2 && ADJACENT_ZONE_PAIRS.has(zonePairKey(zones[0], zones[1]));
    if (!isAdjacentPair) {
      return { valid: false, reason: 'Component cannot span multiple board zones' };
    }
  }

  const occupied = occupiedHoleIds(existingComponents, board);
  for (const hole of holes) {
    if (occupied.has(hole.id)) {
      return { valid: false, reason: `Hole ${hole.id} is already occupied` };
    }
  }
  return null;
}

/** Validates placing (or moving) a rigid component. To validate a move, pass
 * `existingComponents` with the component being moved already filtered out. */
export function validatePlacement(
  board: BoardModel,
  existingComponents: PlacedComponent[],
  type: ComponentType,
  anchorHoleId: string,
  rotation: Rotation,
): PlacementResult {
  const def = COMPONENT_DEFS[type];

  if (!def.allowedRotations.includes(rotation)) {
    return { valid: false, reason: `${def.label} cannot be rotated to ${rotation}°` };
  }

  const pinHoles = resolveRigidPinHoles(board, type, anchorHoleId, rotation);
  if (!pinHoles) {
    return { valid: false, reason: 'Placement falls off the board' };
  }

  // DIP packages are rigid (fixed 2-row footprint), so their straddle only makes
  // physical sense anchored exactly on row e. TO-92/pot have no such restriction.
  if (def.straddlesTrench) {
    const anchor = board.holesById.get(anchorHoleId)!;
    if (anchor.row !== 'e') {
      return { valid: false, reason: `${def.label} must be anchored on row e, straddling rows e/f` };
    }
  }

  const problem = checkZonesAndOccupancy(board, pinHoles, existingComponents);
  if (problem) return problem;

  return { valid: true, pinHoleIds: pinHoles.map((h) => h.id) };
}

/** Validates placing (or moving) a flexible-lead component's pins directly.
 * To validate a move (whole-body drag or single-leg drag), pass
 * `existingComponents` with the component being moved already filtered out. */
export function validateFlexiblePlacement(
  board: BoardModel,
  existingComponents: PlacedComponent[],
  type: ComponentType,
  pinHoleIds: string[],
): PlacementResult {
  const def = COMPONENT_DEFS[type];

  if (pinHoleIds.length !== def.pinCount) {
    return { valid: false, reason: `${def.label} needs ${def.pinCount} pin holes` };
  }
  if (new Set(pinHoleIds).size !== pinHoleIds.length) {
    return { valid: false, reason: 'A component cannot use the same hole for two pins' };
  }

  const holes = pinHoleIds.map((id) => board.holesById.get(id));
  if (holes.some((h) => !h)) {
    return { valid: false, reason: 'Placement falls off the board' };
  }

  const problem = checkZonesAndOccupancy(board, holes as Hole[], existingComponents);
  if (problem) return problem;

  return { valid: true, pinHoleIds };
}

export function occupiedHoleIds(components: PlacedComponent[], board: BoardModel): Set<string> {
  const set = new Set<string>();
  for (const comp of components) {
    const pins = resolveComponentPinHoles(board, comp);
    pins?.forEach((h) => set.add(h.id));
  }
  return set;
}
