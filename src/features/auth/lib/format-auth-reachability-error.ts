/**
 * Safe for client bundles: do not import `@/lib/supabase/env` here — that module throws at load
 * time if env is missing, which breaks any client page that imports this helper.
 */
export function formatAuthReachabilityError(message: string) {
  const lower = message.toLowerCase();
  const looksLikeNetwork =
    lower === "fetch failed" ||
    lower.includes("failed to fetch") ||
    lower.includes("network") ||
    lower.includes("econnrefused") ||
    lower.includes("socket") ||
    lower.includes("und_err_socket");

  if (!looksLikeNetwork) {
    return message;
  }

  const target =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    "(set NEXT_PUBLIC_SUPABASE_URL in .env.local)";
  const isLocal =
    target.includes("127.0.0.1") ||
    target.includes("localhost") ||
    target.includes("192.168.") ||
    target.includes("10.");

  if (isLocal) {
    return [
      "The app could not reach your local Supabase API.",
      `Configured URL: ${target}`,
      "Restart the stack: npx supabase stop && npx supabase start (needed after changing supabase/config.toml).",
      "Restart Next.js (npm run dev) so it reloads .env.local.",
      "Diagnostics: npm run verify:local-supabase — if you see GoTrue JSON, Supabase is healthy inside Docker and the problem is host port publishing.",
      "On Windows with Docker Desktop: fully quit Docker Desktop and start it again (fixes empty replies / fetch failed to 127.0.0.1:54321). Prefer http://127.0.0.1:54321 over localhost in NEXT_PUBLIC_SUPABASE_URL.",
    ].join(" ");
  }

  return [
    "The app could not reach Supabase (network error).",
    `Configured URL: ${target}`,
    "Check the URL, your internet connection, and whether a firewall or VPN is blocking outbound HTTPS.",
  ].join(" ");
}
