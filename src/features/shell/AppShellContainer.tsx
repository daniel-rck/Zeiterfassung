import {
  Archive as ArchiveIcon,
  BarChart3,
  CalendarDays,
  Clock,
  Download,
  FileText,
  FolderKanban,
  Laptop,
  ListChecks,
  Moon,
  Plus,
  Search,
  Settings as SettingsIcon,
  Sun,
  Tags,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { type CommandItem, CommandPalette } from "../../components/ui/CommandPalette";
import { useToast } from "../../components/ui/Toast";
import { getRunningEntry, startTimer, stopTimer } from "../../lib/db/timeEntries";
import { formatDuration } from "../../lib/format";
import { useFeatures } from "../../lib/hooks/useFeature";
import { useRunningEntry } from "../../lib/hooks/useRunningEntry";
import { useTheme } from "../../lib/hooks/useTheme";
import { downloadSnapshot } from "../../lib/io/exportJson";
import { modKey } from "../../lib/platform";
import { ROUTES } from "../../lib/routes.ts";
import type { FeatureName } from "../../lib/types";
import { AppShell, type NavItem } from "../../lib/ui";

const LogoMark = (
  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-600 text-white">
    <Clock size={14} aria-hidden="true" />
  </span>
);

interface NavConfig {
  to: string;
  label: string;
  icon: typeof Clock;
  feature?: FeatureName;
}

const NAV: NavConfig[] = [
  { to: ROUTES.home, label: "Heute", icon: Clock },
  { to: ROUTES.entries, label: "Einträge", icon: ListChecks },
  { to: ROUTES.week, label: "Woche", icon: CalendarDays, feature: "weeklyView" },
  { to: ROUTES.projects, label: "Projekte", icon: FolderKanban, feature: "projects" },
  { to: ROUTES.tags, label: "Tags", icon: Tags, feature: "tags" },
  { to: ROUTES.reports, label: "Reports", icon: BarChart3, feature: "reports" },
  { to: ROUTES.invoice, label: "Rechnung", icon: FileText, feature: "invoicing" },
  { to: ROUTES.invoices, label: "Archiv", icon: ArchiveIcon, feature: "invoicing" },
  { to: ROUTES.settings, label: "Einstellungen", icon: SettingsIcon },
];

const THEME_ICON = { light: Sun, dark: Moon, system: Laptop } as const;

/** App-specific shell: feeds the canonical lib/ui AppShell via props and keeps
 *  the command palette, theme toggle, live-timer badge and quick-add FAB. */
export function AppShellContainer() {
  const features = useFeatures();
  const location = useLocation();
  const navigate = useNavigate();
  const { entry, liveDurationSec } = useRunningEntry();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const [commandOpen, setCommandOpen] = useState(false);

  const visible = NAV.filter((item) => !item.feature || features[item.feature]);

  const navItems: NavItem[] = visible.map((item) => ({
    to: item.to,
    label: item.label,
    icon: <item.icon size={18} aria-hidden="true" />,
  }));

  // ⌘K / Ctrl+K opens the command palette.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const commands: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [
      {
        id: "toggle-timer",
        section: "Aktionen",
        label: entry ? "Timer stoppen" : "Timer starten",
        description: entry ? "Aktiven Timer beenden" : "Neuen Timer beginnen",
        icon: <Clock size={14} />,
        kbd: "Space",
        keywords: ["start", "stop", "timer", "play"],
        onSelect: async () => {
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
        id: "new-entry",
        section: "Aktionen",
        label: "Neuen Eintrag erfassen",
        description: "Manuellen Zeit-Eintrag anlegen",
        icon: <Plus size={14} />,
        kbd: "N",
        keywords: ["neu", "add", "create"],
        onSelect: () => navigate(ROUTES.entryNew),
      },
      {
        id: "backup",
        section: "Aktionen",
        label: "Backup herunterladen",
        description: "JSON-Snapshot exportieren",
        icon: <Download size={14} />,
        keywords: ["export", "sichern", "json"],
        onSelect: async () => {
          try {
            await downloadSnapshot();
            toast.success("Backup heruntergeladen");
          } catch (err) {
            toast.error((err as Error).message);
          }
        },
      },
    ];

    for (const item of visible) {
      list.push({
        id: `nav-${item.to}`,
        section: "Navigation",
        label: item.label,
        description: `Zu ${item.label} wechseln`,
        icon: <item.icon size={14} />,
        keywords: [item.label.toLowerCase(), item.to],
        onSelect: () => navigate(item.to),
      });
    }

    list.push(
      {
        id: "theme-light",
        section: "Erscheinung",
        label: "Hell",
        icon: <Sun size={14} />,
        hint: theme === "light" ? "Aktiv" : undefined,
        keywords: ["light", "theme"],
        onSelect: () => setTheme("light"),
      },
      {
        id: "theme-dark",
        section: "Erscheinung",
        label: "Dunkel",
        icon: <Moon size={14} />,
        hint: theme === "dark" ? "Aktiv" : undefined,
        keywords: ["dark", "theme"],
        onSelect: () => setTheme("dark"),
      },
      {
        id: "theme-system",
        section: "Erscheinung",
        label: "System",
        icon: <Laptop size={14} />,
        hint: theme === "system" ? "Aktiv" : undefined,
        keywords: ["system", "theme", "auto"],
        onSelect: () => setTheme("system"),
      },
    );

    return list;
  }, [entry, visible, theme, navigate, setTheme, toast]);

  const ThemeIcon = THEME_ICON[theme];
  const nextTheme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";

  const headerActions: ReactNode = (
    <>
      {entry && location.pathname !== ROUTES.home ? (
        <Link
          to={ROUTES.home}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-accent-600 px-2.5 text-xs font-medium text-white transition-colors hover:bg-accent-700 no-min-tap"
        >
          <span aria-hidden="true" className="pulse-dot h-1.5 w-1.5 rounded-full bg-white" />
          <span className="tnum font-mono">{formatDuration(liveDurationSec, "short")}</span>
        </Link>
      ) : null}
      <button
        type="button"
        onClick={() => setTheme(nextTheme)}
        aria-label={`Thema wechseln (aktuell: ${theme})`}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg no-min-tap"
      >
        <ThemeIcon size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        aria-label="Befehlsmenü öffnen"
        title={`${modKey()} K`}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg no-min-tap"
      >
        <Search size={16} aria-hidden="true" />
      </button>
    </>
  );

  const showFab = !entry && location.pathname !== ROUTES.entryNew;

  return (
    <>
      <AppShell
        title="Zeiterfassung"
        logo={LogoMark}
        navItems={navItems}
        headerActions={headerActions}
      >
        <div id="main" key={location.pathname} className="page-fade">
          <Outlet />
        </div>
      </AppShell>

      {showFab ? (
        <Link
          to={ROUTES.entryNew}
          aria-label="Neuen Eintrag erfassen"
          className="fixed bottom-20 right-4 z-30 inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent-600 text-white shadow-lg transition-colors hover:bg-accent-700 md:bottom-6 md:right-6"
        >
          <Plus size={22} aria-hidden="true" />
        </Link>
      ) : null}

      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        commands={commands}
      />
    </>
  );
}
