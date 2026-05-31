import { DB_VERSION, dayKey, getDB, notifyMutation } from "../db";
import { writeSettings } from "../db/settings";
import type { DBSnapshot } from "../types";

export interface ImportResult {
  projects: number;
  tags: number;
  timeEntries: number;
}

function isSnapshot(value: unknown): value is DBSnapshot {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<DBSnapshot>;
  return (
    v.app === "zeiterfassung" &&
    typeof v.schemaVersion === "number" &&
    Array.isArray(v.projects) &&
    Array.isArray(v.tags) &&
    Array.isArray(v.timeEntries) &&
    typeof v.settings === "object"
  );
}

function findDuplicateIds(items: Array<{ id?: string }>, label: string): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (typeof item.id !== "string" || item.id === "") {
      throw new Error(`${label}: Eintrag ohne ID gefunden.`);
    }
    if (seen.has(item.id)) {
      throw new Error(`${label}: doppelte ID „${item.id}“.`);
    }
    seen.add(item.id);
  }
}

function validateEntry(e: unknown, i: number): void {
  if (!e || typeof e !== "object") throw new Error(`Eintrag #${i + 1}: ungültiger Typ.`);
  const entry = e as Record<string, unknown>;
  if (typeof entry.startedAt !== "number" || !Number.isFinite(entry.startedAt)) {
    throw new Error(`Eintrag #${i + 1}: ungültiger Startzeitpunkt.`);
  }
  if (
    entry.endedAt !== undefined &&
    entry.endedAt !== null &&
    (typeof entry.endedAt !== "number" || !Number.isFinite(entry.endedAt))
  ) {
    throw new Error(`Eintrag #${i + 1}: ungültiger Endzeitpunkt.`);
  }
  if (!Array.isArray(entry.tagIds)) {
    throw new Error(`Eintrag #${i + 1}: tagIds fehlt.`);
  }
}

export async function importSnapshot(json: string): Promise<ImportResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Datei ist kein gültiges JSON.");
  }
  if (!isSnapshot(parsed)) {
    throw new Error("Datei ist kein gültiges Zeiterfassung-Backup.");
  }
  if (parsed.schemaVersion > DB_VERSION) {
    throw new Error(
      `Backup wurde mit einer neueren App-Version (Schema ${parsed.schemaVersion}) erstellt.`,
    );
  }

  // Validate up-front so we never clear the DB before failing.
  findDuplicateIds(parsed.projects, "Projekte");
  findDuplicateIds(parsed.tags, "Tags");
  findDuplicateIds(parsed.timeEntries, "Einträge");
  parsed.timeEntries.forEach(validateEntry);
  const invoiceList = parsed.invoices ?? [];
  findDuplicateIds(invoiceList, "Rechnungen");

  const db = await getDB();
  const tx = db.transaction(["projects", "tags", "time_entries", "invoices"], "readwrite");
  try {
    await tx.objectStore("projects").clear();
    await tx.objectStore("tags").clear();
    await tx.objectStore("time_entries").clear();
    await tx.objectStore("invoices").clear();
    for (const project of parsed.projects) {
      await tx.objectStore("projects").put(project);
    }
    for (const tag of parsed.tags) {
      await tx.objectStore("tags").put(tag);
    }
    for (const entry of parsed.timeEntries) {
      await tx.objectStore("time_entries").put({
        ...entry,
        startedAtDay: dayKey(entry.startedAt),
        running: entry.endedAt == null ? 1 : 0,
      });
    }
    for (const invoice of invoiceList) {
      await tx.objectStore("invoices").put(invoice);
    }
    await tx.done;
  } catch (err) {
    // Best-effort abort: if a request already failed, the transaction may
    // already be inactive and calling abort() would throw a second error
    // that masks the real cause.
    try {
      tx.abort();
    } catch {
      // ignore
    }
    throw new Error(`Import fehlgeschlagen: ${(err as Error).message}`);
  }
  writeSettings(parsed.settings);
  notifyMutation("*");
  return {
    projects: parsed.projects.length,
    tags: parsed.tags.length,
    timeEntries: parsed.timeEntries.length,
  };
}

export async function pickAndImport(): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error("Keine Datei ausgewählt."));
        return;
      }
      try {
        const text = await file.text();
        const result = await importSnapshot(text);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    input.click();
  });
}
