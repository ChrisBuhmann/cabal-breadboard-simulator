import { GRID_SIZE } from '../../board/boardTypes';

/** Pin 0 = anode, pin 1 = cathode (band end). */
export function DiodeSVG({ value }: { value: string }) {
  const span = 3 * GRID_SIZE;
  const bodyW = GRID_SIZE * 1.1;
  const bodyH = GRID_SIZE * 0.5;
  const cx = span / 2;

  return (
    <g>
      <line x1={0} y1={0} x2={span} y2={0} stroke="#999" strokeWidth={1.5} />
      <rect x={cx - bodyW / 2} y={-bodyH / 2} width={bodyW} height={bodyH} fill="#1a1a1a" stroke="#000" />
      <rect x={cx + bodyW / 2 - bodyH * 0.28} y={-bodyH / 2} width={bodyH * 0.28} height={bodyH} fill="#e0e0e0" />
      <text x={cx} y={-bodyH} textAnchor="middle" fontSize={6} fill="#555">
        {value}
      </text>
      <circle cx={0} cy={0} r={2.5} fill="#555" />
      <circle cx={span} cy={0} r={2.5} fill="#555" />
    </g>
  );
}
