import Link from "next/link";
import { BriefcaseBusiness, Building2, Plus } from "lucide-react";
import { MainShell } from "@/components/layout/main-shell";
import type { Space } from "@/types/space";

type JobMarketDashboardProps = Readonly<{
  spaces: Space[];
}>;

export function JobMarketDashboard({ spaces }: JobMarketDashboardProps) {
  return (
    <MainShell
      title="Job Market"
      description="This is the main dashboard landing area for marketplace-ready work."
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
          Posted work orders will appear here once spaces are active and sharing opportunities.
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
          <p className="mt-3 text-2xl font-semibold text-foreground">0</p>
        </div>
        <div className="px-6 py-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Status</p>
          <p className="mt-3 text-lg font-semibold text-foreground">Placeholder</p>
        </div>
      </section>

      <section className="grid min-h-[calc(100vh-12rem)] place-items-center px-6 py-10">
        <div className="w-full max-w-2xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-panel-muted">
            <BriefcaseBusiness className="h-6 w-6 text-foreground" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-foreground">
            No job market posts yet
          </h2>
          <p className="mt-3 text-base text-muted">
            Registruum will surface posted work orders here. For now this is the empty
            dashboard placeholder users land on right after sign-in.
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
                Once a work order is open and market-ready, it can appear here for contractor
                discovery.
              </p>
            </div>
          </div>
        </div>
      </section>
    </MainShell>
  );
}
