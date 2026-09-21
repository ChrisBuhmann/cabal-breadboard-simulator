import { GRID_SIZE } from '../../board/boardTypes';

/** Pin 0/2 = outer terminals, pin 1 = wiper. */
export function PotSVG({ value }: { value: string }) {
  const span = 2 * GRID_SIZE;
  const cx = span / 2;
  const bodyTopY = -GRID_SIZE * 1.4;
  const r = GRID_SIZE * 0.9;

  return (
    <g>
      <line x1={0} y1={0} x2={0} y2={bodyTopY + r} stroke="#999" strokeWidth={1.5} />
      <line x1={span} y1={0} x2={span} y2={bodyTopY + r} stroke="#999" strokeWidth={1.5} />
      <line x1={cx} y1={0} x2={cx} y2={bodyTopY + r} stroke="#999" strokeWidth={1.5} />
      <rect x={cx - r} y={bodyTopY - r} width={r * 2} height={r * 2} rx={4} fill="#2255a4" stroke="#123456" />
      <circle cx={cx} cy={bodyTopY} r={r * 0.55} fill="#111" stroke="#444" />
      <line x1={cx} y1={bodyTopY} x2={cx + r * 0.4} y2={bodyTopY - r * 0.3} stroke="#eee" strokeWidth={1.5} />
      <text x={cx} y={bodyTopY + r + 12} textAnchor="middle" fontSize={7} fill="#333">
        {value}
      </text>
      <circle cx={0} cy={0} r={2.5} fill="#555" />
      <circle cx={cx} cy={0} r={2.5} fill="#555" />
      <circle cx={span} cy={0} r={2.5} fill="#555" />
    </g>
  );
}
