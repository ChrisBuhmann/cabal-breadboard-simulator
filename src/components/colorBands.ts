const BAND_COLORS = [
  '#1a1a1a', // 0 black
  '#8b4513', // 1 brown
  '#ff2b2b', // 2 red
  '#ff9a1f', // 3 orange
  '#ffe135', // 4 yellow
  '#4caf50', // 5 green
  '#3b6fd6', // 6 blue
  '#9b30ff', // 7 violet
  '#8c8c8c', // 8 grey
  '#f5f5f5', // 9 white
];
const GOLD = '#d4af37';

function parseResistorValue(value: string): number {
  const m = value.trim().match(/^([\d.]+)\s*([rkKmM]?)\s*(?:ohm[s]?|Ω)?$/);
  if (!m) return NaN;
  const num = parseFloat(m[1]);
  const suffix = m[2].toLowerCase();
  const mult = suffix === 'k' ? 1e3 : suffix === 'm' ? 1e6 : 1;
  return num * mult;
}

/** Returns 4 hex colors: [digit1, digit2, multiplier, tolerance]. */
export function resistorColorBands(value: string): [string, string, string, string] {
  const ohms = parseResistorValue(value);
  if (!Number.isFinite(ohms) || ohms <= 0) {
    return ['#cccccc', '#cccccc', '#cccccc', GOLD];
  }
  const exp = Math.floor(Math.log10(ohms));
  let mantissa = Math.round(ohms / 10 ** (exp - 1));
  let multiplier = exp - 1;
  if (mantissa >= 100) {
    mantissa = Math.round(mantissa / 10);
    multiplier += 1;
  }
  const d1 = Math.floor(mantissa / 10);
  const d2 = mantissa % 10;
  const multColor = multiplier >= 0 && multiplier < BAND_COLORS.length ? BAND_COLORS[multiplier] : GOLD;
  return [BAND_COLORS[d1] ?? '#cccccc', BAND_COLORS[d2] ?? '#cccccc', multColor, GOLD];
}
