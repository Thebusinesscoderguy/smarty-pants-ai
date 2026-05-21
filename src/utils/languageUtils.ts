
import { Language } from '@/types/language';

export const getStoredLanguage = (): Language | null => {
  try {
    const savedLanguage = localStorage.getItem('language') as Language;
    return savedLanguage;
  } catch (error) {
    console.warn('Failed to get stored language:', error);
    return null;
  }
};

export const storeLanguage = (language: Language): void => {
  try {
    localStorage.setItem('language', language);
  } catch (error) {
    console.warn('Failed to store language:', error);
  }
};

export const isValidLanguage = (lang: string): lang is Language => {
  const validLanguages: Language[] = ['en', 'ar'];
  return validLanguages.includes(lang as Language);
};
