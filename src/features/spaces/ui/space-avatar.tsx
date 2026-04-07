import Image from "next/image";
import { Building2 } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

type SpaceAvatarProps = Readonly<{
  name: string;
  photoUrl?: string | null;
  className?: string;
  fallbackClassName?: string;
  iconClassName?: string;
  textClassName?: string;
}>;

export function SpaceAvatar({
  name,
  photoUrl = null,
  className,
  fallbackClassName,
  iconClassName,
  textClassName,
}: SpaceAvatarProps) {
  if (photoUrl) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <Image
          src={photoUrl}
          alt={`${name} photo`}
          fill
          unoptimized
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-[#edf3ff] text-[#2f5fd4]",
        className,
        fallbackClassName,
      )}
    >
      <div className="flex flex-col items-center justify-center gap-1">
        <Building2 className={cn("h-5 w-5", iconClassName)} />
        <span className={cn("text-[10px] font-semibold uppercase tracking-[0.14em]", textClassName)}>
          {getInitials(name) || "S"}
        </span>
      </div>
    </div>
  );
}
