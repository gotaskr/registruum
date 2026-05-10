/**
 * Loads the Maps JavaScript API with the Places library once per page.
 * Rejects when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is unset or the script fails.
 *
 * Note: Do not use `loading=async` without a `callback` — on `load`, `places` is
 * often not ready yet, so Autocomplete would never attach.
 */

let loadPromise: Promise<void> | null = null;

function attachPlacesWhenReady(
  resolve: () => void,
  reject: (reason: Error) => void,
) {
  const finish = () => {
    if (window.google?.maps?.places) {
      resolve();
      return true;
    }
    return false;
  };

  if (finish()) {
    return;
  }

  const maps = window.google?.maps;
  if (maps && typeof maps.importLibrary === "function") {
    void maps
      .importLibrary("places")
      .then(() => {
        if (!finish()) {
          loadPromise = null;
          reject(new Error("Google Maps Places library did not initialize."));
        }
      })
      .catch(() => {
        loadPromise = null;
        reject(new Error("Failed to import Google Maps Places library."));
      });
    return;
  }

  loadPromise = null;
  reject(new Error("Google Maps loaded without Places support."));
}

export function loadGoogleMapsPlaces(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser."));
  }

  if (window.google?.maps?.places) {
    return Promise.resolve();
  }

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  if (!key) {
    return Promise.reject(new Error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY."));
  }

  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const callbackName = "__registruumMapsPlacesCb";
      const previous = (
        window as unknown as Record<string, unknown>
      )[callbackName];

      (window as unknown as Record<string, () => void>)[callbackName] = () => {
        try {
          attachPlacesWhenReady(resolve, reject);
        } finally {
          if (previous !== undefined) {
            (window as unknown as Record<string, unknown>)[callbackName] =
              previous;
          } else {
            Reflect.deleteProperty(window as unknown as object, callbackName);
          }
        }
      };

      const script = document.createElement("script");
      script.async = true;
      const originReferrer =
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_AUTH_REFERRER_ORIGIN === "true"
          ? "&auth_referrer_policy=origin"
          : "";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&loading=async&callback=${callbackName}${originReferrer}`;
      script.onerror = () => {
        loadPromise = null;
        Reflect.deleteProperty(window as unknown as object, callbackName);
        reject(new Error("Failed to load Google Maps JavaScript API."));
      };
      document.head.appendChild(script);
    });
  }

  return loadPromise;
}
