
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const wolframAlphaAppId = Deno.env.get('WOLFRAM_ALPHA_APP_ID');

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
    const { query, podState } = await req.json();

    if (!query) {
      throw new Error('Query parameter is required');
    }

    if (!wolframAlphaAppId) {
      throw new Error('Wolfram|Alpha App ID not configured');
    }

    console.log(`Processing Wolfram|Alpha query: ${query}`);

    // Construct the Wolfram|Alpha API URL with the Full Results API
    const apiUrl = new URL('https://api.wolframalpha.com/v2/query');
    apiUrl.searchParams.append('appid', wolframAlphaAppId);
    apiUrl.searchParams.append('input', query);
    apiUrl.searchParams.append('format', 'plaintext,image');
    apiUrl.searchParams.append('output', 'json');
    
    // Add step-by-step solution parameter
    apiUrl.searchParams.append('podstate', 'Step-by-step solution');
    
    // Add any additional pod state if provided
    if (podState) {
      apiUrl.searchParams.append('podstate', podState);
    }
    
    // Include important response pods like solutions, plots, etc.
    apiUrl.searchParams.append('includepodid', 'Result');
    apiUrl.searchParams.append('includepodid', 'Solution');
    apiUrl.searchParams.append('includepodid', 'Derivative');
    apiUrl.searchParams.append('includepodid', 'Integral');
    apiUrl.searchParams.append('includepodid', 'Plot');
    apiUrl.searchParams.append('includepodid', 'AlternativeForm');
    
    const response = await fetch(apiUrl.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Wolfram|Alpha API error:', errorText);
      throw new Error(`Wolfram|Alpha API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Process and enrich the response with metadata
    const processedData = {
      success: data.queryresult?.success || false,
      error: data.queryresult?.error || false,
      numpods: data.queryresult?.numpods,
      timing: data.queryresult?.timing,
      pods: data.queryresult?.pods || [],
      interpretation: data.queryresult?.pods?.find(pod => pod.id === 'Input')?.subpods?.[0]?.plaintext,
      solutions: data.queryresult?.pods?.filter(pod => 
        ['Result', 'Solution', 'Derivative', 'Integral', 'AlternativeForms'].includes(pod.id)
      ),
      visualizations: data.queryresult?.pods?.filter(pod => 
        ['Plot', 'VisualRepresentation', 'Graphics'].includes(pod.id)
      ),
      steps: data.queryresult?.pods?.find(pod => pod.id === 'Solution')?.subpods
    };

    console.log(`Wolfram|Alpha query processed successfully, returned ${processedData.pods.length} pods`);

    return new Response(
      JSON.stringify(processedData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error("Error in wolfram-alpha function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
