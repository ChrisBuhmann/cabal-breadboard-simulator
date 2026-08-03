export const GRID_SIZE = 20;
export const NUM_COLS = 60;

export type RowCode =
  | 'rtp' | 'rtn'
  | 'a' | 'b' | 'c' | 'd' | 'e'
  | 'f' | 'g' | 'h' | 'i' | 'j'
  | 'rbp' | 'rbn';

export const ROW_CODES: RowCode[] = [
  'rtp', 'rtn',
  'a', 'b', 'c', 'd', 'e',
  'f', 'g', 'h', 'i', 'j',
  'rbp', 'rbn',
];

export const ROW_TRACK_Y: number[] = [0, 1, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 15, 16];

export const TERMINAL_ROW_TRACK_START = 2;
export const TERMINAL_ROW_TRACK_END = 11;

export function isRailRow(rowTrack: number): boolean {
  return rowTrack <= 1 || rowTrack >= 12;
}

export function isTopTerminalRow(rowTrack: number): boolean {
  return rowTrack >= 2 && rowTrack <= 6;
}

export function isBottomTerminalRow(rowTrack: number): boolean {
  return rowTrack >= 7 && rowTrack <= 11;
}

/** Board is split into zones; only DIP packages may straddle top/bottom terminal zones. */
export type Zone = 'rail-top-pos' | 'rail-top-neg' | 'terminal-top' | 'terminal-bottom' | 'rail-bot-pos' | 'rail-bot-neg';

export function zoneOf(rowTrack: number): Zone {
  switch (rowTrack) {
    case 0: return 'rail-top-pos';
    case 1: return 'rail-top-neg';
    case 12: return 'rail-bot-pos';
    case 13: return 'rail-bot-neg';
    default: return isTopTerminalRow(rowTrack) ? 'terminal-top' : 'terminal-bottom';
  }
}

export interface Hole {
  id: string;
  row: RowCode;
  rowTrack: number;
  col: number;
  x: number;
  y: number;
  nodeGroupId: string;
}

export interface BoardModel {
  id: string;
  holes: Hole[];
  holesById: Map<string, Hole>;
  nodeGroupIds: string[];
  numCols: number;
}

/** Namespaced by boardId so hole ids stay globally unique once multiple boards exist. */
export function holeId(boardId: string, row: RowCode, col: number): string {
  return `${boardId}:${row}${col}`;
}
