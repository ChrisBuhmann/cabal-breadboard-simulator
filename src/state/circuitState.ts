import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import type { ComponentType, PlacedComponent } from '../components/componentDefs';
import type { Rotation } from '../interaction/rotation';
import type { Wire } from '../interaction/jumperSnap';

export interface CircuitSnapshot {
  components: PlacedComponent[];
  wires: Wire[];
}

interface HistoryState {
  past: CircuitSnapshot[];
  present: CircuitSnapshot;
  future: CircuitSnapshot[];
}

type Action =
  | { type: 'PLACE_COMPONENT'; component: PlacedComponent }
  | { type: 'REMOVE_COMPONENT'; id: string }
  | { type: 'ROTATE_COMPONENT'; id: string; rotation: Rotation }
  | { type: 'ADD_WIRE'; wire: Wire }
  | { type: 'REMOVE_WIRE'; id: string }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'LOAD'; snapshot: CircuitSnapshot }
  | { type: 'RESET' };

const EMPTY_SNAPSHOT: CircuitSnapshot = { components: [], wires: [] };
const HISTORY_LIMIT = 100;

function withHistory(state: HistoryState, present: CircuitSnapshot): HistoryState {
  const past = [...state.past, state.present].slice(-HISTORY_LIMIT);
  return { past, present, future: [] };
}

function reducer(state: HistoryState, action: Action): HistoryState {
  switch (action.type) {
    case 'PLACE_COMPONENT':
      return withHistory(state, {
        ...state.present,
        components: [...state.present.components, action.component],
      });
    case 'REMOVE_COMPONENT':
      return withHistory(state, {
        components: state.present.components.filter((c) => c.id !== action.id),
        wires: state.present.wires,
      });
    case 'ROTATE_COMPONENT':
      return withHistory(state, {
        ...state.present,
        components: state.present.components.map((c) =>
          c.id === action.id ? { ...c, rotation: action.rotation } : c,
        ),
      });
    case 'ADD_WIRE':
      return withHistory(state, {
        ...state.present,
        wires: [...state.present.wires, action.wire],
      });
    case 'REMOVE_WIRE':
      return withHistory(state, {
        ...state.present,
        wires: state.present.wires.filter((w) => w.id !== action.id),
      });
    case 'LOAD':
      return withHistory(state, action.snapshot);
    case 'RESET':
      return withHistory(state, EMPTY_SNAPSHOT);
    case 'UNDO': {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
      };
    }
    case 'REDO': {
      if (state.future.length === 0) return state;
      const [next, ...rest] = state.future;
      return {
        past: [...state.past, state.present],
        present: next,
        future: rest,
      };
    }
    default:
      return state;
  }
}

export interface CircuitApi {
  components: PlacedComponent[];
  wires: Wire[];
  canUndo: boolean;
  canRedo: boolean;
  placeComponent: (boardId: string, type: ComponentType, anchorHoleId: string, rotation: Rotation, value: string) => void;
  removeComponent: (id: string) => void;
  rotateComponent: (id: string, rotation: Rotation) => void;
  addWire: (wire: Wire) => void;
  removeWire: (id: string) => void;
  undo: () => void;
  redo: () => void;
  load: (snapshot: CircuitSnapshot) => void;
  reset: () => void;
}

const CircuitContext = createContext<CircuitApi | null>(null);

let idCounter = 0;
export function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${idCounter}_${Date.now().toString(36)}`;
}

export function useCircuitProvider(): CircuitApi {
  const [state, dispatch] = useReducer(reducer, {
    past: [],
    present: EMPTY_SNAPSHOT,
    future: [],
  });

  const placeComponent = useCallback(
    (boardId: string, type: ComponentType, anchorHoleId: string, rotation: Rotation, value: string) => {
      dispatch({
        type: 'PLACE_COMPONENT',
        component: { id: nextId('comp'), boardId, type, anchorHoleId, rotation, value },
      });
    },
    [],
  );

  const removeComponent = useCallback((id: string) => dispatch({ type: 'REMOVE_COMPONENT', id }), []);
  const rotateComponent = useCallback(
    (id: string, rotation: Rotation) => dispatch({ type: 'ROTATE_COMPONENT', id, rotation }),
    [],
  );
  const addWire = useCallback((wire: Wire) => dispatch({ type: 'ADD_WIRE', wire }), []);
  const removeWire = useCallback((id: string) => dispatch({ type: 'REMOVE_WIRE', id }), []);
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);
  const load = useCallback((snapshot: CircuitSnapshot) => dispatch({ type: 'LOAD', snapshot }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return useMemo(
    () => ({
      components: state.present.components,
      wires: state.present.wires,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
      placeComponent,
      removeComponent,
      rotateComponent,
      addWire,
      removeWire,
      undo,
      redo,
      load,
      reset,
    }),
    [state, placeComponent, removeComponent, rotateComponent, addWire, removeWire, undo, redo, load, reset],
  );
}

export { CircuitContext };

export function useCircuit(): CircuitApi {
  const ctx = useContext(CircuitContext);
  if (!ctx) throw new Error('useCircuit must be used within CircuitContext.Provider');
  return ctx;
}

const STORAGE_KEY = 'cabal-breadboard-circuit';

export function saveCircuitToStorage(snapshot: CircuitSnapshot) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export function loadCircuitFromStorage(): CircuitSnapshot | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CircuitSnapshot;
  } catch {
    return null;
  }
}
