import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { requireSchoolAdmin } from "../_shared/adminAuth.ts";
import { createStudentAccount, remainingStudentCapacity } from "../_shared/createStudent.ts";

// admin-create-student (admin-gated)
// Creates one pre-confirmed student account directly (no invite link).
// Password is admin-supplied or auto-generated; returned so the admin can share it.

let corsHeaders = buildCorsHeaders();

serve(async (req) => {
  corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const auth = await requireSchoolAdmin(req, corsHeaders);
    if (!auth.ok) return auth.response;
    const { schoolId, adminClient } = auth;

    const body = await req.json().catch(() => ({}));

    const remaining = await remainingStudentCapacity(adminClient, schoolId);
    if (remaining !== null && remaining <= 0) {
      // Business outcome → HTTP 200 with ok:false so the client reads it from data.
      return json({ ok: false, error: "Student limit reached for your plan.", code: "limit_reached" });
    }

    const result = await createStudentAccount(adminClient, schoolId, {
      email: body.email,
      first_name: body.first_name,
      last_name: body.last_name,
      password: body.password,
      section_id: body.section_id,
    });

    if (result.status !== "created") {
      return json({ ok: false, error: result.error, code: result.code });
    }

    return json({
      ok: true,
      user_id: result.user_id,
      email: result.email,
      password: result.password,
      generated: result.generated,
    });
  } catch (error) {
    console.error("[admin-create-student] unexpected error:", (error as Error).message);
    return json({ ok: false, error: "An unexpected error occurred. Please try again." }, 500);
  }
});
