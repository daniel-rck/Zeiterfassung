export function parseDuration(input: string): number | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;

  // HH:MM or HH:MM:SS
  const colonMatch = trimmed.match(/^(\d+):([0-5]?\d)(?::([0-5]?\d))?$/);
  if (colonMatch) {
    const h = Number(colonMatch[1]);
    const m = Number(colonMatch[2]);
    const s = colonMatch[3] ? Number(colonMatch[3]) : 0;
    return h * 3600 + m * 60 + s;
  }

  // h/m/s combinations: "1h 30m", "1h30m", "90m", "45s"
  const partMatch = trimmed.match(
    /^(?:(\d+(?:[.,]\d+)?)\s*h)?\s*(?:(\d+(?:[.,]\d+)?)\s*m(?:in)?)?\s*(?:(\d+(?:[.,]\d+)?)\s*s)?$/,
  );
  if (partMatch && (partMatch[1] || partMatch[2] || partMatch[3])) {
    const h = partMatch[1] ? parseFloat(partMatch[1].replace(",", ".")) : 0;
    const m = partMatch[2] ? parseFloat(partMatch[2].replace(",", ".")) : 0;
    const s = partMatch[3] ? parseFloat(partMatch[3].replace(",", ".")) : 0;
    return Math.round(h * 3600 + m * 60 + s);
  }

  // Plain decimal hours: "1.5", "0,75", "2"
  const decimalMatch = trimmed.match(/^(\d+(?:[.,]\d+)?)$/);
  if (decimalMatch) {
    const hours = parseFloat(decimalMatch[1].replace(",", "."));
    return Math.round(hours * 3600);
  }

  return null;
}

export function roundDurationSec(seconds: number, roundToMinutes: 0 | 1 | 5 | 15 | 30): number {
  if (roundToMinutes === 0) return seconds;
  const step = roundToMinutes * 60;
  return Math.round(seconds / step) * step;
}
