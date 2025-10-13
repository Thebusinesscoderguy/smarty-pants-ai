import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuestEvent {
  id: string;
  user_id: string;
  source: string;
  event_type: string;
  subject_id: string | null;
  score: number | null;
  payload: any;
  status: string;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  target_value: number;
  subject_id: string | null;
  requirements: any;
}

interface QuestDecision {
  quest_id: string;
  increment: number;
  reason: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } }
    );

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
    }
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey
    );

    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { eventId } = await req.json();
    console.log('Processing event:', eventId);

    // Fetch event
    const { data: event, error: eventError } = await supabaseUser
      .from('quest_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      console.error('Event not found:', eventError);
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if already classified
    if (event.status !== 'pending') {
      console.log('Event already processed:', event.status);
      return new Response(JSON.stringify({ status: event.status, message: 'Already processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch active quests for user
    const nowIso = new Date().toISOString();
    const { data: quests, error: questsError } = await supabaseUser
      .from('quests')
      .select('*')
      .eq('is_active', true)
      .or(`created_by.eq.system,created_by_id.eq.${event.user_id}`)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`);

    if (questsError) {
      console.error('Error fetching quests:', questsError);
      throw questsError;
    }

    console.log(`Found ${quests?.length || 0} active quests`);

    // Build AI prompt
    const systemPrompt = `You are a quest progress adjudicator. You decide if a user's action advances any active quests.
Be strict and require semantic relevance. Only increment quests when the action clearly matches the quest requirements.
Consider: subject match, activity type, score thresholds, and semantic intent.`;

    const userPrompt = `Event Details:
- Source: ${event.source}
- Event Type: ${event.event_type}
- Subject ID: ${event.subject_id || 'none'}
- Score: ${event.score || 'N/A'}
- Payload: ${JSON.stringify(event.payload)}

Active Quests:
${quests?.map(q => `
- ID: ${q.id}
- Title: ${q.title}
- Description: ${q.description}
- Type: ${q.type}
- Difficulty: ${q.difficulty}
- Target: ${q.target_value}
- Subject ID: ${q.subject_id || 'any'}
- Requirements: ${JSON.stringify(q.requirements || {})}
`).join('\n')}

Determine which quests (if any) should be incremented and by how much.`;

    // Call Lovable AI Gateway with tool calling
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'apply_quest_progress',
            description: 'Apply progress increments to matching quests',
            parameters: {
              type: 'object',
              properties: {
                decisions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      quest_id: { type: 'string', description: 'UUID of the quest' },
                      increment: { type: 'number', description: 'Amount to increment (usually 1)' },
                      reason: { type: 'string', description: 'Why this quest matches' }
                    },
                    required: ['quest_id', 'increment', 'reason']
                  }
                }
              },
              required: ['decisions']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'apply_quest_progress' } }
      }),
    });

    if (aiResponse.status === 429) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (aiResponse.status === 402) {
      return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your Lovable AI workspace.' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response:', JSON.stringify(aiData, null, 2));

    // Parse tool call
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.log('No tool call in response - no matching quests');
      
      // Create classification record
      const { data: classification } = await supabaseAdmin
        .from('ai_event_classifications')
        .insert({
          event_id: eventId,
          model: 'google/gemini-2.5-flash',
          verdict: 'no_match',
          matched_quests: [],
          increments: {},
          reason: 'AI determined no quests match this event'
        })
        .select()
        .single();

      // Update event status
      await supabaseAdmin
        .from('quest_events')
        .update({
          status: 'ignored',
          classification_id: classification.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', eventId);

      return new Response(JSON.stringify({ status: 'ignored', reason: 'No matching quests' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const decisions: QuestDecision[] = JSON.parse(toolCall.function.arguments).decisions;
    console.log('Quest decisions:', decisions);

    if (!decisions || decisions.length === 0) {
      // Same as no matches
      const { data: classification } = await supabaseAdmin
        .from('ai_event_classifications')
        .insert({
          event_id: eventId,
          model: 'google/gemini-2.5-flash',
          verdict: 'no_match',
          matched_quests: [],
          increments: {},
          reason: 'No quest decisions made'
        })
        .select()
        .single();

      await supabaseAdmin
        .from('quest_events')
        .update({
          status: 'ignored',
          classification_id: classification.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', eventId);

      return new Response(JSON.stringify({ status: 'ignored', reason: 'No decisions' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create classification record
    const { data: classification } = await supabaseAdmin
      .from('ai_event_classifications')
      .insert({
        event_id: eventId,
        model: 'google/gemini-2.5-flash',
        verdict: 'match',
        matched_quests: decisions.map(d => d.quest_id),
        increments: decisions.reduce((acc, d) => ({ ...acc, [d.quest_id]: d.increment }), {}),
        reason: decisions.map(d => `${d.quest_id}: ${d.reason}`).join('; ')
      })
      .select()
      .single();

    // Apply each decision
    for (const decision of decisions) {
      // Create event link
      await supabaseAdmin
        .from('quest_event_links')
        .upsert({
          event_id: eventId,
          quest_id: decision.quest_id,
          increment: decision.increment,
          applied: true,
          applied_at: new Date().toISOString()
        }, { onConflict: 'event_id,quest_id' });

      // Update quest progress
      const { data: progress } = await supabaseAdmin
        .from('user_quest_progress')
        .select('*')
        .eq('user_id', event.user_id)
        .eq('quest_id', decision.quest_id)
        .maybeSingle();

      const quest = quests?.find(q => q.id === decision.quest_id);
      if (!quest) continue;

      if (progress) {
        const newValue = progress.current_value + decision.increment;
        const completed = newValue >= quest.target_value;
        
        await supabaseAdmin
          .from('user_quest_progress')
          .update({
            current_value: newValue,
            completed,
            completed_at: completed ? new Date().toISOString() : progress.completed_at,
            status: completed ? 'completed' : progress.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', progress.id);

        console.log(`Updated quest ${decision.quest_id}: ${progress.current_value} -> ${newValue}/${quest.target_value}`);
      } else {
        // Create progress
        const completed = decision.increment >= quest.target_value;
        await supabaseAdmin
          .from('user_quest_progress')
          .insert({
            user_id: event.user_id,
            quest_id: decision.quest_id,
            current_value: decision.increment,
            completed,
            completed_at: completed ? new Date().toISOString() : null,
            status: completed ? 'completed' : 'active'
          });

        console.log(`Created quest progress ${decision.quest_id}: ${decision.increment}/${quest.target_value}`);
      }
    }

    // Update event status
    await supabaseAdmin
      .from('quest_events')
      .update({
        status: 'classified',
        classification_id: classification.id,
        processed_at: new Date().toISOString()
      })
      .eq('id', eventId);

    return new Response(JSON.stringify({
      status: 'classified',
      decisions,
      message: `Applied ${decisions.length} quest increment(s)`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in classify-quest-event:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
