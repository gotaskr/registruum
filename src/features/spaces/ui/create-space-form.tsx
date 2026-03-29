"use client";

import { useActionState } from "react";
import { FormMessage } from "@/features/auth/ui/form-message";
import { createSpace } from "@/features/spaces/actions/space.actions";
import { initialSpaceActionState } from "@/features/spaces/types/space-action-state";

export function CreateSpaceForm() {
  const [state, formAction, isPending] = useActionState(
    createSpace,
    initialSpaceActionState,
  );

  return (
    <form action={formAction} className="space-y-4 px-6 py-5">
      <div>
        <p className="text-sm font-semibold text-foreground">Create Space</p>
        <p className="mt-1 text-sm text-muted">
          Create a new space and assign yourself as the initial admin.
        </p>
      </div>
      <FormMessage message={state.error} />
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">Space Name</span>
        <input
          name="name"
          type="text"
          className="h-11 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none"
        />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isPending ? "Creating..." : "Create Space"}
      </button>
    </form>
  );
}
