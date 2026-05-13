import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { MainShell } from "@/components/layout/main-shell";
import {
  bandwidthLabel,
  formatStorageCap,
  spacesLabel,
  teamMembersLabel,
  unlimitedWorkOrderMembersLabel,
  workOrdersLabel,
} from "@/features/settings/lib/plan-card-formatters";
import {
  billingPlans,
  paidCheckoutPlanTiers,
  resolveBillingPlanTier,
  type BillingPlanTier,
  type PaidCheckoutPlanTier,
} from "@/features/settings/lib/subscription-plans";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/profile";

type BillingPlansPageContentProps = Readonly<{
  profile: Profile;
}>;

/** Keeps currency on one line; period + "/month" can wrap without colliding with adjacent cards. */
function splitPriceLabel(priceLabel: string): { primary: string; suffix: string | null } {
  const idx = priceLabel.indexOf("/");
  if (idx === -1) {
    return { primary: priceLabel, suffix: null };
  }

  return {
    primary: priceLabel.slice(0, idx).trim(),
    suffix: priceLabel.slice(idx).trim(),
  };
}

export function BillingPlansPageContent({ profile }: BillingPlansPageContentProps) {
  const currentTier = resolveBillingPlanTier(profile.billingPlanTier);

  return (
    <MainShell
      title="Plans & pricing"
      description="Pick the plan that fits your team. You will complete secure checkout with Stripe."
      meta={
        <Link
          href="/settings?section=subscription"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-panel px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-panel-muted"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Back to billing
        </Link>
      }
    >
      <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
        <div className="grid min-w-0 grid-cols-1 gap-6 pt-2 md:grid-cols-2 xl:grid-cols-4 xl:gap-8">
          {paidCheckoutPlanTiers.map((tier) => (
            <LargePlanCard
              key={tier}
              tier={tier}
              currentTier={currentTier}
              tag={tier === "basic" ? "popular" : tier === "pro_team" ? "hot" : null}
            />
          ))}
        </div>

        <p className="mx-auto mt-12 max-w-2xl text-center text-sm leading-relaxed text-muted">
          Prices shown in CAD. Subscriptions renew monthly until canceled. Taxes may apply. Questions? Use{" "}
          <a href="/api/billing/portal" className="font-medium text-accent underline-offset-2 hover:underline">
            Manage billing
          </a>{" "}
          after you subscribe.
        </p>
      </div>
    </MainShell>
  );
}

type PlanCardTag = "popular" | "hot" | null;

function LargePlanCard({
  tier,
  currentTier,
  tag,
}: Readonly<{
  tier: PaidCheckoutPlanTier;
  currentTier: BillingPlanTier;
  tag: PlanCardTag;
}>) {
  const def = billingPlans[tier];
  const isCurrent = tier === currentTier;
  const showTag = tag != null && !isCurrent;
  const bullets = [
    spacesLabel(def.limits.maxSpaces),
    teamMembersLabel(def.limits.maxActiveMembers),
    `${formatStorageCap(def.limits.storageBytes)} storage`,
    unlimitedWorkOrderMembersLabel(),
    workOrdersLabel(def.limits.maxActiveWorkOrders),
    bandwidthLabel(def.limits.monthlyBandwidthBytes),
  ];
  const { primary: pricePrimary, suffix: priceSuffix } = splitPriceLabel(def.priceLabel);

  return (
    <div
      className={cn(
        "relative flex min-h-[28rem] min-w-0 flex-col rounded-[1.75rem] border bg-panel p-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)] transition-[transform,box-shadow,border-color,ring-color] duration-200 ease-out will-change-transform lg:min-h-[32rem] lg:rounded-[2rem] lg:p-10 motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:shadow-[0_24px_60px_rgba(0,0,0,0.35)]",
        "hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(15,23,42,0.12)] dark:hover:shadow-[0_28px_70px_rgba(0,0,0,0.5)]",
        tag === "popular" && !isCurrent
          ? "border-accent ring-2 ring-accent/20 hover:ring-accent/35"
          : tag === "hot" && !isCurrent
            ? "border-orange-400/70 ring-2 ring-orange-400/20 hover:border-orange-400 hover:ring-orange-400/35 dark:border-orange-500/50 dark:ring-orange-500/25 dark:hover:border-orange-400/90"
            : isCurrent
              ? "border-accent ring-1 ring-accent/30 hover:ring-accent/45"
              : "border-border hover:border-accent/30 hover:ring-1 hover:ring-accent/10",
      )}
    >
      <div className="mb-4 flex h-8 shrink-0 items-center justify-center">
        {showTag && tag === "popular" ? (
          <span className="rounded-full bg-accent px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
            Popular
          </span>
        ) : showTag && tag === "hot" ? (
          <span className="rounded-full bg-gradient-to-r from-orange-500 to-rose-600 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
            Hot
          </span>
        ) : null}
      </div>

      <p className="min-w-0 text-xs font-semibold uppercase tracking-[0.22em] text-muted">{def.label}</p>
      <div className="mt-4 min-w-0">
        <p className="text-balance text-3xl font-bold tabular-nums tracking-tight text-foreground sm:text-4xl">
          {pricePrimary}
        </p>
        {priceSuffix ? (
          <p className="mt-1 text-lg font-semibold tabular-nums text-muted sm:text-xl">{priceSuffix}</p>
        ) : null}
      </div>
      <p className="mt-2 min-w-0 text-base text-muted">{def.trialLabel}</p>

      <ul className="mt-8 flex min-w-0 flex-1 flex-col gap-3.5 text-sm text-foreground">
        {bullets.map((line) => (
          <li key={line} className="flex min-w-0 gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent">
              <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
            </span>
            <span className="min-w-0 break-words leading-snug">{line}</span>
          </li>
        ))}
      </ul>

      <div className="mt-10">
        {isCurrent ? (
          <p className="flex h-14 w-full items-center justify-center rounded-2xl border border-border bg-panel-muted text-center text-sm font-semibold text-foreground">
            Current plan
          </p>
        ) : (
          <a
            href={`/api/billing/checkout?plan=${tier}`}
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-accent text-base font-semibold text-white shadow-[0_20px_40px_rgba(31,95,255,0.28)] transition-opacity hover:opacity-95 dark:shadow-none"
          >
            {currentTier === "free" ? "Subscribe" : "Switch to this plan"}
          </a>
        )}
      </div>
    </div>
  );
}
