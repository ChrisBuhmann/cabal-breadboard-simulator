import { useCallback, useMemo, useRef, useState } from 'react';
import type { BoardModel, Hole } from './boardTypes';
import { GRID_SIZE, NUM_COLS, ROW_CODES, ROW_TRACK_Y, holeId } from './boardTypes';
import type { CircuitApi } from '../state/circuitState';
import { nextId } from '../state/circuitState';
import { COMPONENT_RENDERERS } from '../components/componentRender/index';
import { JumperSVG } from '../components/componentRender/jumper';
import { FlexibleLeadSVG } from '../components/componentRender/flexibleLead';
import {
  validatePlacement,
  validateFlexiblePlacement,
  resolveComponentPinHoles,
  translateHole,
} from '../interaction/snapLogic';
import {
  computeJumperEnd,
  validateJumper,
  nextWireColor,
  JUMPER_DEAD_ZONE,
  type JumperCandidate,
} from '../interaction/jumperSnap';
import { clientToSvgPoint, decodeDragPayload, DRAG_MIME, type DragPayload } from '../interaction/dragDrop';
import { COMPONENT_DEFS, isFlexibleComponent, type FlexiblePlacedComponent, type PlacedComponent } from '../components/componentDefs';
import { rotateOffset } from '../interaction/rotation';

export type Selection = { kind: 'component'; id: string } | { kind: 'wire'; id: string } | null;

interface BoardViewProps {
  board: BoardModel;
  circuit: CircuitApi;
  pending: DragPayload | null;
  onPlaced: () => void;
  onRejected: (reason: string) => void;
  selection: Selection;
  onSelect: (sel: Selection) => void;
}

type Point = { x: number; y: number };

type ActiveDrag =
  | { kind: 'wire'; start: Hole; pointer: Point }
  | { kind: 'place-flexible'; payload: DragPayload; start: Hole; pointer: Point }
  | { kind: 'move-leg'; comp: FlexiblePlacedComponent; legIndex: number; pointer: Point }
  | { kind: 'move-body'; comp: PlacedComponent; startPointer: Point; pointer: Point };

/** A component's body can be clicked anywhere along its length to select it,
 * often far from any hole - so unlike the other drag kinds (anchored to a
 * hole, where "landed on a different hole" already implies real movement),
 * move-body needs an explicit minimum-drag-distance check to avoid every
 * plain select-click being misread as "drag to the nearest hole". */
const DRAG_THRESHOLD = GRID_SIZE * 0.3;

const MARGIN = GRID_SIZE * 1.5;
const VIEW_X0 = -MARGIN;
const VIEW_Y0 = -GRID_SIZE * 3;
const VIEW_W = (NUM_COLS + 1) * GRID_SIZE + MARGIN * 2;
const VIEW_H = 16 * GRID_SIZE + GRID_SIZE * 7;
const RAIL_ROW_TRACKS = [0, 1, 12, 13];

