# Cabal Breadboard Simulator — Phase 1

A React + TypeScript + SVG app that visually replicates a real solderless breadboard.
Drag or click stylized-realistic components onto a grid-accurate board, wire them
with snapped-length jumpers, and watch a live netlist get derived from the physical
placement — no schematic drawing involved.

This is **Phase 1: capture only**. Circuit simulation (gain, filter response,
transient analysis) is explicitly out of scope; the netlist JSON is shaped to feed
a future MNA solver, but nothing here computes electrical behavior.

## Running it

```
npm install
npm run dev
```

`npm run build`, `npm run lint`, and `npx tsc -b` all pass clean.

## How it works

- **Board** (`src/board`): the board is generated once at load. Every hole gets a
  pre-assigned `node_group` id — one per terminal-strip column (top a–e and bottom
  f–j are separate groups), and one per rail segment (each of the 4 rails is split
  into two segments at the board midpoint, matching a real full-size breadboard).
- **Components** (`src/components`): a small registry (`componentDefs.ts`) defines
  each component type as pin offsets + allowed rotations + package kind. Each
  package has its own SVG renderer in `componentRender/`.
- **Interaction** (`src/interaction`): two placement models, matching how real
  parts actually behave. **Flexible-lead parts** (resistor, film/ceramic/
  electrolytic capacitor, diode, LED) are placed like a jumper wire — click or
  drag from one hole to another, any distance or axis, and the lead stretches
  to match, same as bending a real wire lead to reach wherever you need. **Rigid
  packaged parts** (TO-92, potentiometer, DIP-8/14) keep a fixed pin geometry
  (`COMPONENT_DEFS[type].basePins`) placed as an anchor hole + rotation, since
  their real lead spacing can't change. Both funnel through the same
  zone/occupancy validator (`snapLogic.ts`). Once selected, a placed component
  can be repositioned: flexible parts show small drag handles at each pin for
  moving one lead independently, or drag the body to move both together;
  TO-92/pot can be dragged as a whole (same rigid geometry, new anchor); DIP-8/14
  can't be dragged (delete and re-place instead) since a rigid multi-row
  footprint has nowhere sensible to "slide" it. Jumper wires snap to preset
  lengths (1/2/3/4/6/8/10 holes) along whichever axis (row or column) the drag
  is closer to.
- **Netlist** (`src/netlist`): a union-find over node groups. Wires union two
  node groups; components don't need to union anything themselves, since every pin
  in a hole is already implicitly connected to that hole's node group. The result
  is exported as `{ nodes: [{ id, connected_pins: [{ component_id, pin_index }] }] }`,
  visible live in the debug panel (toggle top-right).
- **State** (`src/state`): a single reducer holds placed components + wires, with a
  snapshot-based undo/redo stack and localStorage save/load.
- **Keyboard shortcuts**: `Ctrl+Z` undo, `Ctrl+Y` / `Ctrl+Shift+Z` redo, `Alt+R`
  (or plain `R`) rotate the selected/pending component, `Delete`/`Backspace` delete
  selection, `Escape` clear selection/pending placement. Disabled while a text
  field has focus.
- **Multiple breadboards**: "Add Breadboard" stacks additional independent boards
  vertically. Hole ids and node-group ids are namespaced per board (`board-2:e5`),
  so placements/wires/netlists never cross boards; the netlist debug panel
  aggregates all boards' nets together.
- **Board Connections** (`src/ui/BoardConnectionsPanel.tsx`, shown once a second
  board exists): links a power/ground rail on one board to a rail on another,
  e.g. to share a 9V/ground bus across two physical breadboards. This is a
  dedicated picker (pick board + rail on each side, Connect) rather than a
  drawn wire — jumpering between two separate board canvases doesn't have a
  meaningful "snapped length" the way an in-board jumper does, and rails are a
  small, bounded set of connection points, so a picker is both simpler and
  more honest about what's being modeled. A link unions both physical L/R
  rail segments (see `src/interaction/railLink.ts`) and is fully undo/redo-able.
  Regular jumper wires remain scoped to a single board.
