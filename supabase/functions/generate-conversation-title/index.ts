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
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages array is required');
    }

    // Take first few messages to understand the conversation topic
    const conversationContext = messages
      .slice(0, 6) // First 6 messages should be enough to understand the topic
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    console.log('Generating title for conversation context:', conversationContext.substring(0, 200));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that creates short, descriptive titles for educational conversations. Generate a concise title (2-6 words) that captures the main topic or subject being discussed. Focus on the educational content, subject matter, or learning objective. Examples: "Chess Opening Strategies", "Photosynthesis Process", "French Grammar Basics", "Calculus Integration Methods".'
          },
          {
            role: 'user',
            content: `Based on this conversation, create a short descriptive title:\n\n${conversationContext}`
          }
        ],
        max_completion_tokens: 50,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const title = data.choices[0].message.content.trim();

    // Clean up the title - remove quotes and ensure it's not too long
    const cleanTitle = title
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
      .substring(0, 50) // Limit length
      .trim();

    console.log('Generated conversation title:', cleanTitle);

    return new Response(
      JSON.stringify({ title: cleanTitle }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error generating conversation title:', error);
    
    // Return a fallback title instead of erroring
    const fallbackTitle = 'Learning Session';
    
    return new Response(
      JSON.stringify({ title: fallbackTitle }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});