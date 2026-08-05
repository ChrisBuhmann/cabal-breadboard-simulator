import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import type { ComponentType, PlacedComponent } from '../components/componentDefs';
import type { Rotation } from '../interaction/rotation';
import type { Wire } from '../interaction/jumperSnap';
import type { RailLink } from '../interaction/railLink';

export interface CircuitSnapshot {
  components: PlacedComponent[];
  wires: Wire[];
  railLinks: RailLink[];
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
  | { type: 'MOVE_ANCHOR'; id: string; anchorHoleId: string }
  | { type: 'SET_PIN_HOLES'; id: string; pinHoleIds: string[] }
  | { type: 'ADD_WIRE'; wire: Wire }
  | { type: 'REMOVE_WIRE'; id: string }
  | { type: 'ADD_RAIL_LINK'; railLink: RailLink }
  | { type: 'REMOVE_RAIL_LINK'; id: string }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'LOAD'; snapshot: CircuitSnapshot }
  | { type: 'RESET' };

const EMPTY_SNAPSHOT: CircuitSnapshot = { components: [], wires: [], railLinks: [] };
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
        ...state.present,
        components: state.present.components.filter((c) => c.id !== action.id),
      });
    case 'ROTATE_COMPONENT':
      return withHistory(state, {
        ...state.present,
        components: state.present.components.map((c) =>
          c.id === action.id ? { ...c, rotation: action.rotation } : c,
        ),
      });
    case 'MOVE_ANCHOR':
      return withHistory(state, {
        ...state.present,
        components: state.present.components.map((c) =>
          c.id === action.id ? { ...c, anchorHoleId: action.anchorHoleId } : c,
        ),
      });
    case 'SET_PIN_HOLES':
      return withHistory(state, {
        ...state.present,
        components: state.present.components.map((c) =>
          c.id === action.id ? { ...c, pinHoleIds: action.pinHoleIds } : c,
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
    case 'ADD_RAIL_LINK':
      return withHistory(state, {
        ...state.present,
        railLinks: [...state.present.railLinks, action.railLink],
      });
    case 'REMOVE_RAIL_LINK':
      return withHistory(state, {
        ...state.present,
        railLinks: state.present.railLinks.filter((r) => r.id !== action.id),
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
  railLinks: RailLink[];
  canUndo: boolean;
  canRedo: boolean;
  placeComponent: (boardId: string, type: ComponentType, anchorHoleId: string, rotation: Rotation, value: string) => void;
  placeFlexibleComponent: (boardId: string, type: ComponentType, pinHoleIds: string[], value: string) => void;
  removeComponent: (id: string) => void;
  rotateComponent: (id: string, rotation: Rotation) => void;
  moveAnchor: (id: string, anchorHoleId: string) => void;
  setPinHoles: (id: string, pinHoleIds: string[]) => void;
  addWire: (wire: Wire) => void;
  removeWire: (id: string) => void;
  addRailLink: (railLink: RailLink) => void;
  removeRailLink: (id: string) => void;
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

  const placeFlexibleComponent = useCallback(
    (boardId: string, type: ComponentType, pinHoleIds: string[], value: string) => {
      dispatch({
        type: 'PLACE_COMPONENT',
        component: { id: nextId('comp'), boardId, type, pinHoleIds, value },
      });
    },
    [],
  );

  const removeComponent = useCallback((id: string) => dispatch({ type: 'REMOVE_COMPONENT', id }), []);
  const rotateComponent = useCallback(
    (id: string, rotation: Rotation) => dispatch({ type: 'ROTATE_COMPONENT', id, rotation }),
    [],
  );
  const moveAnchor = useCallback(
    (id: string, anchorHoleId: string) => dispatch({ type: 'MOVE_ANCHOR', id, anchorHoleId }),
    [],
  );
  const setPinHoles = useCallback(
    (id: string, pinHoleIds: string[]) => dispatch({ type: 'SET_PIN_HOLES', id, pinHoleIds }),
    [],
  );
  const addWire = useCallback((wire: Wire) => dispatch({ type: 'ADD_WIRE', wire }), []);
  const removeWire = useCallback((id: string) => dispatch({ type: 'REMOVE_WIRE', id }), []);
  const addRailLink = useCallback((railLink: RailLink) => dispatch({ type: 'ADD_RAIL_LINK', railLink }), []);
  const removeRailLink = useCallback((id: string) => dispatch({ type: 'REMOVE_RAIL_LINK', id }), []);
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);
  const load = useCallback((snapshot: CircuitSnapshot) => dispatch({ type: 'LOAD', snapshot }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return useMemo(
    () => ({
      components: state.present.components,
      wires: state.present.wires,
      railLinks: state.present.railLinks,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
      placeComponent,
      placeFlexibleComponent,
      removeComponent,
      rotateComponent,
      moveAnchor,
      setPinHoles,
      addWire,
      removeWire,
      addRailLink,
      removeRailLink,
      undo,
      redo,
      load,
      reset,
    }),
    [
      state,
      placeComponent,
      placeFlexibleComponent,
      removeComponent,
      rotateComponent,
      moveAnchor,
      setPinHoles,
      addWire,
      removeWire,
      addRailLink,
      removeRailLink,
      undo,
      redo,
      load,
      reset,
    ],
  );
}

export { CircuitContext };

export function useCircuit(): CircuitApi {
  const ctx = useContext(CircuitContext);
  if (!ctx) throw new Error('useCircuit must be used within CircuitContext.Provider');
  return ctx;
}

function normalizeSnapshot(parsed: Partial<CircuitSnapshot>): CircuitSnapshot {
  return { components: parsed.components ?? [], wires: parsed.wires ?? [], railLinks: parsed.railLinks ?? [] };
}

/**
 * Named, multi-slot design storage - a single localStorage key holding a
 * {name: snapshot} map, so saving a new design doesn't clobber the last one.
 * This only persists per browser profile on one machine; see designFile.ts
 * for the file-based export/import that survives a cleared cache, a new
 * machine, or just wanting a durable copy outside the browser.
 */
const DESIGNS_STORAGE_KEY = 'cabal-breadboard-designs';

function readDesignsMap(): Record<string, CircuitSnapshot> {
  const raw = localStorage.getItem(DESIGNS_STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, CircuitSnapshot>;
  } catch {
    return {};
  }
}

function writeDesignsMap(map: Record<string, CircuitSnapshot>) {
  localStorage.setItem(DESIGNS_STORAGE_KEY, JSON.stringify(map));
}

export function listSavedDesignNames(): string[] {
  return Object.keys(readDesignsMap()).sort((a, b) => a.localeCompare(b));
}

export function saveNamedDesign(name: string, snapshot: CircuitSnapshot) {
  const map = readDesignsMap();
  map[name] = snapshot;
  writeDesignsMap(map);
}

export function loadNamedDesign(name: string): CircuitSnapshot | null {
  const found = readDesignsMap()[name];
  return found ? normalizeSnapshot(found) : null;
}

export function deleteNamedDesign(name: string) {
  const map = readDesignsMap();
  delete map[name];
  writeDesignsMap(map);
}
