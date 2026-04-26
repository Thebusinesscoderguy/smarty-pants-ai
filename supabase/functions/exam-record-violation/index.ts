import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_TYPES = new Set([
  'tab_switch', 'window_blur', 'exit_fullscreen', 'inactivity', 'copy_paste', 'right_click',
]);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing auth' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: 'Invalid token' }, 401);
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const { session_id, type, details } = body ?? {};
    if (!session_id || typeof session_id !== 'string') return json({ error: 'session_id required' }, 400);
    if (!type || !ALLOWED_TYPES.has(type)) return json({ error: 'Invalid violation type' }, 400);

    const admin = createClient(supabaseUrl, serviceKey);

    // Verify session ownership + active state + load threshold/action
    const { data: session } = await admin
      .from('exam_sessions')
      .select('id, user_id, quiz_id, status, violation_count')
      .eq('id', session_id)
      .maybeSingle();
    if (!session || session.user_id !== userId) return json({ error: 'Forbidden' }, 403);
    if (session.status !== 'in_progress') return json({ error: 'Session not active' }, 400);

    const { data: test } = await admin
      .from('tests')
      .select('violation_threshold, violation_action')
      .eq('id', session.quiz_id)
      .maybeSingle();

    const threshold = test?.violation_threshold ?? 3;
    const action = test?.violation_action ?? 'flag';

    // Insert violation
    const { error: vErr } = await admin.from('exam_violations').insert({
      session_id,
      type,
      details: details ?? {},
    });
    if (vErr) return json({ error: vErr.message }, 500);

    const newCount = (session.violation_count ?? 0) + 1;
    const flagged = newCount >= threshold;

    await admin.from('exam_sessions').update({
      violation_count: newCount,
      flagged,
    }).eq('id', session_id);

    return json({
      violation_count: newCount,
      threshold,
      flagged,
      should_auto_submit: flagged && action === 'auto_submit',
    });
  } catch (e: any) {
    return json({ error: e?.message || 'Server error' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