export function BoardView({ board, circuit, pending, onPlaced, onRejected, selection, onSelect }: BoardViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<ActiveDrag | null>(null);
  const [pendingPointer, setPendingPointer] = useState<Point | null>(null);
  // A native "click" fires on the common ancestor of the mousedown and mouseup
  // targets, not just the mousedown target - so a drag that starts on a hole/leg/
  // body and ends elsewhere (a no-op move, or one that lands over an unrelated
  // element) still bubbles a click up to the board's clear-selection handler.
  // Any mousedown that starts an interactive gesture sets this so that click is
  // swallowed regardless of where the gesture ends.
  const suppressNextBoardClick = useRef(false);

  const boardComponents = useMemo(
    () => circuit.components.filter((c) => c.boardId === board.id),
    [circuit.components, board.id],
  );
  const boardWires = useMemo(() => circuit.wires.filter((w) => w.boardId === board.id), [circuit.wires, board.id]);

  const toSvgPoint = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    return clientToSvgPoint(svgRef.current, clientX, clientY);
  }, []);

  const attemptPlaceRigid = useCallback(
    (payload: DragPayload, anchorHoleId: string) => {
      const result = validatePlacement(board, boardComponents, payload.type, anchorHoleId, payload.rotation);
      if (!result.valid) {
        onRejected(result.reason ?? 'Invalid placement');
        return;
      }
      circuit.placeComponent(board.id, payload.type, anchorHoleId, payload.rotation, payload.value);
      onPlaced();
    },
    [board, boardComponents, circuit, onPlaced, onRejected],
  );

  const attemptPlaceFlexible = useCallback(
    (payload: DragPayload, pinHoleIds: string[]) => {
      const result = validateFlexiblePlacement(board, boardComponents, payload.type, pinHoleIds);
      if (!result.valid) {
        onRejected(result.reason ?? 'Invalid placement');
        return;
      }
      circuit.placeFlexibleComponent(board.id, payload.type, pinHoleIds, payload.value);
      onPlaced();
    },
    [board, boardComponents, circuit, onPlaced, onRejected],
  );

  const handleHoleMouseDown = useCallback(
    (hole: Hole, evt: React.MouseEvent) => {
      evt.stopPropagation();
      suppressNextBoardClick.current = true;
      const pointer = toSvgPoint(evt.clientX, evt.clientY);
      if (pending) {
        if (COMPONENT_DEFS[pending.type].flexible) {
          setDrag({ kind: 'place-flexible', payload: pending, start: hole, pointer });
        } else {
          attemptPlaceRigid(pending, hole.id);
        }
        return;
      }
      onSelect(null);
      setDrag({ kind: 'wire', start: hole, pointer });
    },
    [pending, attemptPlaceRigid, toSvgPoint, onSelect],
  );

  const handleLegMouseDown = useCallback(
    (comp: FlexiblePlacedComponent, legIndex: number, evt: React.MouseEvent) => {
      evt.stopPropagation();
      suppressNextBoardClick.current = true;
      onSelect({ kind: 'component', id: comp.id });
      setDrag({ kind: 'move-leg', comp, legIndex, pointer: toSvgPoint(evt.clientX, evt.clientY) });
    },
    [toSvgPoint, onSelect],
  );

  const handleBodyMouseDown = useCallback(
    (comp: PlacedComponent, evt: React.MouseEvent) => {
      evt.stopPropagation();
      suppressNextBoardClick.current = true;
      onSelect({ kind: 'component', id: comp.id });
      if (COMPONENT_DEFS[comp.type].draggable) {
        const p = toSvgPoint(evt.clientX, evt.clientY);
        setDrag({ kind: 'move-body', comp, startPointer: p, pointer: p });
      }
    },
    [toSvgPoint, onSelect],
  );

  const dragEndCandidate: JumperCandidate | null =
    drag?.kind === 'wire' ? computeJumperEnd(board, drag.start, drag.pointer.x, drag.pointer.y) : null;
  const dropHoleCandidate: Hole | null =
    drag && drag.kind !== 'wire' ? findNearestHoleForDrop(board, drag.pointer.x, drag.pointer.y) : null;

  const handleMouseMove = useCallback(
    (evt: React.MouseEvent<SVGSVGElement>) => {
      const p = toSvgPoint(evt.clientX, evt.clientY);
      if (drag) setDrag({ ...drag, pointer: p });
      if (pending && !COMPONENT_DEFS[pending.type].flexible) setPendingPointer(p);
    },
    [drag, pending, toSvgPoint],
  );

  const handleMouseUp = useCallback(() => {
    if (!drag) return;

    if (drag.kind === 'wire') {
      const candidate = computeJumperEnd(board, drag.start, drag.pointer.x, drag.pointer.y);
      if (candidate) {
        const check = validateJumper(drag.start, candidate.endHole);
        if (check.valid) {
          circuit.addWire({
            id: nextId('wire'),
            boardId: board.id,
            fromHoleId: drag.start.id,
            toHoleId: candidate.endHole.id,
            color: nextWireColor(boardWires.length),
            span: candidate.span,
          });
        } else {
          onRejected(check.reason ?? 'Invalid jumper');
        }
      } else {
        const dx = drag.pointer.x - drag.start.x * GRID_SIZE;
        const dy = drag.pointer.y - drag.start.y * GRID_SIZE;
        // Only a real, failed attempt deserves a message -- a drag that never
        // really left the start hole (a stray click) should stay silent.
        if (Math.abs(dx) >= JUMPER_DEAD_ZONE || Math.abs(dy) >= JUMPER_DEAD_ZONE) {
          onRejected('No straight jumper reaches there — try it as two hops (sideways, then to the rail/row)');
        }
      }
      setDrag(null);
      return;
    }

    const targetHole = findNearestHoleForDrop(board, drag.pointer.x, drag.pointer.y);

    if (drag.kind === 'place-flexible') {
      if (targetHole && targetHole.id !== drag.start.id) {
        attemptPlaceFlexible(drag.payload, [drag.start.id, targetHole.id]);
      }
      setDrag(null);
      return;
    }

    if (drag.kind === 'move-leg') {
      const { comp, legIndex } = drag;
      if (targetHole && targetHole.id !== comp.pinHoleIds[legIndex]) {
        const newPinHoleIds = comp.pinHoleIds.map((id, i) => (i === legIndex ? targetHole.id : id));
        const others = boardComponents.filter((c) => c.id !== comp.id);
        const result = validateFlexiblePlacement(board, others, comp.type, newPinHoleIds);
        if (result.valid) circuit.setPinHoles(comp.id, newPinHoleIds);
        else onRejected(result.reason ?? 'Invalid placement');
      }
      setDrag(null);
      return;
    }

    // move-body: require real movement (not just "landed on a different hole than
    // the component's current position", since the body can be clicked anywhere
    // along its length, often nowhere near that reference hole).
    const { comp, startPointer } = drag;
    const movedFar = Math.hypot(drag.pointer.x - startPointer.x, drag.pointer.y - startPointer.y) >= DRAG_THRESHOLD;
    if (targetHole && movedFar) {
      const others = boardComponents.filter((c) => c.id !== comp.id);
      if (isFlexibleComponent(comp)) {
        const pin0 = board.holesById.get(comp.pinHoleIds[0])!;
        if (targetHole.id !== pin0.id) {
          const dRowTrack = targetHole.rowTrack - pin0.rowTrack;
          const dCol = targetHole.col - pin0.col;
          const newHoles = comp.pinHoleIds.map((id) => translateHole(board, board.holesById.get(id)!, dRowTrack, dCol));
          if (newHoles.some((h) => !h)) {
            onRejected('Placement falls off the board');
          } else {
            const newPinHoleIds = newHoles.map((h) => h!.id);
            const result = validateFlexiblePlacement(board, others, comp.type, newPinHoleIds);
            if (result.valid) circuit.setPinHoles(comp.id, newPinHoleIds);
            else onRejected(result.reason ?? 'Invalid placement');
          }
        }
      } else if (targetHole.id !== comp.anchorHoleId) {
        const result = validatePlacement(board, others, comp.type, targetHole.id, comp.rotation);
        if (result.valid) circuit.moveAnchor(comp.id, targetHole.id);
        else onRejected(result.reason ?? 'Invalid placement');
      }
    }
    setDrag(null);
  }, [drag, board, boardComponents, boardWires.length, circuit, attemptPlaceFlexible, onRejected]);

  const handleBoardClick = useCallback(() => {
    if (suppressNextBoardClick.current) {
      suppressNextBoardClick.current = false;
      return;
    }
    if (!pending) onSelect(null);
  }, [pending, onSelect]);

  const handleDrop = useCallback(
    (evt: React.DragEvent<SVGSVGElement>) => {
      evt.preventDefault();
      const raw = evt.dataTransfer.getData(DRAG_MIME);
      const payload = decodeDragPayload(raw);
      if (!payload) return;
      const p = toSvgPoint(evt.clientX, evt.clientY);
      const hole = findNearestHoleForDrop(board, p.x, p.y);
      if (!hole) {
        onRejected('No hole near drop point');
        return;
      }
      const def = COMPONENT_DEFS[payload.type];
      if (def.flexible) {
        // No second drop point from a single HTML5 drag-drop - fall back to the
        // part's historical default span (rotation 0) as a starting point; the
        // user can drag either leg afterwards to adjust it.
        const secondPin = def.basePins[1];
        const secondHole = board.holesById.get(holeId(board.id, ROW_CODES[hole.rowTrack + secondPin.drow], hole.col + secondPin.dcol));
        if (!secondHole) {
          onRejected('No room for the default lead span here - drag between two holes instead');
          return;
        }
        attemptPlaceFlexible(payload, [hole.id, secondHole.id]);
      } else {
        attemptPlaceRigid(payload, hole.id);
      }
    },
    [board, attemptPlaceRigid, attemptPlaceFlexible, toSvgPoint, onRejected],
  );

  return (
    <svg
      ref={svgRef}
      viewBox={`${VIEW_X0} ${VIEW_Y0} ${VIEW_W} ${VIEW_H}`}
      className="board-svg"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setDrag(null)}
      onClick={handleBoardClick}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <BoardChrome />

      {boardComponents.map((comp) => (
        <PlacedComponentView
          key={comp.id}
          board={board}
          comp={comp}
          selected={selection?.kind === 'component' && selection.id === comp.id}
          onBodyMouseDown={(evt) => handleBodyMouseDown(comp, evt)}
          onLegMouseDown={(legIndex, evt) => {
            if (isFlexibleComponent(comp)) handleLegMouseDown(comp, legIndex, evt);
          }}
        />
      ))}

      {boardWires.map((wire) => {
        const from = board.holesById.get(wire.fromHoleId);
        const to = board.holesById.get(wire.toHoleId);
        if (!from || !to) return null;
        return (
          <g
            key={wire.id}
            onMouseDown={(e) => {
              e.stopPropagation();
              onSelect({ kind: 'wire', id: wire.id });
            }}
            onClick={(e) => e.stopPropagation()}
            style={{ cursor: 'pointer' }}
          >
            <JumperSVG
              x1={from.x * GRID_SIZE}
              y1={from.y * GRID_SIZE}
              x2={to.x * GRID_SIZE}
              y2={to.y * GRID_SIZE}
              color={wire.color}
              span={wire.span}
              selected={selection?.kind === 'wire' && selection.id === wire.id}
            />
          </g>
        );
      })}

      {drag?.kind === 'wire' && (
        <path
          className="wire-drag-path"
          d={`M ${drag.start.x * GRID_SIZE} ${drag.start.y * GRID_SIZE} L ${drag.pointer.x} ${drag.pointer.y}`}
          strokeDasharray="4 3"
          strokeWidth={1.5}
          fill="none"
        />
      )}
      {dragEndCandidate && (
        <circle
          className="selection-outline"
          cx={dragEndCandidate.endHole.x * GRID_SIZE}
          cy={dragEndCandidate.endHole.y * GRID_SIZE}
          r={6}
          fill="none"
          strokeWidth={2}
        />
      )}

      {drag?.kind === 'place-flexible' && (
        <path
          className="wire-drag-path"
          d={`M ${drag.start.x * GRID_SIZE} ${drag.start.y * GRID_SIZE} L ${drag.pointer.x} ${drag.pointer.y}`}
          strokeDasharray="4 3"
          strokeWidth={1.5}
          fill="none"
        />
      )}
      {dropHoleCandidate && (drag?.kind === 'place-flexible' || drag?.kind === 'move-leg' || drag?.kind === 'move-body') && (
        <circle
          className="selection-outline"
          cx={dropHoleCandidate.x * GRID_SIZE}
          cy={dropHoleCandidate.y * GRID_SIZE}
          r={6}
          fill="none"
          strokeWidth={2}
        />
      )}

      {pending && pendingPointer && (
        <g transform={`translate(${pendingPointer.x} ${pendingPointer.y}) rotate(${pending.rotation})`} opacity={0.55} pointerEvents="none">
          {(() => {
            const Visual = COMPONENT_RENDERERS[pending.type];
            return <Visual value={pending.value} />;
          })()}
        </g>
      )}

      {/* Interactive hole hit-targets sit above everything so wires can always be started/ended. */}
      {board.holes.map((hole) => (
        <circle
          key={hole.id}
          data-hole-id={hole.id}
          cx={hole.x * GRID_SIZE}
          cy={hole.y * GRID_SIZE}
          r={5}
          fill="transparent"
          className="hole-hit"
          onMouseDown={(e) => handleHoleMouseDown(hole, e)}
        />
      ))}
    </svg>
  );
}

