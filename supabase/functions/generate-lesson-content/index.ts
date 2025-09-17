import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { topic, description, gradeLevel = 'high school', activities, language = 'en' } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!topic) {
      throw new Error('Topic is required');
    }

    // Language instruction for AI
    const languageInstruction = language === 'en' ? '' : `Please provide all content in ${getLanguageName(language)}. `;

    // Create a focused lesson content prompt
    const prompt = `${languageInstruction}Create a focused ${gradeLevel} level lesson about "${topic}".

Description: ${description}

Generate clear, practical learning content. Structure the lesson with these sections:

## 1. What You'll Learn
- Brief overview of the topic
- Key learning goals

## 2. Core Concepts
- Essential definitions with clear examples
- Step-by-step explanations
- Important formulas (use LaTeX: $$formula$$ for display, $formula$ for inline)
- Common mistakes to avoid
- Practice problems with solutions

## 3. Quick Summary
- Main points recap
- Key formulas and methods

For mathematical expressions, use proper LaTeX notation:
- Display math: $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$
- Inline math: $x^2 + y^2 = r^2$

Keep it focused on practical learning. Be concise but thorough. Aim for 800-1000 words maximum.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert educator who creates focused, practical lesson content for learning. Your lessons are clear, concise, and get straight to the point while still being educational.${language !== 'en' ? ` Always respond in ${getLanguageName(language)}.` : ''}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response data:', JSON.stringify(data, null, 2));
    
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in response. Full response:', data);
      throw new Error(`No content generated from OpenAI. Response: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in generate-lesson-content:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getLanguageName(code: string): string {
  const languages: Record<string, string> = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'tr': 'Turkish',
    'pl': 'Polish',
    'nl': 'Dutch'
  };
  return languages[code] || 'English';
}