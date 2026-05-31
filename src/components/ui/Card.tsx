import type { ElementType, HTMLAttributes, ReactNode } from "react";

type Padding = "none" | "sm" | "md" | "lg";
type Variant = "flat" | "elevated";

const PADDING: Record<Padding, string> = {
  none: "",
  sm: "p-3",
  md: "p-4 sm:p-5",
  lg: "p-5 sm:p-6",
};

export interface CardProps extends HTMLAttributes<HTMLElement> {
  padding?: Padding;
  variant?: Variant;
  interactive?: boolean;
  as?: ElementType;
}

export function Card({
  padding = "md",
  variant = "flat",
  interactive,
  as,
  className = "",
  children,
  ...props
}: CardProps) {
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag
      {...props}
      className={`rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-1)] ${PADDING[padding]} ${variant === "elevated" ? "shadow-sm" : ""} ${interactive ? "transition-colors duration-150 hover:border-[color:var(--color-border-strong)]" : ""} ${className}`}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className = "",
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-4 flex items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-[color:var(--color-text-1)]">{title}</h3>
        {description && (
          <p className="mt-1 text-xs text-[color:var(--color-text-3)]">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
