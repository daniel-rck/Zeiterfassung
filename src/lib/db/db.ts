import type { DBSchema } from "idb";
import type { Break, Project, StoredInvoice, Tag, TimeEntry } from "../types";
import { clearStores } from "./mutations.ts";
import { createDBOpener } from "./open.ts";

export const DB_NAME = "zeiterfassung";
export const DB_VERSION = 3;

export type StoredTimeEntry = TimeEntry & {
  startedAtDay: string;
  running: 0 | 1;
};

export interface ZeiterfassungDB extends DBSchema {
  projects: {
    key: string;
    value: Project;
    indexes: {
      byName: string;
      byArchived: number;
    };
  };
  tags: {
    key: string;
    value: Tag;
    indexes: {
      byName: string;
    };
  };
  time_entries: {
    key: string;
    value: StoredTimeEntry;
    indexes: {
      byProjectId: string;
      byStartedAt: number;
      byStartedAtDay: string;
      byRunning: number;
    };
  };
  invoices: {
    key: string;
    value: StoredInvoice;
    indexes: {
      byDate: number;
    };
  };
  breaks: {
    key: string;
    value: Break;
    indexes: {
      byEntryId: string;
      byStartedAt: number;
    };
  };
}

/** Alias used by the web-base storage convention. */
export type AppSchema = ZeiterfassungDB;

export function dayKey(timestamp: number): string {
  const d = new Date(timestamp);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export const getDB = createDBOpener<ZeiterfassungDB>({
  // Name and version are the users' existing database — never rename it, or
  // every user starts over with an empty one.
  name: DB_NAME,
  version: DB_VERSION,
  upgrade(db, oldVersion) {
    // The migration ladder: never edit a step that has shipped; bump
    // DB_VERSION and add a new `if (oldVersion < N)` below the last one.
    if (oldVersion < 1) {
      const projects = db.createObjectStore("projects", { keyPath: "id" });
      projects.createIndex("byName", "name");
      projects.createIndex("byArchived", "archived");

      const tags = db.createObjectStore("tags", { keyPath: "id" });
      tags.createIndex("byName", "name");

      const entries = db.createObjectStore("time_entries", { keyPath: "id" });
      entries.createIndex("byProjectId", "projectId");
      entries.createIndex("byStartedAt", "startedAt");
      entries.createIndex("byStartedAtDay", "startedAtDay");
      entries.createIndex("byRunning", "running");
    }
    if (oldVersion < 2) {
      const invoices = db.createObjectStore("invoices", { keyPath: "id" });
      invoices.createIndex("byDate", "date");
    }
    if (oldVersion < 3) {
      const breaks = db.createObjectStore("breaks", { keyPath: "id" });
      breaks.createIndex("byEntryId", "entryId");
      breaks.createIndex("byStartedAt", "startedAt");
    }
  },
});

/** Wipe every store (tests' cleanup, a "delete all data" action). */
export async function clearAll(): Promise<void> {
  await clearStores(await getDB());
}

export { notifyMutation } from "./mutations.ts";
