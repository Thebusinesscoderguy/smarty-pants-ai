
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

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
    const { text, voice } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    // Check if the OpenAI API key is configured
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      console.error("OpenAI API key is not configured");
      throw new Error('OpenAI API key is not configured. Please add your API key in the Supabase dashboard.');
    }

    console.log("Converting text to speech:", { textLength: text.length, voice });

    // Generate speech from text
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice || 'alloy',
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to generate speech';
      try {
        const errorData = await response.json();
        console.error("OpenAI API error:", errorData);
        errorMessage = errorData.error?.message || errorMessage;
        
        // Check for invalid API key errors
        if (errorMessage.includes('API key') || errorMessage.includes('authentication') || response.status === 401) {
          throw new Error('Invalid OpenAI API key. Please check your API key in the Supabase dashboard.');
        }
      } catch (e) {
        console.error("Failed to parse error response:", e);
      }
      throw new Error(errorMessage);
    }

    // Convert audio buffer to base64
    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(arrayBuffer))
    );

    console.log("Successfully converted text to speech");

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error("Error in text-to-voice function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        source: 'text-to-voice',
        type: error.message.includes('API key') ? 'api_key_error' : 'processing_error'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
