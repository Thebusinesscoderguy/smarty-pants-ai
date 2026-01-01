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
    
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
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

    console.log('[generate-lesson-content] Calling Lovable AI for topic:', topic);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
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
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[generate-lesson-content] AI gateway error:', response.status, errorData);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[generate-lesson-content] AI response received');
    
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('[generate-lesson-content] No content in response:', data);
      throw new Error('No content generated from AI');
    }

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[generate-lesson-content] Error:', error);
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
