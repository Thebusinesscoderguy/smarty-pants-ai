import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const sanitize = (str: string) =>
  str.replace(/[<>"'&]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "&": "&amp;" }[c] || c),
  );

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      return json({ success: false, error: "Email service not configured" }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const invitationId =
      typeof body?.invitationId === "string" ? body.invitationId.trim() : "";
    if (!invitationId) {
      return json({ success: false, error: "Missing invitationId" }, 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: invitation, error: invErr } = await admin
      .from("student_invitations")
      .select("id, email, first_name, last_name, school_id, invited_by_id")
      .eq("id", invitationId)
      .maybeSingle();

    if (invErr || !invitation) {
      return json({ success: false, error: "Invitation not found" }, 404);
    }

    const { data: school } = await admin
      .from("school_accounts")
      .select("school_name, admin_user_id")
      .eq("id", invitation.school_id)
      .maybeSingle();

    const schoolName = school?.school_name || "your school";
    const studentName =
      [invitation.first_name, invitation.last_name].filter(Boolean).join(" ").trim() ||
      invitation.email;

    // Look up admin email from auth.users (need it to notify the school admin)
    let adminEmail: string | null = null;
    const adminUserId = school?.admin_user_id || invitation.invited_by_id;
    if (adminUserId) {
      const { data: adminUser } = await admin.auth.admin.getUserById(adminUserId);
      adminEmail = adminUser?.user?.email ?? null;
    }

    const safeStudent = sanitize(studentName.substring(0, 120));
    const safeSchool = sanitize(schoolName.substring(0, 200));
    const safeEmail = sanitize(String(invitation.email).substring(0, 200));

    const fromAddr = "Teachly <noreply@teachlyai.com>";
    const keyToUse = resendApiKey.replace(/\r\n/g, "").trim();

    const sendEmail = async (to: string, subject: string, html: string) => {
      try {
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${keyToUse}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ from: fromAddr, to: [to], subject, html }),
        });
        if (!r.ok) {
          console.error("Resend error", to, r.status, await r.text());
          return false;
        }
        return true;
      } catch (e) {
        console.error("Resend exception", to, e);
        return false;
      }
    };

    const studentHtml = `
      <!DOCTYPE html><html><head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; background:#fff; padding:40px 20px;">
        <div style="max-width:480px;margin:0 auto;background:#fff8f0;border-radius:12px;padding:32px;border:1px solid #fed7aa;">
          <h1 style="color:#1a1a1a;font-size:22px;margin:0 0 16px;">You're in! 🎉</h1>
          <p style="color:#444;font-size:16px;line-height:1.6;">Hi ${safeStudent || "there"},</p>
          <p style="color:#444;font-size:16px;line-height:1.6;">
            Your account at <strong>${safeSchool}</strong> is now active. You can sign in any time and start learning.
          </p>
          <p style="color:#888;font-size:13px;margin-top:24px;">— The Teachly Team</p>
        </div>
      </body></html>`;

    const adminHtml = `
      <!DOCTYPE html><html><head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; background:#fff; padding:40px 20px;">
        <div style="max-width:480px;margin:0 auto;background:#fff8f0;border-radius:12px;padding:32px;border:1px solid #fed7aa;">
          <h1 style="color:#1a1a1a;font-size:22px;margin:0 0 16px;">Invitation accepted ✅</h1>
          <p style="color:#444;font-size:16px;line-height:1.6;">
            <strong>${safeStudent}</strong> (${safeEmail}) has accepted their invitation to <strong>${safeSchool}</strong> and now has access.
          </p>
          <p style="color:#888;font-size:13px;margin-top:24px;">— The Teachly Team</p>
        </div>
      </body></html>`;

    const studentOk = await sendEmail(
      invitation.email,
      `Welcome to ${schoolName} on Teachly`,
      studentHtml,
    );

    let adminOk = false;
    if (adminEmail) {
      adminOk = await sendEmail(
        adminEmail,
        `${studentName} accepted their invitation`,
        adminHtml,
      );
    }

    return json({ success: true, studentEmailed: studentOk, adminEmailed: adminOk });
  } catch (e) {
    console.error("send-invitation-accepted-email error:", e);
    return json(
      { success: false, error: e instanceof Error ? e.message : "Unknown error" },
      500,
    );
  }
});
