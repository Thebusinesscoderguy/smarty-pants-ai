import { buildCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

let corsHeaders = buildCorsHeaders();

const STALE_MS = 8000;

Deno.serve(async (req) => {
  corsHeaders = buildCorsHeaders(req);
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
    const { session_id, tab_id } = body ?? {};
    if (!session_id || !tab_id) return json({ error: 'session_id and tab_id required' }, 400);

    const admin = createClient(supabaseUrl, serviceKey);

    // Verify session belongs to caller
    const { data: session } = await admin
      .from('exam_sessions')
      .select('id, user_id, status')
      .eq('id', session_id)
      .maybeSingle();
    if (!session || session.user_id !== userId) return json({ error: 'Forbidden' }, 403);

    const { data: lock } = await admin
      .from('exam_session_locks')
      .select('tab_id, last_seen_at')
      .eq('session_id', session_id)
      .maybeSingle();

    const now = Date.now();
    const lockTs = lock ? new Date(lock.last_seen_at).getTime() : 0;
    const stale = !lock || now - lockTs > STALE_MS;

    if (!lock || stale || lock.tab_id === tab_id) {
      // Take or refresh ownership
      await admin.from('exam_session_locks').upsert({
        session_id,
        user_id: userId,
        tab_id,
        last_seen_at: new Date().toISOString(),
      }, { onConflict: 'session_id' });
      return json({ owner: true, status: session.status });
    }

    return json({ owner: false, status: session.status });
  } catch (e: any) {
    return json({ error: 'An unexpected error occurred. Please try again.' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
