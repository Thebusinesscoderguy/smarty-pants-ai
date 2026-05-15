import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const sanitize = (str: string) =>
  str.replace(/[<>"'&]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "&": "&amp;" }[c] || c)
  );

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    // Verify caller
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = claimsData.claims.sub;

    // Caller must be a school admin or teacher
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: school } = await admin
      .from("school_accounts")
      .select("id, school_name")
      .eq("admin_user_id", callerId)
      .maybeSingle();

    let schoolId = school?.id;
    let schoolName = school?.school_name;
    if (!schoolId) {
      // Maybe a teacher
      const { data: teacher } = await admin
        .from("school_teachers")
        .select("school_id, school_accounts(id, school_name)")
        .eq("user_id", callerId)
        .maybeSingle();
      schoolId = (teacher as any)?.school_id;
      schoolName = (teacher as any)?.school_accounts?.school_name;
    }
    if (!schoolId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { absentStudentIds, date } = await req.json();
    if (!Array.isArray(absentStudentIds) || absentStudentIds.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, skipped: "no absences" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "RESEND_API_KEY not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get parents for each absent student (parent_child_relationships.child_id == student profile id)
    const { data: rels } = await admin
      .from("parent_child_relationships")
      .select("parent_id, child_id")
      .in("child_id", absentStudentIds);

    if (!rels || rels.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, skipped: "no parents linked" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Student names
    const { data: students } = await admin
      .from("profiles")
      .select("id, display_name")
      .in("id", absentStudentIds);
    const nameById = new Map((students || []).map((s) => [s.id, s.display_name || "your child"]));

    // Parent emails via auth admin API
    const parentIds = Array.from(new Set(rels.map((r) => r.parent_id)));
    const emailById = new Map<string, string>();
    for (const pid of parentIds) {
      const { data: u } = await admin.auth.admin.getUserById(pid);
      if (u?.user?.email) emailById.set(pid, u.user.email);
    }

    const safeSchool = sanitize((schoolName || "Your school").substring(0, 200));
    const dateStr = sanitize(String(date || new Date().toISOString().slice(0, 10)));
    const keyToUse = resendApiKey.replace(/\r\n/g, "").trim();

    let sent = 0;
    const errors: string[] = [];
    for (const rel of rels) {
      const email = emailById.get(rel.parent_id);
      if (!email) continue;
      const childName = sanitize(String(nameById.get(rel.child_id) || "your child").substring(0, 100));

      const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#fff;padding:32px 16px;">
        <div style="max-width:480px;margin:0 auto;background:#fff8f0;border:1px solid #fed7aa;border-radius:12px;padding:28px;">
          <h1 style="color:#1a1a1a;font-size:22px;margin:0 0 16px;">Absence notice</h1>
          <p style="color:#444;font-size:16px;line-height:1.6;margin:0 0 12px;">Hi,</p>
          <p style="color:#444;font-size:16px;line-height:1.6;margin:0 0 12px;">
            <strong>${childName}</strong> was marked <strong style="color:#dc2626;">absent</strong> at <strong>${safeSchool}</strong> on <strong>${dateStr}</strong>.
          </p>
          <p style="color:#444;font-size:16px;line-height:1.6;margin:0 0 16px;">
            If this is a mistake, please contact the school office.
          </p>
          <hr style="border:none;border-top:1px solid #fed7aa;margin:20px 0;">
          <p style="color:#aaa;font-size:12px;margin:0;">Sent automatically by Teachly</p>
        </div></body></html>`;

      try {
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${keyToUse}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Teachly <noreply@teachlyai.com>",
            to: [email],
            subject: `Absence notice — ${childName} (${dateStr})`,
            html,
          }),
        });
        if (r.ok) sent++;
        else errors.push(`${email}: ${r.status}`);
      } catch (e: any) {
        errors.push(`${email}: ${e.message}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent, total_parents: rels.length, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("send-absence-notification error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