- **Dark theme**: manual toggle (top-right), persisted to `localStorage`, applied
  before first paint. Defaults to the OS preference.

## KiCad schematic export

"Export KiCad Schematic" (in the netlist debug panel) generates a `.kicad_sch`
file: one KiCad symbol per placed component, laid out in a plain grid (not a
copy of the breadboard layout), with each pin wired to a short stub ending in a
`global_label` named after its netlist node. Nets connect by matching label
name rather than by point-to-point routing — the standard KiCad approach for
netlist-driven schematics, and it avoids a rat's nest of crossing wires. Open
the file in KiCad and rearrange/relabel as needed; the connectivity is already
correct, only the layout is rough.

Since this app only ever produces a handful of standard through-hole part
types (typical of DIY pedal builds), each `ComponentType` maps to one specific
KiCad `Device:` library symbol rather than trying to cover KiCad's whole
catalog — verified against the real KiCad 7 `Device.kicad_sym`/footprint
libraries, not guessed from memory:

| Component               | KiCad symbol         | Footprint |
|--------------------------|----------------------|-----------|
| Resistor                 | `Device:R`           | `Resistor_THT:R_Axial_DIN0207_L6.3mm_D2.5mm_P10.16mm_Horizontal` |
| Film / ceramic capacitor | `Device:C`           | `Capacitor_THT:C_Disc_D5.0mm_W2.5mm_P5.00mm` |
| Electrolytic capacitor   | `Device:C_Polarized` | `Capacitor_THT:CP_Radial_D5.0mm_P2.00mm` |
| Diode                    | `Device:D`           | `Diode_THT:D_DO-35_SOD27_P10.16mm_Horizontal` |
| LED                      | `Device:LED`         | `LED_THT:LED_D5.0mm` |
| TO-92 (transistor/JFET)  | `Device:Q_NPN_EBC`   | `Package_TO_SOT_THT:TO-92_Inline` |
| DIP-8 / DIP-14           | hand-authored generic placeholder (see below) | `Package_DIP:DIP-8_W7.62mm_Socket` / `DIP-14_W7.62mm_Socket` |
| Potentiometer            | `Device:R_Potentiometer` | *(left blank — too many mechanical variants to guess)* |
| Input / Output jack      | `Connector_Audio:AudioJack2` | `Connector_Audio:Jack_6.35mm_Neutrik_NJ2FD-V_Vertical` |

Assumptions worth knowing about:

- **TO-92 pinout** assumes the standard E-B-C left-to-right layout that matches
  this app's default value ("2N3904"). If you actually used a PNP, a JFET, or
  anything with a different pinout, the generated symbol's pin functions will
  be wrong even though the *netlist connectivity* (which physical pins tie to
  which nets) is still correct — swap in the real part's symbol and re-map by
  hand.
- **DIP-8/14** use a hand-authored generic rectangle symbol (embedded directly
  in the file, not from any real library) since a breadboard placement alone
  doesn't tell us which real IC you used. Its pins are numbered top row
  left-to-right then bottom row left-to-right — matching this app's own DIP
  pin ordering (see below), *not* real DIP silkscreen numbering. Once you know
  the real chip (an op-amp, most likely, for pedal builds), swap in its real
  symbol.
- **Potentiometer footprint** is left blank since pedal pots vary widely
  (PCB-mount vs. lug/wire, 9mm/16mm/24mm body) — pick the right one in KiCad.
- Diode/LED pin mapping is intentionally *not* a simple index+1 mapping:
  this app's pin 0 is the anode (see the "polarized" notes below), while
  KiCad's `D`/`LED` symbols number pin 1 as the cathode — the exporter
  accounts for the swap.
