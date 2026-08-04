import { useState } from 'react';
import type { BoardModel } from '../board/boardTypes';
import { RAIL_KINDS, RAIL_LABELS, type RailKind, type RailLink } from '../interaction/railLink';
import { nextId } from '../state/circuitState';

interface BoardConnectionsPanelProps {
  boards: BoardModel[];
  railLinks: RailLink[];
  onAdd: (link: RailLink) => void;
  onRemove: (id: string) => void;
}

function boardLabel(boards: BoardModel[], boardId: string): string {
  const index = boards.findIndex((b) => b.id === boardId);
  return index === -1 ? boardId : `Board ${index + 1}`;
}

export function BoardConnectionsPanel({ boards, railLinks, onAdd, onRemove }: BoardConnectionsPanelProps) {
  const [boardAId, setBoardAId] = useState(boards[0]?.id ?? '');
  const [railA, setRailA] = useState<RailKind>('rtp');
  const [boardBId, setBoardBId] = useState(boards[1]?.id ?? '');
  const [railB, setRailB] = useState<RailKind>('rtp');

  const canConnect = boardAId !== '' && boardBId !== '' && boardAId !== boardBId;

  return (
    <div className="board-connections">
      <span className="board-connections-label">Board Connections</span>
      <div className="board-connections-picker">
        <select value={boardAId} onChange={(e) => setBoardAId(e.target.value)}>
          {boards.map((b, i) => (
            <option key={b.id} value={b.id}>
              Board {i + 1}
            </option>
          ))}
        </select>
        <select value={railA} onChange={(e) => setRailA(e.target.value as RailKind)}>
          {RAIL_KINDS.map((r) => (
            <option key={r} value={r}>
              {RAIL_LABELS[r]}
            </option>
          ))}
        </select>
        <span className="board-connections-arrow">↔</span>
        <select value={boardBId} onChange={(e) => setBoardBId(e.target.value)}>
          {boards.map((b, i) => (
            <option key={b.id} value={b.id}>
              Board {i + 1}
            </option>
          ))}
        </select>
        <select value={railB} onChange={(e) => setRailB(e.target.value as RailKind)}>
          {RAIL_KINDS.map((r) => (
            <option key={r} value={r}>
              {RAIL_LABELS[r]}
            </option>
          ))}
        </select>
        <button
          disabled={!canConnect}
          onClick={() => {
            onAdd({ id: nextId('raillink'), boardAId, railA, boardBId, railB });
          }}
        >
          Connect
        </button>
      </div>

      {railLinks.length > 0 && (
        <ul className="board-connections-list">
          {railLinks.map((link) => (
            <li key={link.id}>
              <span>
                {boardLabel(boards, link.boardAId)} {RAIL_LABELS[link.railA]} ↔ {boardLabel(boards, link.boardBId)}{' '}
                {RAIL_LABELS[link.railB]}
              </span>
              <button onClick={() => onRemove(link.id)} aria-label="Remove connection">
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
