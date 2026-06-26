import { buildCorsHeaders } from "../_shared/cors.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

let corsHeaders = buildCorsHeaders();
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const LANG_NAMES: Record<string, string> = {
  en: 'English', ar: 'Arabic', es: 'Spanish', fr: 'French', pt: 'Portuguese',
  de: 'German', zh: 'Chinese', ja: 'Japanese', it: 'Italian', ru: 'Russian',
};
const langName = (c: string) => LANG_NAMES[c] || c;

function getAdminClient() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function translateBatch(texts: string[], targetLang: string): Promise<string[]> {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');
  const sys = `You are a professional UI/localization translation engine. Translate each string in the input JSON array \`items\` into ${langName(targetLang)}.\nRules:\n- Preserve ALL placeholders exactly and untranslated: {name}, {count}, {{x}}, %s, %d, :param, and any HTML tags/entities.\n- Keep leading/trailing whitespace and punctuation.\n- No quotes, notes, or explanations.\n- If a string is already in ${langName(targetLang)}, or is only numbers/symbols/emoji/a brand name, return it unchanged.\n- Natural, concise UI tone.\nReturn ONLY JSON: {"items": ["..."]} with EXACTLY the same number of items, same order.`;
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini', temperature: 0, response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: sys }, { role: 'user', content: JSON.stringify({ items: texts }) }],
    }),
  });
  if (!resp.ok) throw new Error(`OpenAI error ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content from OpenAI');
  const out = JSON.parse(content).items;
  if (!Array.isArray(out) || out.length !== texts.length) throw new Error('Batch length mismatch');
  return out.map((x: unknown, i: number) => (typeof x === 'string' ? x : texts[i]));
}

// Batch translate with a persistent DB cache (ui_translations): translate only
// the misses, store them, and return all in order.
async function cachedBatch(admin: ReturnType<typeof getAdminClient>, texts: string[], lang: string): Promise<string[]> {
  if (!admin) return translateBatch(texts, lang);
  const uniq = Array.from(new Set(texts));
  const map = new Map<string, string>();
  const { data: hits } = await admin.from('ui_translations').select('source_text, translated_text').eq('target_language', lang).in('source_text', uniq);
  for (const h of hits || []) map.set(h.source_text, h.translated_text);
  const misses = uniq.filter((t) => !map.has(t));
  if (misses.length) {
    const translated = await translateBatch(misses, lang);
    const rows = misses.map((m, i) => ({ target_language: lang, source_text: m, translated_text: translated[i] }));
    misses.forEach((m, i) => map.set(m, translated[i]));
    await admin.from('ui_translations').upsert(rows, { onConflict: 'target_language,source_text' });
  }
  return texts.map((t) => map.get(t) ?? t);
}

serve(async (req) => {
  corsHeaders = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const { text, texts, targetLang, sourceLang = 'en', messageId } = await req.json();
    const admin = getAdminClient();

    // ---- Batch mode (runtime DOM translator) ----
    if (Array.isArray(texts)) {
      if (!targetLang) throw new Error('Missing targetLang');
      if (targetLang === sourceLang) {
        return new Response(JSON.stringify({ translations: texts }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      try {
        const translations = await cachedBatch(admin, texts, targetLang);
        return new Response(JSON.stringify({ translations }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (e) {
        console.error('Batch failed:', e instanceof Error ? e.message : e);
        return new Response(JSON.stringify({ translations: texts, fallback: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // ---- Single mode (messages / announcements) ----
    if (!text || !targetLang) throw new Error('Missing required parameters: text and targetLang');
    if (sourceLang === targetLang) {
      return new Response(JSON.stringify({ translatedText: text, originalText: text, targetLang, sourceLang, service: 'none' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (admin && messageId) {
      const { data: cached } = await admin.from('message_translations').select('translated_text').eq('message_id', messageId).eq('target_language', targetLang).maybeSingle();
      if (cached?.translated_text) {
        return new Response(JSON.stringify({ translatedText: cached.translated_text, originalText: text, targetLang, sourceLang, service: 'cache' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }
    try {
      const [translatedText] = await cachedBatch(admin, [text], targetLang);
      if (admin && messageId) {
        await admin.from('message_translations').upsert({ message_id: messageId, target_language: targetLang, translated_text: translatedText, source_language: sourceLang }, { onConflict: 'message_id,target_language' });
      }
      return new Response(JSON.stringify({ translatedText, originalText: text, targetLang, sourceLang, service: 'OpenAI' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (e) {
      console.error('Single failed:', e instanceof Error ? e.message : e);
      return new Response(JSON.stringify({ translatedText: text, originalText: text, targetLang, sourceLang, fallback: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  } catch (error) {
    console.error('translate-text error:', error);
    return new Response(JSON.stringify({ error: 'Unexpected error', translatedText: null }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
