export type RailKind = 'rtp' | 'rtn' | 'rbp' | 'rbn';

export const RAIL_KINDS: RailKind[] = ['rtp', 'rtn', 'rbp', 'rbn'];

export const RAIL_LABELS: Record<RailKind, string> = {
  rtp: 'Top + Rail',
  rtn: 'Top − Rail',
  rbp: 'Bottom + Rail',
  rbn: 'Bottom − Rail',
};

/** A rail is physically split into left/right segments at the board midpoint
 * (see boardGenerator.ts); linking two boards' rails means bridging both segments. */
export interface RailLink {
  id: string;
  boardAId: string;
  railA: RailKind;
  boardBId: string;
  railB: RailKind;
}

export function railNodeGroupIds(boardId: string, rail: RailKind): [string, string] {
  return [`${boardId}:R_${rail}_L`, `${boardId}:R_${rail}_R`];
}
