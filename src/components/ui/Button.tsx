import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ElementType, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "xs" | "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-xs ring-1 ring-inset ring-brand-600/30 disabled:bg-brand-400 disabled:ring-brand-400/30",
  secondary:
    "bg-[color:var(--color-surface-2)] text-[color:var(--color-text-1)] hover:bg-[color:var(--color-surface-3)] ring-1 ring-inset ring-[color:var(--color-border-subtle)]",
  outline:
    "bg-transparent text-[color:var(--color-text-1)] hover:bg-[color:var(--color-surface-2)] ring-1 ring-inset ring-[color:var(--color-border-strong)]",
  ghost:
    "bg-transparent text-[color:var(--color-text-2)] hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-text-1)]",
  danger:
    "bg-[color:var(--color-danger-500)] text-white hover:bg-[color:var(--color-danger-600)] shadow-xs ring-1 ring-inset ring-[color:var(--color-danger-600)]/40 disabled:opacity-60",
};

const SIZE_CLASSES: Record<Size, string> = {
  xs: "h-7 px-2 text-xs gap-1 rounded-md no-min-tap",
  sm: "h-8 px-3 text-xs gap-1.5 rounded-md",
  md: "h-9 px-3.5 text-sm gap-2 rounded-md",
  lg: "h-11 px-5 text-sm gap-2 rounded-md",
};

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  block?: boolean;
  loading?: boolean;
  kbd?: string;
  type?: "button" | "submit" | "reset";
  as?: ElementType;
  // Pass-through props when rendered as Link / anchor
  to?: string;
  href?: string;
  target?: string;
  rel?: string;
}

export function Button({
  variant = "secondary",
  size = "md",
  icon,
  iconPosition = "left",
  block,
  loading,
  kbd,
  className = "",
  children,
  disabled,
  as,
  type,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const Tag = (as ?? "button") as ElementType;
  const isNativeButton = !as || as === "button";
  const tagProps: Record<string, unknown> = isNativeButton
    ? { type: type ?? "button", disabled: isDisabled }
    : isDisabled
      ? { "aria-disabled": true }
      : {};
  return (
    <Tag
      {...tagProps}
      {...props}
      className={`relative inline-flex items-center justify-center font-medium transition-colors duration-150 ease-out disabled:cursor-not-allowed focus-visible:outline-none ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${block ? "w-full" : ""} ${className}`}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={size === "lg" ? 16 : size === "xs" ? 12 : 14} />
      ) : (
        iconPosition === "left" && icon
      )}
      {children && <span className="truncate">{children}</span>}
      {!loading && iconPosition === "right" && icon}
      {kbd && <span className="kbd ml-1.5 -mr-1 hidden sm:inline-flex">{kbd}</span>}
    </Tag>
  );
}
