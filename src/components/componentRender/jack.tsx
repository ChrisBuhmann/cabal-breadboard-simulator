import { GRID_SIZE } from '../../board/boardTypes';

/** Pin 0 = tip (signal), pin 1 = sleeve (ground) - standard TS mono wiring. */
function JackSVG({ label, color }: { label: string; color: string }) {
  const span = 2 * GRID_SIZE;
  const cx = span / 2;
  const r = GRID_SIZE * 0.45;

  return (
    <g>
      <line x1={0} y1={0} x2={span} y2={0} stroke="#999" strokeWidth={1.5} />
      <circle cx={cx} cy={0} r={r} fill={color} stroke="#222" />
      <text x={cx} y={2.5} textAnchor="middle" fontSize={6.5} fill="#fff">
        {label}
      </text>
      <circle cx={0} cy={0} r={2.5} fill="#555" />
      <circle cx={span} cy={0} r={2.5} fill="#555" />
    </g>
  );
}

export function InputJackSVG({ value }: { value: string }) {
  return <JackSVG label={value || 'IN'} color="#3b7dff" />;
}

export function OutputJackSVG({ value }: { value: string }) {
  return <JackSVG label={value || 'OUT'} color="#e0a83a" />;
}
