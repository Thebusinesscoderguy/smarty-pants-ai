import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { hashToken } from "../_shared/tokens.ts";
import { enforceIpRateLimit, rateLimitedResponse } from "../_shared/rateLimit.ts";

// validate-invite (public, verify_jwt=false)
//
// Given a raw token, returns a discriminated status the set-password page renders.
// Read-only; creates nothing. Generic "invalid" for not-found to avoid enumeration.

let corsHeaders = buildCorsHeaders();

serve(async (req) => {
  corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { allowed } = await enforceIpRateLimit(req, "validate-invite", 30, 3600);
    if (!allowed) return rateLimitedResponse(corsHeaders);

    const { token } = await req.json().catch(() => ({ token: "" }));
    if (!token || typeof token !== "string") {
      return json({ status: "invalid" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const tokenHash = await hashToken(token);
    const { data: invite, error } = await admin
      .from("invites")
      .select("status, role, email, expires_at, school_id")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (error) {
      console.error("[validate-invite] lookup error:", error.message);
      return json({ status: "invalid" });
    }
    if (!invite) return json({ status: "invalid" });
    if (invite.status === "accepted") return json({ status: "used" });
    if (invite.status === "revoked") return json({ status: "revoked" });
    if (new Date(invite.expires_at).getTime() < Date.now()) return json({ status: "expired" });

    // Resolve school name for display.
    const { data: school } = await admin
      .from("school_accounts")
      .select("school_name")
      .eq("id", invite.school_id)
      .maybeSingle();

    return json({
      status: "valid",
      email: invite.email,
      role: invite.role,
      school_name: school?.school_name || "your school",
    });
  } catch (error) {
    console.error("[validate-invite] unexpected error:", (error as Error).message);
    return json({ status: "invalid" });
  }
});
