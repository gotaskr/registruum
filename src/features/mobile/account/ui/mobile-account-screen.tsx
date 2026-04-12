import { ShieldCheck } from "lucide-react";
import type { MobileAccountData } from "@/features/mobile/types/mobile";
import { MobileCard, MobilePageHeader, MobileSectionTitle } from "@/features/mobile/ui/mobile-primitives";
import { MobileShell } from "@/features/mobile/ui/mobile-shell";

export function MobileAccountScreen({
  data,
}: Readonly<{
  data: MobileAccountData;
}>) {
  const firstName = data.profile.fullName.split(/\s+/)[0] ?? data.profile.fullName;

  return (
    <MobileShell
      header={
        <MobilePageHeader
          title="Account"
          subtitle={`Signed in as ${firstName}. Keep your profile and identity details within reach.`}
        />
      }
    >
      <div className="mobile-screen-bg space-y-5 px-4 py-4">
        <MobileCard className="bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_60%,#eef4ff_100%)]">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[linear-gradient(180deg,#244da7_0%,#3566d6_100%)] text-xl font-semibold text-white shadow-[0_12px_26px_rgba(53,102,214,0.24)]">
              {data.profile.fullName
                .split(/\s+/)
                .map((part) => part[0] ?? "")
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[1.25rem] font-semibold tracking-[-0.03em] text-slate-950">{data.profile.fullName}</p>
              <p className="mt-1 text-[0.98rem] text-slate-500">{data.profile.email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                  {data.profile.userTag}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {data.profile.emailVerifiedAt ? "Verified" : "Verification pending"}
                </span>
              </div>
            </div>
          </div>
        </MobileCard>

        <section>
          <MobileSectionTitle title="Profile" />
          <MobileCard className="space-y-4 bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Full Name
              </p>
              <p className="mt-1 text-sm text-slate-950">{data.profile.fullName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Email
              </p>
              <p className="mt-1 text-sm text-slate-950">{data.profile.email}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Member Code
              </p>
              <p className="mt-1 text-sm text-slate-950">{data.profile.userTag}</p>
            </div>
          </MobileCard>
        </section>

        <section>
          <MobileSectionTitle title="Company" />
          <MobileCard className="space-y-4 bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Representation
              </p>
              <p className="mt-1 text-sm text-slate-950">
                {data.profile.representsCompany ? "Representing a company" : "Personal account"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Company Name
              </p>
              <p className="mt-1 text-sm text-slate-950">
                {data.profile.companyName ?? "Not recorded"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Company Email
              </p>
              <p className="mt-1 text-sm text-slate-950">
                {data.profile.companyEmail ?? "Not recorded"}
              </p>
            </div>
          </MobileCard>
        </section>
      </div>
    </MobileShell>
  );
}