function findNearestHoleForDrop(board: BoardModel, x: number, y: number): Hole | null {
  let best: Hole | null = null;
  let bestDist = Infinity;
  for (const hole of board.holes) {
    const dx = hole.x * GRID_SIZE - x;
    const dy = hole.y * GRID_SIZE - y;
    const dist = Math.hypot(dx, dy);
    if (dist < bestDist) {
      bestDist = dist;
      best = hole;
    }
  }
  return bestDist <= GRID_SIZE * 1.2 ? best : null;
}

function PlacedComponentView({
  board,
  comp,
  selected,
  onBodyMouseDown,
  onLegMouseDown,
}: {
  board: BoardModel;
  comp: PlacedComponent;
  selected: boolean;
  onBodyMouseDown: (evt: React.MouseEvent) => void;
  onLegMouseDown: (legIndex: number, evt: React.MouseEvent) => void;
}) {
  if (isFlexibleComponent(comp)) {
    return <FlexibleComponentView board={board} comp={comp} selected={selected} onBodyMouseDown={onBodyMouseDown} onLegMouseDown={onLegMouseDown} />;
  }

  const anchor = board.holesById.get(comp.anchorHoleId);
  if (!anchor) return null;
  const Visual = COMPONENT_RENDERERS[comp.type];
  const def = COMPONENT_DEFS[comp.type];
  const pins = def.basePins.map((p) => rotateOffset(p, comp.rotation));

  return (
    <g
      transform={`translate(${anchor.x * GRID_SIZE} ${anchor.y * GRID_SIZE}) rotate(${comp.rotation})`}
      onMouseDown={onBodyMouseDown}
      onClick={(e) => e.stopPropagation()}
      style={{ cursor: def.draggable ? 'grab' : 'pointer' }}
    >
      {selected && (
        <rect
          className="selection-outline"
          x={-6}
          y={-6}
          width={(Math.max(...pins.map((p) => Math.abs(p.dcol))) || 0) * GRID_SIZE + 12}
          height={12}
          fill="none"
          strokeDasharray="3 2"
          strokeWidth={1.5}
        />
      )}
      <Visual value={comp.value} />
    </g>
  );
}

