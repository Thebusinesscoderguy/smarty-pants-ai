
import { supabase } from '@/integrations/supabase/client';

interface TranslationCache {
  [key: string]: {
    [targetLang: string]: string;
  };
}

class TranslationService {
  private cache: TranslationCache = {};
  private readonly CACHE_KEY = 'translation_cache';

  constructor() {
    this.loadCache();
  }

  private loadCache() {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        this.cache = JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Failed to load translation cache:', error);
    }
  }

  private saveCache() {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.warn('Failed to save translation cache:', error);
    }
  }

  private getCacheKey(text: string, sourceLang: string): string {
    return `${sourceLang}:${text}`;
  }

  async translateText(text: string, targetLang: string, sourceLang: string = 'en'): Promise<string> {
    // Check cache first
    const cacheKey = this.getCacheKey(text, sourceLang);
    if (this.cache[cacheKey]?.[targetLang]) {
      console.log(`Cache hit for "${text}" -> ${targetLang}`);
      return this.cache[cacheKey][targetLang];
    }

    try {
      // Call the edge function
      const { data, error } = await supabase.functions.invoke('translate-text', {
        body: {
          text,
          targetLang,
          sourceLang
        }
      });

      if (error) {
        console.error('Translation service error:', error);
        return text; // Return original text on error
      }

      const translatedText = data?.translatedText;
      if (translatedText && translatedText !== text) {
        // Cache the translation
        if (!this.cache[cacheKey]) {
          this.cache[cacheKey] = {};
        }
        this.cache[cacheKey][targetLang] = translatedText;
        this.saveCache();
        
        console.log(`Translated and cached: "${text}" -> "${translatedText}"`);
        return translatedText;
      }

      return text;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text on error
    }
  }

  // Language code mapping for LibreTranslate
  private getLibreTranslateCode(langCode: string): string {
    const mapping: { [key: string]: string } = {
      'en': 'en',
      'es': 'es',
      'fr': 'fr',
      'de': 'de',
      'zh': 'zh',
      'ja': 'ja',
      'pt': 'pt',
      'it': 'it',
      'ru': 'ru',
      'ar': 'ar'
    };
    return mapping[langCode] || langCode;
  }

  async translateKey(key: string, targetLang: string): Promise<string> {
    // Convert the key to a more readable format for translation
    const readableText = key.split('.').pop()?.replace(/([A-Z])/g, ' $1').toLowerCase() || key;
    const libreTranslateCode = this.getLibreTranslateCode(targetLang);
    
    return this.translateText(readableText, libreTranslateCode);
  }
}

export const translationService = new TranslationService();
