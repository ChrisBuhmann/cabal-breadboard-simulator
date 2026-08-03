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
- **Interaction** (`src/interaction`): drag-and-drop (HTML5 DnD) and click-to-place
  both funnel through the same placement validator, which checks pin holes are
  empty and package-appropriate (e.g. DIP packages must anchor on row `e` and
  straddle the trench to row `f`; only DIP packages are allowed to span the
  top/bottom terminal zones at all). Jumper wires snap to preset lengths
  (1/2/3/4/6/8/10 holes) along whichever axis (row or column) the drag is closer to.
- **Netlist** (`src/netlist`): a union-find over node groups. Wires union two
  node groups; components don't need to union anything themselves, since every pin
  in a hole is already implicitly connected to that hole's node group. The result
  is exported as `{ nodes: [{ id, connected_pins: [{ component_id, pin_index }] }] }`,
  visible live in the debug panel (toggle top-right).
- **State** (`src/state`): a single reducer holds placed components + wires, with a
  snapshot-based undo/redo stack and localStorage save/load.

## Component registry — assumptions

The task spec referenced a "component registry" pin-geometry block that wasn't
actually included. Pin geometries below were chosen to be physically plausible
substitutes — swap these out if you have the real spec:

| Component              | Pins | Span (grid holes)        | Notes |
|-------------------------|------|---------------------------|-------|
| Resistor                | 2    | 4                          | axial |
| Film / ceramic capacitor| 2    | 2                          | radial |
| Electrolytic capacitor  | 2    | 2                          | polarized, radial |
| Diode                   | 2    | 3                          | polarized (cathode band) |
| LED                     | 2    | 2                          | polarized (flat side = cathode) |
| TO-92 (transistor/JFET) | 3    | 2 (3 pins, 1 hole apart)   | single row |
| DIP-8                   | 8    | 4 cols × 2 rows            | must straddle rows e/f, rotation locked to 0°/180° |
| DIP-14                  | 14   | 7 cols × 2 rows            | same straddle rule as DIP-8 |
| Potentiometer           | 3    | 2 (3 pins, 1 hole apart)   | single row; middle pin is the wiper |

DIP pin numbering here goes left-to-right along the top row (pins 0..n/2-1) then
left-to-right along the bottom row (pins n/2..n-1) — a simplification of real-world
DIP pin-1-at-notch numbering, since only relative position (not real silkscreen
numbering) matters for netlist derivation in this phase.

Rotation is implemented as a genuine coordinate rotation of pin offsets (matching
the SVG `rotate()` transform applied to each component's artwork), so hole-snapping
and rendering always agree. Non-DIP components allow all four 90° rotations; DIP
packages only allow 0°/180°, since a real DIP's straddle is fixed by its package,
not something free rotation could produce.
