import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectTo, type } = await req.json();

    if (!email || typeof email !== "string" || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: "Valid email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const linkType = type === "recovery" ? "recovery" : "signup";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Rate-limit: 1 email per (email,type) per 60s, max 5 per email per hour.
    // Uses parent_verification_codes table as a generic rate ledger via a dedicated table would be cleaner,
    // but we use a lightweight in-DB log table created on demand.
    try {
      const since = new Date(Date.now() - 60_000).toISOString();
      const sinceHour = new Date(Date.now() - 60 * 60_000).toISOString();
      const { data: recent } = await admin
        .from("auth_email_send_log")
        .select("id, created_at")
        .eq("email", email.toLowerCase())
        .eq("link_type", linkType)
        .gte("created_at", since)
        .limit(1);
      if (recent && recent.length > 0) {
        return new Response(
          JSON.stringify({ error: "Please wait a minute before requesting another email." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const { count } = await admin
        .from("auth_email_send_log")
        .select("id", { count: "exact", head: true })
        .eq("email", email.toLowerCase())
        .gte("created_at", sinceHour);
      if ((count ?? 0) >= 5) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (rateErr) {
      console.warn("rate-limit log read failed (continuing):", rateErr);
    }

    // Validate redirectTo against allowlist
    const ALLOWED_REDIRECT_HOSTS = new Set([
      "teachlyai.com",
      "www.teachlyai.com",
      "teachlyai-com.lovable.app",
      "id-preview--5ad48171-e85b-42b0-8a0f-d2ee2f3e163c.lovable.app",
      "localhost",
    ]);
    let safeRedirect: string | undefined = undefined;
    if (redirectTo && typeof redirectTo === "string") {
      try {
        const u = new URL(redirectTo);
        if (ALLOWED_REDIRECT_HOSTS.has(u.hostname)) safeRedirect = u.toString();
      } catch (_) { /* ignore */ }
    }

    // Generate the action link (signup confirmation or password recovery)
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: linkType as any,
      email,
      options: {
        redirectTo: safeRedirect,
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error("generateLink error:", linkError);
      return new Response(
        JSON.stringify({ error: linkError?.message || "Failed to generate link" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const actionLink = linkData.properties.action_link;

    const subject =
      linkType === "recovery"
        ? "Reset your Teachly password"
        : "Verify your email for Teachly";

    const heading =
      linkType === "recovery" ? "Reset your password" : "Welcome to Teachly! 🎓";

    const body =
      linkType === "recovery"
        ? "Click the button below to reset your password. This link will expire shortly."
        : "Thanks for signing up! Please confirm your email address to get started.";

    const buttonLabel =
      linkType === "recovery" ? "Reset Password" : "Verify Email";

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; background:#ffffff; padding:40px 20px;">
        <div style="max-width:480px;margin:0 auto;background:#fff8f0;border-radius:12px;padding:32px;border:1px solid #fed7aa;">
          <h1 style="color:#1a1a1a;font-size:24px;margin-bottom:16px;">${heading}</h1>
          <p style="color:#444;font-size:16px;line-height:1.6;">${body}</p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${actionLink}" style="background:#f97316;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;">
              ${buttonLabel}
            </a>
          </div>
          <p style="color:#888;font-size:13px;margin-top:24px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${actionLink}" style="color:#f97316;word-break:break-all;">${actionLink}</a>
          </p>
          <hr style="border:none;border-top:1px solid #fed7aa;margin:24px 0;">
          <p style="color:#aaa;font-size:12px;">If you didn't request this, you can safely ignore this email.<br>The Teachly Team</p>
        </div>
      </body>
      </html>
    `;

    const keyToUse = resendApiKey.replace(/\r\n/g, "").trim();

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${keyToUse}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Teachly <noreply@teachlyai.com>",
        to: [email],
        subject,
        html,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Resend error:", resp.status, errText);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: errText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await resp.json();
    return new Response(
      JSON.stringify({ success: true, emailId: data.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-verification-email error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
