import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { hashToken } from "../_shared/tokens.ts";
import { enforceIpRateLimit, rateLimitedResponse } from "../_shared/rateLimit.ts";

// accept-invite (public, verify_jwt=false)
//
// Finalizes a teacher/parent account from an invite token.
//
// SECURITY:
//  - Token is re-validated server-side; client validation is never trusted.
//  - The token is atomically CLAIMED (pending -> accepted) before account
//    creation, guaranteeing single use even under concurrent requests.
//  - The role comes from the INVITE ROW, not the request body, so a recipient
//    cannot escalate beyond the invited role.
//  - The account is created server-side with the service role; the client only
//    learns success, then signs in normally with the password it just set.

const MIN_PASSWORD_LEN = 8;

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
    const { allowed } = await enforceIpRateLimit(req, "accept-invite", 20, 3600);
    if (!allowed) return rateLimitedResponse(corsHeaders);

    // Business-rule outcomes return HTTP 200 with { ok:false, code } so the
    // supabase-js client reads them from `data` (non-2xx hides the body).
    const { token, password } = await req.json().catch(() => ({}));
    if (!token || typeof token !== "string") {
      return json({ ok: false, error: "Invalid invite link", code: "invalid" });
    }
    if (!password || typeof password !== "string" || password.length < MIN_PASSWORD_LEN) {
      return json({ ok: false, error: `Password must be at least ${MIN_PASSWORD_LEN} characters`, code: "weak_password" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const tokenHash = await hashToken(token);

    // Re-validate.
    const { data: invite, error: lookupErr } = await admin
      .from("invites")
      .select("id, status, role, email, school_id, child_ids, expires_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (lookupErr) {
      console.error("[accept-invite] lookup error:", lookupErr.message);
      return json({ ok: false, error: "Invalid invite link", code: "invalid" });
    }
    if (!invite) return json({ ok: false, error: "Invalid invite link", code: "invalid" });
    if (invite.status === "accepted") return json({ ok: false, error: "This invite has already been used", code: "used" });
    if (invite.status === "revoked") return json({ ok: false, error: "This invite was revoked", code: "revoked" });
    if (new Date(invite.expires_at).getTime() < Date.now()) {
      return json({ ok: false, error: "This invite has expired", code: "expired" });
    }

    const email = invite.email.toLowerCase();
    const role = invite.role as "teacher" | "parent";

    // Atomically CLAIM the invite (single-use guarantee). Only one concurrent
    // request will flip pending -> accepted and get a row back.
    const nowIso = new Date().toISOString();
    const { data: claimed, error: claimErr } = await admin
      .from("invites")
      .update({ status: "accepted", accepted_at: nowIso, updated_at: nowIso })
      .eq("id", invite.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (claimErr) {
      console.error("[accept-invite] claim error:", claimErr.message);
      return json({ ok: false, error: "Could not process invite. Please try again.", code: "error" }, 500);
    }
    if (!claimed) {
      // Lost the race — already accepted.
      return json({ ok: false, error: "This invite has already been used", code: "used" });
    }

    // Helper to roll the claim back so the link remains usable on recoverable errors.
    const revertClaim = async () => {
      await admin
        .from("invites")
        .update({ status: "pending", accepted_at: null, updated_at: new Date().toISOString() })
        .eq("id", invite.id);
    };

    // Derive a display name (teachers carry names on school_teachers).
    let fullName: string | null = null;
    if (role === "teacher") {
      const { data: teacher } = await admin
        .from("school_teachers")
        .select("first_name, last_name")
        .eq("school_id", invite.school_id)
        .eq("email", email)
        .maybeSingle();
      if (teacher) fullName = [teacher.first_name, teacher.last_name].filter(Boolean).join(" ") || null;
    }

    // Create the account server-side, pre-confirmed.
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: fullName ? { full_name: fullName } : {},
    });

    if (createErr || !created?.user) {
      const msg = (createErr?.message || "").toLowerCase();
      if (msg.includes("already") && (msg.includes("registered") || msg.includes("exist"))) {
        // Account appeared after invite creation; keep invite consumed-revert so
        // it's not stuck, and tell them to log in.
        await revertClaim();
        return json({ ok: false, error: "This email already has an account. Please log in at /auth.", code: "email_exists" });
      }
      console.error("[accept-invite] createUser error:", createErr?.message);
      await revertClaim();
      return json({ ok: false, error: "Could not create your account. Please try again.", code: "error" }, 500);
    }

    const newUserId = created.user.id;

    // Finalize: stamp the accepted_user_id now that we have it.
    await admin.from("invites").update({ accepted_user_id: newUserId }).eq("id", invite.id);

    // Reconcile roles: the handle_new_user trigger inserted user_roles='student'
    // and a profiles row. Replace with the INVITED role (from the invite, not the
    // request) so no escalation is possible.
    await admin.from("user_roles").delete().eq("user_id", newUserId);
    const { error: roleErr } = await admin.from("user_roles").insert({ user_id: newUserId, role });
    if (roleErr) console.error("[accept-invite] user_roles insert error:", roleErr.message);

    const { error: profErr } = await admin
      .from("profiles")
      .update({
        role,
        display_name: fullName,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", newUserId);
    if (profErr) console.error("[accept-invite] profiles update error:", profErr.message);

    // Wire membership.
    if (role === "parent" && Array.isArray(invite.child_ids) && invite.child_ids.length > 0) {
      const rows = invite.child_ids.map((childId: string) => ({ parent_id: newUserId, child_id: childId }));
      const { error: linkErr } = await admin.from("parent_child_relationships").insert(rows);
      if (linkErr) console.error("[accept-invite] parent_child link error:", linkErr.message);
    }
    // Teacher membership is via the school_teachers email row already ensured at invite time.

    return json({ ok: true, email, role });
  } catch (error) {
    console.error("[accept-invite] unexpected error:", (error as Error).message);
    return json({ error: "An unexpected error occurred. Please try again.", code: "error" }, 500);
  }
});
