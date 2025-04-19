
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String, chunkSize = 32768) {
  const chunks = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("Request received for voice-to-text");
    console.log(`Request method: ${req.method}`);
    console.log(`Request URL: ${req.url}`);
    
    const requestData = await req.json();
    console.log("Request data received, contains audio:", !!requestData.audio);
    
    const { audio } = requestData;
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    // Get API key from environment variable
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIKey) {
      console.error("OPENAI_API_KEY not found in environment variables");
      throw new Error('OpenAI API key not configured on the server');
    }
    
    console.log("Using server-side API key");
    console.log("Processing audio data...");

    try {
      // Process audio in chunks
      const binaryAudio = processBase64Chunks(audio);
      console.log("Audio data processed, creating form data");
      
      // Prepare form data
      const formData = new FormData();
      const blob = new Blob([binaryAudio], { type: 'audio/webm' });
      formData.append('file', blob, 'audio.webm');
      formData.append('model', 'whisper-1');
      
      console.log("Sending request to OpenAI API");

      // Send to OpenAI
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIKey}`,
        },
        body: formData,
      });

      console.log("OpenAI API response status:", response.status);
      
      if (!response.ok) {
        let errorMessage = 'Failed to transcribe audio';
        let errorType = 'processing_error';
        
        try {
          const errorText = await response.text();
          console.error("OpenAI API error response:", errorText);
          
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error?.message || errorMessage;
          } catch (parseError) {
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
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Successfully transcribed audio to text");

      return new Response(
        JSON.stringify({ text: result.text }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (apiError) {
      console.error("API error when calling OpenAI:", apiError);
      throw apiError;
    }
  } catch (error) {
    console.error("Error in voice-to-text function:", error);
    
    // Determine error type and provide structured response
    const errorType = error.message.includes('API key') ? 'api_key_error' : 'processing_error';
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        source: 'voice-to-text',
        type: errorType 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
