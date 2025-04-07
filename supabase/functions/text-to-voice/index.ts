
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
    
    // Enhanced logging of request details
    console.log(`Request method: ${req.method}`);
    console.log(`Request URL: ${req.url}`);
    
    const { text, voice, apiKey } = await req.json();
    console.log("Received payload:", { textLength: text?.length || 0, voice, hasApiKey: !!apiKey });

    if (!text) {
      throw new Error('Text is required');
    }

    if (!apiKey) {
      throw new Error('API key is required');
    }

    // Use the provided API key directly instead of environment variable
    const openAIKey = apiKey;
    console.log("Using provided API key");

    // Check if the API key is properly formatted (should start with "sk-")
    if (!openAIKey.startsWith('sk-')) {
      console.error("API key appears to be in incorrect format");
      throw new Error('OpenAI API key appears to be in incorrect format. It should start with "sk-"');
    }

    console.log("Converting text to speech:", { textLength: text.length, voice });

    // Generate speech from text with more detailed error handling
    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: voice || 'alloy',
          response_format: 'mp3',
        }),
      });

      console.log("OpenAI API response status:", response.status);
      
      if (!response.ok) {
        let errorMessage = 'Failed to generate speech';
        let errorDetails = null;
        let errorType = 'processing_error';
        
        try {
          const errorText = await response.text();
          console.error("OpenAI API error response raw:", errorText);
          
          try {
            const errorData = JSON.parse(errorText);
            console.error("OpenAI API error response parsed:", JSON.stringify(errorData));
            
            if (errorData.error) {
              errorMessage = errorData.error.message || errorMessage;
              errorDetails = errorData.error;
            }
          } catch (parseError) {
            console.error("Failed to parse error response as JSON:", parseError);
            errorMessage = `Raw error: ${errorText}`;
          }
          
          // Check for specific error types
          if (response.status === 401) {
            errorType = 'api_key_error';
            errorMessage = 'Invalid OpenAI API key. Please check your API key.';
          } else if (response.status === 429) {
            errorType = 'rate_limit_error';
            errorMessage = 'OpenAI rate limit exceeded. Please try again later.';
          }
        } catch (e) {
          console.error("Failed to process error response:", e);
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
    } catch (fetchError) {
      console.error("Fetch error when calling OpenAI API:", fetchError);
      throw fetchError;
    }
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
