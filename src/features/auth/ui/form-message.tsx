type FormMessageProps = Readonly<{
  message?: string;
  tone?: "error" | "info";
}>;

export function FormMessage({ message, tone = "error" }: FormMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={
        tone === "error"
          ? "rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          : "rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700"
      }
    >
      {message}
    </div>
  );
}
