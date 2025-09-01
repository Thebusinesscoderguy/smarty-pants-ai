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
    const { content, language = 'en' } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!content) {
      throw new Error('Content is required');
    }

    // Language instruction for AI
    const languageInstruction = language === 'en' ? '' : `Please provide all expanded content in ${getLanguageName(language)}. `;

    const prompt = `${languageInstruction}Take this educational lesson content and significantly expand it with much more detailed explanations, examples, and depth. For each concept, definition, or section:

1. Add comprehensive explanations with multiple examples
2. Include step-by-step breakdowns where applicable
3. Provide additional context and background information
4. Add more worked examples with complete solutions
5. Include visual descriptions and analogies
6. Expand on connections between concepts
7. Add more real-world applications and examples

Original Content:
${content}

Expand this content to be much more detailed and comprehensive while maintaining the same structure and format. Make each section significantly longer with in-depth explanations. Use LaTeX notation for any mathematical expressions: $$formula$$ for display math, $formula$ for inline math.

The goal is to provide a much deeper, more thorough understanding of each topic covered.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          {
            role: 'system',
            content: `You are an expert educator who expands lesson content with comprehensive detail and depth.${language !== 'en' ? ` Always respond in ${getLanguageName(language)}.` : ''}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response data:', JSON.stringify(data, null, 2));
    
    const expandedContent = data.choices?.[0]?.message?.content;

    if (!expandedContent) {
      console.error('No expanded content in response. Full response:', data);
      throw new Error(`No expanded content generated from OpenAI. Response: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ expandedContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in expand-lesson-detail:', error);
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