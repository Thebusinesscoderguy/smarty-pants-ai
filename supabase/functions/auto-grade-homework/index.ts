import { buildCorsHeaders } from "../_shared/cors.ts";
// Nightly auto-grading of homework submissions using semantic AI grading.
// Cron-invoked. Idempotent: skips submissions that already have ai_graded_at set.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

let corsHeaders = buildCorsHeaders();

interface QuestionResponse {
  question: string;
  expectedAnswer?: string;
  studentAnswer: string;
}

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

async function gradeOne(qr: QuestionResponse): Promise<{ score: number; feedback: string; confidence: number }> {
  if (!LOVABLE_API_KEY) {
    return { score: 0, feedback: 'AI grading unavailable', confidence: 0 };
  }
  const prompt = `You are a strict but fair teacher grading a student's open-ended answer.
Question: ${qr.question}
${qr.expectedAnswer ? `Reference answer: ${qr.expectedAnswer}\n` : ''}Student's answer: ${qr.studentAnswer}

Return ONLY a JSON object: {"score": <0-100>, "feedback": "<one-sentence feedback>", "confidence": <0-1>}`;

  try {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });
    if (!res.ok) throw new Error(`AI gateway ${res.status}`);
    const data = await res.json();
    const txt = data.choices?.[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(txt);
    return {
      score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
      feedback: String(parsed.feedback || '').slice(0, 500),
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5)),
    };
  } catch (e) {
    console.error('grade error', e);
    return { score: 0, feedback: 'Grading failed — please review manually', confidence: 0 };
  }
}

Deno.serve(async (req) => {
  corsHeaders = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Pull submitted but not-yet-AI-graded submissions
  const { data: subs, error } = await supabase
    .from('homework_submissions')
    .select('id, response_data, assignment_id')
    .eq('status', 'submitted')
    .is('ai_graded_at', null)
    .limit(200);

  if (error) {
    console.error('fetch error', error);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred. Please try again.' }), { status: 500, headers: corsHeaders });
  }

  let processed = 0;
  for (const sub of subs ?? []) {
    const responses: QuestionResponse[] = Array.isArray((sub.response_data as any)?.responses)
      ? (sub.response_data as any).responses
      : [];

    if (!responses.length) {
      // Mark as graded with 0 to avoid re-processing forever
      await supabase.from('homework_submissions').update({
        ai_score: 0,
        ai_feedback: 'No response data found',
        ai_confidence: 0,
        ai_graded_at: new Date().toISOString(),
        status: 'ai_graded',
      }).eq('id', sub.id);
      processed++;
      continue;
    }

    const results = [];
    for (const r of responses) {
      results.push(await gradeOne(r));
    }
    const avg = results.reduce((a, b) => a + b.score, 0) / results.length;
    const avgConf = results.reduce((a, b) => a + b.confidence, 0) / results.length;
    const feedback = results.map((r, i) => `Q${i + 1}: ${r.feedback}`).join('\n');

    await supabase.from('homework_submissions').update({
      ai_score: Math.round(avg),
      ai_feedback: feedback,
      ai_confidence: Number(avgConf.toFixed(2)),
      ai_graded_at: new Date().toISOString(),
      status: 'ai_graded',
    }).eq('id', sub.id);
    processed++;
  }

  return new Response(JSON.stringify({ processed }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
