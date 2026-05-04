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

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
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

    // Generate the action link (signup confirmation or password recovery)
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: linkType as any,
      email,
      options: {
        redirectTo: redirectTo || undefined,
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
