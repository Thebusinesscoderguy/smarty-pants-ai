
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This function extracts quiz questions from an uploaded image/PDF using OpenAI Vision
// Returns JSON in the same shape as generate-quiz
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileBase64, contentType, difficulty = 'medium', questionCount = 10, gradeLevel, mode = 'extract', difficultyVariant = 'same' } = await req.json();

    if (!fileBase64 || !contentType) {
      return new Response(JSON.stringify({ error: 'fileBase64 and contentType are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const dataUrl = `data:${contentType};base64,${fileBase64}`;

    const modeInstructions = mode === 'similar'
      ? 'Generate a new quiz with novel questions inspired by the document. Do not copy text verbatim. Use similar concepts and styles, and vary numbers/context while keeping learning objectives aligned.'
      : 'Extract the questions that actually appear in the document as faithfully as possible.';

    const difficultyInstructions = difficultyVariant === 'easier'
      ? 'Adjust to be slightly easier than the source (simpler wording, clearer contexts, more obvious distractors).'
      : difficultyVariant === 'harder'
      ? 'Adjust to be slightly harder than the source (multi-step reasoning, trickier distractors, deeper analysis).'
      : 'Match the source difficulty level overall.';

    const systemPrompt = `You are an expert educator and exam parser.
${modeInstructions}
${difficultyInstructions}

When building the quiz:
- Identify each question and its type.
- If a question is True/False, use type "true_false" and options ["True","False"].
- If the question is short answer, set type "short_answer" and omit options.
- Prefer multiple_choice where appropriate with 3-5 options and ONE correct answer.
- Provide a concise explanation for each correct answer when possible.
- If the document includes answers/keys, use them to set correct_answer accurately.
- Keep difficulty as the provided value.
- Output VALID JSON ONLY with this exact schema: {
  "title": "Quiz about [topic]",
  "description": "Brief description",
  "questions": [
    {"question": "...", "type": "multiple_choice|true_false|short_answer", "options": ["A","B",...], "correct_answer": "...", "explanation": "..."}
  ]
}`;

    const userPrompt = `Use the attached document image as the source. Create about ${questionCount} ${difficulty} questions${gradeLevel ? ` for grade level ${gradeLevel}` : ''}. Return ONLY JSON as per the schema.`;

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              { type: 'image_url', image_url: { url: dataUrl } }
            ] as any
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      const status = resp.status;
      const message = status === 429
        ? 'Rate limit reached. Please wait and try again.'
        : (status === 401 || status === 403)
        ? 'OpenAI authentication failed. Check API key.'
        : `OpenAI API error (${status})`;
      return new Response(JSON.stringify({ error: message, details: text }), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ai = await resp.json();
    let content = ai.choices?.[0]?.message?.content ?? '';
    content = content.trim().replace(/^```json\n?|\n?```$/g, '');

    let quizData;
    try {
      quizData = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse extracted quiz JSON:', content);
      throw new Error('Failed to extract a valid quiz from the document');
    }

    return new Response(JSON.stringify(quizData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in extract-quiz function:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
