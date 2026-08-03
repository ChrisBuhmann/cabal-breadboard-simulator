import { GRID_SIZE, ROW_TRACK_Y } from '../../board/boardTypes';

// DIP packages are always anchored on row 'e' (rowTrack 6), straddling to row 'f' (rowTrack 7).
const ROW_GAP = (ROW_TRACK_Y[7] - ROW_TRACK_Y[6]) * GRID_SIZE;

function DipBody({ halfWidth, value }: { halfWidth: number; value: string }) {
  const span = (halfWidth - 1) * GRID_SIZE;
  const bodyW = span + GRID_SIZE * 0.6;
  const bodyH = ROW_GAP + GRID_SIZE * 0.5;
  const x0 = -GRID_SIZE * 0.3;
  const y0 = -GRID_SIZE * 0.25;

  const legs = [];
  for (let i = 0; i < halfWidth; i++) {
    legs.push(<circle key={`t${i}`} cx={i * GRID_SIZE} cy={0} r={2.5} fill="#c9c9c9" />);
    legs.push(<circle key={`b${i}`} cx={i * GRID_SIZE} cy={ROW_GAP} r={2.5} fill="#c9c9c9" />);
  }

  return (
    <g>
      <rect x={x0} y={y0} width={bodyW} height={bodyH} rx={3} fill="#1c1c1c" stroke="#000" />
      <path d={`M ${x0 + bodyW / 2 - 6} ${y0} a 6 6 0 0 0 12 0 Z`} fill="#000" />
      <circle cx={x0 + 6} cy={y0 + 6} r={2} fill="#444" />
      <text x={bodyW / 2 + x0} y={ROW_GAP / 2 + 3} textAnchor="middle" fontSize={7} fill="#ddd">
        {value}
      </text>
      {legs}
    </g>
  );
}

export function Dip8SVG({ value }: { value: string }) {
  return <DipBody halfWidth={4} value={value} />;
}

export function Dip14SVG({ value }: { value: string }) {
  return <DipBody halfWidth={7} value={value} />;
}
