
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Request received for voice-to-text');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key not configured. Please set the OPENAI_API_KEY secret in Supabase.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get the raw body as ArrayBuffer first
    const arrayBuffer = await req.arrayBuffer();
    
    // Try to parse as JSON first
    let audioBlob;
    try {
      const textDecoder = new TextDecoder();
      const jsonString = textDecoder.decode(arrayBuffer);
      const requestData = JSON.parse(jsonString);
      
      if (requestData.audio) {
        // Convert base64 to blob
        const audioData = requestData.audio.split(',')[1] || requestData.audio;
        const binaryString = atob(audioData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        audioBlob = new Blob([bytes], { type: 'audio/webm' });
      } else {
        throw new Error('No audio data found in request');
      }
    } catch (parseError) {
      console.error('JSON parse error, treating as raw audio:', parseError.message);
      // If JSON parsing fails, treat as raw audio data
      audioBlob = new Blob([arrayBuffer], { type: 'audio/webm' });
    }

    // Create FormData for OpenAI API
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    console.log('Sending request to OpenAI Whisper API...');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: `OpenAI API error: ${response.statusText}`,
          details: errorText
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    console.log('Transcription successful:', data.text);

    return new Response(JSON.stringify({
      text: data.text
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in voice-to-text function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
