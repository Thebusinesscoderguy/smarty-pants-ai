import { buildCorsHeaders } from "../_shared/cors.ts";
// DEPRECATED: AI auto-grading of homework has been removed.
//
// Grading rule (uniform across exams and assignments): any free-text / typed
// answer goes to the TEACHER for manual grading — never AI. Homework submissions
// are free-text, so they are graded by hand in the Grading Inbox / Submissions
// drawer. This endpoint is intentionally a no-op: it no longer calls any AI model
// and never writes ai_score/ai_feedback/status='ai_graded'. The nightly cron that
// invoked it has been unscheduled; this stub remains only so any lingering caller
// fails safe instead of erroring.

let corsHeaders = buildCorsHeaders();

Deno.serve(async (req) => {
  corsHeaders = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  return new Response(
    JSON.stringify({ processed: 0, deprecated: true, reason: 'AI homework grading removed; typed answers are graded manually by teachers.' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
