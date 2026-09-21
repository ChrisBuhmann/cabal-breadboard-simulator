import { GRID_SIZE } from '../../board/boardTypes';

/** Generic multi-lug switch placeholder: pins laid out in a single row
 * (matching componentDefs.ts's line(n)), not a real switch's multi-row lug
 * grid. See the corresponding CabalGeneric_SW* symbol's ki_description for
 * the same caveat on the KiCad export side. */
function SwitchBody({ pinCount, value }: { pinCount: number; value: string }) {
  const span = (pinCount - 1) * GRID_SIZE;
  const bodyTopY = -GRID_SIZE * 1.6;
  const bodyH = GRID_SIZE * 1.6;

  const legs = [];
  for (let i = 0; i < pinCount; i++) {
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

export function Switch3PDTSVG({ value }: { value: string }) {
  return <SwitchBody pinCount={9} value={value} />;
}

export function SwitchDPDTSVG({ value }: { value: string }) {
  return <SwitchBody pinCount={6} value={value} />;
}
