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
      ? `You are an educator. Write a clean, plain-text summary (2–3 sentences, max 70 words). Do NOT use markdown, lists, headings, or asterisks. Output ONLY the summary.\n\nExplanation:\n${text}`
      : `You are an educator. Rewrite with a bit more detail (3–4 sentences, max 120 words). Keep it clear, focused, and plain text. NO markdown, lists, headings, or asterisks. Output ONLY the improved explanation.\n\nExplanation:\n${text}`;

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

    generatedText = collapse(stripLead(stripMd(stripLists(generatedText)))).trim();
    const maxWords = mode === 'summary' ? 70 : 120;
    generatedText = limitWords(generatedText, maxWords);

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
