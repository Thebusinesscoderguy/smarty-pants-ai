// Weekly digest email to parents. Cron-invoked Fridays.
// Optional ?parent_id=<uuid> for "send me a preview" calls (auth required).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend';
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

function buildHtml(parentName: string, children: any[]): string {
  const childBlocks = children.map(c => `
    <div style="margin:24px 0;padding:20px;background:#fff7ed;border-radius:12px;border-left:4px solid #f97316;">
      <h2 style="margin:0 0 12px;color:#1f2937;font-size:18px;">${c.name}</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#6b7280;">📚 Lessons completed</td><td style="text-align:right;font-weight:600;">${c.lessons}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">✅ Quizzes taken</td><td style="text-align:right;font-weight:600;">${c.quizzes} (avg ${c.avgScore}%)</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">💪 Top strength</td><td style="text-align:right;font-weight:600;">${c.strength || '—'}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">🎯 Focus area</td><td style="text-align:right;font-weight:600;">${c.weakness || '—'}</td></tr>
      </table>
    </div>`).join('');

  return `<!doctype html><html><body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;">
    <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
      <div style="text-align:center;margin-bottom:32px;">
        <h1 style="color:#f97316;margin:0;font-size:28px;">Teachly</h1>
        <p style="color:#6b7280;margin:8px 0 0;">Your child's week at a glance</p>
      </div>
      <p style="color:#1f2937;font-size:16px;">Hi ${parentName},</p>
      <p style="color:#4b5563;">Here's how your ${children.length === 1 ? 'child did' : 'children did'} this week on Teachly:</p>
      ${childBlocks}
      <div style="text-align:center;margin:32px 0;">
        <a href="https://teachlyai.com/family-hub" style="background:#f97316;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">View full dashboard →</a>
      </div>
      <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:32px;">
        You're receiving this because weekly digests are enabled. <a href="https://teachlyai.com/settings" style="color:#9ca3af;">Manage preferences</a>
      </p>
    </div></body></html>`;
}

async function buildChildSummary(supabase: any, childUserId: string, childName: string) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [progressRes, attemptsRes, analyticsRes] = await Promise.all([
    supabase.from('user_progress').select('id', { count: 'exact', head: true })
      .eq('user_id', childUserId).eq('status', 'completed').gte('updated_at', since),
    supabase.from('quiz_attempts').select('score, total_possible')
      .eq('user_id', childUserId).gte('completed_at', since),
    supabase.from('learning_analytics').select('topic_name, strength_score')
      .eq('user_id', childUserId).order('last_updated', { ascending: false }).limit(50),
  ]);

  const lessons = progressRes.count ?? 0;
  const attempts = attemptsRes.data ?? [];
  const quizzes = attempts.length;
  const avgScore = quizzes > 0
    ? Math.round(attempts.reduce((s: number, a: any) => s + (a.total_possible ? (a.score / a.total_possible) * 100 : 0), 0) / quizzes)
    : 0;

  const analytics = analyticsRes.data ?? [];
  const strength = analytics.filter((a: any) => a.strength_score >= 0.75).sort((a: any, b: any) => b.strength_score - a.strength_score)[0]?.topic_name;
  const weakness = analytics.filter((a: any) => a.strength_score < 0.5).sort((a: any, b: any) => a.strength_score - b.strength_score)[0]?.topic_name;

  return { name: childName, lessons, quizzes, avgScore, strength, weakness };
}

async function sendDigestForParent(supabase: any, parentId: string): Promise<boolean> {
  // Get parent profile + email
  const { data: { user: parentUser } } = await supabase.auth.admin.getUserById(parentId);
  if (!parentUser?.email) return false;

  const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', parentId).maybeSingle();
  const parentName = profile?.display_name || 'there';

  // Get children via parent_child_relationships (child_id => profile)
  const { data: rels } = await supabase.from('parent_child_relationships').select('child_id').eq('parent_id', parentId);
  if (!rels?.length) return false;

  const childSummaries = [];
  for (const r of rels) {
    const { data: cp } = await supabase.from('profiles').select('display_name').eq('id', r.child_id).maybeSingle();
    childSummaries.push(await buildChildSummary(supabase, r.child_id, cp?.display_name || 'Your child'));
  }

  const html = buildHtml(parentName, childSummaries);
  const res = await fetch(`${GATEWAY_URL}/emails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'X-Connection-Api-Key': RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: 'Teachly <noreply@teachlyai.com>',
      to: [parentUser.email],
      subject: `📚 ${childSummaries.length === 1 ? `${childSummaries[0].name}'s` : "Your kids'"} week on Teachly`,
      html,
    }),
  });

  if (!res.ok) {
    console.error('resend error', await res.text());
    return false;
  }

  await supabase.from('parent_email_preferences')
    .upsert({ parent_id: parentId, last_digest_sent_at: new Date().toISOString() }, { onConflict: 'parent_id' });
  return true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const url = new URL(req.url);
  const previewParentId = url.searchParams.get('parent_id');

  // Preview mode: single parent (used by "send me a preview" button)
  if (previewParentId) {
    const ok = await sendDigestForParent(supabase, previewParentId);
    return new Response(JSON.stringify({ sent: ok }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: ok ? 200 : 500,
    });
  }

  // Cron mode: every parent with digests enabled
  // Find all parents (users with role 'parent') with prefs enabled or no prefs row yet
  const { data: parentRoles } = await supabase.from('user_roles').select('user_id').eq('role', 'parent');
  const parentIds = (parentRoles ?? []).map((r: any) => r.user_id);

  const { data: optedOut } = await supabase.from('parent_email_preferences')
    .select('parent_id').eq('weekly_digest_enabled', false);
  const optedOutSet = new Set((optedOut ?? []).map((p: any) => p.parent_id));

  let sent = 0;
  for (const pid of parentIds) {
    if (optedOutSet.has(pid)) continue;
    const ok = await sendDigestForParent(supabase, pid);
    if (ok) sent++;
  }

  return new Response(JSON.stringify({ sent, total: parentIds.length }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
