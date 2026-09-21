import { GRID_SIZE } from '../../board/boardTypes';
import { LED_COLORS } from '../ledColors';

/** Pin 0 = anode (long leg), pin 1 = cathode (flat side). */
export function LedSVG({ value }: { value: string }) {
  const span = 2 * GRID_SIZE;
  const cx = span / 2;
  const r = GRID_SIZE * 0.5;
  const color = LED_COLORS[value.toLowerCase()] ?? LED_COLORS.red;

  return (
    <g>
      <line x1={0} y1={0} x2={cx} y2={r * 0.3} stroke="#999" strokeWidth={1.5} />
      <line x1={span} y1={0} x2={cx} y2={r * 0.3} stroke="#999" strokeWidth={1.5} />
      <path
        d={`M ${cx - r} ${r * 0.3} L ${cx - r} ${-r * 0.4} A ${r} ${r} 0 0 1 ${cx + r} ${-r * 0.4} L ${cx + r} ${r * 0.3} Z`}
        fill={color}
        fillOpacity={0.85}
        stroke="#333"
      />
      <line x1={cx - r} y1={r * 0.3} x2={cx - r} y2={-r * 0.4} stroke="#333" strokeWidth={2} />
      <circle cx={0} cy={0} r={2.5} fill="#555" />
      <circle cx={span} cy={0} r={2.5} fill="#555" />
    </g>
  );
}
