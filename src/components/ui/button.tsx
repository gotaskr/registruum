import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "brand";

type ButtonProps = Readonly<{
  children: ReactNode;
  variant?: ButtonVariant;
}> &
  ButtonHTMLAttributes<HTMLButtonElement>;

const variantClasses: Record<ButtonVariant, string> = {
  primary: "border-transparent bg-slate-950 text-white hover:bg-slate-800",
  secondary: "border-border bg-panel text-foreground hover:bg-panel-muted",
  brand:
    "border-transparent bg-[#2f5fd4] text-white shadow-[0_2px_10px_rgba(47,95,212,0.3)] hover:bg-[#274fbf] hover:shadow-[0_4px_14px_rgba(47,95,212,0.38)] disabled:bg-[#2f5fd4]/55 disabled:shadow-none dark:bg-[#3d6fd9] dark:hover:bg-[#5285e8] dark:disabled:bg-[#3d6fd9]/50",
};

export function Button({
  children,
  className,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium transition-colors",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
