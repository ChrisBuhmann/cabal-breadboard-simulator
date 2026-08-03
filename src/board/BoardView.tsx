import { useCallback, useMemo, useRef, useState } from 'react';
import type { BoardModel, Hole } from './boardTypes';
import { GRID_SIZE, NUM_COLS, ROW_TRACK_Y } from './boardTypes';
import type { CircuitApi } from '../state/circuitState';
import { nextId } from '../state/circuitState';
import { COMPONENT_RENDERERS } from '../components/componentRender/index';
import { JumperSVG } from '../components/componentRender/jumper';
import { validatePlacement, resolvePinHoles } from '../interaction/snapLogic';
import { computeJumperEnd, validateJumper, nextWireColor, type JumperCandidate } from '../interaction/jumperSnap';
import { clientToSvgPoint, decodeDragPayload, DRAG_MIME, type DragPayload } from '../interaction/dragDrop';
import type { PlacedComponent } from '../components/componentDefs';

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

const MARGIN = GRID_SIZE * 1.5;
const VIEW_X0 = -MARGIN;
const VIEW_Y0 = -GRID_SIZE * 3;
const VIEW_W = (NUM_COLS + 1) * GRID_SIZE + MARGIN * 2;
const VIEW_H = 16 * GRID_SIZE + GRID_SIZE * 7;
const RAIL_ROW_TRACKS = [0, 1, 12, 13];

export function BoardView({ board, circuit, pending, onPlaced, onRejected, selection, onSelect }: BoardViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [wireDrag, setWireDrag] = useState<{ start: Hole; pointer: { x: number; y: number } } | null>(null);
  const [pendingPointer, setPendingPointer] = useState<{ x: number; y: number } | null>(null);

  const boardComponents = useMemo(
    () => circuit.components.filter((c) => c.boardId === board.id),
    [circuit.components, board.id],
  );
  const boardWires = useMemo(() => circuit.wires.filter((w) => w.boardId === board.id), [circuit.wires, board.id]);

  const toSvgPoint = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    return clientToSvgPoint(svgRef.current, clientX, clientY);
  }, []);

  const attemptPlace = useCallback(
    (payload: DragPayload, holeId: string) => {
      const result = validatePlacement(board, boardComponents, payload.type, holeId, payload.rotation);
      if (!result.valid) {
        onRejected(result.reason ?? 'Invalid placement');
        return;
      }
      circuit.placeComponent(board.id, payload.type, holeId, payload.rotation, payload.value);
      onPlaced();
    },
    [board, boardComponents, circuit, onPlaced, onRejected],
  );

  const handleHoleMouseDown = useCallback(
    (hole: Hole, evt: React.MouseEvent) => {
      evt.stopPropagation();
      if (pending) {
        attemptPlace(pending, hole.id);
        return;
      }
      onSelect(null);
      setWireDrag({ start: hole, pointer: toSvgPoint(evt.clientX, evt.clientY) });
    },
    [pending, attemptPlace, toSvgPoint, onSelect],
  );

  const jumperCandidate: JumperCandidate | null = wireDrag
    ? computeJumperEnd(board, wireDrag.start, wireDrag.pointer.x, wireDrag.pointer.y)
    : null;

  const handleMouseMove = useCallback(
    (evt: React.MouseEvent<SVGSVGElement>) => {
      const p = toSvgPoint(evt.clientX, evt.clientY);
      if (wireDrag) setWireDrag({ ...wireDrag, pointer: p });
      if (pending) setPendingPointer(p);
    },
    [wireDrag, pending, toSvgPoint],
  );

  const handleMouseUp = useCallback(() => {
    if (!wireDrag) return;
    const candidate = computeJumperEnd(board, wireDrag.start, wireDrag.pointer.x, wireDrag.pointer.y);
    if (candidate) {
      const check = validateJumper(wireDrag.start, candidate.endHole);
      if (check.valid) {
        circuit.addWire({
          id: nextId('wire'),
          boardId: board.id,
          fromHoleId: wireDrag.start.id,
          toHoleId: candidate.endHole.id,
          color: nextWireColor(boardWires.length),
          span: candidate.span,
        });
      } else {
        onRejected(check.reason ?? 'Invalid jumper');
      }
    }
    setWireDrag(null);
  }, [wireDrag, board, boardWires.length, circuit, onRejected]);

  const handleBoardClick = useCallback(() => {
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
      attemptPlace(payload, hole.id);
    },
    [board, attemptPlace, toSvgPoint, onRejected],
  );

  return (
    <svg
      ref={svgRef}
      viewBox={`${VIEW_X0} ${VIEW_Y0} ${VIEW_W} ${VIEW_H}`}
      className="board-svg"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setWireDrag(null)}
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
          onSelect={() => onSelect({ kind: 'component', id: comp.id })}
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

      {wireDrag && (
        <path
          className="wire-drag-path"
          d={`M ${wireDrag.start.x * GRID_SIZE} ${wireDrag.start.y * GRID_SIZE} L ${wireDrag.pointer.x} ${wireDrag.pointer.y}`}
          strokeDasharray="4 3"
          strokeWidth={1.5}
          fill="none"
        />
      )}
      {jumperCandidate && (
        <circle
          className="selection-outline"
          cx={jumperCandidate.endHole.x * GRID_SIZE}
          cy={jumperCandidate.endHole.y * GRID_SIZE}
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
  onSelect,
}: {
  board: BoardModel;
  comp: PlacedComponent;
  selected: boolean;
  onSelect: () => void;
}) {
  const anchor = board.holesById.get(comp.anchorHoleId);
  if (!anchor) return null;
  const Visual = COMPONENT_RENDERERS[comp.type];
  const pins = resolvePinHoles(board, comp.type, comp.anchorHoleId, comp.rotation);

  return (
    <g
      transform={`translate(${anchor.x * GRID_SIZE} ${anchor.y * GRID_SIZE}) rotate(${comp.rotation})`}
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onClick={(e) => e.stopPropagation()}
      style={{ cursor: 'pointer' }}
    >
      {selected && pins && (
        <rect
          className="selection-outline"
          x={-6}
          y={-6}
          width={(Math.max(...pins.map((p) => Math.abs(p.col - anchor.col))) || 0) * GRID_SIZE + 12}
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
