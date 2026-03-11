import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const invitationCode =
      typeof body?.invitationCode === "string" ? body.invitationCode.trim() : "";

    if (!/^[a-zA-Z0-9_-]{6,64}$/.test(invitationCode)) {
      return json({ valid: false, reason: "invalid_code" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ valid: false, reason: "configuration_error" }, 500);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: invitation, error: invitationError } = await admin
      .from("student_invitations")
      .select("id, email, first_name, last_name, school_id, expires_at, used")
      .eq("invitation_code", invitationCode)
      .maybeSingle();

    if (invitationError) {
      console.error("validate-student-invitation lookup error:", invitationError);
      return json({ valid: false, reason: "lookup_failed" }, 500);
    }

    if (!invitation) {
      return json({ valid: false, reason: "not_found" });
    }

    if (invitation.used) {
      return json({ valid: false, reason: "used" });
    }

    if (new Date(invitation.expires_at).getTime() <= Date.now()) {
      return json({ valid: false, reason: "expired" });
    }

    const { data: school } = await admin
      .from("school_accounts")
      .select("school_name")
      .eq("id", invitation.school_id)
      .maybeSingle();

    return json({
      valid: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        first_name: invitation.first_name ?? "",
        last_name: invitation.last_name ?? "",
        school_id: invitation.school_id,
        school_name: school?.school_name ?? "your school",
        expires_at: invitation.expires_at,
        used: invitation.used,
      },
    });
  } catch (error) {
    console.error("validate-student-invitation fatal error:", error);
    return json(
      {
        valid: false,
        reason: "unexpected_error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});
