"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Plus, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { FormMessage } from "@/features/auth/ui/form-message";
import { updateProfileIdentity } from "@/features/settings/actions/profile.actions";
import {
  initialProfileActionState,
} from "@/features/settings/types/profile-action-state";
import { getInitials } from "@/lib/utils";
import type { Profile } from "@/types/profile";

type ProfileIdentityEditModalProps = Readonly<{
  open: boolean;
  profile: Profile;
  onClose: () => void;
}>;

export function ProfileIdentityEditModal({
  open,
  profile,
  onClose,
}: ProfileIdentityEditModalProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    updateProfileIdentity,
    initialProfileActionState,
  );
  const [fullName, setFullName] = useState(profile.fullName);
  const [primaryEmail, setPrimaryEmail] = useState(profile.email);
  const [additionalEmails, setAdditionalEmails] = useState<string[]>(
    profile.additionalEmails.length > 0 ? profile.additionalEmails : [],
  );
  const [contactInfo, setContactInfo] = useState(profile.contactInfo ?? "");
  const [photoName, setPhotoName] = useState<string | null>(profile.avatarFileName);

  const avatarLabel = useMemo(() => getInitials(fullName || profile.fullName), [fullName, profile.fullName]);

  useEffect(() => {
    if (!state.success) {
      return;
    }

    onClose();
    router.refresh();
  }, [onClose, router, state.success]);

  const handleAdditionalEmailChange = (index: number, value: string) => {
    setAdditionalEmails((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
  };

  const handleAddEmail = () => {
    setAdditionalEmails((current) => [...current, ""]);
  };

  const handleRemoveEmail = (index: number) => {
    setAdditionalEmails((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setPhotoName(file?.name ?? null);
  };

  return (
    <Modal
      open={open}
      title="Edit Identity"
      description="Update the identity details used across Registruum records."
      onClose={onClose}
      panelClassName="max-w-2xl"
    >
      <form action={formAction} className="space-y-5 px-5 py-4">
        <div className="grid gap-4 md:grid-cols-[5rem_minmax(0,1fr)]">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-border bg-panel-muted text-xl font-semibold text-foreground">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={profile.fullName}
                width={80}
                height={80}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              avatarLabel
            )}
          </div>
          <div className="grid gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
                Photo
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-border bg-panel px-4 text-sm font-medium text-foreground">
                  <Upload className="h-4 w-4" />
                  Upload Photo
                  <input
                    type="file"
                    name="avatar"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </label>
                <span className="text-sm text-muted">
                  {photoName ?? "No file selected"}
                </span>
              </div>
            </div>

            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
                Full Name
              </span>
              <input
                name="fullName"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none"
              />
            </label>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-panel-muted/60 px-4 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
              Email Addresses
            </p>
            <p className="mt-1 text-sm text-muted">
              Primary email is used for account access. Additional emails are optional.
            </p>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Primary Email</span>
            <input
              name="email"
              type="email"
              value={primaryEmail}
              onChange={(event) => setPrimaryEmail(event.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none"
            />
          </label>

          <div className="space-y-2">
            {additionalEmails.map((email, index) => (
              <div key={`additional-email-${index}`} className="flex items-center gap-2">
                <input
                  name="additionalEmails"
                  type="email"
                  value={email}
                  onChange={(event) => handleAdditionalEmailChange(index, event.target.value)}
                  placeholder="Additional email"
                  className="h-10 flex-1 rounded-lg border border-border bg-panel px-3 text-sm text-foreground outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveEmail(index)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-panel text-muted hover:text-foreground"
                  aria-label="Remove email"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddEmail}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-panel px-4 text-sm font-medium text-foreground"
            >
              <Plus className="h-4 w-4" />
              Add Email
            </button>
          </div>
        </div>

        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
            Contact Info
          </span>
          <textarea
            name="contactInfo"
            value={contactInfo}
            onChange={(event) => setContactInfo(event.target.value)}
            rows={3}
            placeholder="Add a preferred contact method, extension, or operational note"
            className="w-full rounded-lg border border-border bg-panel px-3 py-2.5 text-sm text-foreground outline-none"
          />
        </label>

        <FormMessage
          message={state.error ?? state.success}
          tone={state.error ? "error" : "info"}
        />

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-panel px-4 text-sm font-medium text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
