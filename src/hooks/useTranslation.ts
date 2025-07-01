
import { useState, useEffect } from 'react';
import { translationService } from '@/services/translationService';
import { Language } from '@/types/language';

export const useTranslation = () => {
  const [autoTranslationCache, setAutoTranslationCache] = useState<{ [key: string]: string }>({});
  const [translatingKeys, setTranslatingKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load auto-translation cache
    try {
      const autoCache = localStorage.getItem('auto_translation_cache');
      if (autoCache) {
        setAutoTranslationCache(JSON.parse(autoCache));
      }
    } catch (error) {
      console.warn('Failed to load auto-translation cache:', error);
    }
  }, []);

  const saveAutoTranslationCache = (newCache: { [key: string]: string }) => {
    try {
      localStorage.setItem('auto_translation_cache', JSON.stringify(newCache));
    } catch (error) {
      console.warn('Failed to save auto-translation cache:', error);
    }
  };

  const autoTranslate = (key: string, translation: string, language: Language) => {
    const cacheKey = `${language}:${key}`;
    
    if (autoTranslationCache[cacheKey] || translatingKeys.has(cacheKey) || language === 'en') {
      return;
    }

    // Only translate certain types of keys to avoid overwhelming the API
    const shouldTranslate = key.includes('title') || 
                          key.includes('subtitle') || 
                          key.includes('desc') || 
                          key.includes('content') ||
                          key.length > 5; // Translate longer keys
    
    if (!shouldTranslate) {
      return;
    }

    setTranslatingKeys(prev => new Set(prev).add(cacheKey));
    
    translationService.translateText(translation, language, 'en')
      .then(autoTranslated => {
        if (autoTranslated && autoTranslated !== translation) {
          const newCache = {
            ...autoTranslationCache,
            [cacheKey]: autoTranslated
          };
          setAutoTranslationCache(newCache);
          saveAutoTranslationCache(newCache);
          console.log(`Auto-translation completed: "${key}" -> "${autoTranslated}"`);
        }
      })
      .catch(error => {
        console.warn('Auto-translation failed for key:', key, error);
      })
      .finally(() => {
        setTranslatingKeys(prev => {
          const newSet = new Set(prev);
          newSet.delete(cacheKey);
          return newSet;
        });
      });
  };

  return {
    autoTranslationCache,
    autoTranslate
  };
};
