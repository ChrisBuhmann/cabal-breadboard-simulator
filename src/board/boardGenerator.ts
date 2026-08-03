import {
  type BoardModel,
  type Hole,
  type RowCode,
  ROW_CODES,
  ROW_TRACK_Y,
  NUM_COLS,
  isRailRow,
  isTopTerminalRow,
  holeId,
} from './boardTypes';

const MIDPOINT = NUM_COLS / 2;

function railSegment(col: number): 'L' | 'R' {
  return col <= MIDPOINT ? 'L' : 'R';
}

function nodeGroupFor(row: RowCode, rowTrack: number, col: number): string {
  if (isRailRow(rowTrack)) {
    return `R_${row}_${railSegment(col)}`;
  }
  return isTopTerminalRow(rowTrack) ? `Ttop${col}` : `Tbot${col}`;
}

/** Real rails are physically grouped in blocks of 5 holes with a gap; the gap is
 * cosmetic only — the whole segment (up to the midpoint break) is one node group. */
function railHoleExists(col: number): boolean {
  return col % 6 !== 0;
}

export function generateBoard(): BoardModel {
  const holes: Hole[] = [];
  const holesById = new Map<string, Hole>();
  const nodeGroupSet = new Set<string>();

  ROW_CODES.forEach((row, rowTrack) => {
    const y = ROW_TRACK_Y[rowTrack];
    for (let col = 1; col <= NUM_COLS; col++) {
      if (isRailRow(rowTrack) && !railHoleExists(col)) continue;
      const nodeGroupId = nodeGroupFor(row, rowTrack, col);
      nodeGroupSet.add(nodeGroupId);
      const hole: Hole = {
        id: holeId(row, col),
        row,
        rowTrack,
        col,
        x: col,
        y,
        nodeGroupId,
      };
      holes.push(hole);
      holesById.set(hole.id, hole);
    }
  });

  return {
    holes,
    holesById,
    nodeGroupIds: Array.from(nodeGroupSet),
    numCols: NUM_COLS,
  };
}
