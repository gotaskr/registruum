import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type AccordionItemProps = Readonly<{
  href: string;
  title: string;
  subtitle: string;
  titleAccessory?: ReactNode;
  actions?: ReactNode;
  isOpen: boolean;
  isActive: boolean;
  onToggle: () => void;
  children: ReactNode;
}>;

export function AccordionItem({
  href,
  title,
  subtitle,
  titleAccessory,
  actions,
  isOpen,
  isActive,
  onToggle,
  children,
}: AccordionItemProps) {
  return (
    <div className="border-b border-border px-2 py-2">
      <div
        className={cn(
          "flex items-start gap-3 rounded-[10px] px-4 py-4",
          isActive ? "bg-[#eef2f7]" : "bg-transparent hover:bg-[#f7f9fd]",
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          suppressHydrationWarning
          className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted"
          aria-label={isOpen ? "Collapse work order" : "Expand work order"}
        >
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <Link href={href} className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-foreground">{title}</p>
              <p className="mt-2 text-sm text-muted">{subtitle}</p>
            </Link>
            {titleAccessory ? <div className="shrink-0 pt-0.5">{titleAccessory}</div> : null}
          </div>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {isOpen ? <div className="pl-11 pr-4 pt-2">{children}</div> : null}
    </div>
  );
}
