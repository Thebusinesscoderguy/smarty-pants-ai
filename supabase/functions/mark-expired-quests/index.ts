import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting daily quest expiration check...');

    // Call the database function to mark expired daily quests as failed
    const { error: markFailedError } = await supabase.rpc('mark_expired_daily_quests_as_failed');

    if (markFailedError) {
      console.error('Error marking expired quests as failed:', markFailedError);
      throw markFailedError;
    }

    // Get count of newly failed quests for logging
    const { data: failedQuests, error: countError } = await supabase
      .from('user_quest_progress')
      .select('id, quests(title, type)')
      .eq('status', 'failed')
      .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (countError) {
      console.error('Error counting failed quests:', countError);
    } else {
      console.log(`Marked ${failedQuests?.length || 0} daily quests as failed`);
    }

    // Also clean up very old failed quests (older than 7 days) to prevent data buildup
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error: cleanupError } = await supabase
      .from('user_quest_progress')
      .delete()
      .eq('status', 'failed')
      .lt('updated_at', sevenDaysAgo);

    if (cleanupError) {
      console.error('Error cleaning up old failed quests:', cleanupError);
    } else {
      console.log('Cleaned up old failed quests');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed quest expiration check. ${failedQuests?.length || 0} quests marked as failed.`,
        failedCount: failedQuests?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in mark-expired-quests function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});