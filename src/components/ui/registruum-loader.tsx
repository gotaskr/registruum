import { cn } from "@/lib/utils";

type RegistruumLoaderProps = Readonly<{
  size?: "sm" | "md" | "lg";
  className?: string;
}>;

const sizeMap = {
  sm: "h-6 w-6",
  md: "h-9 w-9",
  lg: "h-12 w-12",
} as const;

export function RegistruumLoader({ size = "md", className }: RegistruumLoaderProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className={cn(
          sizeMap[size],
          "rounded-full border-[2.5px] border-border border-t-accent animate-spin",
        )}
      />
    </div>
  );
}

export function RegistruumPageLoader() {
  return (
    <div className="flex h-full min-h-[60vh] w-full items-center justify-center">
      <RegistruumLoader size="lg" />
    </div>
  );
}
