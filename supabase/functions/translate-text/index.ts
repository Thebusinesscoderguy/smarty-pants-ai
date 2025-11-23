
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Use DeepL for reliable translation
const DEEPL_API_KEY = Deno.env.get('DEEPL_API_KEY');

// DeepL language code mapping
function getDeepLCode(langCode: string): string {
  const mapping: { [key: string]: string } = {
    'en': 'EN',
    'es': 'ES',
    'fr': 'FR',
    'de': 'DE',
    'zh': 'ZH',
    'ja': 'JA',
    'pt': 'PT-PT',
    'it': 'IT',
    'ru': 'RU',
    'ar': 'AR'
  };
  return mapping[langCode] || langCode.toUpperCase();
}

async function translateWithDeepL(text: string, sourceLang: string, targetLang: string): Promise<string> {
  if (!DEEPL_API_KEY) {
    throw new Error('DeepL API key not configured');
  }

  const targetLangCode = getDeepLCode(targetLang);
  const sourceLangCode = getDeepLCode(sourceLang);

  // Try free API first, fallback to pro
  const apiUrl = 'https://api-free.deepl.com/v2/translate';
  
  const params = new URLSearchParams({
    auth_key: DEEPL_API_KEY,
    text: text,
    target_lang: targetLangCode,
    source_lang: sourceLangCode
  });

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepL API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  const translatedText = data.translations?.[0]?.text;
  
  if (!translatedText) {
    throw new Error('No translation received from DeepL');
  }

  return translatedText;
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

    // Skip translation if same language
    if (sourceLang === targetLang) {
      return new Response(JSON.stringify({ 
        translatedText: text,
        originalText: text,
        targetLang,
        sourceLang,
        service: 'none'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`Translation request: "${text}" from ${sourceLang} to ${targetLang}`);

    try {
      const translatedText = await translateWithDeepL(text, sourceLang, targetLang);
      
      return new Response(JSON.stringify({ 
        translatedText,
        originalText: text,
        targetLang,
        sourceLang,
        service: 'DeepL'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('DeepL translation failed:', error instanceof Error ? error.message : 'Unknown error');
      
      // Return original text as fallback
      return new Response(JSON.stringify({ 
        translatedText: text,
        originalText: text,
        targetLang,
        sourceLang,
        error: `Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        fallback: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Translation function error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      translatedText: null 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
