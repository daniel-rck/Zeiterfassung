import { Link } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { ROUTES } from "../lib/routes.ts";

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md pt-10">
      <Card padding="md">
        <div className="space-y-3 text-center">
          <p className="text-4xl font-semibold tracking-tight text-[color:var(--color-text-3)]">
            404
          </p>
          <h1 className="text-lg font-semibold text-[color:var(--color-text-1)]">
            Seite nicht gefunden
          </h1>
          <p className="text-sm text-[color:var(--color-text-2)]">
            Diese Adresse gibt es nicht (mehr).
          </p>
          <Link
            to={ROUTES.home}
            className="inline-flex items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            Zur Übersicht
          </Link>
        </div>
      </Card>
    </div>
  );
}
