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
    <form action={formAction} className="space-y-5 px-6 py-6">
      <input type="hidden" name="spaceId" value={space.id} />
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8093af]">
          Editable Profile
        </p>
        <p className="mt-2 text-xl font-semibold text-foreground">Space Details</p>
        <p className="mt-2 text-sm text-[#5f718b]">
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
            className="h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#f9fbff] px-4 text-sm text-foreground outline-none transition focus:border-[#97b5ff] focus:bg-white"
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
              className="h-12 w-full appearance-none rounded-2xl border border-[#dbe4f0] bg-[#f9fbff] px-4 pr-10 text-sm text-foreground outline-none transition focus:border-[#97b5ff] focus:bg-white"
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
            <Factory className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f8ca3]" />
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
              className="h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#f9fbff] px-4 pr-10 text-sm text-foreground outline-none transition focus:border-[#97b5ff] focus:bg-white"
            />
            <MapPin className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f8ca3]" />
          </div>
          {state.fieldErrors?.address ? (
            <p className="text-sm text-rose-700">{state.fieldErrors.address}</p>
          ) : null}
        </label>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#1f5fff] px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,95,255,0.24)] disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Save Space Details"}
      </button>
    </form>
  );
}
