import type { BoardModel, Hole } from '../board/boardTypes';
import { ROW_CODES, GRID_SIZE, holeId } from '../board/boardTypes';

export const JUMPER_SPANS = [1, 2, 3, 4, 6, 8, 10];

export interface Wire {
  id: string;
  boardId: string;
  fromHoleId: string;
  toHoleId: string;
  color: string;
  span: number;
}

export interface JumperCandidate {
  endHole: Hole;
  span: number;
}

function candidatesForAxis(
  board: BoardModel,
  start: Hole,
  axis: 'row' | 'col',
  sign: 1 | -1,
): JumperCandidate[] {
  const results: JumperCandidate[] = [];
  for (const span of JUMPER_SPANS) {
    let hole: Hole | undefined;
    if (axis === 'col') {
      const targetCol = start.col + sign * span;
      hole = board.holesById.get(holeId(board.id, start.row, targetCol));
    } else {
      const targetRowTrack = start.rowTrack + sign * span;
      const row = ROW_CODES[targetRowTrack];
      if (row) hole = board.holesById.get(holeId(board.id, row, start.col));
    }
    if (hole) results.push({ endHole: hole, span });
  }
  return results;
}

/** Given a drag from `start` towards pointer (px, py) in pixel space, finds the
 * nearest valid preset-length jumper end point along the dominant axis. */
export function computeJumperEnd(board: BoardModel, start: Hole, px: number, py: number): JumperCandidate | null {
  const dx = px - start.x * GRID_SIZE;
  const dy = py - start.y * GRID_SIZE;
  if (Math.abs(dx) < GRID_SIZE * 0.3 && Math.abs(dy) < GRID_SIZE * 0.3) return null;

  const axis: 'row' | 'col' = Math.abs(dx) >= Math.abs(dy) ? 'col' : 'row';
  const sign: 1 | -1 = (axis === 'col' ? dx : dy) >= 0 ? 1 : -1;
  const targetDist = axis === 'col' ? Math.abs(dx) : Math.abs(dy);

  const candidates = candidatesForAxis(board, start, axis, sign);
  if (candidates.length === 0) return null;

  // Compare against each candidate's own actual rendered distance from `start`,
  // not its abstract span number. Row spacing isn't uniform in span-index terms:
  // the rail<->nearest-terminal-row gap and the top/bottom trench each render at
  // double the normal row pitch (see ROW_TRACK_Y), so a hole that's 1 span away
  // can be 2 rows' worth of pixels away. Sorting by span number against a raw
  // pixel distance silently favored whichever candidate's *span number* was
  // numerically closest to the pixel gap, not whichever hole the pointer was
  // actually nearest to -- e.g. dragging onto the rail right next to a terminal
  // row would snap to the *next* rail over instead.
  const distanceOf = (candidate: JumperCandidate) =>
    Math.abs((axis === 'col' ? candidate.endHole.x - start.x : candidate.endHole.y - start.y) * GRID_SIZE);

  candidates.sort((a, b) => Math.abs(distanceOf(a) - targetDist) - Math.abs(distanceOf(b) - targetDist));
  return candidates[0];
}

export interface JumperValidation {
  valid: boolean;
  reason?: string;
}

export function validateJumper(start: Hole, end: Hole): JumperValidation {
  if (start.id === end.id) return { valid: false, reason: 'Start and end are the same hole' };
  if (start.nodeGroupId === end.nodeGroupId) {
    return { valid: false, reason: 'Both holes are already electrically connected' };
  }
  return { valid: true };
}

const WIRE_PALETTE = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#34495e'];

export function nextWireColor(existingCount: number): string {
  return WIRE_PALETTE[existingCount % WIRE_PALETTE.length];
}
