"use client";

import Image from "next/image";
import { Building2, Upload } from "lucide-react";
import { useEffect, useState, type ChangeEvent } from "react";
import { getInitials } from "@/lib/utils";

type SpacePhotoFieldProps = Readonly<{
  defaultLabel?: string;
  inputName?: string;
  previewUrl?: string | null;
}>;

export function SpacePhotoField({
  defaultLabel = "Space",
  inputName = "photo",
  previewUrl = null,
}: SpacePhotoFieldProps) {
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => () => {
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }
  }, [localPreviewUrl]);

  const resolvedPreviewUrl = localPreviewUrl ?? previewUrl;

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
      setLocalPreviewUrl(null);
    }

    if (!file) {
      setFileName(null);
      return;
    }

    setFileName(file.name);
    setLocalPreviewUrl(URL.createObjectURL(file));
  };

  return (
    <div className="flex items-center gap-4">
      <label className="group relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-[1.75rem] border border-[#dbe4f0] bg-[#edf3ff] shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
        {resolvedPreviewUrl ? (
          <Image
            src={resolvedPreviewUrl}
            alt={`${defaultLabel} photo`}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[#2f5fd4]">
            <Building2 className="h-7 w-7" />
            <span className="text-xs font-semibold uppercase tracking-[0.16em]">
              {getInitials(defaultLabel || "Space") || "S"}
            </span>
          </div>
        )}

        <div className="absolute inset-0 flex items-end justify-center bg-slate-950/0 p-2 opacity-0 transition group-hover:bg-slate-950/35 group-hover:opacity-100">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-slate-900">
            <Upload className="h-3 w-3" />
            Change
          </span>
        </div>

        <input
          type="file"
          name={inputName}
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />
      </label>

      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">Space Photo</p>
        <p className="mt-1 text-sm text-[#5f718b]">
          Click the image to upload.
        </p>
        <p className="mt-2 truncate text-xs font-medium text-[#8093af]">
          {fileName ?? "No photo selected"}
        </p>
      </div>
    </div>
  );
}
