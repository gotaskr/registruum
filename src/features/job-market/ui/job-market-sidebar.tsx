import Link from "next/link";
import { getSpaceHref } from "@/lib/route-utils";
import { formatRoleLabel } from "@/lib/utils";
import type { Space } from "@/types/space";

type JobMarketSidebarProps = Readonly<{
  spaces: Space[];
}>;

export function JobMarketSidebar({ spaces }: JobMarketSidebarProps) {
  return (
    <div className="grid h-full min-h-[18rem] grid-rows-[auto_1fr]">
      <div className="border-b border-border px-4 py-5">
        <h1 className="text-[15px] font-semibold text-foreground">Spaces</h1>
        <p className="mt-2 text-sm text-muted">
          Select a space to manage work orders and members.
        </p>
      </div>

      <div className="overflow-y-auto">
        {spaces.length === 0 ? (
          <div className="px-4 py-5 text-sm text-muted">
            No spaces yet. Use the + button in the global rail to create your first space.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {spaces.map((space) => (
              <Link
                key={space.id}
                href={getSpaceHref(space.id)}
                className="block px-4 py-4 transition-colors hover:bg-white"
              >
                <p className="text-sm font-medium text-foreground">{space.name}</p>
                <p className="mt-1 text-sm text-muted">
                  {space.membershipRole ? formatRoleLabel(space.membershipRole) : "Member"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
