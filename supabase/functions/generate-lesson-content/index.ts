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
    const { topic, description, gradeLevel = 'high school', activities } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!topic) {
      throw new Error('Topic is required');
    }

    // Create a comprehensive lesson content prompt
    const prompt = `Create a comprehensive ${gradeLevel} level lesson about "${topic}".

Description: ${description}

Generate detailed educational content that actually teaches the subject matter. Include:

1. Clear explanations of key concepts
2. Step-by-step breakdowns of important processes
3. Real examples with worked solutions
4. Important formulas, definitions, or principles
5. Common misconceptions and how to avoid them
6. Visual descriptions where helpful (describe diagrams, graphs, etc.)

Make this a complete lesson that a student can learn from, not just instructions or activities. Write in clear, educational prose that explains the concepts thoroughly. Use headings and subheadings to organize the content well.

Format as markdown. Focus on teaching the actual subject matter with detailed explanations and examples.

Length: Aim for 800-1200 words of substantial educational content.`;

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
            content: 'You are an expert educator who creates comprehensive, detailed lesson content that actually teaches students the subject matter. Your lessons are thorough, well-explained, and educational.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content generated from OpenAI');
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