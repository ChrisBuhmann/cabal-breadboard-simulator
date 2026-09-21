import { GRID_SIZE } from '../../board/boardTypes';

const LEG_COLOR = '#999';

export function FilmCapacitorSVG({ value }: { value: string }) {
  const span = 2 * GRID_SIZE;
  const w = GRID_SIZE * 0.85;
  const h = GRID_SIZE * 1.1;
  return (
    <g>
      <line x1={0} y1={0} x2={span / 2 - w / 2} y2={0} stroke={LEG_COLOR} strokeWidth={1.5} />
      <line x1={span / 2 + w / 2} y1={0} x2={span} y2={0} stroke={LEG_COLOR} strokeWidth={1.5} />
      <rect x={span / 2 - w / 2} y={-h / 2} width={w} height={h} rx={4} fill="#e0a83a" stroke="#8a6a1e" />
      <text x={span / 2} y={3} textAnchor="middle" fontSize={7} fill="#3a2a05">
        {value}
      </text>
      <circle cx={0} cy={0} r={2.5} fill="#555" />
      <circle cx={span} cy={0} r={2.5} fill="#555" />
    </g>
  );
}

export function CeramicCapacitorSVG({ value }: { value: string }) {
  const span = 2 * GRID_SIZE;
  const r = GRID_SIZE * 0.55;
  return (
    <g>
      <line x1={0} y1={0} x2={span / 2} y2={-r * 0.5} stroke={LEG_COLOR} strokeWidth={1.5} />
      <line x1={span} y1={0} x2={span / 2} y2={-r * 0.5} stroke={LEG_COLOR} strokeWidth={1.5} />
      <ellipse cx={span / 2} cy={-r * 0.5} rx={r} ry={r * 0.75} fill="#4a8f5c" stroke="#2c5a37" />
      <text x={span / 2} y={-r * 0.5 + 3} textAnchor="middle" fontSize={6.5} fill="#eafff0">
        {value}
      </text>
      <circle cx={0} cy={0} r={2.5} fill="#555" />
      <circle cx={span} cy={0} r={2.5} fill="#555" />
    </g>
  );
}

export function ElectrolyticCapacitorSVG({ value }: { value: string }) {
  const span = 2 * GRID_SIZE;
  const w = GRID_SIZE * 0.9;
  const h = GRID_SIZE * 1.3;
  const cx = span / 2;
  return (
    <g>
      <line x1={0} y1={0} x2={cx - w / 2} y2={0} stroke={LEG_COLOR} strokeWidth={1.5} />
      <line x1={cx + w / 2} y1={0} x2={span} y2={0} stroke={LEG_COLOR} strokeWidth={1.5} />
      <rect x={cx - w / 2} y={-h / 2} width={w} height={h} rx={3} fill="#2b2b2b" stroke="#000" />
      <rect x={cx - w / 2} y={-h / 2} width={w * 0.28} height={h} fill="#546e7a" />
      <text x={cx - w / 2 - 6} y={-h / 2 + 8} fontSize={8} fill="#546e7a">
        +
      </text>
      <text x={cx} y={4} textAnchor="middle" fontSize={6} fill="#ddd">
        {value}
      </text>
      <circle cx={0} cy={0} r={2.5} fill="#555" />
      <circle cx={span} cy={0} r={2.5} fill="#555" />
    </g>
  );
}
