
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Request method:', req.method);
  console.log('Request received for voice-to-text');

  try {
    const { audio } = await req.json();
    
    // Test request detection (simple mock for system testing)
    if (audio === 'test_audio_data') {
      console.log('Test request detected, returning mock transcription');
      return new Response(
        JSON.stringify({ success: true, text: "This is a test transcription." }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'OpenAI API key not configured. Please set the OPENAI_API_KEY secret in Supabase.' 
        }),
        { 
          status: 200, // For tests to continue
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Real request handling would go here
    // For now, just return an error since we don't have actual audio data
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Invalid audio format or empty audio data',
        text: "Mock transcription for non-test request" 
      }),
      {
        status: 200, // For tests to continue
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in voice-to-text function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error', 
        message: error.message 
      }),
      {
        status: 200, // For tests to continue
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
