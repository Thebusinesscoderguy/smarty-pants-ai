// High-accuracy curriculum units backfill.
// Strategy: two-pass generation + cross-verification with GPT-4o for max accuracy.
// Idempotent: skips (framework, grade, subject) combos that already have units.
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const PRIMARY_MODEL = "gpt-4o-2024-11-20";
const VERIFY_MODEL = "gpt-4o-2024-11-20";

interface UnitDraft {
  unit_number: number;
  title_en: string;
  title_ar: string;
  description: string;
  topics: { en: string; ar: string }[];
  source_reference?: string;
  confidence?: number;
}

function buildPrompt(framework: string, region: string, grade: string, subject: string, code?: string | null) {
  return `You are a curriculum specialist with deep knowledge of official syllabi worldwide.
Produce the OFFICIAL unit/chapter structure for:

Framework: ${framework}${code ? ` (code ${code})` : ""}
Region: ${region}
Grade: ${grade}
Subject: ${subject}

Rules:
- Return ONLY units that appear in the OFFICIAL published syllabus / textbook table of contents.
- If this is a regional Ministry of Education curriculum (Saudi MOE, UAE MOE, etc.), use the EXACT chapter titles as they appear in the official ministry textbook for that grade.
- Provide both English and Arabic titles. For Arabic-medium curricula (Saudi, UAE, Kuwait, Qatar MOE), the Arabic title is the AUTHORITATIVE one — translate to English.
- 6-12 units typical. Each unit gets 3-6 specific topics (not generic — actual sub-chapters).
- Include a source_reference: e.g. "Cambridge IGCSE Mathematics 0580 syllabus 2025-2027" or "Saudi MOE Math Grade 10 textbook 1445H, Chapter list".
- Set confidence 0.0-1.0 honestly. Use <0.7 if you are not certain of the official structure.
- If you genuinely don't know the official structure, return an empty units array — do NOT fabricate.

Return STRICT JSON:
{
  "source_reference": "string",
  "confidence": 0.0,
  "units": [
    {
      "unit_number": 1,
      "title_en": "...",
      "title_ar": "...",
      "description": "1-sentence summary",
      "topics": [{"en":"...","ar":"..."}, ...]
    }
  ]
}`;
}

function buildVerifyPrompt(framework: string, grade: string, subject: string, draft: any) {
  return `You are auditing a curriculum unit list for accuracy against the OFFICIAL syllabus.

Framework: ${framework}
Grade: ${grade}
Subject: ${subject}

Draft to verify:
${JSON.stringify(draft, null, 2)}

Tasks:
1. Remove any unit that does NOT appear in the official syllabus.
2. Add any missing official units.
3. Correct any wrong titles to match official wording (English + Arabic).
4. Re-number sequentially starting at 1.
5. Lower confidence if you had to make significant changes.

Return the SAME JSON shape with the corrected list.`;
}

async function callOpenAI(prompt: string, model: string): Promise<any> {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });
  if (!r.ok) throw new Error(`OpenAI ${r.status}: ${await r.text()}`);
  const j = await r.json();
  return JSON.parse(j.choices[0].message.content);
}

async function generateUnitsForCombo(
  framework: string,
  region: string,
  grade: string,
  subject: string,
  code: string | null,
): Promise<{ units: UnitDraft[]; source_reference: string; confidence: number; verification_status: string }> {
  // Pass 1: draft
  const draft = await callOpenAI(buildPrompt(framework, region, grade, subject, code), PRIMARY_MODEL);
  if (!draft.units || draft.units.length === 0) {
    return { units: [], source_reference: draft.source_reference ?? "", confidence: 0, verification_status: "ai_generated" };
  }
  // Pass 2: cross-verify
  let verified = draft;
  let status = "ai_generated";
  try {
    verified = await callOpenAI(buildVerifyPrompt(framework, grade, subject, draft), VERIFY_MODEL);
    status = "ai_cross_verified";
  } catch (e) {
    console.warn("verify pass failed, using draft", e);
  }
  return {
    units: verified.units ?? draft.units ?? [],
    source_reference: verified.source_reference ?? draft.source_reference ?? "",
    confidence: verified.confidence ?? draft.confidence ?? 0.7,
    verification_status: status,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  let body: any = {};
  try { body = await req.json(); } catch { /* allow empty */ }

  // Optional scoping for per-slice regeneration from admin UI
  const { framework_id, grade_level_id, subject_id, force = false, limit = 5000 } = body;

  // Build the list of (framework, grade, subject) combos to process
  const { data: frameworks } = await supabase.from("curriculum_frameworks")
    .select("id,code,name_en,region").eq("is_active", true);
  const { data: grades } = await supabase.from("curriculum_grade_levels").select("id,framework_id,label_en");
  const { data: subjects } = await supabase.from("curriculum_subjects").select("id,framework_id,name_en,code");
  const { data: existing } = await supabase.from("curriculum_units")
    .select("framework_id,grade_level_id,subject_id");

  const have = new Set((existing ?? []).map(u => `${u.framework_id}|${u.grade_level_id}|${u.subject_id}`));

  type Combo = { fw: any; g: any; s: any };
  const combos: Combo[] = [];
  for (const fw of frameworks ?? []) {
    if (framework_id && fw.id !== framework_id) continue;
    const fwGrades = (grades ?? []).filter(x => x.framework_id === fw.id);
    const fwSubjects = (subjects ?? []).filter(x => x.framework_id === fw.id);
    for (const g of fwGrades) {
      if (grade_level_id && g.id !== grade_level_id) continue;
      for (const s of fwSubjects) {
        if (subject_id && s.id !== subject_id) continue;
        const key = `${fw.id}|${g.id}|${s.id}`;
        if (!force && have.has(key)) continue;
        combos.push({ fw, g, s });
      }
    }
  }

  const todo = combos.slice(0, limit);
  const results = { processed: 0, skipped_no_units: 0, inserted: 0, errors: [] as string[], total_combos: combos.length };

  for (const { fw, g, s } of todo) {
    try {
      console.log(`[backfill] ${fw.name_en} | ${g.label_en} | ${s.name_en}`);
      const out = await generateUnitsForCombo(fw.name_en, fw.region, g.label_en, s.name_en, s.code);

      if (out.units.length === 0) {
        results.skipped_no_units++;
        continue;
      }

      // If force, delete existing non-custom units for this slice first
      if (force) {
        await supabase.from("curriculum_units")
          .delete()
          .match({ framework_id: fw.id, grade_level_id: g.id, subject_id: s.id, is_custom: false });
      }

      const rows = out.units.map((u, i) => ({
        framework_id: fw.id,
        grade_level_id: g.id,
        subject_id: s.id,
        unit_number: u.unit_number ?? i + 1,
        title_en: u.title_en,
        title_ar: u.title_ar ?? null,
        description: u.description ?? null,
        topics: u.topics ?? [],
        is_custom: false,
        verification_status: out.verification_status,
        confidence_score: out.confidence,
        source_reference: out.source_reference,
        generation_model: PRIMARY_MODEL,
        generated_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from("curriculum_units").insert(rows);
      if (error) throw error;
      results.inserted += rows.length;
      results.processed++;
    } catch (e: any) {
      console.error("combo failed", fw.name_en, g.label_en, s.name_en, e);
      results.errors.push(`${fw.name_en}/${g.label_en}/${s.name_en}: ${e.message ?? e}`);
    }
  }

  return new Response(JSON.stringify(results), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