- **Input/output jacks** map to `AudioJack2` (KiCad's 2-pole/mono-TS audio
  connector symbol) with the pin numbers it actually uses — `"T"` (tip) and
  `"S"` (sleeve), not plain 1/2 — and a real 1/4" Neutrik footprint common in
  pedal builds. Both jack types share the same symbol/footprint, just
  different reference/value text; they're otherwise ordinary 2-pin flexible
  components, so pin 0 (tip/signal) and pin 1 (sleeve/ground) can go anywhere
  a resistor's leads could, rail included.

## Component registry — assumptions

The task spec referenced a "component registry" pin-geometry block that wasn't
actually included. Details below were chosen to be physically plausible
substitutes — swap these out if you have the real spec:

| Component              | Pins | Placement | Notes |
|-------------------------|------|-----------|-------|
| Resistor                | 2    | flexible  | any two holes, any distance/axis |
| Film / ceramic capacitor| 2    | flexible  | any two holes, any distance/axis |
| Electrolytic capacitor  | 2    | flexible  | polarized (pin 0 = +); any two holes |
| Diode                   | 2    | flexible  | polarized (pin 0 = anode); any two holes |
| LED                     | 2    | flexible  | polarized (pin 0 = anode); any two holes |
| TO-92 (transistor/JFET) | 3    | rigid, draggable        | anchor + rotation, 1 hole apart; assumes E-B-C left-to-right |
| DIP-8                   | 8    | rigid, not draggable    | 4 cols × 2 rows; must anchor row `e`, straddling e/f; rotation locked to 0°/180° |
| DIP-14                  | 14   | rigid, not draggable    | 7 cols × 2 rows; same straddle rule as DIP-8 |
| Potentiometer           | 3    | rigid, draggable        | anchor + rotation, 1 hole apart; middle pin is the wiper |
| Input / output jack     | 2    | flexible  | TS mono only (tip = signal, sleeve = ground); any two holes |

**Flexible vs. rigid** (`ComponentDef.flexible` in `componentDefs.ts`): the
2-lead parts with real wire leads are placed and stored as two independent
`pinHoleIds`, exactly like a jumper wire, since a real lead can be bent to any
length. The packaged parts (TO-92, pot, DIP) have genuinely fixed pin spacing,
so they keep the original anchor-hole + rotation model
(`RigidPlacedComponent`) and a fixed `basePins` offset table.

DIP pin numbering goes left-to-right along the top row (pins 0..n/2-1) then
left-to-right along the bottom row (pins n/2..n-1) — a simplification of
real-world DIP pin-1-at-notch numbering, since only relative position (not
real silkscreen numbering) matters for netlist derivation in this phase.

Rotation (rigid parts only) is a genuine coordinate rotation of pin offsets
(matching the SVG `rotate()` transform applied to each component's artwork),
so hole-snapping and rendering always agree. TO-92/pot allow all four 90°
rotations; DIP packages only allow 0°/180°, since a real DIP's straddle is
fixed by its package, not something free rotation could produce. Flexible
parts have no rotation at all — their angle is whatever the line between
their two chosen holes happens to be.

**Zone spanning**: a component's two pins are allowed to land in different
board zones only if those zones are physically adjacent on a real board
(`ADJACENT_ZONE_PAIRS` in `snapLogic.ts`) — anything further needs an actual
jumper wire to bridge instead:

- top terminal ↔ bottom terminal (trench crossing, e.g. row c to row g)
- a rail ↔ its own opposite-polarity rail (e.g. a bypass cap straight across
  the two top rails)
- a rail ↔ its adjacent terminal strip (e.g. a pull-up resistor from the
  +rail into row a) — the standard way of tying a component to power/ground
  without a separate wire

DIP packages still must anchor exactly on row `e` for their trench straddle,
since their footprint is rigid and only lines up with the trench from that
one anchor (and their fixed 2-row geometry can never physically reach a rail
regardless). Non-rigid/TO-92/pot parts have no such anchor restriction. Spans
that aren't in the adjacency list (e.g. top rail to bottom terminal, or top
rail to bottom rail) are still rejected — use a jumper wire for those.
