
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        ...corsHeaders,
      },
    });
  }

  try {
    const { service } = await req.json() as { service: string };
    
    console.log(`Edge function called: get-api-service for ${service}`);
    
    if (!service || service !== 'google') {
      console.error(`Invalid service specified: ${service}. Only 'google' is supported.`);
      return new Response(
        JSON.stringify({ error: 'Invalid service specified. Only Google API is supported.' }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }
    
    // Get Google API configuration
    const googleApiKey = Deno.env.get("GOOGLE_API_KEY");
    
    if (!googleApiKey) {
      console.error('GOOGLE_API_KEY environment variable is not set');
      return new Response(
        JSON.stringify({ error: 'Google API key is not configured' }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }
    
    console.log('Successfully retrieved Google API config');
    
    return new Response(
      JSON.stringify({ apiKey: googleApiKey }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : 'Unknown error');
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});
