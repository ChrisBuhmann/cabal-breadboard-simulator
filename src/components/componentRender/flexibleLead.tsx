import { GRID_SIZE } from '../../board/boardTypes';
import type { ComponentType } from '../componentDefs';
import { resistorColorBands } from '../colorBands';
import { LED_COLORS } from '../ledColors';

const BADGE_W = GRID_SIZE * 0.85;
const BADGE_H = GRID_SIZE * 0.5;

/** Fixed-size badge for a flexible-lead component - doesn't stretch with lead
 * length, matching how a real component's body is a fixed size regardless of
 * how far apart its leads are bent. Drawn in local space with +x pointing from
 * pin 0 towards pin 1 (see FlexibleLeadSVG), so polarity marks land on the
 * correct physical side: pin 0 (anode/+) is towards -x, pin 1 (cathode/-)
 * towards +x, matching the fixed-span renderers' documented pin conventions. */
function ComponentBadge({ type, value }: { type: ComponentType; value: string }) {
  switch (type) {
    case 'resistor': {
      const bands = resistorColorBands(value);
      return (
        <g>
          <rect x={-BADGE_W / 2} y={-BADGE_H / 2} width={BADGE_W} height={BADGE_H} rx={BADGE_H / 2} fill="#e8d5a0" stroke="#8a7340" />
          {bands.slice(0, 3).map((c, i) => (
            <rect
              key={i}
              x={-BADGE_W / 2 + BADGE_W * 0.18 + i * BADGE_W * 0.22}
              y={-BADGE_H / 2}
              width={BADGE_W * 0.12}
              height={BADGE_H}
              fill={c}
            />
          ))}
        </g>
      );
    }
    case 'capacitor-film':
      return <rect x={-BADGE_W / 2} y={-BADGE_H / 2} width={BADGE_W} height={BADGE_H} rx={4} fill="#e0a83a" stroke="#8a6a1e" />;
    case 'capacitor-ceramic':
      return <ellipse cx={0} cy={0} rx={BADGE_W / 2} ry={BADGE_H * 0.7} fill="#4a8f5c" stroke="#2c5a37" />;
    case 'capacitor-electrolytic':
      return (
        <g>
          <rect x={-BADGE_W / 2} y={-BADGE_H * 0.75} width={BADGE_W} height={BADGE_H * 1.5} rx={3} fill="#2b2b2b" stroke="#000" />
          <rect x={-BADGE_W / 2} y={-BADGE_H * 0.75} width={BADGE_W * 0.22} height={BADGE_H * 1.5} fill="#546e7a" />
          <text x={-BADGE_W / 2 - 6} y={-BADGE_H * 0.75 + 7} fontSize={7} fill="#546e7a">
            +
          </text>
        </g>
      );
    case 'diode':
      return (
        <g>
          <rect x={-BADGE_W / 2} y={-BADGE_H / 2} width={BADGE_W} height={BADGE_H} fill="#1a1a1a" stroke="#000" />
          <rect x={BADGE_W / 2 - BADGE_H * 0.28} y={-BADGE_H / 2} width={BADGE_H * 0.28} height={BADGE_H} fill="#e0e0e0" />
        </g>
      );
    case 'led': {
      const color = LED_COLORS[value.toLowerCase()] ?? LED_COLORS.red;
      return (
        <g>
          <circle cx={0} cy={0} r={BADGE_H * 0.65} fill={color} fillOpacity={0.85} stroke="#333" />
          <line x1={BADGE_H * 0.35} y1={-BADGE_H * 0.65} x2={BADGE_H * 0.35} y2={BADGE_H * 0.65} stroke="#333" strokeWidth={1.5} />
        </g>
      );
    }
    case 'input-jack':
    case 'output-jack': {
      const isInput = type === 'input-jack';
      return (
        <g>
          <circle cx={0} cy={0} r={BADGE_H * 0.8} fill={isInput ? '#3b7dff' : '#e0a83a'} stroke="#222" />
          <text x={0} y={2.5} textAnchor="middle" fontSize={6} fill="#fff">
            {isInput ? 'IN' : 'OUT'}
          </text>
        </g>
      );
    }
    default:
      return null;
  }
}

export function FlexibleLeadSVG({
  type,
  value,
  x1,
  y1,
  x2,
  y2,
  selected,
}: {
  type: ComponentType;
  value: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  selected?: boolean;
}) {
  const angleDeg = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  return (
    <g>
      {selected && (
        <line x1={x1} y1={y1} x2={x2} y2={y2} className="selection-outline" strokeWidth={5} strokeOpacity={0.35} strokeLinecap="round" />
      )}
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#999" strokeWidth={1.5} />
      <g transform={`translate(${midX} ${midY}) rotate(${angleDeg})`}>
        <ComponentBadge type={type} value={value} />
      </g>
      <circle cx={x1} cy={y1} r={2.5} fill="#555" />
      <circle cx={x2} cy={y2} r={2.5} fill="#555" />
    </g>
  );
}
