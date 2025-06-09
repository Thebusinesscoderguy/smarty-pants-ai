
import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const wolframAppId = Deno.env.get('WOLFRAM_ALPHA_APP_ID');
    if (!wolframAppId) {
      console.error('Wolfram Alpha App ID not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Wolfram Alpha App ID not configured. Please set the WOLFRAM_ALPHA_APP_ID secret in Supabase.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { query } = await req.json();
    
    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid request: query string is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Wolfram Alpha query:', query);

    const wolframUrl = `http://api.wolframalpha.com/v2/query?input=${encodeURIComponent(query)}&format=plaintext,image&output=JSON&appid=${wolframAppId}`;

    const response = await fetch(wolframUrl);
    
    if (!response.ok) {
      console.error('Wolfram Alpha API error:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ 
          error: `Wolfram Alpha API error: ${response.statusText}` 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    console.log('Wolfram Alpha response received successfully');

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in wolfram-alpha function:', error);
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
