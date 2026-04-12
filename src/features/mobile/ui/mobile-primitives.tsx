import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobilePageHeader({
  title,
  subtitle,
  action,
}: Readonly<{
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}>) {
  return (
    <header className="border-b border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafe_100%)] px-6 py-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-950">{title}</h1>
          {subtitle ? <p className="mt-2 text-[0.98rem] leading-7 text-slate-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
    </header>
  );
}

export function MobileDetailHeader({
  backHref,
  title,
  badge,
  menu,
}: Readonly<{
  backHref: string;
  title: ReactNode;
  badge?: ReactNode;
  menu?: ReactNode;
}>) {
  return (
    <header className="border-b border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafe_100%)] px-6 py-5">
      <div className="flex items-start gap-3">
        <Link
          href={backHref}
          className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-3">
            <h1 className="truncate text-[1.85rem] font-semibold tracking-[-0.04em] text-slate-950">{title}</h1>
            {badge}
          </div>
        </div>
        {menu ?? (
          <button
            type="button"
            className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        )}
      </div>
    </header>
  );
}

export function MobileCard({
  children,
  className,
}: Readonly<{
  children: ReactNode;
  className?: string;
}>) {
  return (
    <section
      className={cn(
        "mobile-card-surface p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function MobileSectionTitle({
  title,
  action,
}: Readonly<{
  title: string;
  action?: ReactNode;
}>) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-[1.14rem] font-semibold tracking-[-0.03em] text-slate-950">
        {title}
      </h2>
      {action}
    </div>
  );
}

export function MobileStatusPill({
  label,
  tone = "neutral",
}: Readonly<{
  label: string;
  tone?: "neutral" | "active" | "success" | "warning";
}>) {
  const toneClassName =
    tone === "active"
      ? "border-blue-100 bg-[#e8efff] text-[#3566d6]"
      : tone === "success"
        ? "border-emerald-100 bg-emerald-50 text-emerald-700"
      : tone === "warning"
          ? "border-amber-100 bg-amber-50 text-amber-700"
          : "border-slate-200 bg-slate-100 text-slate-600";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.08em]",
        toneClassName,
      )}
    >
      {label}
    </span>
  );
}
