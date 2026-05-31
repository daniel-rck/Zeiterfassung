import { MoreHorizontal, Plus } from "lucide-react";
import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Sheet } from "./ui/Sheet";

export interface MobileNavItem {
  to: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
  end?: boolean;
}

export function MobileBottomNav({
  primary,
  overflow,
  showFab = true,
}: {
  primary: MobileNavItem[];
  overflow: MobileNavItem[];
  showFab?: boolean;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  // Split primary in half to embed FAB in middle
  const half = Math.ceil(primary.length / 2);
  const left = primary.slice(0, half);
  const right = primary.slice(half);

  return (
    <>
      <nav
        aria-label="Hauptnavigation"
        className="fixed inset-x-0 bottom-0 z-40 flex h-14 items-center border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)]/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex w-full items-stretch">
          {left.map((item) => (
            <MobileTab key={item.to} item={item} />
          ))}

          {showFab && (
            <div className="flex flex-1 items-center justify-center">
              <button
                type="button"
                onClick={() => navigate("/entry/new")}
                aria-label="Neuen Eintrag erfassen"
                className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-white shadow-md transition-transform duration-150 ease-out hover:bg-brand-600 active:scale-95 no-min-tap"
              >
                <Plus size={20} />
              </button>
            </div>
          )}

          {right.map((item) => (
            <MobileTab key={item.to} item={item} />
          ))}

          {overflow.length > 0 && (
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] text-[color:var(--color-text-3)] no-min-tap"
            >
              <MoreHorizontal size={18} />
              <span>Mehr</span>
            </button>
          )}
        </div>
      </nav>

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="Mehr" size="sm">
        <ul className="grid grid-cols-2 gap-2">
          {overflow.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={`flex items-center gap-3 rounded-md border border-[color:var(--color-border-subtle)] p-3 transition-colors ${
                    isActive
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
                      : "bg-[color:var(--color-surface-1)] text-[color:var(--color-text-1)] hover:bg-[color:var(--color-surface-2)]"
                  }`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--color-surface-2)] text-[color:var(--color-text-2)]">
                    <Icon size={16} />
                  </span>
                  <span className="text-sm font-medium">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </Sheet>
    </>
  );
}

function MobileTab({ item }: { item: MobileNavItem }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] transition-colors no-min-tap ${
          isActive ? "text-brand-600 dark:text-brand-400" : "text-[color:var(--color-text-3)]"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className="relative flex h-6 items-center justify-center">
            <Icon size={18} />
            {isActive && (
              <span
                aria-hidden="true"
                className="absolute -bottom-1 h-0.5 w-5 rounded-full bg-brand-500"
              />
            )}
          </span>
          <span className="font-medium">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}
