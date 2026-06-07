import { buildCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { finalizeSession } from "./finalize.ts";

let corsHeaders = buildCorsHeaders();

Deno.serve(async (req) => {
  corsHeaders = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Find in_progress sessions whose time limit has elapsed
    const { data: rows, error } = await admin
      .from('exam_sessions')
      .select('id, user_id, start_time, time_limit, answers')
      .eq('status', 'in_progress');
    if (error) return json({ error: 'An unexpected error occurred. Please try again.' }, 500);

    const now = Date.now();
    let processed = 0;
    const errors: any[] = [];

    for (const row of rows ?? []) {
      const started = new Date(row.start_time).getTime();
      const limitMs = (row.time_limit ?? 0) * 60_000;
      if (limitMs <= 0 || now - started < limitMs) continue;

      // Convert stored answers (object map or array of {id, selected}) into [{question_id, answer}]
      const submitted = normalizeAnswers(row.answers);

      try {
        const r = await finalizeSession({
          admin,
          userId: row.user_id,
          sessionId: row.id,
          submitted,
          auto: true,
          callerIsSystem: true,
          supabaseUrl,
          anonKey,
          authHeader: null,
        });
        if (r.status !== 200) errors.push({ id: row.id, error: r.body });
        else processed++;
      } catch (e: any) {
        errors.push({ id: row.id, error: 'An unexpected error occurred. Please try again.' });
      }
    }

    return json({ processed, errors });
  } catch (e: any) {
    return json({ error: 'An unexpected error occurred. Please try again.' }, 500);
  }
});

function normalizeAnswers(stored: any): { question_id: string; answer: string }[] {
  if (!stored) return [];
  if (Array.isArray(stored)) {
    return stored
      .map((a: any) => {
        if (!a) return null;
        const qid = a.question_id ?? a.id;
        const ans = a.answer ?? a.selected ?? '';
        return qid ? { question_id: String(qid), answer: String(ans) } : null;
      })
      .filter(Boolean) as any;
  }
  if (typeof stored === 'object') {
    return Object.entries(stored).map(([k, v]) => ({ question_id: k, answer: String(v ?? '') }));
  }
  return [];
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
