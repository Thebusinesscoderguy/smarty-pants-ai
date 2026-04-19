// Auto-generate curriculum units when none exist for a framework+grade+subject combo.
// Uses Lovable AI Gateway (Gemini Flash) and saves results permanently to curriculum_units.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReqBody {
  framework_id: string;
  subject_id: string;
  grade_level_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as ReqBody;
    if (!body.framework_id || !body.subject_id || !body.grade_level_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Idempotent: if units already exist for this combo, return them.
    const { data: existing } = await admin
      .from('curriculum_units')
      .select('*')
      .eq('framework_id', body.framework_id)
      .eq('subject_id', body.subject_id)
      .eq('grade_level_id', body.grade_level_id)
      .order('unit_number');
    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ units: existing, cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Look up names for the AI prompt.
    const [{ data: fw }, { data: subj }, { data: grade }] = await Promise.all([
      admin.from('curriculum_frameworks').select('name_en, region').eq('id', body.framework_id).maybeSingle(),
      admin.from('curriculum_subjects').select('name_en').eq('id', body.subject_id).maybeSingle(),
      admin.from('curriculum_grade_levels').select('label_en').eq('id', body.grade_level_id).maybeSingle(),
    ]);

    if (!fw || !subj || !grade) {
      return new Response(JSON.stringify({ error: 'Framework, subject, or grade not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableKey) {
      return new Response(JSON.stringify({ error: 'AI gateway not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `You are a curriculum specialist. Generate 6 curriculum units for the following:
- Framework: ${fw.name_en} (${fw.region})
- Subject: ${subj.name_en}
- Grade level: ${grade.label_en}

For each unit, provide:
- title_en: short English title
- title_ar: short Arabic title
- short_description: 1-2 sentence overview
- estimated_minutes: integer (total study time, typically 300-900)
- difficulty_level: one of "beginner", "intermediate", "advanced"
- topics: array of 4-6 objects { en, ar } covering subtopics
- exam_topics: array of 3-5 strings of commonly tested exam topics

Return ONLY a JSON object: { "units": [ ... 6 units ordered by unit_number 1-6 ... ] }. No prose.`;

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You output strict JSON only.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error('AI gateway error', aiResp.status, errText);
      return new Response(JSON.stringify({ error: 'AI generation failed', detail: errText }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiJson = await aiResp.json();
    const content = aiJson?.choices?.[0]?.message?.content ?? '{}';
    let parsed: any;
    try {
      parsed = typeof content === 'string' ? JSON.parse(content) : content;
    } catch {
      return new Response(JSON.stringify({ error: 'AI returned invalid JSON' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const units = Array.isArray(parsed?.units) ? parsed.units : [];
    if (units.length === 0) {
      return new Response(JSON.stringify({ error: 'No units generated' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rows = units.slice(0, 8).map((u: any, idx: number) => ({
      framework_id: body.framework_id,
      subject_id: body.subject_id,
      grade_level_id: body.grade_level_id,
      unit_number: idx + 1,
      title_en: String(u.title_en ?? `Unit ${idx + 1}`),
      title_ar: u.title_ar ? String(u.title_ar) : null,
      short_description: u.short_description ? String(u.short_description) : null,
      estimated_minutes: Number.isFinite(u.estimated_minutes) ? Math.round(u.estimated_minutes) : null,
      difficulty_level: ['beginner', 'intermediate', 'advanced'].includes(u.difficulty_level)
        ? u.difficulty_level
        : 'intermediate',
      topics: Array.isArray(u.topics) ? u.topics : [],
      exam_topics: Array.isArray(u.exam_topics) ? u.exam_topics : [],
      verification_status: 'ai_generated',
      generation_model: 'google/gemini-2.5-flash',
      generated_at: new Date().toISOString(),
      confidence_score: 0.7,
    }));

    const { data: inserted, error: insertErr } = await admin
      .from('curriculum_units')
      .insert(rows)
      .select('*');

    if (insertErr) {
      console.error('Insert error', insertErr);
      return new Response(JSON.stringify({ error: 'Failed to save units', detail: insertErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ units: inserted, cached: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Unexpected error', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
