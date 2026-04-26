import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { finalizeSession } from "./finalize.ts";

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
    const { session_id, answers, auto } = body ?? {};
    if (!session_id || typeof session_id !== 'string') return json({ error: 'session_id required' }, 400);
    if (!Array.isArray(answers)) return json({ error: 'answers must be an array' }, 400);

    const admin = createClient(supabaseUrl, serviceKey);
    const result = await finalizeSession({
      admin, userId, sessionId: session_id, submitted: answers, auto: !!auto,
      callerIsSystem: false, supabaseUrl, anonKey, authHeader,
    });
    return json(result.body, result.status);
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
