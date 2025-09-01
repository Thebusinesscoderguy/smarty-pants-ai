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

    const prompt = `${languageInstruction}Take this educational lesson content and MASSIVELY expand it with extremely detailed explanations, extensive examples, and comprehensive depth. Transform this into a thorough, professional-level educational resource. For EVERY concept, definition, or section:

1. **Comprehensive Explanations**: Provide extensive, multi-paragraph explanations for each concept with detailed reasoning and context
2. **Multiple Worked Examples**: Include at least 3-5 detailed worked examples for each major concept, showing every step with explanations
3. **Step-by-Step Breakdowns**: Break down complex processes into detailed, numbered steps with explanations for why each step is necessary
4. **Historical Context**: Add relevant historical background, development of concepts, and key contributors to the field
5. **Visual Descriptions & Analogies**: Include detailed descriptions of diagrams, graphs, visual representations, and real-world analogies to help understanding
6. **Connections & Applications**: Extensively explain how concepts connect to other areas of mathematics and provide numerous real-world applications
7. **Common Misconceptions**: Address potential misunderstandings with detailed explanations of why they're wrong and how to correct them
8. **Practice Problems**: Include additional practice problems with complete solutions and explanations
9. **Advanced Extensions**: Add advanced applications, extensions, and connections to higher-level mathematics
10. **Conceptual Understanding**: Explain not just HOW to do something, but WHY it works and the underlying principles

Original Content:
${content}

INSTRUCTIONS FOR EXPANSION:
- Expand EVERY section to be at least 3-5 times longer than the original
- Add extensive mathematical rigor and detailed explanations
- Include comprehensive examples with full solutions and explanations
- Provide detailed background context and motivation for each concept
- Add numerous real-world applications and connections
- Include detailed visual descriptions and analogies
- Address common student difficulties and misconceptions
- Use proper LaTeX notation: $$formula$$ for display math, $formula$ for inline math
- Maintain clear structure with detailed headings and subheadings
- Aim for university-level depth while remaining accessible

TARGET LENGTH: Transform this into a comprehensive 3000-4000 word educational resource that thoroughly teaches every aspect of the topic with extensive detail, examples, and explanations.`;

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
            content: `You are an expert educator who expands lesson content with comprehensive detail and depth.${language !== 'en' ? ` Always respond in ${getLanguageName(language)}.` : ''}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
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