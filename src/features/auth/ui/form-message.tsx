import { cn } from "@/lib/utils";

type FormMessageProps = Readonly<{
  message?: string;
  tone?: "error" | "info";
  className?: string;
}>;

export function FormMessage({ message, tone = "error", className }: FormMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={cn(
        tone === "error"
          ? "rounded-[1.35rem] border border-rose-200/80 bg-rose-50/90 px-4 py-3 text-sm leading-6 text-rose-700 shadow-[0_10px_24px_rgba(244,63,94,0.08)] dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200"
          : "rounded-[1.35rem] border border-sky-200/80 bg-sky-50/90 px-4 py-3 text-sm leading-6 text-sky-700 shadow-[0_10px_24px_rgba(56,189,248,0.08)] dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200",
        className,
      )}
    >
      {message}
    </div>
  );
}
