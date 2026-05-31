import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRunningEntry, startTimer, stopTimer } from "../lib/db/timeEntries";
import { useFeatures } from "../lib/hooks/useFeature";
import { type ShortcutBinding, useShortcuts } from "../lib/keyboard/shortcuts";
import { Kbd } from "./ui/Kbd";
import { Sheet } from "./ui/Sheet";
import { useToast } from "./ui/Toast";

export function GlobalShortcuts() {
  const navigate = useNavigate();
  const toast = useToast();
  const features = useFeatures();
  const [helpOpen, setHelpOpen] = useState(false);

  const bindings: ShortcutBinding[] = [
    {
      key: " ",
      description: "Timer starten / stoppen",
      handler: async () => {
        try {
          const running = await getRunningEntry();
          if (running) {
            await stopTimer();
            toast.success("Timer gestoppt");
          } else {
            await startTimer({});
            toast.success("Timer gestartet");
          }
        } catch (err) {
          toast.error((err as Error).message);
        }
      },
    },
    {
      key: "n",
      description: "Neuer Eintrag",
      handler: () => navigate("/entry/new"),
    },
    { key: "t", description: "Heute", handler: () => navigate("/") },
    { key: "e", description: "Einträge", handler: () => navigate("/entries") },
    {
      key: "p",
      description: "Projekte",
      handler: () => {
        if (features.projects) navigate("/projects");
        else toast.show("Projekte sind in den Einstellungen ausgeschaltet.");
      },
    },
    {
      key: "r",
      description: "Reports",
      handler: () => {
        if (features.reports) navigate("/reports");
        else toast.show("Reports sind in den Einstellungen ausgeschaltet.");
      },
    },
    {
      key: "i",
      description: "Rechnung",
      handler: () => {
        if (features.invoicing) navigate("/invoice");
        else toast.show("Rechnungen sind in den Einstellungen ausgeschaltet.");
      },
    },
    {
      key: ",",
      description: "Einstellungen",
      handler: () => navigate("/settings"),
    },
    {
      key: "?",
      description: "Tastatur-Shortcuts anzeigen",
      handler: () => setHelpOpen(true),
    },
  ];

  useShortcuts(bindings);

  return (
    <Sheet open={helpOpen} onClose={() => setHelpOpen(false)} title="Tastatur-Shortcuts" size="sm">
      <ul className="space-y-1.5 text-sm text-[color:var(--color-text-2)]">
        {bindings
          .filter((b) => b.key !== "?")
          .map((b) => (
            <li key={b.key} className="flex items-center justify-between gap-3 py-1">
              <span>{b.description}</span>
              <Kbd>{labelForKey(b.key)}</Kbd>
            </li>
          ))}
        <li className="flex items-center justify-between gap-3 py-1">
          <span>Diese Übersicht öffnen</span>
          <Kbd>?</Kbd>
        </li>
      </ul>
    </Sheet>
  );
}

function labelForKey(key: string): string {
  if (key === " ") return "Leertaste";
  if (key === ",") return ",";
  return key.toUpperCase();
}
