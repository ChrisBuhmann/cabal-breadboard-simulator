import { useCallback, useEffect, useMemo, useState } from 'react';
import { generateBoard } from './board/boardGenerator';
import type { BoardModel } from './board/boardTypes';
import { BoardView, type Selection } from './board/BoardView';
import { COMPONENT_DEFS } from './components/componentDefs';
import { ComponentPalette } from './ui/ComponentPalette';
import { NetlistDebugPanel } from './ui/NetlistDebugPanel';
import { buildNetlist } from './netlist/netlistBuilder';
import {
  CircuitContext,
  loadCircuitFromStorage,
  saveCircuitToStorage,
  useCircuit,
  useCircuitProvider,
} from './state/circuitState';
import { nextRotation } from './interaction/rotation';
import { rotatePendingValue, type DragPayload } from './interaction/dragDrop';
import './board-app.css';

type Theme = 'light' | 'dark';
const THEME_STORAGE_KEY = 'cabal-breadboard-theme';

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Boards are ids "board-1", "board-2", ... in creation order, so a saved snapshot's
 * component/wire boardIds can be matched back up after a fresh reload (see Load below). */
function makeBoardId(index: number): string {
  return `board-${index}`;
}

function boardIndexFromId(id: string): number {
  const n = Number(id.slice('board-'.length));
  return Number.isFinite(n) ? n : 0;
}

function AppInner() {
  const [boards, setBoards] = useState<BoardModel[]>(() => [generateBoard(makeBoardId(1))]);
  const circuit = useCircuit();
  const [pending, setPending] = useState<DragPayload | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [debugOpen, setDebugOpen] = useState(true);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const addBoard = () => {
    setBoards((bs) => [...bs, generateBoard(makeBoardId(bs.length + 1))]);
  };

  /** Ensures every boardId referenced by a loaded snapshot has a matching board,
   * recreating boards the current session hasn't (re-)added yet. */
  const ensureBoardsFor = (snapshotBoardIds: Iterable<string>) => {
    const maxIndex = Math.max(0, ...Array.from(snapshotBoardIds, boardIndexFromId));
    setBoards((bs) => {
      if (maxIndex <= bs.length) return bs;
      const next = [...bs];
      for (let i = bs.length + 1; i <= maxIndex; i++) next.push(generateBoard(makeBoardId(i)));
      return next;
    });
  };

  const netlist = useMemo(() => buildNetlist(boards, circuit.components, circuit.wires), [boards, circuit.components, circuit.wires]);

  const flash = (msg: string) => {
    setMessage(msg);
    window.setTimeout(() => setMessage((cur) => (cur === msg ? null : cur)), 2200);
  };

  const deleteSelection = useCallback(() => {
    if (!selection) return;
    if (selection.kind === 'component') circuit.removeComponent(selection.id);
    else circuit.removeWire(selection.id);
    setSelection(null);
  }, [selection, circuit]);

  const rotateSelection = useCallback(() => {
    if (!selection || selection.kind !== 'component') return;
    const comp = circuit.components.find((c) => c.id === selection.id);
    if (!comp) return;
    const def = COMPONENT_DEFS[comp.type];
    circuit.rotateComponent(comp.id, nextRotation(comp.rotation, def.allowedRotations));
  }, [selection, circuit]);

  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      if (!el) return false;
      return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;

      if (e.key === 'Escape') {
        setPending(null);
        setSelection(null);
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selection) {
          e.preventDefault();
          deleteSelection();
        }
        return;
      }

      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) circuit.redo();
        else circuit.undo();
        return;
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        circuit.redo();
        return;
      }
      // Plain "R" and Alt+R both land here: Alt isn't part of `mod`.
      if (!mod && e.key.toLowerCase() === 'r') {
        if (pending) setPending(rotatePendingValue(pending));
        else rotateSelection();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pending, selection, circuit, deleteSelection, rotateSelection]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Cabal Breadboard Simulator</h1>
        <div className="toolbar">
          <button disabled={!circuit.canUndo} onClick={circuit.undo} title="Ctrl+Z">
            Undo
          </button>
          <button disabled={!circuit.canRedo} onClick={circuit.redo} title="Ctrl+Y / Ctrl+Shift+Z">
            Redo
          </button>
          <button
            disabled={!selection}
            onClick={() => {
              if (selection?.kind === 'component') rotateSelection();
            }}
            title="Alt+R"
          >
            Rotate Selected
          </button>
          <button disabled={!selection} onClick={deleteSelection}>
            Delete Selected
          </button>
          <button
            onClick={() => {
              saveCircuitToStorage({ components: circuit.components, wires: circuit.wires });
              flash('Circuit saved');
            }}
          >
            Save
          </button>
          <button
            onClick={() => {
              const snap = loadCircuitFromStorage();
              if (snap) {
                circuit.load(snap);
                ensureBoardsFor([...snap.components.map((c) => c.boardId), ...snap.wires.map((w) => w.boardId)]);
                flash('Circuit loaded');
              } else {
                flash('No saved circuit found');
              }
            }}
          >
            Load
          </button>
          <button
            onClick={() => {
              circuit.reset();
              flash('Board cleared');
            }}
          >
            Clear
          </button>
          <button onClick={addBoard}>Add Breadboard</button>
          <button onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </header>

      {message && <div className="toast">{message}</div>}

      <div className="app-body">
        <ComponentPalette
          pending={pending}
          onArm={setPending}
          onCancelPending={() => setPending(null)}
          onRotatePending={() => pending && setPending(rotatePendingValue(pending))}
        />

        <main className="board-area">
          {boards.map((b, i) => (
            <section key={b.id} className="board-section">
              <h3 className="board-section-label">Board {i + 1}</h3>
              <BoardView
                board={b}
                circuit={circuit}
                pending={pending}
                onPlaced={() => setPending(null)}
                onRejected={flash}
                selection={selection}
                onSelect={setSelection}
              />
            </section>
          ))}
        </main>

        <NetlistDebugPanel netlist={netlist} open={debugOpen} onToggle={() => setDebugOpen((o) => !o)} />
      </div>
    </div>
  );
}

export default function App() {
  const circuit = useCircuitProvider();
  return (
    <CircuitContext.Provider value={circuit}>
      <AppInner />
    </CircuitContext.Provider>
  );
}
