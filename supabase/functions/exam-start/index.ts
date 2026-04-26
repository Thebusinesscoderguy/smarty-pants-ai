import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const { test_id, tab_id } = body ?? {};
    if (!test_id || typeof test_id !== 'string') return json({ error: 'test_id required' }, 400);
    if (!tab_id || typeof tab_id !== 'string') return json({ error: 'tab_id required' }, 400);

    const admin = createClient(supabaseUrl, serviceKey);

    // Re-verify assignment server-side
    const { data: assigned, error: aErr } = await admin.rpc('is_test_assigned_to_student', {
      _test_id: test_id, _student_id: userId,
    });
    if (aErr) return json({ error: aErr.message }, 500);
    if (!assigned) return json({ error: 'You are not assigned to this exam.' }, 403);

    // Load test
    const { data: test, error: tErr } = await admin
      .from('tests')
      .select('id, time_limit_minutes, assessment_mode')
      .eq('id', test_id)
      .maybeSingle();
    if (tErr || !test) return json({ error: 'Test not found' }, 404);
    if (test.assessment_mode !== 'exam') return json({ error: 'Not an exam' }, 400);

    // Compute total points from questions
    const { data: qs } = await admin
      .from('test_questions')
      .select('points')
      .eq('test_id', test_id);
    const totalPoints = (qs ?? []).reduce((s: number, q: any) => s + (q.points ?? 1), 0);

    // Reuse an existing in_progress session if it exists (not expired)
    const { data: existing } = await admin
      .from('exam_sessions')
      .select('id, start_time, time_limit, status')
      .eq('user_id', userId)
      .eq('quiz_id', test_id)
      .eq('status', 'in_progress')
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    let session = existing;
    if (!session) {
      const { data: created, error: cErr } = await admin
        .from('exam_sessions')
        .insert({
          user_id: userId,
          quiz_id: test_id,
          time_limit: test.time_limit_minutes,
          total_points: totalPoints,
          status: 'in_progress',
        })
        .select('id, start_time, time_limit, status')
        .single();
      if (cErr) return json({ error: cErr.message }, 500);
      session = created;
    }

    // Claim the lock for this tab
    const { error: lockErr } = await admin
      .from('exam_session_locks')
      .upsert({
        session_id: session.id,
        user_id: userId,
        tab_id,
        last_seen_at: new Date().toISOString(),
      }, { onConflict: 'session_id' });
    if (lockErr) return json({ error: lockErr.message }, 500);

    return json({
      session_id: session.id,
      start_time: session.start_time,
      time_limit_minutes: session.time_limit,
      total_points: totalPoints,
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
