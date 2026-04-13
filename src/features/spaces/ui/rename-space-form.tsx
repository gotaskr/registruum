"use client";

import { useActionState } from "react";
import { Factory, MapPin } from "lucide-react";
import { FormMessage } from "@/features/auth/ui/form-message";
import { updateSpaceProfile } from "@/features/spaces/actions/space.actions";
import { spaceTypeOptions } from "@/features/spaces/lib/space-types";
import { initialSpaceActionState } from "@/features/spaces/types/space-action-state";
import { SpacePhotoField } from "@/features/spaces/ui/space-photo-field";
import type { Space } from "@/types/space";

type SpaceProfileFormProps = Readonly<{
  space: Space;
}>;

export function SpaceProfileForm({ space }: SpaceProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateSpaceProfile,
    initialSpaceActionState,
  );

  return (
    <form action={formAction} className="space-y-4 px-4 py-5 sm:space-y-5 sm:px-6 sm:py-6">
      <input type="hidden" name="spaceId" value={space.id} />
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted sm:text-[11px] sm:tracking-[0.24em]">
          Editable profile
        </p>
        <p className="mt-1.5 text-lg font-semibold text-foreground sm:mt-2 sm:text-xl">Space details</p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted sm:mt-2 sm:text-sm">
          Admins can update the active space profile, including its photo.
        </p>
      </div>
      <FormMessage message={state.error} />
      <SpacePhotoField
        defaultLabel={space.name}
        previewUrl={space.photoUrl}
      />
      {state.fieldErrors?.photo ? (
        <p className="text-sm text-rose-700">{state.fieldErrors.photo}</p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-foreground">Space Name</span>
          <input
            name="name"
            type="text"
            defaultValue={space.name}
            className="h-11 w-full rounded-xl border border-border bg-panel px-3 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-[#2f5fd4]/35 sm:h-12 sm:rounded-2xl sm:px-4"
          />
          {state.fieldErrors?.name ? (
            <p className="text-sm text-rose-700">{state.fieldErrors.name}</p>
          ) : null}
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">Type of Space</span>
          <div className="relative">
            <select
              name="spaceType"
              defaultValue={space.spaceType ?? ""}
              className="h-11 w-full appearance-none rounded-xl border border-border bg-panel px-3 pr-10 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-[#2f5fd4]/35 sm:h-12 sm:rounded-2xl sm:px-4"
            >
              <option value="" disabled>
                Select a space type
              </option>
              {spaceTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Factory className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted sm:right-4" />
          </div>
          {state.fieldErrors?.spaceType ? (
            <p className="text-sm text-rose-700">{state.fieldErrors.spaceType}</p>
          ) : null}
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">Address</span>
          <div className="relative">
            <input
              name="address"
              type="text"
              defaultValue={space.address ?? ""}
              className="h-11 w-full rounded-xl border border-border bg-panel px-3 pr-10 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-[#2f5fd4]/35 sm:h-12 sm:rounded-2xl sm:px-4"
            />
            <MapPin className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted sm:right-4" />
          </div>
          {state.fieldErrors?.address ? (
            <p className="text-sm text-rose-700">{state.fieldErrors.address}</p>
          ) : null}
        </label>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 w-full touch-manipulation items-center justify-center rounded-xl bg-[#2f5fd4] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#274fbf] disabled:opacity-60 sm:w-auto sm:rounded-2xl dark:bg-[#3d6fd9] dark:hover:bg-[#5285e8]"
      >
        {isPending ? "Saving..." : "Save Space Details"}
      </button>
    </form>
  );
}
