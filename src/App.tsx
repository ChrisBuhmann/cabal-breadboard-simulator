import { useMemo, useState } from 'react';
import { generateBoard } from './board/boardGenerator';
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

function AppInner() {
  const board = useMemo(() => generateBoard(), []);
  const circuit = useCircuit();
  const [pending, setPending] = useState<DragPayload | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [debugOpen, setDebugOpen] = useState(true);

  const netlist = useMemo(() => buildNetlist(board, circuit.components, circuit.wires), [board, circuit.components, circuit.wires]);

  const flash = (msg: string) => {
    setMessage(msg);
    window.setTimeout(() => setMessage((cur) => (cur === msg ? null : cur)), 2200);
  };

  const deleteSelection = () => {
    if (!selection) return;
    if (selection.kind === 'component') circuit.removeComponent(selection.id);
    else circuit.removeWire(selection.id);
    setSelection(null);
  };

  const rotateSelection = () => {
    if (!selection || selection.kind !== 'component') return;
    const comp = circuit.components.find((c) => c.id === selection.id);
    if (!comp) return;
    const def = COMPONENT_DEFS[comp.type];
    circuit.rotateComponent(comp.id, nextRotation(comp.rotation, def.allowedRotations));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setPending(null);
      setSelection(null);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selection) {
        e.preventDefault();
        deleteSelection();
      }
    } else if (e.key === 'r' || e.key === 'R') {
      if (pending) setPending(rotatePendingValue(pending));
      else rotateSelection();
    }
  };

  return (
    <div className="app-shell" tabIndex={0} onKeyDown={onKeyDown}>
      <header className="app-header">
        <h1>Cabal Breadboard Simulator</h1>
        <div className="toolbar">
          <button disabled={!circuit.canUndo} onClick={circuit.undo}>
            Undo
          </button>
          <button disabled={!circuit.canRedo} onClick={circuit.redo}>
            Redo
          </button>
          <button
            disabled={!selection}
            onClick={() => {
              if (selection?.kind === 'component') rotateSelection();
            }}
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
          <BoardView
            board={board}
            circuit={circuit}
            pending={pending}
            onPlaced={() => setPending(null)}
            onRejected={flash}
            selection={selection}
            onSelect={setSelection}
          />
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
