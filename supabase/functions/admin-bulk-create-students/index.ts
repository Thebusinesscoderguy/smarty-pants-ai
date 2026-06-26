import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { requireSchoolAdmin } from "../_shared/adminAuth.ts";
import { createStudentAccount, remainingStudentCapacity, type CreateStudentResult } from "../_shared/createStudent.ts";

// admin-bulk-create-students (admin-gated)
// Creates many pre-confirmed student accounts from a parsed CSV. Returns a
// per-row result so the UI can build a credentials CSV and a failure report.

const MAX_BATCH = 500;

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
    const students = Array.isArray(body.students) ? body.students : [];
    if (students.length === 0) return json({ ok: false, error: "No students provided" });
    if (students.length > MAX_BATCH) {
      return json({ ok: false, error: `Too many rows (max ${MAX_BATCH} per import)` });
    }

    let remaining = await remainingStudentCapacity(adminClient, schoolId);
    const results: CreateStudentResult[] = [];

    for (const s of students) {
      if (remaining !== null && remaining <= 0) {
        results.push({ email: (s.email || "").trim().toLowerCase(), status: "failed", error: "Student limit reached", code: "limit_reached" });
        continue;
      }
      const result = await createStudentAccount(adminClient, schoolId, {
        email: s.email,
        first_name: s.first_name,
        middle_name: s.middle_name,
        last_name: s.last_name,
        password: s.password,
        section_id: s.section_id,
      });
      if (result.status === "created" && remaining !== null) remaining -= 1;
      results.push(result);
    }

    const created = results.filter((r) => r.status === "created").length;
    const failed = results.length - created;
    return json({ ok: true, created, failed, results });
  } catch (error) {
    console.error("[admin-bulk-create-students] unexpected error:", (error as Error).message);
    return json({ ok: false, error: "An unexpected error occurred. Please try again." }, 500);
  }
});
