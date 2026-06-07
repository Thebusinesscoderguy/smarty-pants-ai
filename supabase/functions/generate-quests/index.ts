import { buildCorsHeaders } from "../_shared/cors.ts";
import { enforceIpRateLimit, rateLimitedResponse } from "../_shared/rateLimit.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

let corsHeaders = buildCorsHeaders();

serve(async (req) => {
  corsHeaders = buildCorsHeaders(req);
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // SECURITY (AI bill abuse): this endpoint is intentionally anonymous, so cap
  // each client IP to 3 requests/hour before doing any AI work.
  const { allowed } = await enforceIpRateLimit(req, 'generate-quests');
  if (!allowed) return rateLimitedResponse(corsHeaders);

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
    // SECURITY (sensitive logging): don't dump the full request body to logs;
    // it can contain user-supplied content/PII. Log only non-sensitive metadata.
    console.log('[generate-quests] Received request with keys:', Object.keys(body ?? {}));

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

    // Build prompt - quests MUST be tied to trackable platform activities
    const systemPrompt = `You are an educational quest designer. Generate engaging learning quests that are TRACKABLE within the platform.

IMPORTANT: All quests MUST be tied to one of these trackable activities:
1. lesson_completed - Complete lessons/study plan days
2. quiz_completed - Complete quizzes (can require minimum score)
3. test_completed - Complete tests (can require minimum score)

Always respond with valid JSON containing a "quests" array.
Each quest must have these exact fields:
- title: string (catchy, action-oriented, mention the activity type)
- description: string (clear goal tied to platform activity, 1-2 sentences)
- type: "${rawType}" (use exactly this value)
- difficulty: "${rawDifficulty}" (use exactly this value)
- target_value: number (how many times to do the activity, 1-10 based on difficulty)
- is_active: true
- requirements: object with trigger_type (one of: lesson_completed, quiz_completed, test_completed) and optionally min_percentage (50-100) for quiz/test quests

${language !== 'English' ? `Generate all content in ${language}.` : ''}`;

    const userPrompt = `Generate ${count} ${rawType} educational quests for ${subject} at ${gradeLevel} level with ${rawDifficulty} difficulty.

CRITICAL: Each quest must be trackable. Use these patterns:
- Lesson quests: "Complete X lessons" with trigger_type: "lesson_completed"
- Quiz quests: "Complete X quizzes" or "Score X% on quizzes" with trigger_type: "quiz_completed" and optional min_percentage
- Test quests: "Pass X tests" with trigger_type: "test_completed" and min_percentage

Return ONLY valid JSON in this exact format:
{
  "quests": [
    {
      "title": "Complete 3 Math Lessons",
      "description": "Finish 3 lessons in your study plan to master the basics",
      "type": "${rawType}",
      "difficulty": "${rawDifficulty}",
      "target_value": 3,
      "is_active": true,
      "requirements": {
        "trigger_type": "lesson_completed"
      }
    },
    {
      "title": "Quiz Champion: Score 80%+",
      "description": "Complete 2 quizzes with at least 80% score",
      "type": "${rawType}",
      "difficulty": "${rawDifficulty}",
      "target_value": 2,
      "is_active": true,
      "requirements": {
        "trigger_type": "quiz_completed",
        "min_percentage": 80
      }
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
      // SECURITY (info disclosure): do not forward the raw upstream provider
      // response (`details: errorText`) to the client. Keep it in server logs
      // only and return generic, non-revealing messages.
      if (openAIResponse.status === 401) {
        return new Response(
          JSON.stringify({ error: 'AI service is misconfigured. Please contact support.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (openAIResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded - please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'AI service temporarily unavailable. Please try again.' }),
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
    const msg = error instanceof Error ? error.message : 'Unexpected error occurred';
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
