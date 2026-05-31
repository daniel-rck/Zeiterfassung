export type RangePreset =
  | "today"
  | "yesterday"
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "lastMonth"
  | "last30Days"
  | "thisYear"
  | "custom";

export interface DateRange {
  from: number;
  to: number;
}

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function endOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(23, 59, 59, 999);
  return out;
}

function startOfWeek(d: Date, weekStart: 0 | 1): Date {
  const out = startOfDay(d);
  const dayOfWeek = out.getDay();
  const diff = (dayOfWeek - weekStart + 7) % 7;
  out.setDate(out.getDate() - diff);
  return out;
}

export function getRange(
  preset: RangePreset,
  weekStart: 0 | 1 = 1,
  reference: number = Date.now(),
): DateRange | null {
  if (preset === "custom") return null;
  const now = new Date(reference);
  switch (preset) {
    case "today":
      return { from: startOfDay(now).getTime(), to: endOfDay(now).getTime() };
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { from: startOfDay(y).getTime(), to: endOfDay(y).getTime() };
    }
    case "thisWeek": {
      const start = startOfWeek(now, weekStart);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return { from: start.getTime(), to: endOfDay(end).getTime() };
    }
    case "lastWeek": {
      const thisWeekStart = startOfWeek(now, weekStart);
      const start = new Date(thisWeekStart);
      start.setDate(start.getDate() - 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return { from: start.getTime(), to: endOfDay(end).getTime() };
    }
    case "thisMonth": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: start.getTime(), to: endOfDay(end).getTime() };
    }
    case "lastMonth": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: start.getTime(), to: endOfDay(end).getTime() };
    }
    case "last30Days": {
      const end = endOfDay(now);
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      return { from: startOfDay(start).getTime(), to: end.getTime() };
    }
    case "thisYear": {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      return { from: start.getTime(), to: endOfDay(end).getTime() };
    }
  }
}

export const RANGE_PRESET_LABELS: Record<RangePreset, string> = {
  today: "Heute",
  yesterday: "Gestern",
  thisWeek: "Diese Woche",
  lastWeek: "Letzte Woche",
  thisMonth: "Dieser Monat",
  lastMonth: "Letzter Monat",
  last30Days: "Letzte 30 Tage",
  thisYear: "Dieses Jahr",
  custom: "Benutzerdefiniert",
};
