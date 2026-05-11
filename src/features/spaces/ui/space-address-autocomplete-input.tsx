"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { MapPin } from "lucide-react";
import { loadGoogleMapsPlaces } from "@/features/spaces/lib/load-google-maps-places";
import { cn } from "@/lib/utils";

/** Matches `createSpaceSchema` address max length. */
const ADDRESS_MAX_LEN = 200;
const DEBOUNCE_MS = 280;
const MIN_INPUT_LEN = 2;
/** Flip / size panel from viewport (address field is often near bottom of forms). */
const PANEL_VIEWPORT_MARGIN = 8;
const FOOTER_ROW_EST_PX = 44;
const MIN_LIST_SCROLL_PX = 100;
const MAX_LIST_SCROLL_PX = 360;
/**
 * Same band as `.pac-container` in `globals.css` so portaled suggestions stay
 * above modals (`z-50`), first-visit tours (`z-[100]`…`z-[102]`), nav popovers, etc.
 */
const PORTAL_Z_INDEX = 999_999;

type FixedPanelGeom = Readonly<{
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  placement: "top" | "bottom";
  listMaxPx: number;
}>;

export type SpaceAddressAutocompleteInputProps = Omit<
  ComponentProps<"input">,
  "ref" | "type"
>;

type Prediction = google.maps.places.AutocompletePrediction;

/**
 * Address field with Registruum-styled suggestions via Places
 * `AutocompleteService` + `getDetails` (no default `.pac-container` widget).
 *
 * Footer shows a compact **Google Maps** attribution (not the multi-color
 * “Powered by Google” chip) — required when displaying Places predictions
 * without a Google map.
 */
