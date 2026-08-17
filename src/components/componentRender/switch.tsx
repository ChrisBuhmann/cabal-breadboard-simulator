import { GRID_SIZE } from '../../board/boardTypes';

/** Generic 9-lug 3PDT footswitch placeholder: pins laid out in a single row
 * (matching componentDefs.ts's line(9)), not a real footswitch's 3x3 lug
 * grid. See CabalGeneric_SW3PDT's ki_description for the same caveat on the
 * KiCad export side. */
export function Switch3PDTSVG({ value }: { value: string }) {
  const span = 8 * GRID_SIZE;
  const bodyTopY = -GRID_SIZE * 1.6;
  const bodyH = GRID_SIZE * 1.6;

  const legs = [];
  for (let i = 0; i < 9; i++) {
    const x = i * GRID_SIZE;
    legs.push(<line key={`leg${i}`} x1={x} y1={0} x2={x} y2={bodyTopY} stroke="#999" strokeWidth={1.5} />);
    legs.push(<circle key={`pin${i}`} cx={x} cy={0} r={2.5} fill="#555" />);
  }

  return (
    <g>
      {legs}
      <rect x={-GRID_SIZE * 0.4} y={bodyTopY - bodyH} width={span + GRID_SIZE * 0.8} height={bodyH} rx={4} fill="#3a3a3a" stroke="#111" />
      <circle cx={span / 2} cy={bodyTopY - bodyH / 2} r={GRID_SIZE * 0.6} fill="#888" stroke="#333" />
      <text x={span / 2} y={bodyTopY - bodyH - 5} textAnchor="middle" fontSize={7} fill="#333">
        {value}
      </text>
    </g>
  );
}
