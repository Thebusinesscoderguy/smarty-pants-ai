
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Use OpenAI for reliable translation
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

async function translateWithOpenAI(text: string, sourceLang: string, targetLang: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const languageNames: { [key: string]: string } = {
    'en': 'English',
    'es': 'Spanish', 
    'fr': 'French',
    'de': 'German',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'pt': 'Portuguese',
    'it': 'Italian',
    'ru': 'Russian',
    'ar': 'Arabic'
  };

  const sourceLanguage = languageNames[sourceLang] || sourceLang;
  const targetLanguage = languageNames[targetLang] || targetLang;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the given text from ${sourceLanguage} to ${targetLanguage}. Only return the translated text, no explanations or additional content.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.1,
      max_tokens: 1000
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  const translatedText = data.choices[0]?.message?.content?.trim();
  
  if (!translatedText) {
    throw new Error('No translation received from OpenAI');
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
      const translatedText = await translateWithOpenAI(text, sourceLang, targetLang);
      
      return new Response(JSON.stringify({ 
        translatedText,
        originalText: text,
        targetLang,
        sourceLang,
        service: 'OpenAI'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('OpenAI translation failed:', error.message);
      
      // Return original text as fallback
      return new Response(JSON.stringify({ 
        translatedText: text,
        originalText: text,
        targetLang,
        sourceLang,
        error: `Translation failed: ${error.message}`,
        fallback: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
