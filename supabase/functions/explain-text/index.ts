import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, mode } = await req.json();

    if (!openAIApiKey) {
      return new Response(JSON.stringify({ error: 'Missing OPENAI_API_KEY' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid text' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = mode === 'summary'
      ? `You are an expert educator. Create a comprehensive, detailed summary that is 5-7 paragraphs long (approximately 800-1200 words). This should be a thorough academic summary that covers:

1. **Core Concepts**: Explain all the main ideas, definitions, and principles covered in the content
2. **Key Methodologies**: Describe the important techniques, approaches, and problem-solving strategies  
3. **Mathematical Foundations**: Detail the underlying mathematical principles and formulas
4. **Practical Applications**: Discuss real-world applications and how the concepts connect to practical situations
5. **Conceptual Understanding**: Explain why these concepts are important and how they fit into the broader subject area
6. **Learning Progression**: How this material builds on previous knowledge and prepares for advanced topics
7. **Key Takeaways**: Highlight the most important insights and learning outcomes

Write in clear, professional academic prose. Use proper mathematical notation with LaTeX format ($$formula$$ for display math, $formula$ for inline math). Write in flowing paragraphs with proper transitions. Be comprehensive and detailed while remaining accessible. Make this a substantial academic summary that thoroughly covers the material.

Content to Summarize:
${text}`
      : `You are an educator. Rewrite with significantly more detail and depth (approximately 150-250 words). Expand on key concepts, add examples where helpful, and provide more comprehensive explanations. Keep it clear, focused, and in plain text format. NO markdown, lists, headings, or asterisks. Output ONLY the improved explanation.

Content to Expand:
${text}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a helpful educator assistant.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenAI error:', errText);
      return new Response(JSON.stringify({ error: 'OpenAI request failed', details: errText }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    let generatedText = data.choices?.[0]?.message?.content ?? '';

    // Clean formatting and keep output concise without markdown or list bullets
    const stripLists = (s: string) => s.replace(/^\s*[-*•]\s+/gm, '');
    const stripMd = (s: string) => s.replace(/[*_`#]/g, '');
    const stripLead = (s: string) => s.replace(/^(sure[,!.\s-]*|here(?:'|’)s (?:a|an) .*?:\s*)/i, '');
    const collapse = (s: string) => s.replace(/\n{2,}/g, '\n').replace(/[ \t]{2,}/g, ' ');
    const limitWords = (s: string, n: number) => {
      const words = s.trim().split(/\s+/);
      if (words.length <= n) return s.trim();
      return words.slice(0, n).join(' ') + '…';
    };

    // For summaries, preserve LaTeX and don't limit words as heavily
    if (mode === 'summary') {
      // Only clean up leading text and collapse whitespace, preserve LaTeX
      generatedText = collapse(stripLead(generatedText)).trim();
    } else {
      generatedText = collapse(stripLead(stripMd(stripLists(generatedText)))).trim();
      const maxWords = 250;
      generatedText = limitWords(generatedText, maxWords);
    }

    return new Response(JSON.stringify({ text: generatedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in explain-text function:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
