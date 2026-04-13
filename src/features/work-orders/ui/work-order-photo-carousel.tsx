"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import type { WorkOrderOverviewPhoto } from "@/features/work-orders/types/work-order-overview";

type WorkOrderPhotoCarouselProps = Readonly<{
  photos: WorkOrderOverviewPhoto[];
}>;

export function WorkOrderPhotoCarousel({
  photos,
}: WorkOrderPhotoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (photos.length === 0) {
    return null;
  }

  const activePhoto = photos[activeIndex] ?? photos[0];
  const canSlide = photos.length > 1;

  return (
    <aside className="w-full max-w-none rounded-xl border border-border bg-panel-muted/60 p-3 sm:max-w-sm sm:rounded-2xl sm:bg-panel-muted/70 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
            Photos
          </p>
          <p className="mt-1 text-sm text-muted">
            {activeIndex + 1} of {photos.length}
          </p>
        </div>
        {canSlide ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setActiveIndex((currentIndex) =>
                  currentIndex === 0 ? photos.length - 1 : currentIndex - 1,
                )
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-panel text-muted transition-colors hover:text-foreground"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                setActiveIndex((currentIndex) =>
                  currentIndex === photos.length - 1 ? 0 : currentIndex + 1,
                )
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-panel text-muted transition-colors hover:text-foreground"
              aria-label="Next photo"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="mt-4 block w-full overflow-hidden rounded-xl bg-panel text-left transition-transform hover:scale-[1.01]"
        aria-label={`Open larger preview for ${activePhoto.title}`}
      >
        <div className="relative aspect-[4/3] w-full">
          <Image
            src={activePhoto.previewUrl}
            alt={activePhoto.title}
            fill
            unoptimized
            className="object-cover"
          />
          <div className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950/70 text-white">
            <Expand className="h-4 w-4" />
          </div>
        </div>
      </button>

      <p className="mt-4 min-w-0 truncate text-sm font-medium text-foreground">
        {activePhoto.title}
      </p>

      <Modal
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        title={activePhoto.title}
        description={`Photo ${activeIndex + 1} of ${photos.length}`}
        panelClassName="max-w-5xl"
      >
        <div className="space-y-4 px-5 py-5">
          <div className="overflow-hidden rounded-xl bg-panel-muted">
            <div className="relative aspect-[16/10] w-full">
              <Image
                src={activePhoto.previewUrl}
                alt={activePhoto.title}
                fill
                unoptimized
                className="object-contain"
              />
            </div>
          </div>

          {canSlide ? (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  setActiveIndex((currentIndex) =>
                    currentIndex === 0 ? photos.length - 1 : currentIndex - 1,
                  )
                }
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-panel px-4 text-sm font-medium text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveIndex((currentIndex) =>
                    currentIndex === photos.length - 1 ? 0 : currentIndex + 1,
                  )
                }
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-panel px-4 text-sm font-medium text-foreground"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
      </Modal>
    </aside>
  );
}
