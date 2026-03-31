import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, Building2, Plus } from "lucide-react";
import { MainShell } from "@/components/layout/main-shell";
import type {
  JobMarketDashboardData,
  JobMarketPostStatus,
} from "@/features/job-market/types/job-market";
import type { Space } from "@/types/space";

type JobMarketDashboardProps = Readonly<{
  spaces: Space[];
  dashboardData: JobMarketDashboardData;
}>;

function formatMarketStatus(value: JobMarketPostStatus) {
  if (value === "active") {
    return "Active";
  }

  if (value === "closed") {
    return "Closed";
  }

  return "Withdrawn";
}

export function JobMarketDashboard({
  spaces,
  dashboardData,
}: JobMarketDashboardProps) {
  const hasPosts = dashboardData.posts.length > 0;
  const statusLabel =
    dashboardData.activePosts > 0
      ? "Live"
      : spaces.length > 0
        ? "Ready"
        : "Set Up";

  return (
    <MainShell
      title="Job Market"
      description="Shared work opportunities across your spaces."
      actions={
        <Link
          href="/?create-space=1"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-transparent bg-slate-950 px-4 text-sm font-semibold text-white"
        >
          Create Space
        </Link>
      }
      subheader={
        <p className="text-sm text-muted">
          Posted work orders appear here once a space shares open work with the market.
        </p>
      }
    >
      <section className="grid gap-0 border-b border-border md:grid-cols-3">
        <div className="border-b border-border px-6 py-4 md:border-r md:border-b-0">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Spaces</p>
          <p className="mt-3 text-2xl font-semibold text-foreground">{spaces.length}</p>
        </div>
        <div className="border-b border-border px-6 py-4 md:border-r md:border-b-0">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Open Market Posts</p>
          <p className="mt-3 text-2xl font-semibold text-foreground">{dashboardData.activePosts}</p>
        </div>
        <div className="px-6 py-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Status</p>
          <p className="mt-3 text-lg font-semibold text-foreground">{statusLabel}</p>
        </div>
      </section>

      {hasPosts ? (
        <section className="px-6 py-8">
          <div className="overflow-hidden rounded-2xl border border-border bg-panel">
            <div className="grid gap-0 border-b border-border bg-panel-muted md:grid-cols-4">
              <div className="border-b border-border px-5 py-4 md:border-r md:border-b-0">
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Total Posts</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {dashboardData.totalPosts}
                </p>
              </div>
              <div className="border-b border-border px-5 py-4 md:border-r md:border-b-0">
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Inactive Posts</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {dashboardData.closedPosts}
                </p>
              </div>
              <div className="border-b border-border px-5 py-4 md:border-r md:border-b-0">
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Spaces With Posts</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {dashboardData.spacesWithPosts}
                </p>
              </div>
              <div className="px-5 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Available Spaces</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{spaces.length}</p>
              </div>
            </div>

            <div className="divide-y divide-border">
              {dashboardData.posts.map((post) => (
                <article
                  key={post.id}
                  className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={
                          post.status === "active"
                            ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                            : "inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
                        }
                      >
                        {formatMarketStatus(post.status)}
                      </span>
                      <span className="inline-flex rounded-full bg-panel-muted px-2.5 py-1 text-xs font-medium capitalize text-muted">
                        {post.priority}
                      </span>
                    </div>
                    <h2 className="mt-3 text-lg font-semibold text-foreground">{post.title}</h2>
                    <p className="mt-1 text-sm text-muted">
                      {post.spaceName}
                      {post.locationLabel ? ` / ${post.locationLabel}` : ""}
                      {` / Posted ${post.postedAtLabel}`}
                    </p>
                    {post.description?.trim() ? (
                      <p className="mt-2 max-w-3xl text-sm text-muted">{post.description}</p>
                    ) : null}
                  </div>

                  <Link
                    href={post.openHref}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 text-sm font-semibold text-foreground"
                  >
                    Open Work Order
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="grid min-h-[calc(100vh-12rem)] place-items-center px-6 py-10">
          <div className="w-full max-w-2xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-panel-muted">
              <BriefcaseBusiness className="h-6 w-6 text-foreground" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-foreground">
              No job market posts yet
            </h2>
            <p className="mt-3 text-base text-muted">
              Posted work orders will appear here automatically once a space shares market-ready work.
            </p>

            <div className="mt-8 grid gap-3 text-left md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-panel-muted px-4 py-4">
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-foreground" />
                  <p className="text-sm font-medium text-foreground">Set up a space</p>
                </div>
                <p className="mt-2 text-sm text-muted">
                  Create your first space to start managing work orders and memberships.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-panel-muted px-4 py-4">
                <div className="flex items-center gap-3">
                  <Plus className="h-4 w-4 text-foreground" />
                  <p className="text-sm font-medium text-foreground">Post to market later</p>
                </div>
                <p className="mt-2 text-sm text-muted">
                  Once a work order is marked for the market, it will appear here for discovery.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </MainShell>
  );
}
