"use client";

import { useActionState } from "react";
import { FormMessage } from "@/features/auth/ui/form-message";
import { renameSpace } from "@/features/spaces/actions/space.actions";
import { initialSpaceActionState } from "@/features/spaces/types/space-action-state";
import type { Space } from "@/types/space";

type RenameSpaceFormProps = Readonly<{
  space: Space;
}>;

export function RenameSpaceForm({ space }: RenameSpaceFormProps) {
  const [state, formAction, isPending] = useActionState(
    renameSpace,
    initialSpaceActionState,
  );

  return (
    <form action={formAction} className="space-y-4 px-6 py-5">
      <input type="hidden" name="spaceId" value={space.id} />
      <div>
        <p className="text-sm font-semibold text-foreground">Rename Space</p>
        <p className="mt-1 text-sm text-muted">
          Owners and admins can update the active space name.
        </p>
      </div>
      <FormMessage message={state.error} />
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">Space Name</span>
        <input
          name="name"
          type="text"
          defaultValue={space.name}
          className="h-11 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none"
        />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-panel-muted px-4 text-sm font-semibold text-foreground disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Save Name"}
      </button>
    </form>
  );
}
