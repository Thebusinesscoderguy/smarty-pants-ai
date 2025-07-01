
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, LanguageContextType } from '@/types/language';
import { translations } from '@/data/translations';
import { useTranslation } from '@/hooks/useTranslation';
import { getStoredLanguage, storeLanguage, isValidLanguage } from '@/utils/languageUtils';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [isInitialized, setIsInitialized] = useState(false);
  const { autoTranslationCache, autoTranslate } = useTranslation();

  useEffect(() => {
    const savedLanguage = getStoredLanguage();
    if (savedLanguage && isValidLanguage(savedLanguage)) {
      setLanguage(savedLanguage);
    }
    
    setIsInitialized(true);
    console.log('LanguageProvider initialized with language:', savedLanguage || 'en');
  }, []);

  const changeLanguage = (lang: Language) => {
    console.log('Changing language to:', lang);
    setLanguage(lang);
    storeLanguage(lang);
  };

  const t = (key: string): string => {
    if (!isInitialized) {
      return translations['en'][key] || key;
    }

    const currentTranslations = translations[language];
    const englishTranslations = translations['en'];
    
    // Get translation from current language
    let translation = currentTranslations?.[key];
    
    if (!translation) {
      // Check if we have an auto-translated version cached
      const cacheKey = `${language}:${key}`;
      if (autoTranslationCache[cacheKey]) {
        return autoTranslationCache[cacheKey];
      }

      // Fallback to English if translation is missing
      translation = englishTranslations?.[key];
      
      // Auto-translate for non-English languages if we have English text
      if (translation && language !== 'en') {
        autoTranslate(key, translation, language);
      }
      
      if (translation) {
        return translation;
      }
    }
    
    // If still no translation found, return the key itself
    if (!translation) {
      console.warn(`No translation found for key "${key}" in any language`);
      return key;
    }
    
    return translation;
  };

  if (!isInitialized) {
    return <div>Loading translations...</div>;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
