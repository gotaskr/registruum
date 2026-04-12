/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  FileText,
  Link2,
  Plus,
  Trash2,
} from "lucide-react";
import { FileUploadField } from "@/components/ui/file-upload-field";
import {
  createMobileDocumentLink,
  deleteMobileDocumentItem,
  uploadMobileWorkOrderDocuments,
} from "@/features/mobile/actions/mobile-document.actions";
import type { MobileWorkOrderDetailsData } from "@/features/mobile/types/mobile";
import { MobileBottomSheet } from "@/features/mobile/ui/mobile-bottom-sheet";
import { MobileCard } from "@/features/mobile/ui/mobile-primitives";

type FolderFilter = "all" | "photos" | "videos" | "files" | "links";

const folderLabels: ReadonlyArray<Readonly<{ key: FolderFilter; label: string }>> = [
  { key: "all", label: "All" },
  { key: "photos", label: "Photos" },
  { key: "videos", label: "Videos" },
  { key: "files", label: "Files" },
  { key: "links", label: "Links" },
];

export function MobileWorkOrderDocumentsTab({
  data,
}: Readonly<{
  data: MobileWorkOrderDetailsData;
}>) {
  const router = useRouter();
  const [selectedFolderKey, setSelectedFolderKey] = useState<FolderFilter>("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | undefined>(undefined);
  const [deleteError, setDeleteError] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  const visibleDocuments = useMemo(() => {
    if (selectedFolderKey === "all") {
      return data.documents;
    }

    return data.documents.filter((document) => document.systemFolderKey === selectedFolderKey);
  }, [data.documents, selectedFolderKey]);

  const handleUploadAction = (formData: FormData) => {
    startTransition(async () => {
      const result = await uploadMobileWorkOrderDocuments(undefined, formData);
      if (result.error) {
        setUploadError(result.error);
        return;
      }

      setUploadError(undefined);
      setUploadOpen(false);
      router.refresh();
    });
  };

  const handleLinkAction = (formData: FormData) => {
    startTransition(async () => {
      const result = await createMobileDocumentLink(undefined, formData);
      if (result.error) {
        setUploadError(result.error);
        return;
      }

      setUploadError(undefined);
      setUploadOpen(false);
      router.refresh();
    });
  };

  const handleDelete = (documentId: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("spaceId", data.space.id);
      formData.set("workOrderId", data.workOrder.id);
      formData.set("documentId", documentId);
      const result = await deleteMobileDocumentItem(undefined, formData);

      if (result.error) {
        setDeleteError(result.error);
        return;
      }

      setDeleteError(undefined);
      router.refresh();
    });
  };

  const showMediaGrid = selectedFolderKey === "photos" || selectedFolderKey === "videos";

  return (
    <div className="space-y-4">
      <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
        {folderLabels.map((folder) => (
          <button
            key={folder.key}
            type="button"
            onClick={() => setSelectedFolderKey(folder.key)}
            className={
              selectedFolderKey === folder.key
                ? "inline-flex h-11 shrink-0 items-center rounded-full bg-[#3566d6] px-6 text-[1.05rem] font-semibold text-white"
                : "inline-flex h-11 shrink-0 items-center rounded-full border border-slate-200 bg-white px-6 text-[1.05rem] font-medium text-slate-500"
            }
          >
            {folder.label}
          </button>
        ))}
      </div>

      {deleteError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {deleteError}
        </div>
      ) : null}

      {showMediaGrid ? (
        <div className="grid grid-cols-2 gap-3">
          {visibleDocuments.map((document) => (
            <MobileCard key={document.id} className="overflow-hidden p-0">
              {document.previewUrl ? (
                <img
                  src={document.previewUrl}
                  alt={document.title}
                  className="h-32 w-full object-cover"
                />
              ) : (
                <div className="flex h-32 items-center justify-center bg-slate-100 text-slate-400">
                  <Camera className="h-6 w-6" />
                </div>
              )}
              <div className="space-y-2 p-3">
                <p className="truncate text-sm font-semibold text-slate-950">{document.title}</p>
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={document.downloadUrl ?? "#"}
                    target="_blank"
                    className="text-sm font-medium text-slate-700"
                  >
                    Preview
                  </Link>
                  {data.canDeleteDocuments ? (
                    <button
                      type="button"
                      onClick={() => handleDelete(document.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            </MobileCard>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleDocuments.map((document) => (
            <MobileCard key={document.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {document.systemFolderKey === "links" ? (
                      <Link2 className="h-4 w-4 text-slate-500" />
                    ) : (
                      <FileText className="h-4 w-4 text-slate-500" />
                    )}
                    <p className="truncate text-sm font-semibold text-slate-950">{document.title}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">Uploaded by {document.uploadedByName}</p>
                </div>
                {data.canDeleteDocuments ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(document.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-400">{document.createdAt}</span>
                <Link
                  href={document.downloadUrl ?? document.externalUrl ?? "#"}
                  target="_blank"
                  className="text-sm font-medium text-slate-700"
                >
                  Open
                </Link>
              </div>
            </MobileCard>
          ))}
        </div>
      )}

      {visibleDocuments.length === 0 ? (
        <MobileCard className="py-16 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-slate-100 text-slate-400">
            <FileText className="h-8 w-8" />
          </div>
          <p className="mt-5 text-[1.7rem] font-semibold text-slate-950">No documents</p>
          <p className="mt-2 text-[1.05rem] text-slate-500">Upload files to this work order</p>
        </MobileCard>
      ) : null}

      {data.canUploadDocuments ? (
        <div className="sticky bottom-24 flex justify-end">
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#3566d6] text-white shadow-[0_18px_34px_rgba(53,102,214,0.24)]"
          >
            <Plus className="h-7 w-7" />
          </button>
        </div>
      ) : null}

      <MobileBottomSheet
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload to Documents"
        description="Files are auto-sorted into Photos, Videos, Files, and Links."
      >
        <div className="space-y-5">
          {uploadError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {uploadError}
            </div>
          ) : null}

          <form action={handleUploadAction} className="space-y-4">
            <input type="hidden" name="spaceId" value={data.space.id} />
            <input type="hidden" name="workOrderId" value={data.workOrder.id} />
            <FileUploadField
              name="files"
              buttonLabel="Select files"
              helperText="Photos, videos, and files are sorted automatically."
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp,.mp4,.mov,.webm,.avi,.mkv"
            />
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isPending ? "Uploading..." : "Upload Files"}
            </button>
          </form>

          <div className="h-px bg-slate-200" />

          <form action={handleLinkAction} className="space-y-4">
            <input type="hidden" name="spaceId" value={data.space.id} />
            <input type="hidden" name="workOrderId" value={data.workOrder.id} />
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Link title</span>
              <input
                type="text"
                name="title"
                placeholder="Vendor quote"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">URL</span>
              <input
                type="url"
                name="url"
                placeholder="https://"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none"
              />
            </label>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 disabled:opacity-60"
            >
              Add Link
            </button>
          </form>
        </div>
      </MobileBottomSheet>
    </div>
  );
}
