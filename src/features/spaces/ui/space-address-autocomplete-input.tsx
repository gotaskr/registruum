"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { loadGoogleMapsPlaces } from "@/features/spaces/lib/load-google-maps-places";

/** Matches `createSpaceSchema` address max length. */
const ADDRESS_MAX_LEN = 200;

export type SpaceAddressAutocompleteInputProps = Omit<
  ComponentProps<"input">,
  "ref" | "type"
>;

/**
 * Plain text input with optional Google Places address suggestions when
 * `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set. Falls back to a normal input on failure.
 */
export function SpaceAddressAutocompleteInput({
  className,
  ...rest
}: SpaceAddressAutocompleteInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) {
      return;
    }

    let cancelled = false;
    let autocomplete: google.maps.places.Autocomplete | null = null;

    loadGoogleMapsPlaces()
      .then(() => {
        if (cancelled || !inputRef.current || !window.google?.maps?.places) {
          return;
        }

        autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          fields: ["formatted_address"],
          // Omit `types` so partial queries (e.g. "710 gr") get address + place predictions;
          // strict `geocode`/`address` filters often return nothing on production.
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete?.getPlace();
          const raw = place?.formatted_address ?? "";
          if (!raw || !inputRef.current) {
            return;
          }
          const next = raw.slice(0, ADDRESS_MAX_LEN);
          inputRef.current.value = next;
          inputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
        });
      })
      .catch((err: unknown) => {
        const detail = err instanceof Error ? err.message : String(err);
        console.warn(
          "[Registruum] Address suggestions unavailable (manual entry still works):",
          detail,
        );
      });

    return () => {
      cancelled = true;
      if (autocomplete) {
        window.google?.maps?.event?.clearInstanceListeners(autocomplete);
        autocomplete = null;
      }
    };
  }, []);

  return <input ref={inputRef} type="text" className={className} {...rest} />;
}
