import { buildCorsHeaders } from "../_shared/cors.ts";

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

let corsHeaders = buildCorsHeaders();

serve(async (req) => {
  corsHeaders = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, subject, difficulty = 'medium', questionCount = 5, conversationHistory, gradeLevel, language, lessonContext } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    function getLanguageName(code: string): string {
      const languages: Record<string, string> = {
        'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German', 'it': 'Italian',
        'pt': 'Portuguese', 'ru': 'Russian', 'ja': 'Japanese', 'ko': 'Korean', 'zh': 'Chinese',
        'ar': 'Arabic', 'hi': 'Hindi', 'tr': 'Turkish', 'pl': 'Polish', 'nl': 'Dutch'
      };
      return languages[code] || 'English';
    }

    const targetLanguage = language && language !== 'en' ? getLanguageName(language) : null;

    // Create context from conversation history if provided
    let context = '';
    if (conversationHistory && conversationHistory.length > 0) {
      context = conversationHistory
        .map((msg: any) => `${msg.role}: ${msg.content}`)
        .join('\n');
    }

    const languageInstruction = targetLanguage
      ? `\n\n🔴 CRITICAL: Generate ALL quiz content (questions, options, answers, explanations) in ${targetLanguage}. Every single word must be in ${targetLanguage}.`
      : '';

    // Inject the teacher's subject when provided (some callers don't send it).
    const subjectClause = subject ? ` in the subject "${subject}"` : '';

    // Inject selected lesson content as grounding when provided (Phase 1 of the
    // curriculum system). Capped to protect the model's context/token budget.
    const trimmedLessonContext = typeof lessonContext === 'string'
      ? lessonContext.slice(0, 12000)
      : '';
    const groundingInstruction = trimmedLessonContext
      ? `\n\n🎯 GROUNDING (highest priority): Base the quiz STRICTLY on the following lesson content. Do NOT introduce facts, examples, or terminology that are not present in or directly implied by this material. If the requested number of questions cannot be supported by the content, generate fewer rather than inventing material.\n"""\n${trimmedLessonContext}\n"""`
      : '';

    const prompt = `Create a ${difficulty} difficulty quiz about "${topic}"${subjectClause} for grade level "${gradeLevel || 'general'}" with ${questionCount} questions.${languageInstruction}${groundingInstruction}
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
    
    For short_answer questions, ALWAYS include a sample correct answer in correct_answer field. Example:
    {
      "question": "Explain photosynthesis in your own words.",
      "type": "short_answer",
      "correct_answer": "Sample: Plants use sunlight, water and CO2 to make glucose and oxygen",
      "explanation": "Good answers should mention sunlight, water, carbon dioxide, glucose, and oxygen"
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
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: `You are an expert educator creating quiz questions. CRITICAL: If you encounter any conflicting information or are uncertain about factual accuracy for any question, skip that question and do not include it in the quiz. Only create questions with information you are confident is accurate and consistent.${languageInstruction} Always respond with valid JSON only.` },
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
      JSON.stringify({ error: 'An unexpected error occurred. Please try again.' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
