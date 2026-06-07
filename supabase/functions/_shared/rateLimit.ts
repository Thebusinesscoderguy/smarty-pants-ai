// Shared per-IP rate limiter for the anonymous AI endpoints.
//
// SECURITY (AI bill abuse): these endpoints are intentionally unauthenticated so
// the public demo keeps working, which means an attacker could otherwise call
// them in a loop and run up the AI bill. We enforce a per-IP, per-endpoint
// fixed-window limit using the check_ai_rate_limit() RPC (service role only).
//
// Design choice: this is FAIL-OPEN. If the limiter infrastructure is missing or
// errors, we allow the request rather than break a user-facing feature — the
// limiter exists to cap cost abuse, not to be a hard security gate. Errors are
// logged so they're visible.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Best-effort client IP extraction. Supabase/edge puts the real client IP in
// x-forwarded-for (first entry). Never trust this for auth — only for throttling.
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") ?? "";
  const first = xff.split(",")[0]?.trim();
  return first || req.headers.get("x-real-ip") || "unknown";
}

export async function enforceIpRateLimit(
  req: Request,
  endpoint: string,
  limit = 3,
  windowSeconds = 3600,
): Promise<{ allowed: boolean }> {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) {
      console.error("[rate-limit] missing SUPABASE_URL / SERVICE_ROLE_KEY; allowing");
      return { allowed: true };
    }

    const admin = createClient(url, key);
    const ip = getClientIp(req);
    const { data, error } = await admin.rpc("check_ai_rate_limit", {
      _endpoint: endpoint,
      _ip: ip,
      _limit: limit,
      _window_seconds: windowSeconds,
    });

    if (error) {
      console.error("[rate-limit] rpc error:", error.message);
      return { allowed: true }; // fail-open
    }
    return { allowed: data === true };
  } catch (e) {
    console.error("[rate-limit] unexpected error:", (e as Error).message);
    return { allowed: true }; // fail-open
  }
}

// Convenience: build a standard 429 Response using the function's cors headers.
export function rateLimitedResponse(corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
    { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
