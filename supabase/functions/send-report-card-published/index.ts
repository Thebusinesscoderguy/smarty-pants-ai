import { buildCorsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Email parents that their child's report card is available.
// SECURITY (CORS): origin allowlist via shared helper (was wildcard '*').
let corsHeaders = buildCorsHeaders();

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

interface Body {
  school_id: string;
  term: string;
  academic_year: string;
}

Deno.serve(async (req) => {
  corsHeaders = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY missing');
    const { school_id, term, academic_year } = (await req.json()) as Body;
    if (!school_id || !term || !academic_year) {
      return new Response(JSON.stringify({ error: 'school_id, term, academic_year required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: school } = await supabase.from('school_accounts').select('school_name').eq('id', school_id).maybeSingle();
    const schoolName = school?.school_name || 'Your school';

    const { data: cards } = await supabase
      .from('report_cards')
      .select('student_id, data')
      .eq('school_id', school_id)
      .eq('term', term)
      .eq('academic_year', academic_year)
      .eq('published', true);

    const studentIds = (cards || []).map((c: any) => c.student_id);
    if (!studentIds.length) {
      return new Response(JSON.stringify({ sent: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: rels } = await supabase
      .from('parent_child_relationships')
      .select('parent_id, child_id')
      .in('child_id', studentIds);

    const parentIds = Array.from(new Set((rels || []).map((r: any) => r.parent_id).filter(Boolean)));
    if (!parentIds.length) {
      return new Response(JSON.stringify({ sent: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get parent emails from auth.users via profiles (no direct auth.users access; rely on profiles.email if present, else skip)
    const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', parentIds);
    const nameById = new Map((profiles || []).map((p: any) => [p.id, p.display_name || 'Parent']));

    // Need emails — use admin API
    let sent = 0;
    for (const pid of parentIds) {
      const { data: userRes } = await (supabase as any).auth.admin.getUserById(pid);
      const email = userRes?.user?.email;
      if (!email) continue;
      const childCount = (rels || []).filter((r: any) => r.parent_id === pid).length;
      const html = `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto">
          <h2 style="color:#f97316">${schoolName}</h2>
          <p>Hi ${nameById.get(pid)},</p>
          <p>The <strong>${term} ${academic_year}</strong> report card${childCount > 1 ? 's' : ''} for your child${childCount > 1 ? 'ren' : ''} ${childCount > 1 ? 'are' : 'is'} now available.</p>
          <p><a href="https://teachlyai.com/report-cards" style="background:#f97316;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">View Report Card</a></p>
          <p style="color:#666;font-size:12px">Sent by ${schoolName} via Teachly</p>
        </div>`;
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: 'Teachly <noreply@teachlyai.com>',
          to: email,
          subject: `${schoolName} — ${term} ${academic_year} Report Card Available`,
          html,
        }),
      });
      if (r.ok) sent++;
    }

    return new Response(JSON.stringify({ sent, parents: parentIds.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('send-report-card-published error', e);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred. Please try again.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
