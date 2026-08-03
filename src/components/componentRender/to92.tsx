import { GRID_SIZE } from '../../board/boardTypes';

export function To92SVG({ value }: { value: string }) {
  const span = 2 * GRID_SIZE;
  const cx = span / 2;
  const r = GRID_SIZE * 0.6;
  const bodyTopY = -GRID_SIZE * 1.1;

  return (
    <g>
      {[0, 1, 2].map((i) => (
        <line key={i} x1={i * GRID_SIZE} y1={0} x2={i * GRID_SIZE} y2={bodyTopY + r} stroke="#999" strokeWidth={1.5} />
      ))}
      <path
        d={`M ${cx - r} ${bodyTopY + r} A ${r} ${r} 0 1 1 ${cx + r} ${bodyTopY + r} L ${cx + r} ${bodyTopY + r * 1.6} L ${cx - r} ${bodyTopY + r * 1.6} Z`}
        fill="#2b2b2b"
        stroke="#000"
      />
      <rect x={cx - r} y={bodyTopY + r * 1.5} width={r * 0.55} height={r * 0.35} fill="#555" />
      <text x={cx} y={bodyTopY - 3} textAnchor="middle" fontSize={6.5} fill="#555">
        {value}
      </text>
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={i * GRID_SIZE} cy={0} r={2.5} fill="#555" />
      ))}
    </g>
  );
}
