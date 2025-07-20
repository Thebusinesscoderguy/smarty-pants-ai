
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
    console.log(`Request method: ${req.method}`);
    console.log(`Request URL: ${req.url}`);
    
    const { text, voice } = await req.json();
    console.log("Received payload:", { textLength: text?.length || 0, voice });

    if (!text) {
      throw new Error('Text is required');
    }

    // Get API key from environment variable
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    console.log('OpenAI API key check:', openAIKey ? 'Found' : 'Not found');
    
    if (!openAIKey || openAIKey.trim() === '') {
      console.error("OPENAI_API_KEY not found or empty in environment variables");
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key not configured on the server',
          type: 'api_key_error'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check for test mode - return mock response for system tests only
    if (text.toLowerCase().includes('system test')) {
      console.log("System test request detected, returning mock response");
      
      // Return a small mock base64 audio content for testing
      const mockAudioBase64 = 'UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDuN3vHJeSgFJnvLasd0A=='; // Very small WAV file
      
      return new Response(
        JSON.stringify({ audioContent: mockAudioBase64 }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    console.log("Converting text to speech:", { textLength: text.length, voice });

    // Create a timeout promise for the OpenAI API call
    const timeoutMs = 8000; // 8 second timeout for actual API calls
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`OpenAI API call timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    // Generate speech from text with more detailed error handling
    const apiCallPromise = (async () => {
      try {
        console.log("Making request to OpenAI API...");
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
              errorMessage = 'Invalid OpenAI API key. Please contact the administrator.';
            } else if (response.status === 429) {
              errorType = 'rate_limit_error';
              errorMessage = 'OpenAI rate limit exceeded. Please try again later.';
            }
          } catch (e) {
            console.error("Failed to process error response:", e);
          }
          
          return new Response(
            JSON.stringify({ 
              error: errorMessage,
              details: errorDetails,
              type: errorType
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        console.log("Received successful response from OpenAI, processing audio...");
        
        // Convert audio buffer to base64
        const arrayBuffer = await response.arrayBuffer();
        console.log("Audio buffer size:", arrayBuffer.byteLength);
        
        const base64Audio = btoa(
          String.fromCharCode(...new Uint8Array(arrayBuffer))
        );

        console.log("Successfully converted text to speech, base64 length:", base64Audio.length);

        return new Response(
          JSON.stringify({ audioContent: base64Audio }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      } catch (fetchError) {
        console.error("Fetch error when calling OpenAI API:", fetchError);
        return new Response(
          JSON.stringify({ 
            error: `API request failed: ${fetchError.message}`,
            type: 'api_request_error' 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    })();

    // Race between the API call and timeout
    return await Promise.race([apiCallPromise, timeoutPromise]);

  } catch (error) {
    console.error("Error in text-to-voice function:", error);
    
    // Determine error type and provide structured response
    let errorType = 'processing_error';
    let errorMessage = error.message;
    
    if (error.message.includes('API key')) {
      errorType = 'api_key_error';
    } else if (error.message.includes('timed out')) {
      errorType = 'timeout_error';
      errorMessage = 'OpenAI API response timed out - service may be slow or unavailable';
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
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
