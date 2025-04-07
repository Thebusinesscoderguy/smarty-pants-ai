
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
    console.log("Request received for text-to-voice");
    
    // Log request headers for debugging
    const headers = {};
    req.headers.forEach((value, key) => {
      // Don't log full auth tokens for security
      if (key === 'authorization' || key === 'apikey') {
        headers[key] = value.substring(0, 10) + '...';
      } else {
        headers[key] = value;
      }
    });
    console.log("Request headers:", JSON.stringify(headers));
    
    const { text, voice } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    // Check if the OpenAI API key is configured
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      console.error("OpenAI API key is not configured");
      throw new Error('OpenAI API key is not configured. Please add your API key in the Supabase dashboard.');
    } else {
      const maskedKey = apiKey.substring(0, 7) + '...' + apiKey.substring(apiKey.length - 5);
      console.log("Using API key:", maskedKey);
      
      // Check if the API key is properly formatted (should start with "sk-")
      if (!apiKey.startsWith('sk-')) {
        console.error("API key appears to be in incorrect format");
        throw new Error('OpenAI API key appears to be in incorrect format. It should start with "sk-"');
      }
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
      let errorDetails = null;
      let errorType = 'processing_error';
      
      try {
        const errorData = await response.json();
        console.error("OpenAI API error response:", JSON.stringify(errorData));
        
        if (errorData.error) {
          errorMessage = errorData.error.message || errorMessage;
          errorDetails = errorData.error;
        }
        
        // Check for specific error types
        if (response.status === 401) {
          errorType = 'api_key_error';
          errorMessage = 'Invalid OpenAI API key. Please check your API key in the Supabase dashboard.';
        } else if (response.status === 429) {
          errorType = 'rate_limit_error';
          errorMessage = 'OpenAI rate limit exceeded. Please try again later.';
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
    
    // Determine error type and provide structured response
    const errorType = error.message.includes('API key') ? 'api_key_error' : 'processing_error';
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        source: 'text-to-voice',
        type: errorType
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
