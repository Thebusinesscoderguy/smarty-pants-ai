import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages array is required');
    }

    const conversationContext = messages
      .slice(0, 6)
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    console.log('Generating title for conversation context:', conversationContext.substring(0, 200));

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that creates short, descriptive titles for educational conversations. Generate a concise title (2-6 words) that captures the main topic or subject being discussed. Focus on the educational content, subject matter, or learning objective. Return ONLY the title, nothing else. Examples: "Chess Opening Strategies", "Photosynthesis Process", "French Grammar Basics", "Physics Fundamentals", "Algebra Equations".'
          },
          {
            role: 'user',
            content: `Based on this conversation, create a short descriptive title:\n\n${conversationContext}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('AI gateway error:', response.status, errorData);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const title = data.choices?.[0]?.message?.content?.trim();

    console.log('Raw AI title:', title);

    // Clean up the title
    const cleanTitle = (title || '')
      .replace(/^["']|["']$/g, '')
      .substring(0, 50)
      .trim();

    const finalTitle = cleanTitle || 'Learning Session';
    console.log('Final conversation title:', finalTitle);

    return new Response(
      JSON.stringify({ title: finalTitle }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating conversation title:', error);
    
    return new Response(
      JSON.stringify({ title: 'Learning Session' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
