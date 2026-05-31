import { Search, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Kbd } from "./Kbd";

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  hint?: string;
  icon?: ReactNode;
  kbd?: string;
  section: string;
  keywords?: string[];
  onSelect: () => void;
}

function fuzzyScore(query: string, target: string): number {
  if (!query) return 0;
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t === q) return 1000;
  if (t.startsWith(q)) return 500;
  if (t.includes(q)) return 200;
  // Subsequence match
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  if (qi === q.length) return 100 - (t.length - q.length);
  return -1;
}

export function CommandPalette({
  open,
  onClose,
  commands,
}: {
  open: boolean;
  onClose: () => void;
  commands: CommandItem[];
}) {
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setHighlight(0);
      return;
    }
    inputRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const scored = useMemo(() => {
    const q = query.trim();
    if (!q) return commands.map((c) => ({ cmd: c, score: 0 }));
    return commands
      .map((c) => {
        const labelScore = fuzzyScore(q, c.label);
        const descScore = c.description ? fuzzyScore(q, c.description) : -1;
        const kwScore = c.keywords ? Math.max(...c.keywords.map((k) => fuzzyScore(q, k)), -1) : -1;
        const score = Math.max(labelScore, descScore * 0.7, kwScore * 0.6);
        return { cmd: c, score };
      })
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score);
  }, [commands, query]);

  const sections = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    scored.forEach(({ cmd }) => {
      const arr = map.get(cmd.section) ?? [];
      arr.push(cmd);
      map.set(cmd.section, arr);
    });
    return Array.from(map.entries());
  }, [scored]);

  const flat = scored.map((s) => s.cmd);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-cmd-index="${highlight}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight, open]);

  const select = (cmd: CommandItem) => {
    onClose();
    setTimeout(() => cmd.onSelect(), 0);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Befehlsmenü"
      className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[15vh]"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onClose();
          return;
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setHighlight((h) => Math.min(h + 1, flat.length - 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setHighlight((h) => Math.max(h - 1, 0));
        } else if (e.key === "Enter") {
          e.preventDefault();
          const cmd = flat[highlight];
          if (cmd) select(cmd);
        }
      }}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="page-fade relative z-10 w-full max-w-xl overflow-hidden rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] shadow-md">
        <div className="flex items-center gap-3 border-b border-[color:var(--color-border-subtle)] px-4">
          <Search size={16} className="flex-shrink-0 text-[color:var(--color-text-3)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Befehl suchen oder eintippen…"
            className="h-12 flex-1 bg-transparent text-sm text-[color:var(--color-text-1)] placeholder:text-[color:var(--color-text-3)] focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="rounded p-1 text-[color:var(--color-text-3)] hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-text-1)] no-min-tap"
          >
            <X size={14} />
          </button>
        </div>
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-1">
          {flat.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[color:var(--color-text-3)]">
              Kein Befehl gefunden für „{query}“
            </div>
          ) : (
            sections.map(([section, items]) => (
              <div key={section} className="py-1">
                <div className="px-3 pb-1 pt-2 text-2xs font-semibold uppercase tracking-wide text-[color:var(--color-text-3)]">
                  {section}
                </div>
                {items.map((cmd) => {
                  const idx = flat.indexOf(cmd);
                  const active = idx === highlight;
                  return (
                    <button
                      key={cmd.id}
                      type="button"
                      data-cmd-index={idx}
                      onMouseEnter={() => setHighlight(idx)}
                      onClick={() => select(cmd)}
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors no-min-tap ${
                        active ? "bg-[color:var(--color-surface-2)]" : ""
                      }`}
                    >
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-[color:var(--color-surface-2)] text-[color:var(--color-text-2)]">
                        {cmd.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[color:var(--color-text-1)]">{cmd.label}</span>
                        {cmd.description && (
                          <span className="block truncate text-xs text-[color:var(--color-text-3)]">
                            {cmd.description}
                          </span>
                        )}
                      </span>
                      {cmd.hint && (
                        <span className="text-xs text-[color:var(--color-text-3)]">{cmd.hint}</span>
                      )}
                      {cmd.kbd && <Kbd>{cmd.kbd}</Kbd>}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-2)] px-4 py-2 text-xs text-[color:var(--color-text-3)]">
          <div className="flex items-center gap-2">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            <span>Navigieren</span>
            <span className="opacity-50">·</span>
            <Kbd>↵</Kbd>
            <span>Auswählen</span>
            <span className="opacity-50">·</span>
            <Kbd>Esc</Kbd>
            <span>Schließen</span>
          </div>
          <span className="tnum">{flat.length} Befehle</span>
        </div>
      </div>
    </div>
  );
}