function FlexibleComponentView({
  board,
  comp,
  selected,
  onBodyMouseDown,
  onLegMouseDown,
}: {
  board: BoardModel;
  comp: FlexiblePlacedComponent;
  selected: boolean;
  onBodyMouseDown: (evt: React.MouseEvent) => void;
  onLegMouseDown: (legIndex: number, evt: React.MouseEvent) => void;
}) {
  const holes = resolveComponentPinHoles(board, comp);
  if (!holes || holes.length !== 2) return null;
  const [h1, h2] = holes;
  const x1 = h1.x * GRID_SIZE;
  const y1 = h1.y * GRID_SIZE;
  const x2 = h2.x * GRID_SIZE;
  const y2 = h2.y * GRID_SIZE;

  return (
    <g>
      <g onMouseDown={onBodyMouseDown} onClick={(e) => e.stopPropagation()} style={{ cursor: 'grab' }}>
        <FlexibleLeadSVG type={comp.type} value={comp.value} x1={x1} y1={y1} x2={x2} y2={y2} selected={selected} />
      </g>
      {selected && (
        <>
          <circle
            cx={x1}
            cy={y1}
            r={5.5}
            className="leg-handle"
            onMouseDown={(e) => onLegMouseDown(0, e)}
            onClick={(e) => e.stopPropagation()}
          />
          <circle
            cx={x2}
            cy={y2}
            r={5.5}
            className="leg-handle"
            onMouseDown={(e) => onLegMouseDown(1, e)}
            onClick={(e) => e.stopPropagation()}
          />
        </>
      )}
    </g>
  );
}

