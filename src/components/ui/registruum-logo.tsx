"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type RegistruumLogoVariant = "nav" | "authCompact" | "authHero";

const VARIANT: Record<
  RegistruumLogoVariant,
  { box: string; width: number; height: number; priority: boolean }
> = {
  nav: {
    box: "h-10 w-10 min-h-10 min-w-10 lg:h-11 lg:w-11 lg:min-h-11 lg:min-w-11 rounded-[0.85rem] lg:rounded-2xl",
    width: 44,
    height: 44,
    priority: true,
  },
  authCompact: {
    box: "h-14 w-14 min-h-14 min-w-14 rounded-[1.35rem]",
    width: 56,
    height: 56,
    priority: true,
  },
  authHero: {
    box: "h-16 w-16 min-h-16 min-w-16 rounded-[1.45rem]",
    width: 64,
    height: 64,
    priority: true,
  },
};

type RegistruumLogoProps = Readonly<{
  variant?: RegistruumLogoVariant;
  className?: string;
}>;

export function RegistruumLogo({ variant = "nav", className }: RegistruumLogoProps) {
  const [useFallback, setUseFallback] = useState(false);
  const v = VARIANT[variant];

  if (useFallback) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center bg-[#2f5fd4] text-sm font-semibold text-white shadow-[0_8px_20px_rgba(47,95,212,0.2)] lg:text-base lg:shadow-[0_10px_24px_rgba(47,95,212,0.22)]",
          v.box,
          className,
        )}
        aria-hidden
      >
        R
      </span>
    );
  }

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-transparent",
        v.box,
        className,
      )}
    >
      <Image
        src="/logo.png"
        alt="Registruum"
        width={v.width}
        height={v.height}
        sizes={`${Math.max(v.width, 48)}px`}
        className="h-full w-full object-contain object-center"
        unoptimized
        priority={v.priority}
        decoding="async"
        onError={() => setUseFallback(true)}
      />
    </span>
  );
}
