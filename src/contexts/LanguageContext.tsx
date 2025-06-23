
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja' | 'pt' | 'it' | 'ru' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Basic translations - you can expand this significantly
const translations = {
  en: {
    'hero.title': 'Revolutionize Learning with AI-Powered Education',
    'hero.subtitle': 'Experience the future of personalized education with TeachlyAI\'s advanced artificial intelligence',
    'nav.features': 'Features',
    'nav.pricing': 'Pricing',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'cta.start': 'Start Your Learning Journey',
    'cta.demo': 'See Live Demo',
    'cta.test': 'Check System Health',
    'features.adaptive.title': 'Adaptive Intelligence',
    'features.voice.title': 'Natural Voice Learning',
    'features.content.title': 'Smart Content Analysis',
    'language.select': 'Select Language',
    'curriculum.title': 'Choose Your Curriculum',
    'curriculum.create': 'Create Custom Curriculum',
    'curriculum.browse': 'Browse Available Curricula'
  },
  es: {
    'hero.title': 'Revoluciona el Aprendizaje con Educación Impulsada por IA',
    'hero.subtitle': 'Experimenta el futuro de la educación personalizada con la inteligencia artificial avanzada de TeachlyAI',
    'nav.features': 'Características',
    'nav.pricing': 'Precios',
    'nav.about': 'Acerca de',
    'nav.contact': 'Contacto',
    'cta.start': 'Comienza tu Viaje de Aprendizaje',
    'cta.demo': 'Ver Demostración',
    'cta.test': 'Verificar Salud del Sistema',
    'features.adaptive.title': 'Inteligencia Adaptativa',
    'features.voice.title': 'Aprendizaje de Voz Natural',
    'features.content.title': 'Análisis Inteligente de Contenido',
    'language.select': 'Seleccionar Idioma',
    'curriculum.title': 'Elige tu Currículo',
    'curriculum.create': 'Crear Currículo Personalizado',
    'curriculum.browse': 'Explorar Currículos Disponibles'
  },
  fr: {
    'hero.title': 'Révolutionnez l\'Apprentissage avec l\'Éducation Alimentée par l\'IA',
    'hero.subtitle': 'Découvrez l\'avenir de l\'éducation personnalisée avec l\'intelligence artificielle avancée de TeachlyAI',
    'nav.features': 'Fonctionnalités',
    'nav.pricing': 'Tarifs',
    'nav.about': 'À propos',
    'nav.contact': 'Contact',
    'cta.start': 'Commencez Votre Parcours d\'Apprentissage',
    'cta.demo': 'Voir la Démo',
    'cta.test': 'Vérifier la Santé du Système',
    'features.adaptive.title': 'Intelligence Adaptative',
    'features.voice.title': 'Apprentissage Vocal Naturel',
    'features.content.title': 'Analyse Intelligente de Contenu',
    'language.select': 'Sélectionner la Langue',
    'curriculum.title': 'Choisissez Votre Programme',
    'curriculum.create': 'Créer un Programme Personnalisé',
    'curriculum.browse': 'Parcourir les Programmes Disponibles'
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language') as Language;
    if (savedLanguage && translations[savedLanguage]) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('preferred-language', lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
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
