import { COMPONENT_DEFS, type ComponentType } from '../components/componentDefs';
import { nextRotation, type Rotation } from './rotation';

export const DRAG_MIME = 'application/x-cabal-component';

export interface DragPayload {
  type: ComponentType;
  value: string;
  rotation: Rotation;
}

export function encodeDragPayload(payload: DragPayload): string {
  return JSON.stringify(payload);
}

export function decodeDragPayload(raw: string): DragPayload | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.type === 'string') return parsed as DragPayload;
    return null;
  } catch {
    return null;
  }
}

export function rotatePendingValue(pending: DragPayload): DragPayload {
  const allowed = COMPONENT_DEFS[pending.type].allowedRotations;
  return { ...pending, rotation: nextRotation(pending.rotation, allowed) };
}

/** Converts a client-space point (e.g. from a MouseEvent) into the SVG's user-space
 * coordinates, accounting for viewBox scaling/positioning. */
export function clientToSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number): { x: number; y: number } {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: clientX, y: clientY };
  const local = pt.matrixTransform(ctm.inverse());
  return { x: local.x, y: local.y };
}
