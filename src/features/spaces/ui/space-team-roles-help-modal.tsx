"use client";

import { Modal } from "@/components/ui/modal";
import { getSpaceTeamRoleHelpSummaries } from "@/features/spaces/lib/space-team-role-help-summaries";

type SpaceTeamRolesHelpModalProps = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

const summaries = getSpaceTeamRoleHelpSummaries();

export function SpaceTeamRolesHelpModal({ open, onClose }: SpaceTeamRolesHelpModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="What can each space team role do?"
      description="These roles apply to people on the space team (Admin, Operations Manager, Manager, Field Lead / Superintendent). They are different from work order assignments like Worker or Contractor on a single job."
      panelClassName="max-w-lg lg:max-w-xl"
      bottomSheetOnNarrow
      contentClassName="max-h-[min(70dvh,32rem)] overflow-y-auto px-4 pb-5 pt-1 sm:px-5 sm:pb-6"
    >
      <div className="space-y-6">
        {summaries.map((entry) => (
          <section key={entry.role} className="border-b border-border pb-5 last:border-b-0 last:pb-0">
            <h3 className="text-sm font-semibold text-foreground">{entry.title}</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {entry.bullets.map((line, index) => (
                <li key={`${entry.role}-${index}`}>{line}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  );
}
