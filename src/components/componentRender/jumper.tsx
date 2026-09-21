interface JumperProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  span: number;
  selected?: boolean;
}

export function JumperSVG({ x1, y1, x2, y2, color, span, selected }: JumperProps) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  // bow is proportional to span and always arcs "up" in screen space, like a real jumper lead
  const bow = Math.min(4 + span * 1.8, 26);
  const bendX = mx;
  const bendY = my - bow;

  return (
    <g>
      <path
        d={`M ${x1} ${y1} Q ${bendX} ${bendY} ${x2} ${y2}`}
        fill="none"
        stroke={color}
        strokeWidth={selected ? 4 : 2.75}
        strokeLinecap="round"
        opacity={0.9}
      />
      <circle cx={x1} cy={y1} r={3} fill={color} stroke="#333" strokeWidth={0.5} />
      <circle cx={x2} cy={y2} r={3} fill={color} stroke="#333" strokeWidth={0.5} />
    </g>
  );
}
