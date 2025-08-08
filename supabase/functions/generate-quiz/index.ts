
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, difficulty = 'medium', questionCount = 5, conversationHistory, gradeLevel } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create context from conversation history if provided
    let context = '';
    if (conversationHistory && conversationHistory.length > 0) {
      context = conversationHistory
        .map((msg: any) => `${msg.role}: ${msg.content}`)
        .join('\n');
    }

    const prompt = `Create a ${difficulty} difficulty quiz about "${topic}" for grade level "${gradeLevel || 'general'}" with ${questionCount} questions.
    ${context ? `Base the questions on this conversation context:\n${context}\n\n` : ''}
    Generate questions in this exact JSON format only (no markdown, no extra text):
    {
      "title": "Quiz about [topic]",
      "description": "Brief description of the quiz",
      "questions": [
        {
          "question": "Question text",
          "type": "multiple_choice",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct_answer": "Option A",
          "explanation": "Why this answer is correct"
        }
      ]
    }
    Mix question types: multiple_choice, true_false (options must be ["True","False"]) and short_answer (omit options). Ensure JSON is valid.`;

    async function callOpenAIWithRetry(retries = 2, delayMs = 1200): Promise<Response> {
      for (let attempt = 0; attempt <= retries; attempt++) {
        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You are an expert educator creating quiz questions. Always respond with valid JSON only.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.5,
          }),
        });
        if (resp.ok) return resp;
        if (resp.status === 429 && attempt < retries) {
          await new Promise(r => setTimeout(r, delayMs * (attempt + 1)));
          continue;
        }
        return resp;
      }
      // Should not reach here
      return new Response(null, { status: 500 });
    }

    const response = await callOpenAIWithRetry();

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${text}`);
    }

    const data = await response.json();
    let quizContent = data.choices?.[0]?.message?.content ?? '';
    // Strip markdown fences if any
    quizContent = quizContent.trim().replace(/^```json\n?|\n?```$/g, '');
    
    let quizData;
    try {
      quizData = JSON.parse(quizContent);
    } catch (parseError) {
      console.error('Failed to parse quiz JSON:', quizContent);
      throw new Error('Failed to generate valid quiz format');
    }

    return new Response(JSON.stringify(quizData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-quiz function:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
