
import { supabase } from '@/integrations/supabase/client';

interface TranslationCache {
  [key: string]: {
    [targetLang: string]: string;
  };
}

class TranslationService {
  private cache: TranslationCache = {};
  private pendingTranslations: Map<string, Promise<string>> = new Map();
  private readonly CACHE_KEY = 'translation_cache';
  private readonly MAX_RETRIES = 1; // Reduced retries
  private readonly BATCH_DELAY = 100; // ms delay to batch requests

  constructor() {
    this.loadCache();
  }

  private loadCache() {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        this.cache = JSON.parse(cached);
        console.log('Translation cache loaded:', Object.keys(this.cache).length, 'entries');
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
    return `${sourceLang}:${text.toLowerCase().trim()}`;
  }

  private getRequestKey(text: string, targetLang: string, sourceLang: string): string {
    return `${sourceLang}-${targetLang}:${text.toLowerCase().trim()}`;
  }

  async translateText(text: string, sourceLang: string = 'en', targetLang: string, retryCount: number = 0): Promise<string> {
    // Skip translation if same language or empty text
    if (sourceLang === targetLang || !text || text.trim() === '') {
      return text;
    }

    const cleanText = text.trim();
    const cacheKey = this.getCacheKey(cleanText, sourceLang);
    const requestKey = this.getRequestKey(cleanText, targetLang, sourceLang);

    // Check cache first
    if (this.cache[cacheKey]?.[targetLang]) {
      return this.cache[cacheKey][targetLang];
    }

    // Check if translation is already in progress
    if (this.pendingTranslations.has(requestKey)) {
      try {
        return await this.pendingTranslations.get(requestKey)!;
      } catch (error) {
        // If pending translation failed, continue with new attempt
        this.pendingTranslations.delete(requestKey);
      }
    }

    // Create new translation promise
    const translationPromise = this.performTranslation(cleanText, targetLang, sourceLang, retryCount);
    this.pendingTranslations.set(requestKey, translationPromise);

    try {
      const result = await translationPromise;
      this.pendingTranslations.delete(requestKey);
      return result;
    } catch (error) {
      this.pendingTranslations.delete(requestKey);
      throw error;
    }
  }

  private async performTranslation(text: string, targetLang: string, sourceLang: string, retryCount: number): Promise<string> {
    try {
      console.log(`Translating: "${text}" from ${sourceLang} to ${targetLang} (attempt ${retryCount + 1})`);

      const { data, error } = await supabase.functions.invoke('translate-text', {
        body: {
          text: text,
          targetLang: this.getLibreTranslateCode(targetLang),
          sourceLang: this.getLibreTranslateCode(sourceLang)
        }
      });

      if (error) {
        console.error('Translation service error:', error);
        return text; // Return original text on error
      }

      const translatedText = data?.translatedText;
      const isSuccess = translatedText && 
                       translatedText !== text && 
                       translatedText.trim() !== '' &&
                       !data?.fallback;

      if (isSuccess) {
        // Cache successful translation
        const cacheKey = this.getCacheKey(text, sourceLang);
        if (!this.cache[cacheKey]) {
          this.cache[cacheKey] = {};
        }
        this.cache[cacheKey][targetLang] = translatedText;
        this.saveCache();
        
        console.log(`Translation cached: "${text}" -> "${translatedText}"`);
        return translatedText;
      } else if (data?.fallback) {
        console.log(`Translation fallback used for: "${text}"`);
      }

      return text; // Return original text if translation failed or was fallback

    } catch (error) {
      console.error('Translation error:', error);
      
      // Retry logic with exponential backoff
      if (retryCount < this.MAX_RETRIES) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s...
        console.log(`Retrying translation in ${delay}ms (attempt ${retryCount + 1}/${this.MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.performTranslation(text, targetLang, sourceLang, retryCount + 1);
      }
      
      return text; // Return original text on final failure
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

  /**
   * Translate a persisted message/announcement. Passes `messageId` to the
   * edge function so the result is cached server-side in `message_translations`
   * (shared across users/devices) in addition to the local cache. Falls back to
   * the original text on any failure.
   */
  async translateMessage(
    messageId: string,
    text: string,
    targetLang: string,
    sourceLang: string = 'en'
  ): Promise<string> {
    if (!text || text.trim() === '' || sourceLang === targetLang) {
      return text;
    }

    const cleanText = text.trim();
    const cacheKey = this.getCacheKey(cleanText, sourceLang);
    if (this.cache[cacheKey]?.[targetLang]) {
      return this.cache[cacheKey][targetLang];
    }

    try {
      const { data, error } = await supabase.functions.invoke('translate-text', {
        body: {
          messageId,
          text: cleanText,
          targetLang: this.getLibreTranslateCode(targetLang),
          sourceLang: this.getLibreTranslateCode(sourceLang),
        },
      });

      if (error) {
        console.error('Message translation error:', error);
        return text;
      }

      const translatedText = data?.translatedText;
      const isSuccess =
        translatedText &&
        translatedText !== cleanText &&
        translatedText.trim() !== '' &&
        !data?.fallback;

      if (isSuccess) {
        if (!this.cache[cacheKey]) this.cache[cacheKey] = {};
        this.cache[cacheKey][targetLang] = translatedText;
        this.saveCache();
        return translatedText;
      }

      return text;
    } catch (error) {
      console.error('Message translation error:', error);
      return text;
    }
  }

  // Clear cache method for debugging
  clearCache() {
    this.cache = {};
    this.pendingTranslations.clear();
    localStorage.removeItem(this.CACHE_KEY);
    console.log('Translation cache cleared');
  }

  // Get cache stats for debugging
  getCacheStats() {
    return {
      cacheSize: Object.keys(this.cache).length,
      pendingTranslations: this.pendingTranslations.size
    };
  }
}

export const translationService = new TranslationService();
