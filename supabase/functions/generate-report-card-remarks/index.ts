// Generate professional principal/teacher remarks for a student report card.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

interface Body {
  student_name: string;
  term: string;
  subjects: { subject: string; avg: number }[];
  overall?: number;
  attendance_rate?: number | null;
  language?: 'en' | 'ar';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY missing');
    const body = (await req.json()) as Body;
    if (!body?.student_name) {
      return new Response(JSON.stringify({ error: 'student_name required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const lang = body.language === 'ar' ? 'Arabic' : 'English';
    const subjectsText = (body.subjects || []).map(s => `${s.subject}: ${s.avg}%`).join(', ') || 'no recorded grades';
    const prompt = `You are a school principal writing a brief professional remark for a student report card.
Student: ${body.student_name}
Term: ${body.term}
Subjects: ${subjectsText}
Overall average: ${body.overall ?? 'n/a'}%
Attendance: ${body.attendance_rate ?? 'n/a'}%

Write 2-3 sentences in ${lang}. Be encouraging but honest. Mention one strength and one area for growth based on the data. No greetings, no signature. Return ONLY the remark text.`;

    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (res.status === 429) return new Response(JSON.stringify({ error: 'Rate limit' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (res.status === 402) return new Response(JSON.stringify({ error: 'AI credits exhausted' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (!res.ok) throw new Error(`AI gateway ${res.status}`);
    const data = await res.json();
    const remarks = (data.choices?.[0]?.message?.content ?? '').trim();
    return new Response(JSON.stringify({ remarks }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('generate-report-card-remarks error', e);
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
