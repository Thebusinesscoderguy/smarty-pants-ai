// Auto-translate fallback removed: all keys are now manually translated for EN + AR.
// Stub kept so existing imports in LanguageContext keep compiling.
export const useTranslation = () => {
  return {
    autoTranslationCache: {} as Record<string, string>,
    autoTranslate: (_key: string, _translation: string, _language: string) => {
      // no-op
    },
  };
};
