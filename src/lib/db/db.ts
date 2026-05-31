import { type DBSchema, type IDBPDatabase, openDB } from "idb";
import type { Break, Project, StoredInvoice, Tag, TimeEntry } from "../types";

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

let dbPromise: Promise<IDBPDatabase<ZeiterfassungDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<ZeiterfassungDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ZeiterfassungDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
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
      blocked() {
        console.warn("[zeiterfassung] DB upgrade blocked");
      },
      blocking() {
        void getDB().then((db) => db.close());
        dbPromise = null;
      },
    });
  }
  return dbPromise;
}

/** Notify subscribers of mutations. Channels are per-store; "*" hits all. */
export function notifyMutation(storeName: string): void {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(`db:${storeName}`);
  channel.postMessage({ type: "mutation", at: Date.now() });
  channel.close();
}

/** Wipe all object stores in the current DB, then notify every subscriber. */
export async function clearAll(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(Array.from(db.objectStoreNames), "readwrite");
  await Promise.all(Array.from(db.objectStoreNames).map((name) => tx.objectStore(name).clear()));
  await tx.done;
  notifyMutation("*");
}

export async function _resetDBForTests(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
  }
  dbPromise = null;
}
