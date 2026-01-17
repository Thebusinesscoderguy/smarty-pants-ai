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
    const { 
      topic, 
      difficulty, 
      gradeLevel, 
      language,
      questionNumber,
      previousQuestions = [],
      performanceHistory = []
    } = await req.json();
    
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
    const languageInstruction = targetLanguage 
      ? `\n\n🔴 CRITICAL: Generate the question in ${targetLanguage}. Every single word must be in ${targetLanguage}.`
      : '';

    // Build context of previous questions to avoid repetition
    const previousQuestionsContext = previousQuestions.length > 0
      ? `\n\nAVOID these previously asked questions:\n${previousQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}`
      : '';

    // Build performance context for adaptive difficulty hints
    let performanceContext = '';
    if (performanceHistory.length > 0) {
      const recentPerformance = performanceHistory.slice(-5);
      const correctCount = recentPerformance.filter((p: any) => p.correct).length;
      const avgTimeMs = recentPerformance.reduce((acc: number, p: any) => acc + (p.timeMs || 0), 0) / recentPerformance.length;
      
      performanceContext = `\n\nStudent Performance Context:
- Recent accuracy: ${correctCount}/${recentPerformance.length} correct
- Average response time: ${Math.round(avgTimeMs / 1000)}s
- Current difficulty: ${difficulty}
- Adjust question complexity accordingly to challenge but not overwhelm.`;
    }

    const difficultyDescriptions: Record<string, string> = {
      'very_easy': 'Basic recall, simple facts, straightforward questions. Suitable for beginners or those struggling.',
      'easy': 'Simple concepts with minimal complexity. Clear and direct questions.',
      'medium': 'Moderate complexity requiring understanding and application of concepts.',
      'hard': 'Complex questions requiring analysis, synthesis, or multi-step reasoning.',
      'very_hard': 'Advanced questions requiring deep understanding, critical thinking, and expert knowledge.'
    };

    const prompt = `Generate ONE ${difficulty} difficulty question about "${topic}" for ${gradeLevel} level.${languageInstruction}

Difficulty Description: ${difficultyDescriptions[difficulty] || difficultyDescriptions['medium']}
${previousQuestionsContext}
${performanceContext}

This is question #${questionNumber}. Make it UNIQUE and DIFFERENT from any previous questions.

Respond with ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "question": "The question text",
  "type": "multiple_choice",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_answer": "Option A",
  "explanation": "Brief explanation of why this is correct",
  "difficulty": "${difficulty}",
  "points": ${difficulty === 'very_easy' ? 1 : difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : difficulty === 'hard' ? 4 : 5}
}

For true/false questions, use options: ["True", "False"]
Mix question types appropriately for the topic and difficulty.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: `You are an expert educator creating adaptive quiz questions. Generate questions that match the specified difficulty level precisely. Always respond with valid JSON only.${languageInstruction}` 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${text}`);
    }

    const data = await response.json();
    let questionContent = data.choices?.[0]?.message?.content ?? '';
    questionContent = questionContent.trim().replace(/^```json\n?|\n?```$/g, '');
    
    let questionData;
    try {
      questionData = JSON.parse(questionContent);
    } catch (parseError) {
      console.error('Failed to parse question JSON:', questionContent);
      throw new Error('Failed to generate valid question format');
    }

    return new Response(JSON.stringify(questionData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-adaptive-question function:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
