import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('[generate-quests] OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    console.log('[generate-quests] Received request body:', JSON.stringify(body));

    // Normalize parameters - Admin UI sends "questType", singular function expects "type"
    const subject = body.subject || 'General';
    const gradeLevel = body.gradeLevel || body.grade_level || 'middle school';
    const rawType = body.questType || body.type || 'daily';
    const rawDifficulty = body.difficulty || 'intermediate';
    const count = Math.min(Math.max(body.count || 3, 1), 10);
    const language = body.language || 'English';

    // Normalize difficulty: Admin uses "intermediate" but we want to keep it as-is
    // Map values if needed
    const difficultyMap: Record<string, string> = {
      'basic': 'easy',
      'intermediate': 'medium',
      'hard': 'hard',
      'easy': 'easy',
      'medium': 'medium'
    };
    const difficulty = difficultyMap[rawDifficulty] || 'medium';

    // Build prompt
    const systemPrompt = `You are an educational quest designer. Generate engaging learning quests for students.
Always respond with valid JSON containing a "quests" array.
Each quest must have these exact fields:
- title: string (catchy, action-oriented)
- description: string (clear learning goal, 1-2 sentences)
- type: "${rawType}" (use exactly this value)
- difficulty: "${rawDifficulty}" (use exactly this value from the request)
- target_value: number (1-10 based on difficulty)
- is_active: true

${language !== 'English' ? `Generate all content in ${language}.` : ''}`;

    const userPrompt = `Generate ${count} ${rawType} educational quests for ${subject} at ${gradeLevel} level with ${rawDifficulty} difficulty.

Return ONLY valid JSON in this exact format:
{
  "quests": [
    {
      "title": "Quest Title",
      "description": "What the student needs to do",
      "type": "${rawType}",
      "difficulty": "${rawDifficulty}",
      "target_value": 3,
      "is_active": true
    }
  ]
}`;

    console.log('[generate-quests] Calling OpenAI with model gpt-4o-mini');

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('[generate-quests] OpenAI error:', openAIResponse.status, errorText);
      
      if (openAIResponse.status === 401) {
        return new Response(
          JSON.stringify({ error: 'OpenAI authentication failed - check API key', details: errorText }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (openAIResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'OpenAI rate limit exceeded - try again later', details: errorText }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `OpenAI request failed: ${openAIResponse.status}`, details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIData = await openAIResponse.json();
    console.log('[generate-quests] OpenAI response received');

    const content = openAIData.choices?.[0]?.message?.content;
    if (!content) {
      console.error('[generate-quests] No content in OpenAI response:', JSON.stringify(openAIData));
      return new Response(
        JSON.stringify({ error: 'No content in AI response', details: openAIData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (parseError) {
      console.error('[generate-quests] Failed to parse AI response:', content);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response as JSON', raw: content }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const quests = parsedContent.quests || [];
    
    if (!Array.isArray(quests) || quests.length === 0) {
      console.error('[generate-quests] No quests array in response:', parsedContent);
      return new Response(
        JSON.stringify({ error: 'AI did not return a quests array', parsed: parsedContent }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[generate-quests] Successfully generated ${quests.length} quests`);

    return new Response(
      JSON.stringify({ quests }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[generate-quests] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
