import type { BoardModel, Hole } from '../board/boardTypes';
import { ROW_CODES, GRID_SIZE, zoneOf, holeId } from '../board/boardTypes';
import { COMPONENT_DEFS, type ComponentType, type PlacedComponent } from '../components/componentDefs';
import { rotateOffset, type Rotation } from './rotation';

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

/** Resolves the absolute holes a component would occupy for a given anchor + rotation.
 * Returns null if any pin falls off the board or lands on a gap (e.g. rail cosmetic gap). */
export function resolvePinHoles(
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

export interface PlacementResult {
  valid: boolean;
  pinHoleIds?: string[];
  reason?: string;
}

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

  const pinHoles = resolvePinHoles(board, type, anchorHoleId, rotation);
  if (!pinHoles) {
    return { valid: false, reason: 'Placement falls off the board' };
  }

  const zones = new Set(pinHoles.map((h) => zoneOf(h.rowTrack)));
  if (def.straddlesTrench) {
    const anchor = board.holesById.get(anchorHoleId)!;
    if (anchor.row !== 'e') {
      return { valid: false, reason: `${def.label} must be anchored on row e, straddling rows e/f` };
    }
    const expected = new Set(['terminal-top', 'terminal-bottom']);
    if (zones.size !== 2 || ![...zones].every((z) => expected.has(z))) {
      return { valid: false, reason: `${def.label} must straddle the trench (rows e/f)` };
    }
  } else if (zones.size > 1) {
    return { valid: false, reason: 'Component cannot span multiple board zones' };
  }

  const occupied = occupiedHoleIds(existingComponents, board);
  for (const hole of pinHoles) {
    if (occupied.has(hole.id)) {
      return { valid: false, reason: `Hole ${hole.id} is already occupied` };
    }
  }

  return { valid: true, pinHoleIds: pinHoles.map((h) => h.id) };
}

export function occupiedHoleIds(components: PlacedComponent[], board: BoardModel): Set<string> {
  const set = new Set<string>();
  for (const comp of components) {
    const pins = resolvePinHoles(board, comp.type, comp.anchorHoleId, comp.rotation);
    pins?.forEach((h) => set.add(h.id));
  }
  return set;
}
