
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja' | 'pt' | 'it' | 'ru' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Comprehensive translations
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
    'cta.demo': 'Ver Demostración en Vivo',
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
    'cta.demo': 'Voir la Démo en Direct',
    'features.adaptive.title': 'Intelligence Adaptative',
    'features.voice.title': 'Apprentissage Vocal Naturel',
    'features.content.title': 'Analyse Intelligente de Contenu',
    'language.select': 'Sélectionner la Langue',
    'curriculum.title': 'Choisissez Votre Programme',
    'curriculum.create': 'Créer un Programme Personnalisé',
    'curriculum.browse': 'Parcourir les Programmes Disponibles'
  },
  de: {
    'hero.title': 'Revolutionieren Sie das Lernen mit KI-gestützter Bildung',
    'hero.subtitle': 'Erleben Sie die Zukunft personalisierter Bildung mit TeachlyAIs fortschrittlicher künstlicher Intelligenz',
    'nav.features': 'Funktionen',
    'nav.pricing': 'Preise',
    'nav.about': 'Über uns',
    'nav.contact': 'Kontakt',
    'cta.start': 'Starten Sie Ihre Lernreise',
    'cta.demo': 'Live-Demo ansehen',
    'features.adaptive.title': 'Adaptive Intelligenz',
    'features.voice.title': 'Natürliches Sprachlernen',
    'features.content.title': 'Intelligente Inhaltsanalyse',
    'language.select': 'Sprache auswählen',
    'curriculum.title': 'Wählen Sie Ihren Lehrplan',
    'curriculum.create': 'Benutzerdefinierten Lehrplan erstellen',
    'curriculum.browse': 'Verfügbare Lehrpläne durchsuchen'
  },
  zh: {
    'hero.title': '用AI驱动的教育革命化学习',
    'hero.subtitle': '体验TeachlyAI先进人工智能带来的个性化教育未来',
    'nav.features': '功能',
    'nav.pricing': '定价',
    'nav.about': '关于我们',
    'nav.contact': '联系我们',
    'cta.start': '开始您的学习之旅',
    'cta.demo': '查看现场演示',
    'features.adaptive.title': '自适应智能',
    'features.voice.title': '自然语音学习',
    'features.content.title': '智能内容分析',
    'language.select': '选择语言',
    'curriculum.title': '选择您的课程',
    'curriculum.create': '创建自定义课程',
    'curriculum.browse': '浏览可用课程'
  },
  ja: {
    'hero.title': 'AI駆動教育で学習を革命化',
    'hero.subtitle': 'TeachlyAIの先進的人工知能によるパーソナライズ教育の未来を体験',
    'nav.features': '機能',
    'nav.pricing': '料金',
    'nav.about': '会社概要',
    'nav.contact': 'お問い合わせ',
    'cta.start': '学習の旅を始める',
    'cta.demo': 'ライブデモを見る',
    'features.adaptive.title': '適応型知能',
    'features.voice.title': '自然音声学習',
    'features.content.title': 'スマートコンテンツ分析',
    'language.select': '言語を選択',
    'curriculum.title': 'カリキュラムを選択',
    'curriculum.create': 'カスタムカリキュラムを作成',
    'curriculum.browse': '利用可能なカリキュラムを閲覧'
  },
  pt: {
    'hero.title': 'Revolucione o Aprendizado com Educação Impulsionada por IA',
    'hero.subtitle': 'Experimente o futuro da educação personalizada com a inteligência artificial avançada da TeachlyAI',
    'nav.features': 'Recursos',
    'nav.pricing': 'Preços',
    'nav.about': 'Sobre',
    'nav.contact': 'Contato',
    'cta.start': 'Comece Sua Jornada de Aprendizado',
    'cta.demo': 'Ver Demo ao Vivo',
    'features.adaptive.title': 'Inteligência Adaptativa',
    'features.voice.title': 'Aprendizado de Voz Natural',
    'features.content.title': 'Análise Inteligente de Conteúdo',
    'language.select': 'Selecionar Idioma',
    'curriculum.title': 'Escolha Seu Currículo',
    'curriculum.create': 'Criar Currículo Personalizado',
    'curriculum.browse': 'Navegar Currículos Disponíveis'
  },
  it: {
    'hero.title': 'Rivoluziona l\'Apprendimento con l\'Educazione Alimentata dall\'IA',
    'hero.subtitle': 'Sperimenta il futuro dell\'educazione personalizzata con l\'intelligenza artificiale avanzata di TeachlyAI',
    'nav.features': 'Caratteristiche',
    'nav.pricing': 'Prezzi',
    'nav.about': 'Chi siamo',
    'nav.contact': 'Contatto',
    'cta.start': 'Inizia il Tuo Viaggio di Apprendimento',
    'cta.demo': 'Guarda Demo dal Vivo',
    'features.adaptive.title': 'Intelligenza Adattiva',
    'features.voice.title': 'Apprendimento Vocale Naturale',
    'features.content.title': 'Analisi Intelligente dei Contenuti',
    'language.select': 'Seleziona Lingua',
    'curriculum.title': 'Scegli il Tuo Curriculum',
    'curriculum.create': 'Crea Curriculum Personalizzato',
    'curriculum.browse': 'Sfoglia Curriculum Disponibili'
  },
  ru: {
    'hero.title': 'Революционизируйте обучение с образованием на базе ИИ',
    'hero.subtitle': 'Испытайте будущее персонализированного образования с передовым искусственным интеллектом TeachlyAI',
    'nav.features': 'Возможности',
    'nav.pricing': 'Цены',
    'nav.about': 'О нас',
    'nav.contact': 'Контакт',
    'cta.start': 'Начните Ваше Обучение',
    'cta.demo': 'Посмотреть Живую Демо',
    'features.adaptive.title': 'Адаптивный Интеллект',
    'features.voice.title': 'Естественное Голосовое Обучение',
    'features.content.title': 'Умный Анализ Контента',
    'language.select': 'Выберите Язык',
    'curriculum.title': 'Выберите Вашу Программу',
    'curriculum.create': 'Создать Пользовательскую Программу',
    'curriculum.browse': 'Просмотреть Доступные Программы'
  },
  ar: {
    'hero.title': 'ثورة في التعلم مع التعليم المدعوم بالذكاء الاصطناعي',
    'hero.subtitle': 'اختبر مستقبل التعليم الشخصي مع الذكاء الاصطناعي المتقدم من TeachlyAI',
    'nav.features': 'الميزات',
    'nav.pricing': 'الأسعار',
    'nav.about': 'حولنا',
    'nav.contact': 'اتصل بنا',
    'cta.start': 'ابدأ رحلة التعلم',
    'cta.demo': 'شاهد العرض التوضيحي المباشر',
    'features.adaptive.title': 'الذكاء التكيفي',
    'features.voice.title': 'التعلم الصوتي الطبيعي',
    'features.content.title': 'تحليل المحتوى الذكي',
    'language.select': 'اختر اللغة',
    'curriculum.title': 'اختر المنهج الخاص بك',
    'curriculum.create': 'إنشاء منهج مخصص',
    'curriculum.browse': 'تصفح المناهج المتاحة'
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
