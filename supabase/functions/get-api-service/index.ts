
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ServiceType = 'google' | 'paypal';

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
    const { service } = await req.json() as { service: ServiceType };
    
    console.log(`Edge function called: get-api-service for ${service}`);
    
    if (!service || !['google', 'paypal'].includes(service)) {
      console.error(`Invalid service specified: ${service}`);
      return new Response(
        JSON.stringify({ error: 'Invalid service specified' }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }
    
    // Get the appropriate API key based on the requested service
    const apiConfig = await getServiceConfig(service);
    
    // Verify that required environment variables exist
    if (service === 'google' && !apiConfig.apiKey) {
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
    
    if (service === 'paypal' && (!apiConfig.clientId || !apiConfig.hasSecret)) {
      console.error('PAYPAL_CLIENT_ID or PAYPAL_SECRET_KEY environment variable is not set');
      return new Response(
        JSON.stringify({ error: 'PayPal API credentials are not fully configured' }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }
    
    console.log(`Successfully retrieved config for ${service}`);
    
    return new Response(
      JSON.stringify(apiConfig),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
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

async function getServiceConfig(service: ServiceType) {
  switch (service) {
    case 'google':
      return {
        apiKey: Deno.env.get("GOOGLE_API_KEY"),
      };
    case 'paypal':
      return {
        clientId: Deno.env.get("PAYPAL_CLIENT_ID"),
        // Never return the secret key directly to the client
        // This is just to verify it's available
        hasSecret: !!Deno.env.get("PAYPAL_SECRET_KEY"),
      };
    default:
      throw new Error('Invalid service');
  }
}
