
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
    console.log("=== TEXT-TO-VOICE FUNCTION START ===");
    console.log(`Request method: ${req.method}`);
    console.log(`Request URL: ${req.url}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    const { text, voice } = await req.json();
    console.log("Received payload:", { 
      textLength: text?.length || 0, 
      voice,
      textPreview: text?.substring(0, 50) + (text?.length > 50 ? '...' : '')
    });

    if (!text) {
      console.error("ERROR: No text provided in request");
      throw new Error('Text is required');
    }

    // Get and validate API key
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    console.log('OpenAI API key check:', {
      hasKey: !!openAIKey,
      keyLength: openAIKey?.length || 0,
      keyPrefix: openAIKey?.substring(0, 7) || 'none'
    });
    
    if (!openAIKey || openAIKey.trim() === '') {
      console.error("CRITICAL ERROR: OPENAI_API_KEY not found or empty");
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key not configured on the server',
          type: 'api_key_error',
          details: 'The server administrator needs to set the OPENAI_API_KEY in Supabase secrets'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check for system test mode - return mock response for system tests only
    if (text.toLowerCase().includes('system test')) {
      console.log("SYSTEM TEST MODE: Returning mock response");
      
      // Return a small mock base64 audio content for testing
      const mockAudioBase64 = 'UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDuN3vHJeSgFJnvL8dyRQAkTXbPq7KlWFAlFnt/xwG4iBTyO4PHKeSgFJXnI8N2QQAoUXrTp66hVFApGn+DyvmwhBDuN3vHJeSgFJnvL8dyRQAkTXbPq7KlWFAlFnt/xwG4iBTyO4PHKeSgFJXnI8N2QQAoUXrTp66hVFApGn+DyvmwhBDuN3vHJeSgFJnvLasd0A==';
      
      return new Response(
        JSON.stringify({ audioContent: mockAudioBase64 }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    console.log("PROCEEDING WITH REAL OPENAI API CALL");
    console.log("Request parameters:", {
      model: 'tts-1',
      voice: voice || 'alloy',
      textLength: text.length,
      responseFormat: 'mp3'
    });

    // Create timeout promise
    const timeoutMs = 15000; // Increased to 15 seconds
    console.log(`Setting timeout for ${timeoutMs}ms`);
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        console.error(`TIMEOUT: OpenAI API call exceeded ${timeoutMs}ms`);
        reject(new Error(`OpenAI API call timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    // Generate speech from text
    const apiCallPromise = (async () => {
      try {
        console.log("Making HTTP request to OpenAI API...");
        const requestStartTime = Date.now();
        
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

        const requestEndTime = Date.now();
        console.log(`OpenAI API request completed in ${requestEndTime - requestStartTime}ms`);
        console.log("OpenAI API response status:", response.status);
        console.log("OpenAI API response headers:", Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          let errorMessage = 'Failed to generate speech';
          let errorDetails = null;
          let errorType = 'processing_error';
          
          try {
            const errorText = await response.text();
            console.error("OpenAI API error response (raw):", errorText);
            
            try {
              const errorData = JSON.parse(errorText);
              console.error("OpenAI API error response (parsed):", JSON.stringify(errorData, null, 2));
              
              if (errorData.error) {
                errorMessage = errorData.error.message || errorMessage;
                errorDetails = errorData.error;
                
                // Enhanced error type detection
                if (errorData.error.code === 'invalid_api_key' || response.status === 401) {
                  errorType = 'api_key_error';
                  errorMessage = 'Invalid OpenAI API key. Please contact the administrator.';
                } else if (errorData.error.code === 'rate_limit_exceeded' || response.status === 429) {
                  errorType = 'rate_limit_error';
                  errorMessage = 'OpenAI rate limit exceeded. Please try again later.';
                } else if (errorData.error.code === 'insufficient_quota') {
                  errorType = 'quota_error';
                  errorMessage = 'OpenAI account quota exceeded. Please contact the administrator.';
                }
              }
            } catch (parseError) {
              console.error("Failed to parse OpenAI error response as JSON:", parseError);
              errorMessage = `OpenAI API error (status ${response.status}): ${errorText}`;
            }
          } catch (textError) {
            console.error("Failed to read OpenAI error response text:", textError);
            errorMessage = `OpenAI API error (status ${response.status}): Unable to read error details`;
          }
          
          return new Response(
            JSON.stringify({ 
              error: errorMessage,
              details: errorDetails,
              type: errorType,
              httpStatus: response.status
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        console.log("OpenAI API request successful, processing response...");
        
        // Get content type and length for debugging
        const contentType = response.headers.get('content-type');
        const contentLength = response.headers.get('content-length');
        console.log("Response content info:", { contentType, contentLength });
        
        // Convert audio buffer to base64
        const audioProcessStartTime = Date.now();
        const arrayBuffer = await response.arrayBuffer();
        const audioProcessEndTime = Date.now();
        
        console.log(`Audio buffer processed in ${audioProcessEndTime - audioProcessStartTime}ms`);
        console.log("Audio buffer size:", arrayBuffer.byteLength, "bytes");
        
        if (arrayBuffer.byteLength === 0) {
          console.error("ERROR: Received empty audio buffer from OpenAI");
          throw new Error('OpenAI returned empty audio data');
        }
        
        const base64ConvertStartTime = Date.now();
        const base64Audio = btoa(
          String.fromCharCode(...new Uint8Array(arrayBuffer))
        );
        const base64ConvertEndTime = Date.now();
        
        console.log(`Base64 conversion completed in ${base64ConvertEndTime - base64ConvertStartTime}ms`);
        console.log("Base64 audio length:", base64Audio.length, "characters");
        console.log("Base64 audio preview (first 100 chars):", base64Audio.substring(0, 100));

        console.log("=== TEXT-TO-VOICE SUCCESS ===");
        console.log("Total processing time:", Date.now() - requestStartTime, "ms");

        return new Response(
          JSON.stringify({ 
            audioContent: base64Audio,
            metadata: {
              originalSize: arrayBuffer.byteLength,
              base64Size: base64Audio.length,
              voice: voice || 'alloy',
              processingTimeMs: Date.now() - requestStartTime
            }
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      } catch (fetchError) {
        console.error("FETCH ERROR when calling OpenAI API:", fetchError);
        console.error("Fetch error details:", {
          name: fetchError.name,
          message: fetchError.message,
          stack: fetchError.stack
        });
        
        let errorType = 'api_request_error';
        let errorMessage = `API request failed: ${fetchError.message}`;
        
        if (fetchError.name === 'TypeError' && fetchError.message.includes('network')) {
          errorType = 'network_error';
          errorMessage = 'Network error while connecting to OpenAI. Please check your internet connection.';
        } else if (fetchError.name === 'AbortError') {
          errorType = 'timeout_error';
          errorMessage = 'Request to OpenAI was aborted or timed out.';
        }
        
        return new Response(
          JSON.stringify({ 
            error: errorMessage,
            type: errorType,
            details: {
              name: fetchError.name,
              message: fetchError.message
            }
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    })();

    // Race between API call and timeout
    console.log("Starting race between API call and timeout...");
    const result = await Promise.race([apiCallPromise, timeoutPromise]);
    console.log("Race completed successfully");
    return result;

  } catch (error) {
    console.error("=== TEXT-TO-VOICE FUNCTION ERROR ===");
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Determine error type and provide structured response
    let errorType = 'processing_error';
    let errorMessage = error.message;
    
    if (error.message.includes('API key')) {
      errorType = 'api_key_error';
      errorMessage = 'OpenAI API key configuration issue';
    } else if (error.message.includes('timed out')) {
      errorType = 'timeout_error';
      errorMessage = 'OpenAI API response timed out - service may be slow or unavailable';
    } else if (error.message.includes('JSON')) {
      errorType = 'request_format_error';
      errorMessage = 'Invalid request format - please check the request data';
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        source: 'text-to-voice',
        type: errorType,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
