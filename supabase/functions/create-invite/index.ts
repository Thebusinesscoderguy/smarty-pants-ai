import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { requireSchoolAdmin, sanitizeHtml } from "../_shared/adminAuth.ts";
import { generateToken, hashToken } from "../_shared/tokens.ts";
import { buildInviteEmailHtml, INVITE_EMAIL_FROM } from "../_shared/inviteEmailHtml.ts";

// create-invite (admin-gated)
//
// Creates (or re-sends) a single-use, 72h, hashed invite token for a teacher or
// parent and emails the set-password link. Also supports { action: 'revoke', invite_id }.
//
// SECURITY:
//  - Caller must own a school_accounts row; school_id is derived server-side.
//  - Role is restricted to teacher|parent (defense in depth vs the DB check).
//  - The raw token is only emailed, never returned in the response or stored.
//  - Re-sending rotates the token (old link stops working).

const TOKEN_TTL_MS = 72 * 60 * 60 * 1000;
const INVITABLE_ROLES = ["teacher", "parent"];

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
    const auth = await requireSchoolAdmin(req, corsHeaders);
    if (!auth.ok) return auth.response;
    const { schoolId, schoolName, userId, adminClient } = auth;

    const body = await req.json().catch(() => ({}));

    // --- Revoke path ---
    if (body.action === "revoke") {
      const inviteId = String(body.invite_id || "");
      if (!inviteId) return json({ error: "Missing invite_id" }, 400);
      const { error } = await adminClient
        .from("invites")
        .update({ status: "revoked", updated_at: new Date().toISOString() })
        .eq("id", inviteId)
        .eq("school_id", schoolId) // scope to own school
        .eq("status", "pending");
      if (error) {
        console.error("[create-invite] revoke error:", error.message);
        return json({ error: "Could not revoke invite" }, 500);
      }
      return json({ ok: true });
    }

    // --- Create / re-send path ---
    const email = String(body.email || "").trim().toLowerCase();
    const role = String(body.role || "");
    const firstName = String(body.first_name || "").trim();
    const lastName = String(body.last_name || "").trim();
    const childIds: string[] = Array.isArray(body.child_ids) ? body.child_ids.map(String) : [];

    // Business-rule outcomes return HTTP 200 with { ok:false, code } so the
    // supabase-js client can read them from `data` (non-2xx hides the body in
    // error.context). Only genuine auth failures stay non-2xx.
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json({ ok: false, error: "A valid email is required", code: "invalid_email" });
    }
    if (!INVITABLE_ROLES.includes(role)) {
      return json({ ok: false, error: "Role must be teacher or parent", code: "invalid_role" });
    }

    // Block inviting an email that already has an account.
    const { data: exists, error: existsErr } = await adminClient.rpc("email_has_account", {
      _email: email,
    });
    if (existsErr) {
      console.error("[create-invite] email_has_account error:", existsErr.message);
      return json({ error: "Could not verify email" }, 500);
    }
    if (exists === true) {
      return json({ ok: false, error: "This email already has an account. Ask them to log in at /auth.", code: "email_exists" });
    }

    // For parent invites, validate every child_id is a student of THIS school.
    if (role === "parent" && childIds.length > 0) {
      const { data: validStudents, error: studErr } = await adminClient
        .from("school_student_relationships")
        .select("student_id")
        .eq("school_id", schoolId)
        .in("student_id", childIds);
      if (studErr) {
        console.error("[create-invite] student validation error:", studErr.message);
        return json({ error: "Could not validate selected students" }, 500);
      }
      const validIds = new Set((validStudents || []).map((r: { student_id: string }) => r.student_id));
      const invalid = childIds.filter((id) => !validIds.has(id));
      if (invalid.length > 0) {
        return json({ ok: false, error: "One or more selected students are not in your school", code: "invalid_children" });
      }
    }

    // For teacher invites, ensure a school_teachers row exists so email-match
    // access works once they sign in (mirrors existing TeacherManagement behavior).
    if (role === "teacher") {
      const { data: existingTeacher } = await adminClient
        .from("school_teachers")
        .select("id")
        .eq("school_id", schoolId)
        .eq("email", email)
        .maybeSingle();
      if (!existingTeacher) {
        const { error: teacherErr } = await adminClient.from("school_teachers").insert({
          school_id: schoolId,
          email,
          first_name: firstName || null,
          last_name: lastName || null,
          is_active: true,
        });
        if (teacherErr) {
          console.error("[create-invite] school_teachers insert error:", teacherErr.message);
          return json({ error: "Could not register teacher" }, 500);
        }
      }
    }

    // Generate token + hash. Raw token is only emailed.
    const rawToken = generateToken();
    const tokenHash = await hashToken(rawToken);
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

    // Re-send de-dupe: rotate an existing pending invite for (email, school),
    // otherwise insert a new one.
    const { data: pending } = await adminClient
      .from("invites")
      .select("id")
      .eq("school_id", schoolId)
      .eq("email", email)
      .eq("status", "pending")
      .maybeSingle();

    let inviteId: string;
    if (pending) {
      const { data: updated, error: updErr } = await adminClient
        .from("invites")
        .update({
          role,
          token_hash: tokenHash,
          expires_at: expiresAt,
          child_ids: role === "parent" ? childIds : null,
          invited_by: userId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", pending.id)
        .select("id")
        .single();
      if (updErr || !updated) {
        console.error("[create-invite] rotate error:", updErr?.message);
        return json({ error: "Could not update invite" }, 500);
      }
      inviteId = updated.id;
    } else {
      const { data: inserted, error: insErr } = await adminClient
        .from("invites")
        .insert({
          email,
          role,
          school_id: schoolId,
          invited_by: userId,
          token_hash: tokenHash,
          status: "pending",
          child_ids: role === "parent" ? childIds : null,
          expires_at: expiresAt,
        })
        .select("id")
        .single();
      if (insErr || !inserted) {
        console.error("[create-invite] insert error:", insErr?.message);
        return json({ error: "Could not create invite" }, 500);
      }
      inviteId = inserted.id;
    }

    // Send the email via Resend.
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return json({ error: "Email service not configured", type: "configuration_error" }, 500);
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://smarty-pants-ai.lovable.app";
    const acceptLink = `${siteUrl}/accept-invite?token=${encodeURIComponent(rawToken)}`;
    const safeName = sanitizeHtml([firstName, lastName].filter(Boolean).join(" "), 100);
    const safeSchoolName = sanitizeHtml(schoolName, 200);

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey.replace(/\r\n/g, "").trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: INVITE_EMAIL_FROM,
        to: [email],
        subject: `You're invited to join ${safeSchoolName} on Teachly`,
        html: buildInviteEmailHtml({ safeName, safeSchoolName, role: role as "teacher" | "parent", acceptLink }),
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error("[create-invite] Resend error:", emailRes.status, errText);
      // The invite row exists; surface a soft error so the admin can re-send.
      return json({ ok: false, invite_id: inviteId, error: "Could not send the invitation email. Please try again." }, 200);
    }

    return json({ ok: true, invite_id: inviteId });
  } catch (error) {
    console.error("[create-invite] unexpected error:", (error as Error).message);
    return json({ error: "An unexpected error occurred. Please try again." }, 500);
  }
});