function BoardChrome() {
  const cols = Array.from({ length: NUM_COLS }, (_, i) => i + 1);
  const labelCols = cols.filter((c) => c % 5 === 0);

  return (
    <g>
      <rect
        className="board-base"
        x={-GRID_SIZE}
        y={-GRID_SIZE * 2.2}
        width={(NUM_COLS + 1) * GRID_SIZE}
        height={16 * GRID_SIZE + GRID_SIZE * 4.4}
        rx={10}
      />

      {/* trench */}
      <rect
        className="board-trench"
        x={-GRID_SIZE}
        y={ROW_TRACK_Y[6] * GRID_SIZE + GRID_SIZE * 0.65}
        width={(NUM_COLS + 1) * GRID_SIZE}
        height={(ROW_TRACK_Y[7] - ROW_TRACK_Y[6]) * GRID_SIZE - GRID_SIZE * 1.3}
      />

      {RAIL_ROW_TRACKS.map((rt, i) => {
        const isPos = i % 2 === 0;
        const y = ROW_TRACK_Y[rt] * GRID_SIZE;
        return (
          <line
            key={rt}
            className={`board-rail-line ${isPos ? 'pos' : 'neg'}`}
            x1={0}
            y1={y + GRID_SIZE * 0.55}
            x2={NUM_COLS * GRID_SIZE}
            y2={y + GRID_SIZE * 0.55}
            strokeWidth={1.5}
          />
        );
      })}

      {labelCols.map((col) => (
        <g key={col}>
          <text className="board-label-text" x={col * GRID_SIZE} y={ROW_TRACK_Y[0] * GRID_SIZE - GRID_SIZE * 1.1} textAnchor="middle" fontSize={8}>
            {col}
          </text>
          <text className="board-label-text" x={col * GRID_SIZE} y={ROW_TRACK_Y[13] * GRID_SIZE + GRID_SIZE * 1.6} textAnchor="middle" fontSize={8}>
            {col}
          </text>
        </g>
      ))}

      {['a', 'b', 'c', 'd', 'e'].map((r, i) => (
        <text className="board-label-text" key={r} x={-GRID_SIZE * 0.7} y={ROW_TRACK_Y[2 + i] * GRID_SIZE + 3} fontSize={7}>
          {r}
        </text>
      ))}
      {['f', 'g', 'h', 'i', 'j'].map((r, i) => (
        <text className="board-label-text" key={r} x={-GRID_SIZE * 0.7} y={ROW_TRACK_Y[7 + i] * GRID_SIZE + 3} fontSize={7}>
          {r}
        </text>
      ))}

      <StaticHoles />
    </g>
  );
}

function StaticHoles() {
  const dots: React.ReactElement[] = [];
  for (let rt = 0; rt < ROW_TRACK_Y.length; rt++) {
    const isRail = rt <= 1 || rt >= 12;
    const y = ROW_TRACK_Y[rt] * GRID_SIZE;
    for (let col = 1; col <= NUM_COLS; col++) {
      if (isRail && col % 6 === 0) continue;
      dots.push(<circle key={`${rt}-${col}`} className="board-hole-dot" cx={col * GRID_SIZE} cy={y} r={1.8} />);
    }
  }
  return <g pointerEvents="none">{dots}</g>;
}
