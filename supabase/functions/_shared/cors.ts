// Shared CORS helper for all edge functions.
//
// SECURITY (CORS): previously every function returned
//   'Access-Control-Allow-Origin': '*'
// which lets any website's JavaScript invoke these endpoints from a victim's
// browser. We now reflect the request's Origin header back ONLY when it is on
// an explicit allowlist; anything else falls back to the canonical production
// origin. `Vary: Origin` is set so caches don't serve the wrong ACAO header.
//
// Note: CORS is a browser-enforced control, not a replacement for auth — the
// authoritative boundary is still JWT verification + RLS. This is defense in depth.

const ALLOWED_ORIGINS = [
  "https://teachlyai.com",
  "https://www.teachlyai.com",
  "https://preview--teachlyai-com.lovable.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8083",
];

// The header set we accept on cross-origin requests (superset used across all
// functions so none of them break after the migration to this helper).
const ALLOW_HEADERS = [
  "authorization",
  "x-client-info",
  "apikey",
  "content-type",
  "x-supabase-client-platform",
  "x-supabase-client-platform-version",
  "x-supabase-client-runtime",
  "x-supabase-client-runtime-version",
].join(", ");

export function resolveAllowedOrigin(req?: Request): string {
  const origin = req?.headers.get("Origin") ?? "";
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

// Build the CORS headers for a given request. Call with the request to reflect
// an allowlisted Origin; call with no argument to get headers for the canonical
// origin (used as a safe default before the request is in scope).
export function buildCorsHeaders(req?: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
    "Access-Control-Allow-Headers": ALLOW_HEADERS,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Vary": "Origin",
  };
}
