"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { GlobalSearchResponse } from "@/features/search/types/global-search";

const DEBOUNCE_MS = 280;

export function GlobalSearchPopover() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<GlobalSearchResponse | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  const runSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(q)}`,
        { credentials: "same-origin", cache: "no-store" },
      );

      if (response.status === 401) {
        setResults(null);
        setError("Sign in to search.");
        return;
      }

      if (response.status === 400) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setResults(null);
        setError(body?.error ?? "Invalid search.");
        return;
      }

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setResults(null);
        setError(body?.error ?? "Search failed.");
        return;
      }

      const data = (await response.json()) as GlobalSearchResponse;
      setResults(data);
    } catch {
      setResults(null);
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (debounced.length < 2) {
      setResults(null);
      setError(null);
      setLoading(false);
      return;
    }

    void runSearch(debounced);
  }, [debounced, open, runSearch]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const totalHits =
    (results?.spaces.length ?? 0) +
    (results?.workOrders.length ?? 0) +
    (results?.archive.length ?? 0);

  return (
    <div ref={rootRef} className="relative w-full max-w-2xl">
      <label className="relative block w-full">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search spaces, work orders, and archive"
          autoComplete="off"
          spellCheck={false}
          className="h-12 w-full rounded-2xl border border-border bg-panel pl-11 pr-4 text-sm text-foreground outline-none shadow-[0_8px_20px_rgba(15,23,42,0.04)] placeholder:text-muted focus:border-accent"
          aria-autocomplete="list"
          aria-controls="global-search-results"
        />
      </label>

      {open ? (
        <div
          id="global-search-results"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-[min(70dvh,22rem)] overflow-y-auto overscroll-contain rounded-2xl border border-border bg-panel p-3 shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
        >
          {query.trim().length < 2 ? (
            <p className="px-2 py-4 text-center text-sm text-muted">
              Type at least two characters to search across your spaces, active work orders, and
              archive titles.
            </p>
          ) : null}

          {query.trim().length >= 2 && loading ? (
            <p className="px-2 py-6 text-center text-sm text-muted">Searching…</p>
          ) : null}

          {error ? (
            <p className="px-2 py-4 text-center text-sm text-rose-600 dark:text-rose-400">
              {error}
            </p>
          ) : null}

          {!loading && !error && results && totalHits === 0 && debounced.length >= 2 ? (
            <p className="px-2 py-6 text-center text-sm text-muted">No matches yet.</p>
          ) : null}

          {!loading && !error && results && totalHits > 0 ? (
            <div className="space-y-4">
              {results.spaces.length > 0 ? (
                <section>
                  <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                    Spaces
                  </p>
                  <ul className="space-y-0.5">
                    {results.spaces.map((hit) => (
                      <li key={hit.id}>
                        <Link
                          href={hit.href}
                          className="block rounded-xl px-2 py-2 text-sm font-medium text-foreground hover:bg-panel-muted"
                          onClick={() => setOpen(false)}
                        >
                          {hit.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {results.workOrders.length > 0 ? (
                <section>
                  <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                    Work orders
                  </p>
                  <ul className="space-y-0.5">
                    {results.workOrders.map((hit) => (
                      <li key={hit.id}>
                        <Link
                          href={hit.href}
                          className="block rounded-xl px-2 py-2 hover:bg-panel-muted"
                          onClick={() => setOpen(false)}
                        >
                          <p className="text-sm font-medium text-foreground">{hit.title}</p>
                          <p className="text-xs text-muted">{hit.spaceName}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {results.archive.length > 0 ? (
                <section>
                  <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                    Archive
                  </p>
                  <ul className="space-y-0.5">
                    {results.archive.map((hit) => (
                      <li key={hit.id}>
                        <Link
                          href={hit.href}
                          className="block rounded-xl px-2 py-2 hover:bg-panel-muted"
                          onClick={() => setOpen(false)}
                        >
                          <p className="text-sm font-medium text-foreground">{hit.title}</p>
                          <p className="text-xs text-muted">{hit.spaceName}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