export function SpaceAddressAutocompleteInput({
  className,
  onChange,
  onKeyDown,
  onBlur,
  onFocus,
  autoComplete: autoCompleteProp,
  ...rest
}: SpaceAddressAutocompleteInputProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelPortalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<number | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const acServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const dummyHostRef = useRef<HTMLDivElement | null>(null);

  const [placesReady, setPlacesReady] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [listHidden, setListHidden] = useState(false);
  const [panelGeom, setPanelGeom] = useState<FixedPanelGeom | null>(null);

  const clearDebounce = useCallback(() => {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  const scheduleFetch = useCallback(
    (raw: string) => {
      if (!placesReady) {
        return;
      }
      clearDebounce();
      const ac = acServiceRef.current;
      const token = sessionTokenRef.current;
      if (!ac || !token) {
        return;
      }

      const q = raw.trim();
      if (q.length < MIN_INPUT_LEN) {
        setPredictions([]);
        setOpen(false);
        setHighlighted(-1);
        return;
      }

      debounceRef.current = window.setTimeout(() => {
        debounceRef.current = null;
        ac.getPlacePredictions({ input: q, sessionToken: token }, (results, status) => {
          const ok = status === google.maps.places.PlacesServiceStatus.OK;
          if (!ok || !results?.length) {
            setPredictions([]);
            setOpen(false);
            setHighlighted(-1);
            return;
          }
          setPredictions(results);
          setOpen(true);
          setHighlighted(0);
        });
      }, DEBOUNCE_MS) as unknown as number;
    },
    [clearDebounce, placesReady],
  );

  const selectPrediction = useCallback(
    (prediction: Prediction) => {
      const svc = placesServiceRef.current;
      const token = sessionTokenRef.current;
      const input = inputRef.current;
      if (!svc || !token || !prediction.place_id || !input) {
        return;
      }

      setListHidden(true);
      setOpen(false);
      setPredictions([]);
      setHighlighted(-1);

      svc.getDetails(
        {
          placeId: prediction.place_id,
          fields: ["formatted_address"],
          sessionToken: token,
        },
        (place, status) => {
          sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
          setListHidden(false);

          if (status !== google.maps.places.PlacesServiceStatus.OK || !inputRef.current) {
            return;
          }

          const raw = place?.formatted_address ?? "";
          if (!raw) {
            return;
          }

          const el = inputRef.current;
          el.value = raw.slice(0, ADDRESS_MAX_LEN);
          el.dispatchEvent(new Event("change", { bubbles: true }));
          if (onChange) {
            const synthetic = {
              target: el,
              currentTarget: el,
            } as unknown as ChangeEvent<HTMLInputElement>;
            onChange(synthetic);
          }
        },
      );
    },
    [onChange],
  );

  useEffect(() => {
    let cancelled = false;
    const dummy = document.createElement("div");
    dummy.setAttribute("aria-hidden", "true");
    dummy.style.position = "fixed";
    dummy.style.width = "1px";
    dummy.style.height = "1px";
    dummy.style.left = "-9999px";
    dummy.style.top = "0";
    dummy.style.overflow = "hidden";
    document.body.appendChild(dummy);
    dummyHostRef.current = dummy;

    loadGoogleMapsPlaces()
      .then(() => {
        if (cancelled || !window.google?.maps?.places) {
          return;
        }
        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
        acServiceRef.current = new google.maps.places.AutocompleteService();
        placesServiceRef.current = new google.maps.places.PlacesService(dummy);
        setPlacesReady(true);
      })
      .catch((err: unknown) => {
        const detail = err instanceof Error ? err.message : String(err);
        console.warn(
          "[Registruum] Address suggestions unavailable (manual entry still works):",
          detail,
        );
        setPlacesReady(false);
      });

    return () => {
      cancelled = true;
      clearDebounce();
      acServiceRef.current = null;
      placesServiceRef.current = null;
      sessionTokenRef.current = null;
      if (dummyHostRef.current?.parentNode) {
        dummyHostRef.current.parentNode.removeChild(dummyHostRef.current);
      }
      dummyHostRef.current = null;
    };
  }, [clearDebounce]);

  useLayoutEffect(() => {
    if (!open || !placesReady || predictions.length === 0 || listHidden) {
      return;
    }

    function measure() {
      const input = inputRef.current;
      if (!input) {
        return;
      }

      const rect = input.getBoundingClientRect();
      const vv = window.visualViewport;
      const vh = vv?.height ?? window.innerHeight;
      const vw = vv?.width ?? window.innerWidth;
      const margin = PANEL_VIEWPORT_MARGIN;
      const spaceBelow = vh - rect.bottom - margin;
      const spaceAbove = rect.top - margin;

      let placement: "top" | "bottom" = "bottom";
      if (spaceBelow >= MIN_LIST_SCROLL_PX + FOOTER_ROW_EST_PX) {
        placement = "bottom";
      } else if (spaceAbove > spaceBelow) {
        placement = "top";
      } else {
        placement = "bottom";
      }

      const avail = placement === "bottom" ? spaceBelow : spaceAbove;
      const listPx = Math.min(
        MAX_LIST_SCROLL_PX,
        Math.max(
          MIN_LIST_SCROLL_PX,
          avail - FOOTER_ROW_EST_PX - margin,
        ),
      );

      let left = rect.left;
      let width = rect.width;
      if (width > vw - margin * 2) {
        width = Math.max(200, vw - margin * 2);
      }
      if (left + width > vw - margin) {
        left = Math.max(margin, vw - margin - width);
      }
      if (left < margin) {
        left = margin;
      }

      if (placement === "bottom") {
        setPanelGeom({
          left,
          width,
          placement: "bottom",
          top: rect.bottom + margin,
          listMaxPx: listPx,
        });
      } else {
        setPanelGeom({
          left,
          width,
          placement: "top",
          bottom: vh - rect.top + margin,
          listMaxPx: listPx,
        });
      }
    }

    measure();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", measure);
    vv?.addEventListener("scroll", measure);
    window.addEventListener("resize", measure);
    document.addEventListener("scroll", measure, true);
    return () => {
      vv?.removeEventListener("resize", measure);
      vv?.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      document.removeEventListener("scroll", measure, true);
    };
  }, [open, placesReady, predictions, listHidden]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onDocPointerDown(event: PointerEvent) {
      const t = event.target as Node;
      if (rootRef.current?.contains(t) || panelPortalRef.current?.contains(t)) {
        return;
      }
      setOpen(false);
      setHighlighted(-1);
    }

    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, [open]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !open || predictions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((i) => (i + 1) % predictions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((i) => (i <= 0 ? predictions.length - 1 : i - 1));
    } else if (event.key === "Enter" && highlighted >= 0 && highlighted < predictions.length) {
      event.preventDefault();
      selectPrediction(predictions[highlighted]!);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setHighlighted(-1);
    }
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <input
        ref={inputRef}
        {...rest}
        type="text"
        className={cn(className)}
        role={placesReady ? "combobox" : undefined}
        aria-expanded={placesReady ? open : undefined}
        aria-controls={placesReady ? listboxId : undefined}
        aria-autocomplete={placesReady ? "list" : undefined}
        aria-activedescendant={
          placesReady && open && highlighted >= 0
            ? `${listboxId}-opt-${highlighted}`
            : undefined
        }
        autoComplete={placesReady ? "off" : (autoCompleteProp ?? "on")}
        onChange={(e) => {
          onChange?.(e);
          if (placesReady) {
            scheduleFetch(e.target.value);
          }
        }}
        onKeyDown={handleKeyDown}
        onFocus={(e) => {
          onFocus?.(e);
          if (placesReady) {
            const v = e.currentTarget.value;
            if (v.trim().length >= MIN_INPUT_LEN) {
              scheduleFetch(v);
            }
          }
        }}
        onBlur={(e) => {
          onBlur?.(e);
          window.setTimeout(() => {
            const ae = document.activeElement;
            if (!rootRef.current?.contains(ae) && !panelPortalRef.current?.contains(ae)) {
              setOpen(false);
            }
          }, 0);
        }}
      />

      {typeof document !== "undefined" &&
      placesReady &&
      open &&
      predictions.length > 0 &&
      !listHidden &&
      panelGeom
        ? createPortal(
            <div
              ref={panelPortalRef}
              id={listboxId}
              role="listbox"
              data-address-suggest-panel
              className={cn(
                "fixed flex flex-col overflow-hidden rounded-xl border border-border bg-panel shadow-[0_12px_40px_rgba(15,23,42,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)]",
                panelGeom.placement === "top" ? "flex-col-reverse" : "flex-col",
              )}
              style={
                {
                  left: panelGeom.left,
                  width: panelGeom.width,
                  zIndex: PORTAL_Z_INDEX,
                  maxHeight: panelGeom.listMaxPx + FOOTER_ROW_EST_PX + PANEL_VIEWPORT_MARGIN,
                  ...(panelGeom.top !== undefined ? { top: panelGeom.top } : {}),
                  ...(panelGeom.bottom !== undefined ? { bottom: panelGeom.bottom } : {}),
                } as CSSProperties
              }
            >
              <div
                className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain"
                style={{ maxHeight: panelGeom.listMaxPx }}
              >
                <ul className="divide-y divide-border/70">
                  {predictions.map((p, index) => {
                    const main = p.structured_formatting?.main_text ?? p.description;
                    const secondary = p.structured_formatting?.secondary_text ?? "";
                    const active = index === highlighted;

                    return (
                      <li key={p.place_id} role="none">
                        <button
                          type="button"
                          id={`${listboxId}-opt-${index}`}
                          role="option"
                          aria-selected={active}
                          className={cn(
                            "flex w-full items-start gap-2 px-3 py-2 text-left text-sm leading-snug transition-colors",
                            active
                              ? "bg-panel-muted text-foreground"
                              : "text-foreground hover:bg-panel-muted/80",
                          )}
                          onMouseEnter={() => setHighlighted(index)}
                          onMouseDown={(ev) => {
                            ev.preventDefault();
                          }}
                          onClick={() => selectPrediction(p)}
                        >
                          <MapPin
                            className="mt-0.5 h-4 w-4 shrink-0 text-muted"
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1 space-y-0.5">
                            <span className="block font-semibold leading-tight text-foreground">
                              {main}
                            </span>
                            {secondary ? (
                              <span className="block text-[11px] font-normal leading-snug text-muted">
                                {secondary}
                              </span>
                            ) : null}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div
                className={cn(
                  "shrink-0 bg-panel-muted/40 px-2 py-1.5 text-center",
                  panelGeom.placement === "top"
                    ? "border-b border-border"
                    : "border-t border-border",
                )}
              >
                <a
                  href="https://www.google.com/maps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-medium text-muted underline-offset-2 hover:text-foreground hover:underline"
                >
                  Google Maps
                </a>
                <span className="text-[10px] text-muted"> · place data</span>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
