import { GRID_SIZE } from '../../board/boardTypes';
import { resistorColorBands } from '../colorBands';

export function ResistorSVG({ value }: { value: string }) {
  const span = 4 * GRID_SIZE;
  const bodyW = span * 0.5;
  const bodyH = GRID_SIZE * 0.55;
  const bodyX = span / 2 - bodyW / 2;
  const bands = resistorColorBands(value);

  return (
    <g>
      <line x1={0} y1={0} x2={span} y2={0} stroke="#b8860b" strokeWidth={2} />
      <rect x={bodyX} y={-bodyH / 2} width={bodyW} height={bodyH} rx={bodyH / 2} fill="#e8d5a0" stroke="#8a7340" />
      {bands.map((c, i) => (
        <rect key={i} x={bodyX + bodyW * 0.16 + i * bodyW * 0.17} y={-bodyH / 2} width={bodyW * 0.09} height={bodyH} fill={c} />
      ))}
      <circle cx={0} cy={0} r={2.5} fill="#555" />
      <circle cx={span} cy={0} r={2.5} fill="#555" />
    </g>
  );
}
