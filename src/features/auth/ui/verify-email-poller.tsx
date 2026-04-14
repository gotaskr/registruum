"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { RegistruumLoader } from "@/components/ui/registruum-loader";

type VerifyEmailPollerProps = Readonly<{
  email: string;
  next?: string;
}>;

export function VerifyEmailPoller({ email, next }: VerifyEmailPollerProps) {
  const router = useRouter();
  const [verified, setVerified] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const response = await fetch(
          `/api/auth/verify-status?email=${encodeURIComponent(email)}`,
          { cache: "no-store" },
        );
        const data = (await response.json()) as { verified: boolean };

        if (!cancelled && data.verified) {
          setVerified(true);
          if (intervalRef.current) clearInterval(intervalRef.current);
          setTimeout(() => router.push(next ?? "/"), 1500);
        }
      } catch {
        // Silently retry on next interval
      }
    }

    void check();
    intervalRef.current = setInterval(check, 3000);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [email, next, router]);

  if (verified) {
    return (
      <div className="flex items-center gap-3 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4 dark:border-emerald-800 dark:bg-emerald-950/40">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
          Email verified — redirecting to your dashboard…
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-[1.5rem] border border-border bg-panel-muted/60 px-5 py-4">
      <RegistruumLoader size="sm" />
      <p className="text-sm text-muted">
        Waiting for email verification…
      </p>
    </div>
  );
}
