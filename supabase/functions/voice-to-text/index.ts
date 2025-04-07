
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("Request received for voice-to-text");
    
    // Enhanced logging of request details
    console.log(`Request method: ${req.method}`);
    console.log(`Request URL: ${req.url}`);
    
    const requestData = await req.json();
    const { audio, apiKey } = requestData;
    
    console.log("Request payload received:", { 
      hasAudio: !!audio, 
      audioLength: audio ? audio.length : 0,
      hasApiKey: !!apiKey
    });
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    if (!apiKey) {
      throw new Error('API key is required');
    }

    // Use the provided API key directly
    const openAIKey = apiKey;
    console.log("Using provided API key");
    
    // Check if the API key is properly formatted (should start with "sk-")
    if (!openAIKey.startsWith('sk-')) {
      console.error("API key appears to be in incorrect format");
      throw new Error('OpenAI API key appears to be in incorrect format. It should start with "sk-"');
    }
    
    console.log("Processing audio for transcription");

    // Process audio in chunks
    const binaryAudio = processBase64Chunks(audio);
    console.log("Audio processed, size:", binaryAudio.length);
    
    // Prepare form data
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');

    console.log("Sending request to OpenAI API");
    
    // Send to OpenAI with better error handling
    try {
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
          // Try to get more detailed error information
          const errorText = await response.text();
          console.error("OpenAI API error response raw:", errorText);
          
          let errorObj = null;
          try {
            errorObj = JSON.parse(errorText);
            console.error("OpenAI API error response parsed:", JSON.stringify(errorObj));
            
            if (errorObj.error && errorObj.error.message) {
              errorMessage = errorObj.error.message;
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

      const result = await response.json();
      console.log("Transcription successful:", result);

      return new Response(
        JSON.stringify({ text: result.text }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (fetchError) {
      console.error("Fetch error when calling OpenAI API:", fetchError);
      throw fetchError;
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
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
