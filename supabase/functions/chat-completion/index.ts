
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages must be provided as an array');
    }

    // Check if the system prompt includes quiz mode instructions
    const isQuizMode = messages.some(msg => 
      msg.role === 'system' && 
      msg.content.includes('quiz mode')
    );

    // Extract performance data if present in system message
    const performanceData = messages.find(msg => 
      msg.role === 'system' && 
      msg.content.includes('Strengths:')
    );

    // Call OpenAI API for chat completion with appropriate instruction
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using GPT-4o-mini for better responses at lower cost
        messages: messages,
        max_tokens: 500,
        temperature: isQuizMode ? 0.4 : 0.7, // Lower temperature for more factual quiz responses
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI API error:", error);
      throw new Error(error.error?.message || 'Failed to generate completion');
    }

    const data = await response.json();
    const text = data.choices[0].message.content;

    // Log usage data for debugging
    console.log("Token usage:", data.usage);
    if (isQuizMode) {
      console.log("Quiz mode active");
    }

    return new Response(
      JSON.stringify({ text }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error("Error in chat-completion function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
