import { useState } from 'react';
import { COMPONENT_DEFS, COMPONENT_TYPES, type ComponentType } from '../components/componentDefs';
import { COMPONENT_RENDERERS } from '../components/componentRender/index';
import { DRAG_MIME, encodeDragPayload, type DragPayload } from '../interaction/dragDrop';
import type { Rotation } from '../interaction/rotation';

interface PaletteProps {
  pending: DragPayload | null;
  onArm: (payload: DragPayload) => void;
  onCancelPending: () => void;
  onRotatePending: () => void;
}

export function ComponentPalette({ pending, onArm, onCancelPending, onRotatePending }: PaletteProps) {
  const [values, setValues] = useState<Record<ComponentType, string>>(() => {
    const initial = {} as Record<ComponentType, string>;
    for (const t of COMPONENT_TYPES) initial[t] = COMPONENT_DEFS[t].defaultValue;
    return initial;
  });

  return (
    <div className="palette">
      <h2>Components</h2>
      <p className="palette-hint">Drag onto the board, or click to arm and click a hole to place.</p>
      {COMPONENT_TYPES.map((type) => {
        const def = COMPONENT_DEFS[type];
        const Visual = COMPONENT_RENDERERS[type];
        const armed = pending?.type === type;
        return (
          <div key={type} className={`palette-item${armed ? ' armed' : ''}`}>
            <div
              className="palette-icon"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(DRAG_MIME, encodeDragPayload({ type, value: values[type], rotation: 0 }));
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onClick={() =>
                armed ? onCancelPending() : onArm({ type, value: values[type], rotation: 0 as Rotation })
              }
              title={`Place ${def.label}`}
            >
              <svg viewBox="-15 -25 90 45" width={70} height={40}>
                <Visual value={values[type]} />
              </svg>
            </div>
            <div className="palette-meta">
              <span className="palette-label">{def.label}</span>
              <input
                className="palette-value"
                value={values[type]}
                onChange={(e) => setValues((v) => ({ ...v, [type]: e.target.value }))}
              />
            </div>
          </div>
        );
      })}

      {pending && (
        <div className="pending-bar">
          <span>
            Placing {COMPONENT_DEFS[pending.type].label} @ {pending.rotation}°
          </span>
          <button onClick={onRotatePending}>Rotate</button>
          <button onClick={onCancelPending}>Cancel</button>
        </div>
      )}
    </div>
  );
}
