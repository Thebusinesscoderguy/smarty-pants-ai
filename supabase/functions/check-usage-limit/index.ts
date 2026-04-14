import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LIMITS: Record<string, number> = {
  quiz: 5,
  study_plan: 3,
  presentation: 2,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { feature } = await req.json();
    if (!feature || !LIMITS[feature]) {
      return new Response(JSON.stringify({ error: 'Invalid feature' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ allowed: true, remaining: LIMITS[feature] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ allowed: true, remaining: LIMITS[feature] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user has a school subscription (unlimited)
    const { data: school } = await supabase
      .from('school_accounts')
      .select('id')
      .eq('admin_user_id', user.id)
      .eq('is_active', true)
      .limit(1);
    
    if (school && school.length > 0) {
      return new Response(JSON.stringify({ allowed: true, remaining: 999, unlimited: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);
    const periodStartStr = periodStart.toISOString().split('T')[0];

    // Get or create usage record
    const { data: usage } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', user.id)
      .eq('feature', feature)
      .eq('period_start', periodStartStr)
      .single();

    const currentCount = usage?.count || 0;
    const limit = LIMITS[feature];
    const allowed = currentCount < limit;
    const remaining = Math.max(0, limit - currentCount);

    return new Response(JSON.stringify({ allowed, remaining, limit, current: currentCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
