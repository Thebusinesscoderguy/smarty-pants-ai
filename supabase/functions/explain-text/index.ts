import { buildCorsHeaders } from "../_shared/cors.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

let corsHeaders = buildCorsHeaders();

serve(async (req) => {
  corsHeaders = buildCorsHeaders(req);
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
      ? `Create a clear, well-formatted summary of this lesson content. Structure it as:

## Key Points
- Main concepts and definitions
- Important formulas (use LaTeX: $$formula$$ for display, $formula$ for inline)

## Essential Methods
- Step-by-step approaches
- Problem-solving techniques

## Quick Review
- Main takeaways
- Things to remember

Keep it concise but complete. Use markdown formatting for readability.

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
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful educator assistant.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1500,
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

    // For summaries, preserve formatting and LaTeX notation
    if (mode === 'summary') {
      // Only clean up leading text, preserve markdown and LaTeX formatting
      generatedText = stripLead(generatedText).trim();
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
    return new Response(JSON.stringify({ error: 'An unexpected error occurred. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
