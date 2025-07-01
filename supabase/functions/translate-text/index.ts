
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Multiple translation services for fallback
const TRANSLATION_SERVICES = [
  {
    name: 'LibreTranslate',
    url: 'https://libretranslate.de/translate',
    transform: (text: string, source: string, target: string) => ({
      q: text,
      source: source,
      target: target,
      format: 'text'
    }),
    extract: (data: any) => data.translatedText
  },
  {
    name: 'MyMemory',
    url: 'https://api.mymemory.translated.net/get',
    transform: (text: string, source: string, target: string) => null,
    extract: (data: any) => data.responseData?.translatedText,
    method: 'GET',
    buildUrl: (text: string, source: string, target: string) => 
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`
  }
];

async function tryTranslationService(service: any, text: string, sourceLang: string, targetLang: string) {
  try {
    console.log(`Trying ${service.name} for: "${text}" from ${sourceLang} to ${targetLang}`);
    
    let response;
    if (service.method === 'GET') {
      const url = service.buildUrl(text, sourceLang, targetLang);
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Translation Bot)'
        }
      });
    } else {
      response = await fetch(service.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; Translation Bot)'
        },
        body: JSON.stringify(service.transform(text, sourceLang, targetLang)),
      });
    }

    if (!response.ok) {
      throw new Error(`${service.name} API error: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`${service.name} returned non-JSON response`);
    }

    const data = await response.json();
    const translatedText = service.extract(data);
    
    if (translatedText && translatedText.trim() !== '' && translatedText !== text) {
      console.log(`${service.name} success: "${text}" -> "${translatedText}"`);
      return translatedText;
    }
    
    throw new Error(`${service.name} returned empty or unchanged translation`);
  } catch (error) {
    console.error(`${service.name} failed:`, error.message);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, targetLang, sourceLang = 'en' } = await req.json();
    
    if (!text || !targetLang) {
      throw new Error('Missing required parameters: text and targetLang');
    }
    
    console.log(`Translation request: "${text}" from ${sourceLang} to ${targetLang}`);

    // Try each translation service in order
    let lastError;
    for (const service of TRANSLATION_SERVICES) {
      try {
        const translatedText = await tryTranslationService(service, text, sourceLang, targetLang);
        
        return new Response(JSON.stringify({ 
          translatedText,
          originalText: text,
          targetLang,
          sourceLang,
          service: service.name
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        lastError = error;
        continue; // Try next service
      }
    }

    // All services failed
    console.error('All translation services failed, returning original text');
    return new Response(JSON.stringify({ 
      translatedText: text,
      originalText: text,
      targetLang,
      sourceLang,
      error: `All translation services failed. Last error: ${lastError?.message}`,
      fallback: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Translation function error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      translatedText: null 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
