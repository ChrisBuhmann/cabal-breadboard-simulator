export type Rotation = 0 | 90 | 180 | 270;

export const ROTATIONS: Rotation[] = [0, 90, 180, 270];

export interface PinOffset {
  dcol: number;
  drow: number;
}

/** Rotates a grid offset the same way an SVG `rotate(deg)` transform would. */
export function rotateOffset(offset: PinOffset, rotation: Rotation): PinOffset {
  const { dcol, drow } = offset;
  switch (rotation) {
    case 0:
      return { dcol, drow };
    case 90:
      return { dcol: -drow, drow: dcol };
    case 180:
      return { dcol: -dcol, drow: -drow };
    case 270:
      return { dcol: drow, drow: -dcol };
  }
}

export function nextRotation(rotation: Rotation, allowed: Rotation[]): Rotation {
  const idx = allowed.indexOf(rotation);
  return allowed[(idx + 1) % allowed.length];
}
