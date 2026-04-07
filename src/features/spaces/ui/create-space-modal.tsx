"use client";

import { useActionState } from "react";
import { Factory, MapPin } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { FormMessage } from "@/features/auth/ui/form-message";
import { createSpace } from "@/features/spaces/actions/space.actions";
import { spaceTypeOptions } from "@/features/spaces/lib/space-types";
import { initialSpaceActionState } from "@/features/spaces/types/space-action-state";
import { SpacePhotoField } from "@/features/spaces/ui/space-photo-field";

type CreateSpaceModalProps = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

export function CreateSpaceModal({
  open,
  onClose,
}: CreateSpaceModalProps) {
  const [state, formAction, isPending] = useActionState(
    createSpace,
    initialSpaceActionState,
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Space"
      description="Set up a new space for your workorders, team, and archive."
      panelClassName="max-w-xl rounded-[2rem] border-[#dbe4f0] bg-[#f8fbff] shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
    >
      <form action={formAction} className="space-y-6 px-5 py-5">
        <FormMessage message={state.error} />

        <section className="rounded-[1.75rem] border border-[#dbe4f0] bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
          <div className="flex items-start gap-4">
            <SpacePhotoField defaultLabel="New Space" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8093af]">
                Space Setup
              </p>
              <h3 className="mt-2 text-xl font-semibold text-foreground">
                Create a new workspace hub
              </h3>
            </div>
          </div>
          {state.fieldErrors?.photo ? (
            <p className="mt-3 text-sm text-rose-700">{state.fieldErrors.photo}</p>
          ) : null}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-foreground">Name of Space</span>
              <input
                name="name"
                type="text"
                autoFocus
                placeholder="South Tower Operations"
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
                  defaultValue=""
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
                  placeholder="123 Main St, Edmonton"
                  className="h-12 w-full rounded-2xl border border-[#dbe4f0] bg-[#f9fbff] px-4 pr-10 text-sm text-foreground outline-none transition focus:border-[#97b5ff] focus:bg-white"
                />
                <MapPin className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f8ca3]" />
              </div>
              {state.fieldErrors?.address ? (
                <p className="text-sm text-rose-700">{state.fieldErrors.address}</p>
              ) : null}
            </label>
          </div>
        </section>

        <div className="flex items-center justify-end gap-3 border-t border-[#dbe4f0] pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#dbe4f0] bg-white px-5 text-sm font-medium text-foreground shadow-[0_10px_24px_rgba(15,23,42,0.04)] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#1f5fff] px-5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,95,255,0.24)] disabled:opacity-60"
          >
            {isPending ? "Creating..." : "Create Space"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
