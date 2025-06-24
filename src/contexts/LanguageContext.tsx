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
    'cta.demo': 'Try Demo',
    'features.adaptive.title': 'Adaptive Intelligence',
    'features.voice.title': 'Natural Voice Learning',
    'features.content.title': 'Smart Content Analysis',
    'features.gamified.title': 'Gamified Learning Journey',
    'features.analytics.title': 'Advanced Analytics',
    'features.collaborative.title': 'Collaborative Environment',
    'features.section.title': 'Powerful Features for Modern Learning',
    'features.section.subtitle': 'Experience cutting-edge educational technology designed to make learning engaging, effective, and accessible to everyone.',
    'features.adaptive.desc': 'Our AI adapts to each student\'s learning style, pace, and preferences, creating truly personalized educational experiences that evolve with the learner.',
    'features.voice.desc': 'Engage in natural conversations with our AI tutor through voice or text, making learning as easy as having a conversation with a knowledgeable friend.',
    'features.content.desc': 'Upload any document, image, or resource and our AI instantly creates interactive lessons, quizzes, and learning materials tailored to the content.',
    'features.gamified.desc': 'Transform education into an adventure with quests, achievements, leaderboards, and rewards that motivate students to reach their full potential.',
    'features.analytics.desc': 'Comprehensive insights into learning progress, strengths, weaknesses, and recommendations for improvement with detailed visual analytics.',
    'features.collaborative.desc': 'Connect students, teachers, and parents in a unified platform that promotes collaboration, communication, and shared learning goals.',
    'language.select': 'Select Language',
    'curriculum.title': 'Choose Your Curriculum',
    'curriculum.create': 'Create Custom Curriculum',
    'curriculum.browse': 'Browse Available Curricula',
    'pricing.individual': 'Individual',
    'pricing.family': 'Family', 
    'pricing.school': 'School',
    'pricing.individual.price': '$19',
    'pricing.family.price': '$39',
    'pricing.school.price': '$34',
    'pricing.month': '/month',
    'pricing.most.popular': 'Most Popular',
    'pricing.get.started': 'Get Started',
    'pricing.contact.sales': 'Contact Sales',
    'about.title': 'About TeachlyAI',
    'about.subtitle': 'We\'re on a mission to democratize quality education through artificial intelligence, making personalized learning accessible to every student, everywhere.',
    'about.vision.title': 'Our Vision',
    'about.vision.desc1': 'We believe every student deserves access to personalized, high-quality education. Our AI-powered platform adapts to individual learning styles, making education more effective, engaging, and accessible than ever before.',
    'about.vision.desc2': 'Founded by educators and technologists, TeachlyAI combines decades of teaching experience with cutting-edge artificial intelligence to create learning experiences that truly work for every student.',
    'contact.title': 'Get in Touch',
    'contact.subtitle': 'Have questions? We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.',
    'final.cta.title': 'Ready to Transform Learning?',
    'final.cta.subtitle': 'Join thousands of students, teachers, and parents who are already experiencing the future of education with TeachlyAI.',
    'final.cta.trial': 'Start Your Free Trial',
    'final.cta.demo': 'Try Demo'
  },
  es: {
    'hero.title': 'Revoluciona el Aprendizaje con Educación Impulsada por IA',
    'hero.subtitle': 'Experimenta el futuro de la educación personalizada con la inteligencia artificial avanzada de TeachlyAI',
    'nav.features': 'Características',
    'nav.pricing': 'Precios',
    'nav.about': 'Acerca de',
    'nav.contact': 'Contacto',
    'cta.start': 'Comienza tu Viaje de Aprendizaje',
    'cta.demo': 'Probar Demo',
    'features.adaptive.title': 'Inteligencia Adaptativa',
    'features.voice.title': 'Aprendizaje de Voz Natural',
    'features.content.title': 'Análisis Inteligente de Contenido',
    'features.gamified.title': 'Viaje de Aprendizaje Gamificado',
    'features.analytics.title': 'Análisis Avanzado',
    'features.collaborative.title': 'Entorno Colaborativo',
    'features.section.title': 'Características Poderosas para el Aprendizaje Moderno',
    'features.section.subtitle': 'Experimenta tecnología educativa de vanguardia diseñada para hacer el aprendizaje atractivo, efectivo y accesible para todos.',
    'features.adaptive.desc': 'Nuestra IA se adapta al estilo de aprendizaje, ritmo y preferencias de cada estudiante, creando experiencias educativas verdaderamente personalizadas que evolucionan con el aprendiz.',
    'features.voice.desc': 'Participa en conversaciones naturales con nuestro tutor de IA a través de voz o texto, haciendo el aprendizaje tan fácil como tener una conversación con un amigo conocedor.',
    'features.content.desc': 'Sube cualquier documento, imagen o recurso y nuestra IA crea instantáneamente lecciones interactivas, cuestionarios y materiales de aprendizaje adaptados al contenido.',
    'features.gamified.desc': 'Transforma la educación en una aventura con misiones, logros, tablas de clasificación y recompensas que motivan a los estudiantes a alcanzar su máximo potencial.',
    'features.analytics.desc': 'Conocimientos integrales sobre el progreso de aprendizaje, fortalezas, debilidades y recomendaciones para mejorar con análisis visuales detallados.',
    'features.collaborative.desc': 'Conecta estudiantes, profesores y padres en una plataforma unificada que promueve la colaboración, comunicación y objetivos de aprendizaje compartidos.',
    'language.select': 'Seleccionar Idioma',
    'curriculum.title': 'Elige tu Currículo',
    'curriculum.create': 'Crear Currículo Personalizado',
    'curriculum.browse': 'Explorar Currículos Disponibles',
    'pricing.individual': 'Individual',
    'pricing.family': 'Familia',
    'pricing.school': 'Escuela',
    'pricing.individual.price': '$19',
    'pricing.family.price': '$39',
    'pricing.school.price': '$34',
    'pricing.month': '/mes',
    'pricing.most.popular': 'Más Popular',
    'pricing.get.started': 'Comenzar',
    'pricing.contact.sales': 'Contactar Ventas',
    'about.title': 'Acerca de TeachlyAI',
    'about.subtitle': 'Estamos en una misión para democratizar la educación de calidad a través de la inteligencia artificial, haciendo el aprendizaje personalizado accesible a cada estudiante, en todas partes.',
    'about.vision.title': 'Nuestra Visión',
    'about.vision.desc1': 'Creemos que cada estudiante merece acceso a educación personalizada y de alta calidad. Nuestra plataforma impulsada por IA se adapta a estilos individuales de aprendizaje, haciendo la educación más efectiva, atractiva y accesible que nunca.',
    'about.vision.desc2': 'Fundado por educadores y tecnólogos, TeachlyAI combina décadas de experiencia en enseñanza con inteligencia artificial de vanguardia para crear experiencias de aprendizaje que realmente funcionan para cada estudiante.',
    'contact.title': 'Ponte en Contacto',
    'contact.subtitle': '¿Tienes preguntas? Nos encantaría saber de ti. Envíanos un mensaje y responderemos lo antes posible.',
    'final.cta.title': '¿Listo para Transformar el Aprendizaje?',
    'final.cta.subtitle': 'Únete a miles de estudiantes, profesores y padres que ya están experimentando el futuro de la educación con TeachlyAI.',
    'final.cta.trial': 'Comienza tu Prueba Gratuita',
    'final.cta.demo': 'Probar Demo'
  },
  fr: {
    'hero.title': 'Révolutionnez l\'Apprentissage avec l\'Éducation Alimentée par l\'IA',
    'hero.subtitle': 'Découvrez l\'avenir de l\'éducation personnalisée avec l\'intelligence artificielle avancée de TeachlyAI',
    'nav.features': 'Fonctionnalités',
    'nav.pricing': 'Tarifs',
    'nav.about': 'À propos',
    'nav.contact': 'Contact',
    'cta.start': 'Commencez Votre Parcours d\'Apprentissage',
    'cta.demo': 'Essayer Démo',
    'features.adaptive.title': 'Intelligence Adaptative',
    'features.voice.title': 'Apprentissage Vocal Naturel',
    'features.content.title': 'Analyse Intelligente de Contenu',
    'features.gamified.title': 'Parcours Ludique d\'Apprentissage',
    'features.analytics.title': 'Analytiques Avancées',
    'features.collaborative.title': 'Environnement Collaboratif',
    'features.section.title': 'Fonctionnalités Puissantes pour l\'Apprentissage Moderne',
    'features.section.subtitle': 'Découvrez une technologie éducative de pointe conçue pour rendre l\'apprentissage engageant, efficace et accessible à tous.',
    'features.adaptive.desc': 'Notre IA s\'adapte au style d\'apprentissage, au rythme et aux préférences de chaque étudiant, créant des expériences éducatives véritablement personnalisées qui évoluent avec l\'apprenant.',
    'features.voice.desc': 'Engagez-vous dans des conversations naturelles avec notre tuteur IA via la voix ou le texte, rendant l\'apprentissage aussi facile qu\'une conversation avec un ami connaisseur.',
    'features.content.desc': 'Téléchargez n\'importe quel document, image ou ressource et notre IA crée instantanément des leçons interactives, des quiz et des supports d\'apprentissage adaptés au contenu.',
    'features.gamified.desc': 'Transformez l\'éducation en une aventure avec des quêtes, des réalisations, des classements et des récompenses qui motivent les étudiants à atteindre leur plein potentiel.',
    'features.analytics.desc': 'Des insights complets sur les progrès d\'apprentissage, les forces, les faiblesses et des recommandations d\'amélioration avec des analyses visuelles détaillées.',
    'features.collaborative.desc': 'Connectez étudiants, enseignants et parents sur une plateforme unifiée qui favorise la collaboration, la communication et des objectifs d\'apprentissage partagés.',
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
    'cta.demo': 'Demo Ausprobieren',
    'features.adaptive.title': 'Adaptive Intelligenz',
    'features.voice.title': 'Natürliches Sprachlernen',
    'features.content.title': 'Intelligente Inhaltsanalyse',
    'features.gamified.title': 'Spielerische Lernreise',
    'features.analytics.title': 'Erweiterte Analytik',
    'features.collaborative.title': 'Kollaborative Umgebung',
    'features.section.title': 'Mächtige Funktionen für Modernes Lernen',
    'features.section.subtitle': 'Erleben Sie modernste Bildungstechnologie, die darauf ausgelegt ist, das Lernen ansprechend, effektiv und für alle zugänglich zu machen.',
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
    'cta.demo': '试用演示',
    'features.adaptive.title': '自适应智能',
    'features.voice.title': '自然语音学习',
    'features.content.title': '智能内容分析',
    'features.gamified.title': '游戏化学习之旅',
    'features.analytics.title': '高级分析',
    'features.collaborative.title': '协作环境',
    'features.section.title': '现代学习的强大功能',
    'features.section.subtitle': '体验尖端教育技术，旨在使学习变得引人入胜、有效且对每个人都可获得。',
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
    'cta.demo': 'デモを試す',
    'features.adaptive.title': '適応型知能',
    'features.voice.title': '自然音声学習',
    'features.content.title': 'スマートコンテンツ分析',
    'features.gamified.title': 'ゲーミフィケーション学習',
    'features.analytics.title': '高度な分析',
    'features.collaborative.title': '協力的環境',
    'features.section.title': '現代学習のための強力な機能',
    'features.section.subtitle': '学習を魅力的で効果的、そして誰にでもアクセス可能にするために設計された最先端の教育技術を体験してください。',
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
    'cta.demo': 'Experimentar Demo',
    'features.adaptive.title': 'Inteligência Adaptativa',
    'features.voice.title': 'Aprendizado de Voz Natural',
    'features.content.title': 'Análise Inteligente de Conteúdo',
    'features.gamified.title': 'Jornada Gamificada de Aprendizado',
    'features.analytics.title': 'Análises Avançadas',
    'features.collaborative.title': 'Ambiente Colaborativo',
    'features.section.title': 'Recursos Poderosos para Aprendizado Moderno',
    'features.section.subtitle': 'Experimente tecnologia educacional de ponta projetada para tornar o aprendizado envolvente, eficaz e acessível a todos.',
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
    'cta.demo': 'Prova Demo',
    'features.adaptive.title': 'Intelligenza Adattiva',
    'features.voice.title': 'Apprendimento Vocale Naturale',
    'features.content.title': 'Analisi Intelligente dei Contenuti',
    'features.gamified.title': 'Viaggio di Apprendimento Gamificato',
    'features.analytics.title': 'Analitiche Avanzate',
    'features.collaborative.title': 'Ambiente Collaborativo',
    'features.section.title': 'Funzionalità Potenti per l\'Apprendimento Moderno',
    'features.section.subtitle': 'Sperimenta la tecnologia educativa all\'avanguardia progettata per rendere l\'apprendimento coinvolgente, efficace e accessibile a tutti.',
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
    'cta.demo': 'Попробовать Демо',
    'features.adaptive.title': 'Адаптивный Интеллект',
    'features.voice.title': 'Естественное Голосовое Обучение',
    'features.content.title': 'Умный Анализ Контента',
    'features.gamified.title': 'Игровое Обучение',
    'features.analytics.title': 'Продвинутая Аналитика',
    'features.collaborative.title': 'Совместная Среда',
    'features.section.title': 'Мощные Функции для Современного Обучения',
    'features.section.subtitle': 'Испытайте передовые образовательные технологии, разработанные для того, чтобы сделать обучение увлекательным, эффективным и доступным для всех.',
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
    'cta.demo': 'جرب العرض التوضيحي',
    'features.adaptive.title': 'الذكاء التكيفي',
    'features.voice.title': 'التعلم الصوتي الطبيعي',
    'features.content.title': 'تحليل المحتوى الذكي',
    'features.gamified.title': 'رحلة التعلم التفاعلية',
    'features.analytics.title': 'التحليلات المتقدمة',
    'features.collaborative.title': 'البيئة التعاونية',
    'features.section.title': 'ميزات قوية للتعلم الحديث',
    'features.section.subtitle': 'اختبر التكنولوجيا التعليمية المتطورة المصممة لجعل التعلم جذاباً وفعالاً ومتاحاً للجميع.',
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
