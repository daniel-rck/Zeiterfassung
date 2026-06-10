import { dayKey } from "../db";
import type { Project, Tag, TimeEntry } from "../types";

// Cells that start with these characters are interpreted as formulas by
// Excel / LibreOffice / Google Sheets and can execute commands when opened.
// We prefix with an apostrophe so the cell is read literally. Pure numeric
// values are left untouched.
const FORMULA_TRIGGERS = /^[=+\-@\t\r]/;

function escapeCsv(value: string | number | undefined): string {
  if (value == null) return "";
  let str = String(value);
  if (typeof value === "string" && FORMULA_TRIGGERS.test(str)) {
    str = `'${str}`;
  }
  if (/[",\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function entriesToCsv(entries: TimeEntry[], projects: Project[], tags: Tag[]): string {
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const tagMap = new Map(tags.map((t) => [t.id, t]));
  const header = [
    "Datum",
    "Start",
    "Ende",
    "Dauer (h)",
    "Beschreibung",
    "Projekt",
    "Kunde",
    "Tags",
    "Abrechenbar",
    "Stundensatz",
    "Betrag",
    "Währung",
  ];
  const rows = entries.map((e) => {
    const project = e.projectId ? projectMap.get(e.projectId) : undefined;
    const tagNames = e.tagIds
      .map((id) => tagMap.get(id)?.name ?? "")
      .filter(Boolean)
      .join(", ");
    const startDate = new Date(e.startedAt);
    const endDate = e.endedAt ? new Date(e.endedAt) : null;
    const hours = e.durationSec / 3600;
    const rate = e.hourlyRateSnapshot ?? project?.hourlyRate;
    const amount = e.billable && rate ? hours * rate : "";
    const formatTime = (d: Date) =>
      `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    return [
      dayKey(e.startedAt),
      formatTime(startDate),
      endDate ? formatTime(endDate) : "",
      hours.toFixed(2),
      e.description,
      project?.name ?? "",
      project?.client ?? "",
      tagNames,
      e.billable ? "ja" : "nein",
      rate != null ? rate.toFixed(2) : "",
      amount === "" ? "" : amount.toFixed(2),
      e.currencySnapshot ?? project?.currency ?? "",
    ].map(escapeCsv);
  });
  return [header.map(escapeCsv).join(";"), ...rows.map((r) => r.join(";"))].join("\n");
}

export function downloadCsv(filename: string, content: string): void {
  // ﻿ = UTF-8 BOM so Excel detects the encoding.
  const blob = new Blob([`﻿${content}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
