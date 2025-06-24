
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja' | 'pt' | 'it' | 'ru' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Header
    'nav.features': 'Features',
    'nav.pricing': 'Pricing',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.login': 'Log In',
    'nav.signup': 'Sign Up',
    'nav.demo': 'Try Demo',

    // Hero Section
    'hero.title': 'Transform Learning with AI-Powered Education',
    'hero.subtitle': 'Personalized, adaptive learning that grows with every student. Experience the future of education with our intelligent tutoring system.',
    'cta.start': 'Start Your Learning Journey',
    'cta.demo': 'Try Demo',

    // Features Section
    'features.section.title': 'Powerful Features for Modern Learning',
    'features.section.subtitle': 'Discover how our AI-powered platform revolutionizes education with personalized, engaging, and effective learning experiences.',
    
    'features.adaptive.title': 'Adaptive AI Learning',
    'features.adaptive.desc': 'Our AI adapts to each student\'s learning style, pace, and preferences for optimal educational outcomes.',
    
    'features.voice.title': 'Voice Interaction',
    'features.voice.desc': 'Natural voice conversations make learning more engaging and accessible for all students.',
    
    'features.content.title': 'Smart Content Creation',
    'features.content.desc': 'AI generates personalized learning materials, quizzes, and explanations tailored to individual needs.',
    
    'features.gamified.title': 'Gamified Experience',
    'features.gamified.desc': 'Achievement systems, progress tracking, and interactive challenges keep students motivated.',
    
    'features.analytics.title': 'Real-time Analytics',
    'features.analytics.desc': 'Comprehensive insights into learning progress, strengths, and areas for improvement.',
    
    'features.collaborative.title': 'Collaborative Learning',
    'features.collaborative.desc': 'Connect students, teachers, and parents in a unified learning ecosystem.',

    // Subjects Section
    'subjects.title': 'Comprehensive Subject Coverage',
    'subjects.subtitle': 'From elementary basics to advanced topics, our AI tutor covers all major subjects with depth and expertise.',
    
    'subjects.mathematics.title': 'Mathematics',
    'subjects.mathematics.desc': 'Algebra, geometry, calculus, and more',
    
    'subjects.sciences.title': 'Sciences',
    'subjects.sciences.desc': 'Physics, chemistry, biology, earth sciences',
    
    'subjects.literature.title': 'Literature',
    'subjects.literature.desc': 'Reading, writing, grammar, literature analysis',
    
    'subjects.social.title': 'Social Studies',
    'subjects.social.desc': 'History, geography, civics, economics',
    
    'subjects.technology.title': 'Technology',
    'subjects.technology.desc': 'Computer science, coding, digital literacy',
    
    'subjects.arts.title': 'Arts',
    'subjects.arts.desc': 'Visual arts, music, creative expression',
    
    'subjects.languages.title': 'Languages',
    'subjects.languages.desc': 'Foreign language learning and practice',
    
    'subjects.health.title': 'Health & PE',
    'subjects.health.desc': 'Physical education, health, wellness',

    // Advanced Features
    'advanced.title': 'Advanced Learning Technology',
    
    'advanced.adaptive.title': 'Personalized Learning Paths',
    'advanced.adaptive.desc': 'AI creates unique learning journeys based on individual strengths, weaknesses, and learning preferences.',
    
    'advanced.feedback.title': 'Instant Feedback',
    'advanced.feedback.desc': 'Real-time corrections and explanations help students learn from mistakes immediately.',
    
    'advanced.safe.title': 'Safe Learning Environment',
    'advanced.safe.desc': 'Child-safe AI with appropriate content filtering and parental controls.',
    
    'advanced.availability.title': '24/7 Availability',
    'advanced.availability.desc': 'Learn anytime, anywhere with our always-available AI tutor.',

    // Achievement Section
    'achievement.title': 'Track Your Progress',
    'achievement.desc': 'Monitor learning achievements and celebrate milestones with our comprehensive progress tracking system.',
    'achievement.streak': 'Learning Streak',
    'achievement.progress': 'Making Progress',
    'achievement.problems': 'Problems Solved',
    'achievement.tracking': 'Smart Tracking',
    'achievement.level': 'Current Level',
    'achievement.growing': 'Keep Growing',

    // Testimonials
    'testimonials.title': 'What Educators Are Saying',
    'testimonials.subtitle': 'Hear from teachers, parents, and students who have transformed their learning experience.',
    
    'testimonials.teacher': 'High School Teacher',
    'testimonials.teacher.content': 'This AI tutor has revolutionized how I support my students. The personalized feedback and adaptive learning paths have significantly improved engagement and outcomes.',
    
    'testimonials.parent': 'Parent of Two Students',
    'testimonials.parent.content': 'My children love the interactive lessons and voice features. Their grades have improved, and more importantly, they\'re excited about learning again.',
    
    'testimonials.principal': 'School Principal',
    'testimonials.principal.content': 'Implementing this AI learning platform has been a game-changer for our school. Teachers can focus on creativity while AI handles personalized instruction.',

    // Pricing Section
    'pricing.title': 'Choose Your Learning Plan',
    'pricing.subtitle': 'Flexible pricing options to fit every learning need, from individual students to entire schools.',
    
    'pricing.individual': 'Individual',
    'pricing.individual.price': '$9.99',
    'pricing.individual.feature1': 'One student account',
    'pricing.individual.feature2': 'All subject areas',
    'pricing.individual.feature3': 'Progress tracking',
    'pricing.individual.feature4': 'Voice interaction',
    
    'pricing.family': 'Family',
    'pricing.family.price': '$19.99',
    'pricing.family.feature1': 'Up to 4 student accounts',
    'pricing.family.feature2': 'Parental dashboard',
    'pricing.family.feature3': 'Family progress reports',
    'pricing.family.feature4': 'Priority support',
    
    'pricing.school': 'School',
    'pricing.school.price': 'Custom',
    'pricing.school.feature1': 'Unlimited students',
    'pricing.school.feature2': 'Teacher dashboard',
    'pricing.school.feature3': 'Custom curricula',
    'pricing.school.feature4': 'Admin analytics',
    
    'pricing.month': '/month',
    'pricing.most.popular': 'Most Popular',
    'pricing.get.started': 'Get Started',
    'pricing.contact.sales': 'Contact Sales',

    // FAQ Section
    'faq.title': 'Frequently Asked Questions',
    
    'faq.q1': 'How does the AI adapt to different learning styles?',
    'faq.a1': 'Our AI analyzes student responses, learning pace, and preferences to create personalized learning paths. It adjusts difficulty levels, teaching methods, and content delivery based on individual needs.',
    
    'faq.q2': 'Is the content appropriate for all age groups?',
    'faq.a2': 'Yes, our AI includes comprehensive content filtering and age-appropriate material selection. Parents and teachers can set additional restrictions and monitor all interactions.',
    
    'faq.q3': 'Can teachers integrate this with existing curricula?',
    'faq.a3': 'Absolutely! Our platform supports custom curriculum integration and aligns with major educational standards including Common Core, IB, and others.',
    
    'faq.q4': 'What subjects are covered?',
    'faq.a4': 'We cover all major subjects including Mathematics, Sciences, Language Arts, Social Studies, Foreign Languages, and more, from elementary through high school levels.',
    
    'faq.q5': 'How secure is student data?',
    'faq.a5': 'We prioritize student privacy with enterprise-grade security, COPPA compliance, and transparent data practices. Student data is encrypted and never shared with third parties.',
    
    'faq.q6': 'Is there offline functionality?',
    'faq.a6': 'While core features require internet connectivity for AI processing, we offer offline study materials and progress syncing when connection is restored.',

    // About Section
    'about.title': 'About TeachlyAI',
    'about.subtitle': 'We\'re on a mission to democratize quality education through artificial intelligence, making personalized learning accessible to every student worldwide.',
    
    'about.vision.title': 'Our Vision',
    'about.vision.desc1': 'We believe every student deserves personalized attention and the opportunity to learn at their own pace. Traditional one-size-fits-all education often leaves students behind or fails to challenge them appropriately.',
    'about.vision.desc2': 'Our AI-powered platform bridges this gap by providing individualized instruction, real-time feedback, and adaptive learning experiences that grow with each student.',
    
    'about.impact.title': 'Our Impact',
    'about.impact.desc': 'Transforming education through innovation',
    'about.impact.ai': 'AI-Powered',
    'about.impact.learning': 'Personalized Learning',
    'about.impact.global': '24/7',
    'about.impact.accessibility': 'Global Accessibility',
    'about.impact.adaptive': 'Adaptive',
    'about.impact.curriculum': 'Smart Curriculum',
    'about.impact.realtime': 'Real-time',
    'about.impact.analytics': 'Progress Analytics',

    // Contact Section
    'contact.title': 'Get in Touch',
    'contact.subtitle': 'Have questions about TeachlyAI? We\'d love to hear from you and help you get started.',
    
    'contact.form.name': 'Full Name',
    'contact.form.name.placeholder': 'Enter your full name',
    'contact.form.email': 'Email Address',
    'contact.form.email.placeholder': 'Enter your email address',
    'contact.form.message': 'Message',
    'contact.form.message.placeholder': 'Tell us how we can help you...',
    'contact.form.send': 'Send Message',

    // Final CTA
    'final.cta.title': 'Ready to Transform Learning?',
    'final.cta.subtitle': 'Join thousands of students, teachers, and parents who are already experiencing the future of education.',
    'final.cta.trial': 'Start Free Trial',
    'final.cta.demo': 'Watch Demo',

    // Footer
    'footer.description': 'Empowering students worldwide with AI-driven personalized learning experiences.',
    'footer.product': 'Product',
    'footer.features': 'Features',
    'footer.pricing': 'Pricing',
    'footer.demo': 'Demo',
    'footer.company': 'Company',
    'footer.about': 'About Us',
    'footer.blog': 'Blog',
    'footer.careers': 'Careers',
    'footer.support': 'Support',
    'footer.help': 'Help Center',
    'footer.documentation': 'Documentation',
    'footer.community': 'Community',
    'footer.legal': 'Legal',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Service',
    'footer.cookies': 'Cookie Policy',
    'footer.rights': 'All rights reserved.',
  },
  es: {
    // Header
    'nav.features': 'Características',
    'nav.pricing': 'Precios',
    'nav.about': 'Acerca de',
    'nav.contact': 'Contacto',
    'nav.login': 'Iniciar Sesión',
    'nav.signup': 'Registrarse',
    'nav.demo': 'Probar Demo',

    // Hero Section
    'hero.title': 'Transforma el Aprendizaje con Educación Impulsada por IA',
    'hero.subtitle': 'Aprendizaje personalizado y adaptativo que crece con cada estudiante. Experimenta el futuro de la educación con nuestro sistema de tutoría inteligente.',
    'cta.start': 'Comienza tu Viaje de Aprendizaje',
    'cta.demo': 'Probar Demo',

    // Features Section
    'features.section.title': 'Características Poderosas para el Aprendizaje Moderno',
    'features.section.subtitle': 'Descubre cómo nuestra plataforma impulsada por IA revoluciona la educación con experiencias de aprendizaje personalizadas, atractivas y efectivas.',
    
    'features.adaptive.title': 'Aprendizaje IA Adaptativo',
    'features.adaptive.desc': 'Nuestra IA se adapta al estilo de aprendizaje, ritmo y preferencias de cada estudiante para resultados educativos óptimos.',
    
    'features.voice.title': 'Interacción por Voz',
    'features.voice.desc': 'Las conversaciones de voz naturales hacen que el aprendizaje sea más atractivo y accesible para todos los estudiantes.',
    
    'features.content.title': 'Creación de Contenido Inteligente',
    'features.content.desc': 'La IA genera materiales de aprendizaje personalizados, cuestionarios y explicaciones adaptadas a las necesidades individuales.',
    
    'features.gamified.title': 'Experiencia Gamificada',
    'features.gamified.desc': 'Sistemas de logros, seguimiento de progreso y desafíos interactivos mantienen a los estudiantes motivados.',
    
    'features.analytics.title': 'Análisis en Tiempo Real',
    'features.analytics.desc': 'Información integral sobre el progreso de aprendizaje, fortalezas y áreas de mejora.',
    
    'features.collaborative.title': 'Aprendizaje Colaborativo',
    'features.collaborative.desc': 'Conecta estudiantes, profesores y padres en un ecosistema de aprendizaje unificado.',

    // Subjects Section
    'subjects.title': 'Cobertura Integral de Materias',
    'subjects.subtitle': 'Desde conceptos básicos elementales hasta temas avanzados, nuestro tutor IA cubre todas las materias principales con profundidad y experiencia.',
    
    'subjects.mathematics.title': 'Matemáticas',
    'subjects.mathematics.desc': 'Álgebra, geometría, cálculo y más',
    
    'subjects.sciences.title': 'Ciencias',
    'subjects.sciences.desc': 'Física, química, biología, ciencias de la tierra',
    
    'subjects.literature.title': 'Literatura',
    'subjects.literature.desc': 'Lectura, escritura, gramática, análisis literario',
    
    'subjects.social.title': 'Estudios Sociales',
    'subjects.social.desc': 'Historia, geografía, cívica, economía',
    
    'subjects.technology.title': 'Tecnología',
    'subjects.technology.desc': 'Ciencias de la computación, programación, alfabetización digital',
    
    'subjects.arts.title': 'Artes',
    'subjects.arts.desc': 'Artes visuales, música, expresión creativa',
    
    'subjects.languages.title': 'Idiomas',
    'subjects.languages.desc': 'Aprendizaje y práctica de idiomas extranjeros',
    
    'subjects.health.title': 'Salud y EF',
    'subjects.health.desc': 'Educación física, salud, bienestar',

    // Advanced Features
    'advanced.title': 'Tecnología de Aprendizaje Avanzada',
    
    'advanced.adaptive.title': 'Rutas de Aprendizaje Personalizadas',
    'advanced.adaptive.desc': 'La IA crea viajes de aprendizaje únicos basados en fortalezas, debilidades y preferencias de aprendizaje individuales.',
    
    'advanced.feedback.title': 'Retroalimentación Instantánea',
    'advanced.feedback.desc': 'Las correcciones y explicaciones en tiempo real ayudan a los estudiantes a aprender de los errores inmediatamente.',
    
    'advanced.safe.title': 'Entorno de Aprendizaje Seguro',
    'advanced.safe.desc': 'IA segura para niños con filtrado de contenido apropiado y controles parentales.',
    
    'advanced.availability.title': 'Disponibilidad 24/7',
    'advanced.availability.desc': 'Aprende en cualquier momento, en cualquier lugar con nuestro tutor IA siempre disponible.',

    // Achievement Section
    'achievement.title': 'Rastrea tu Progreso',
    'achievement.desc': 'Monitorea los logros de aprendizaje y celebra los hitos con nuestro sistema integral de seguimiento de progreso.',
    'achievement.streak': 'Racha de Aprendizaje',
    'achievement.progress': 'Haciendo Progreso',
    'achievement.problems': 'Problemas Resueltos',
    'achievement.tracking': 'Seguimiento Inteligente',
    'achievement.level': 'Nivel Actual',
    'achievement.growing': 'Sigue Creciendo',

    // Testimonials
    'testimonials.title': 'Lo que Dicen los Educadores',
    'testimonials.subtitle': 'Escucha a maestros, padres y estudiantes que han transformado su experiencia de aprendizaje.',
    
    'testimonials.teacher': 'Profesora de Secundaria',
    'testimonials.teacher.content': 'Este tutor IA ha revolucionado cómo apoyo a mis estudiantes. La retroalimentación personalizada y las rutas de aprendizaje adaptativas han mejorado significativamente el compromiso y los resultados.',
    
    'testimonials.parent': 'Padre de Dos Estudiantes',
    'testimonials.parent.content': 'A mis hijos les encantan las lecciones interactivas y las funciones de voz. Sus calificaciones han mejorado y, lo más importante, están emocionados por aprender de nuevo.',
    
    'testimonials.principal': 'Director de Escuela',
    'testimonials.principal.content': 'Implementar esta plataforma de aprendizaje IA ha sido un cambio revolucionario para nuestra escuela. Los maestros pueden enfocarse en la creatividad mientras la IA maneja la instrucción personalizada.',

    // Pricing Section
    'pricing.title': 'Elige tu Plan de Aprendizaje',
    'pricing.subtitle': 'Opciones de precios flexibles para satisfacer cada necesidad de aprendizaje, desde estudiantes individuales hasta escuelas enteras.',
    
    'pricing.individual': 'Individual',
    'pricing.individual.price': '$9.99',
    'pricing.individual.feature1': 'Una cuenta de estudiante',
    'pricing.individual.feature2': 'Todas las áreas temáticas',
    'pricing.individual.feature3': 'Seguimiento de progreso',
    'pricing.individual.feature4': 'Interacción por voz',
    
    'pricing.family': 'Familia',
    'pricing.family.price': '$19.99',
    'pricing.family.feature1': 'Hasta 4 cuentas de estudiante',
    'pricing.family.feature2': 'Panel de control parental',
    'pricing.family.feature3': 'Informes de progreso familiar',
    'pricing.family.feature4': 'Soporte prioritario',
    
    'pricing.school': 'Escuela',
    'pricing.school.price': 'Personalizado',
    'pricing.school.feature1': 'Estudiantes ilimitados',
    'pricing.school.feature2': 'Panel de control del maestro',
    'pricing.school.feature3': 'Currículos personalizados',
    'pricing.school.feature4': 'Análisis de administrador',
    
    'pricing.month': '/mes',
    'pricing.most.popular': 'Más Popular',
    'pricing.get.started': 'Comenzar',
    'pricing.contact.sales': 'Contactar Ventas',

    // FAQ Section
    'faq.title': 'Preguntas Frecuentes',
    
    'faq.q1': '¿Cómo se adapta la IA a diferentes estilos de aprendizaje?',
    'faq.a1': 'Nuestra IA analiza las respuestas de los estudiantes, el ritmo de aprendizaje y las preferencias para crear rutas de aprendizaje personalizadas. Ajusta los niveles de dificultad, métodos de enseñanza y entrega de contenido según las necesidades individuales.',
    
    'faq.q2': '¿Es el contenido apropiado para todos los grupos de edad?',
    'faq.a2': 'Sí, nuestra IA incluye filtrado de contenido integral y selección de material apropiado para la edad. Los padres y maestros pueden establecer restricciones adicionales y monitorear todas las interacciones.',
    
    'faq.q3': '¿Pueden los maestros integrar esto con los currículos existentes?',
    'faq.a3': '¡Absolutamente! Nuestra plataforma admite la integración de currículos personalizados y se alinea con los principales estándares educativos, incluido Common Core, IB y otros.',
    
    'faq.q4': '¿Qué materias se cubren?',
    'faq.a4': 'Cubrimos todas las materias principales, incluidas Matemáticas, Ciencias, Artes del Lenguaje, Estudios Sociales, Idiomas Extranjeros y más, desde niveles elementales hasta secundaria.',
    
    'faq.q5': '¿Qué tan seguros están los datos de los estudiantes?',
    'faq.a5': 'Priorizamos la privacidad de los estudiantes con seguridad de nivel empresarial, cumplimiento de COPPA y prácticas de datos transparentes. Los datos de los estudiantes están encriptados y nunca se comparten con terceros.',
    
    'faq.q6': '¿Hay funcionalidad sin conexión?',
    'faq.a6': 'Aunque las características principales requieren conectividad a internet para el procesamiento de IA, ofrecemos materiales de estudio sin conexión y sincronización de progreso cuando se restaura la conexión.',

    // About Section
    'about.title': 'Acerca de TeachlyAI',
    'about.subtitle': 'Estamos en una misión de democratizar la educación de calidad a través de la inteligencia artificial, haciendo que el aprendizaje personalizado sea accesible para cada estudiante en todo el mundo.',
    
    'about.vision.title': 'Nuestra Visión',
    'about.vision.desc1': 'Creemos que cada estudiante merece atención personalizada y la oportunidad de aprender a su propio ritmo. La educación tradicional de talla única a menudo deja a los estudiantes atrás o no los desafía apropiadamente.',
    'about.vision.desc2': 'Nuestra plataforma impulsada por IA cierra esta brecha proporcionando instrucción individualizada, retroalimentación en tiempo real y experiencias de aprendizaje adaptativas que crecen con cada estudiante.',
    
    'about.impact.title': 'Nuestro Impacto',
    'about.impact.desc': 'Transformando la educación a través de la innovación',
    'about.impact.ai': 'Impulsado por IA',
    'about.impact.learning': 'Aprendizaje Personalizado',
    'about.impact.global': '24/7',
    'about.impact.accessibility': 'Accesibilidad Global',
    'about.impact.adaptive': 'Adaptativo',
    'about.impact.curriculum': 'Currículo Inteligente',
    'about.impact.realtime': 'Tiempo Real',
    'about.impact.analytics': 'Análisis de Progreso',

    // Contact Section
    'contact.title': 'Ponte en Contacto',
    'contact.subtitle': '¿Tienes preguntas sobre TeachlyAI? Nos encantaría escucharte y ayudarte a comenzar.',
    
    'contact.form.name': 'Nombre Completo',
    'contact.form.name.placeholder': 'Ingresa tu nombre completo',
    'contact.form.email': 'Dirección de Correo',
    'contact.form.email.placeholder': 'Ingresa tu dirección de correo',
    'contact.form.message': 'Mensaje',
    'contact.form.message.placeholder': 'Cuéntanos cómo podemos ayudarte...',
    'contact.form.send': 'Enviar Mensaje',

    // Final CTA
    'final.cta.title': '¿Listo para Transformar el Aprendizaje?',
    'final.cta.subtitle': 'Únete a miles de estudiantes, maestros y padres que ya están experimentando el futuro de la educación.',
    'final.cta.trial': 'Comenzar Prueba Gratuita',
    'final.cta.demo': 'Ver Demo',

    // Footer
    'footer.description': 'Empoderando a estudiantes en todo el mundo con experiencias de aprendizaje personalizadas impulsadas por IA.',
    'footer.product': 'Producto',
    'footer.features': 'Características',
    'footer.pricing': 'Precios',
    'footer.demo': 'Demo',
    'footer.company': 'Empresa',
    'footer.about': 'Sobre Nosotros',
    'footer.blog': 'Blog',
    'footer.careers': 'Carreras',
    'footer.support': 'Soporte',
    'footer.help': 'Centro de Ayuda',
    'footer.documentation': 'Documentación',
    'footer.community': 'Comunidad',
    'footer.legal': 'Legal',
    'footer.privacy': 'Política de Privacidad',
    'footer.terms': 'Términos de Servicio',
    'footer.cookies': 'Política de Cookies',
    'footer.rights': 'Todos los derechos reservados.',
  },
  fr: {
    // Header
    'nav.features': 'Fonctionnalités',
    'nav.pricing': 'Tarifs',
    'nav.about': 'À propos',
    'nav.contact': 'Contact',
    'nav.login': 'Se connecter',
    'nav.signup': 'S\'inscrire',
    'nav.demo': 'Essayer la Démo',

    // Hero Section
    'hero.title': 'Transformez l\'Apprentissage avec l\'Éducation Alimentée par l\'IA',
    'hero.subtitle': 'Apprentissage personnalisé et adaptatif qui grandit avec chaque étudiant. Découvrez l\'avenir de l\'éducation avec notre système de tutorat intelligent.',
    'cta.start': 'Commencez Votre Parcours d\'Apprentissage',
    'cta.demo': 'Essayer la Démo',

    // Features Section
    'features.section.title': 'Fonctionnalités Puissantes pour l\'Apprentissage Moderne',
    'features.section.subtitle': 'Découvrez comment notre plateforme alimentée par l\'IA révolutionne l\'éducation avec des expériences d\'apprentissage personnalisées, engageantes et efficaces.',
    
    'features.adaptive.title': 'Apprentissage IA Adaptatif',
    'features.adaptive.desc': 'Notre IA s\'adapte au style d\'apprentissage, au rythme et aux préférences de chaque étudiant pour des résultats éducatifs optimaux.',
    
    'features.voice.title': 'Interaction Vocale',
    'features.voice.desc': 'Les conversations vocales naturelles rendent l\'apprentissage plus engageant et accessible pour tous les étudiants.',
    
    'features.content.title': 'Création de Contenu Intelligente',
    'features.content.desc': 'L\'IA génère du matériel d\'apprentissage personnalisé, des quiz et des explications adaptés aux besoins individuels.',
    
    'features.gamified.title': 'Expérience Gamifiée',
    'features.gamified.desc': 'Systèmes de réalisations, suivi des progrès et défis interactifs maintiennent la motivation des étudiants.',
    
    'features.analytics.title': 'Analyses en Temps Réel',
    'features.analytics.desc': 'Aperçus complets sur les progrès d\'apprentissage, les forces et les domaines d\'amélioration.',
    
    'features.collaborative.title': 'Apprentissage Collaboratif',
    'features.collaborative.desc': 'Connecte étudiants, enseignants et parents dans un écosystème d\'apprentissage unifié.',

    // Subjects Section
    'subjects.title': 'Couverture Complète des Matières',
    'subjects.subtitle': 'Des bases élémentaires aux sujets avancés, notre tuteur IA couvre toutes les matières principales avec profondeur et expertise.',
    
    'subjects.mathematics.title': 'Mathématiques',
    'subjects.mathematics.desc': 'Algèbre, géométrie, calcul et plus',
    
    'subjects.sciences.title': 'Sciences',
    'subjects.sciences.desc': 'Physique, chimie, biologie, sciences de la terre',
    
    'subjects.literature.title': 'Littérature',
    'subjects.literature.desc': 'Lecture, écriture, grammaire, analyse littéraire',
    
    'subjects.social.title': 'Études Sociales',
    'subjects.social.desc': 'Histoire, géographie, éducation civique, économie',
    
    'subjects.technology.title': 'Technologie',
    'subjects.technology.desc': 'Informatique, programmation, littératie numérique',
    
    'subjects.arts.title': 'Arts',
    'subjects.arts.desc': 'Arts visuels, musique, expression créative',
    
    'subjects.languages.title': 'Langues',
    'subjects.languages.desc': 'Apprentissage et pratique des langues étrangères',
    
    'subjects.health.title': 'Santé et EP',
    'subjects.health.desc': 'Éducation physique, santé, bien-être',

    // Advanced Features
    'advanced.title': 'Technologie d\'Apprentissage Avancée',
    
    'advanced.adaptive.title': 'Parcours d\'Apprentissage Personnalisés',
    'advanced.adaptive.desc': 'L\'IA crée des parcours d\'apprentissage uniques basés sur les forces, faiblesses et préférences d\'apprentissage individuelles.',
    
    'advanced.feedback.title': 'Retour Instantané',
    'advanced.feedback.desc': 'Les corrections et explications en temps réel aident les étudiants à apprendre de leurs erreurs immédiatement.',
    
    'advanced.safe.title': 'Environnement d\'Apprentissage Sûr',
    'advanced.safe.desc': 'IA sécurisée pour les enfants avec filtrage de contenu approprié et contrôles parentaux.',
    
    'advanced.availability.title': 'Disponibilité 24/7',
    'advanced.availability.desc': 'Apprenez à tout moment, n\'importe où avec notre tuteur IA toujours disponible.',

    // Achievement Section
    'achievement.title': 'Suivez Vos Progrès',
    'achievement.desc': 'Surveillez les réalisations d\'apprentissage et célébrez les étapes importantes avec notre système complet de suivi des progrès.',
    'achievement.streak': 'Série d\'Apprentissage',
    'achievement.progress': 'Faire des Progrès',
    'achievement.problems': 'Problèmes Résolus',
    'achievement.tracking': 'Suivi Intelligent',
    'achievement.level': 'Niveau Actuel',
    'achievement.growing': 'Continuez à Grandir',

    // Testimonials
    'testimonials.title': 'Ce que Disent les Éducateurs',
    'testimonials.subtitle': 'Écoutez les enseignants, parents et étudiants qui ont transformé leur expérience d\'apprentissage.',
    
    'testimonials.teacher': 'Enseignante de Lycée',
    'testimonials.teacher.content': 'Ce tuteur IA a révolutionné la façon dont je soutiens mes étudiants. Les retours personnalisés et les parcours d\'apprentissage adaptatifs ont considérablement amélioré l\'engagement et les résultats.',
    
    'testimonials.parent': 'Parent de Deux Étudiants',
    'testimonials.parent.content': 'Mes enfants adorent les leçons interactives et les fonctionnalités vocales. Leurs notes se sont améliorées et, plus important encore, ils sont excités d\'apprendre à nouveau.',
    
    'testimonials.principal': 'Directeur d\'École',
    'testimonials.principal.content': 'Implémenter cette plateforme d\'apprentissage IA a été un tournant pour notre école. Les enseignants peuvent se concentrer sur la créativité pendant que l\'IA gère l\'instruction personnalisée.',

    // Pricing Section
    'pricing.title': 'Choisissez Votre Plan d\'Apprentissage',
    'pricing.subtitle': 'Options de tarification flexibles pour répondre à chaque besoin d\'apprentissage, des étudiants individuels aux écoles entières.',
    
    'pricing.individual': 'Individuel',
    'pricing.individual.price': '9,99€',
    'pricing.individual.feature1': 'Un compte étudiant',
    'pricing.individual.feature2': 'Toutes les matières',
    'pricing.individual.feature3': 'Suivi des progrès',
    'pricing.individual.feature4': 'Interaction vocale',
    
    'pricing.family': 'Famille',
    'pricing.family.price': '19,99€',
    'pricing.family.feature1': 'Jusqu\'à 4 comptes étudiants',
    'pricing.family.feature2': 'Tableau de bord parental',
    'pricing.family.feature3': 'Rapports de progrès familiaux',
    'pricing.family.feature4': 'Support prioritaire',
    
    'pricing.school': 'École',
    'pricing.school.price': 'Personnalisé',
    'pricing.school.feature1': 'Étudiants illimités',
    'pricing.school.feature2': 'Tableau de bord enseignant',
    'pricing.school.feature3': 'Programmes personnalisés',
    'pricing.school.feature4': 'Analyses administrateur',
    
    'pricing.month': '/mois',
    'pricing.most.popular': 'Le Plus Populaire',
    'pricing.get.started': 'Commencer',
    'pricing.contact.sales': 'Contacter les Ventes',

    // FAQ Section
    'faq.title': 'Questions Fréquemment Posées',
    
    'faq.q1': 'Comment l\'IA s\'adapte-t-elle aux différents styles d\'apprentissage ?',
    'faq.a1': 'Notre IA analyse les réponses des étudiants, le rythme d\'apprentissage et les préférences pour créer des parcours d\'apprentissage personnalisés. Elle ajuste les niveaux de difficulté, les méthodes d\'enseignement et la livraison de contenu selon les besoins individuels.',
    
    'faq.q2': 'Le contenu est-il approprié pour tous les groupes d\'âge ?',
    'faq.a2': 'Oui, notre IA inclut un filtrage de contenu complet et une sélection de matériel approprié à l\'âge. Les parents et enseignants peuvent définir des restrictions supplémentaires et surveiller toutes les interactions.',
    
    'faq.q3': 'Les enseignants peuvent-ils intégrer cela aux programmes existants ?',
    'faq.a3': 'Absolument ! Notre plateforme prend en charge l\'intégration de programmes personnalisés et s\'aligne avec les principaux standards éducatifs, y compris Common Core, IB et autres.',
    
    'faq.q4': 'Quelles matières sont couvertes ?',
    'faq.a4': 'Nous couvrons toutes les matières principales, y compris les Mathématiques, les Sciences, les Arts du Langage, les Études Sociales, les Langues Étrangères et plus, du niveau élémentaire au lycée.',
    
    'faq.q5': 'À quel point les données des étudiants sont-elles sécurisées ?',
    'faq.a5': 'Nous priorisons la confidentialité des étudiants avec une sécurité de niveau entreprise, la conformité COPPA et des pratiques de données transparentes. Les données des étudiants sont cryptées et jamais partagées avec des tiers.',
    
    'faq.q6': 'Y a-t-il une fonctionnalité hors ligne ?',
    'faq.a6': 'Bien que les fonctionnalités principales nécessitent une connectivité internet pour le traitement IA, nous offrons du matériel d\'étude hors ligne et la synchronisation des progrès lorsque la connexion est restaurée.',

    // About Section
    'about.title': 'À propos de TeachlyAI',
    'about.subtitle': 'Nous sommes en mission pour démocratiser l\'éducation de qualité grâce à l\'intelligence artificielle, rendant l\'apprentissage personnalisé accessible à chaque étudiant dans le monde.',
    
    'about.vision.title': 'Notre Vision',
    'about.vision.desc1': 'Nous croyons que chaque étudiant mérite une attention personnalisée et l\'opportunité d\'apprendre à son propre rythme. L\'éducation traditionnelle universelle laisse souvent les étudiants derrière ou ne les défie pas appropriément.',
    'about.vision.desc2': 'Notre plateforme alimentée par l\'IA comble cette lacune en fournissant une instruction individualisée, des retours en temps réel et des expériences d\'apprentissage adaptatives qui grandissent avec chaque étudiant.',
    
    'about.impact.title': 'Notre Impact',
    'about.impact.desc': 'Transformer l\'éducation grâce à l\'innovation',
    'about.impact.ai': 'Alimenté par l\'IA',
    'about.impact.learning': 'Apprentissage Personnalisé',
    'about.impact.global': '24/7',
    'about.impact.accessibility': 'Accessibilité Globale',
    'about.impact.adaptive': 'Adaptatif',
    'about.impact.curriculum': 'Programme Intelligent',
    'about.impact.realtime': 'Temps Réel',
    'about.impact.analytics': 'Analyses de Progrès',

    // Contact Section
    'contact.title': 'Contactez-nous',
    'contact.subtitle': 'Avez-vous des questions sur TeachlyAI ? Nous aimerions vous entendre et vous aider à commencer.',
    
    'contact.form.name': 'Nom Complet',
    'contact.form.name.placeholder': 'Entrez votre nom complet',
    'contact.form.email': 'Adresse E-mail',
    'contact.form.email.placeholder': 'Entrez votre adresse e-mail',
    'contact.form.message': 'Message',
    'contact.form.message.placeholder': 'Dites-nous comment nous pouvons vous aider...',
    'contact.form.send': 'Envoyer le Message',

    // Final CTA
    'final.cta.title': 'Prêt à Transformer l\'Apprentissage ?',
    'final.cta.subtitle': 'Rejoignez des milliers d\'étudiants, enseignants et parents qui expérimentent déjà l\'avenir de l\'éducation.',
    'final.cta.trial': 'Commencer l\'Essai Gratuit',
    'final.cta.demo': 'Voir la Démo',

    // Footer
    'footer.description': 'Autonomiser les étudiants du monde entier avec des expériences d\'apprentissage personnalisées alimentées par l\'IA.',
    'footer.product': 'Produit',
    'footer.features': 'Fonctionnalités',
    'footer.pricing': 'Tarifs',
    'footer.demo': 'Démo',
    'footer.company': 'Entreprise',
    'footer.about': 'À Propos',
    'footer.blog': 'Blog',
    'footer.careers': 'Carrières',
    'footer.support': 'Support',
    'footer.help': 'Centre d\'Aide',
    'footer.documentation': 'Documentation',
    'footer.community': 'Communauté',
    'footer.legal': 'Légal',
    'footer.privacy': 'Politique de Confidentialité',
    'footer.terms': 'Conditions d\'Utilisation',
    'footer.cookies': 'Politique des Cookies',
    'footer.rights': 'Tous droits réservés.',
  },
  de: {
    // Header
    'nav.features': 'Funktionen',
    'nav.pricing': 'Preise',
    'nav.about': 'Über uns',
    'nav.contact': 'Kontakt',
    'nav.login': 'Anmelden',
    'nav.signup': 'Registrieren',
    'nav.demo': 'Demo testen',

    // Hero Section
    'hero.title': 'Transformiere das Lernen mit KI-gesteuerter Bildung',
    'hero.subtitle': 'Personalisiertes, adaptives Lernen, das mit jedem Schüler wächst. Erlebe die Zukunft der Bildung mit unserem intelligenten Nachhilfesystem.',
    'cta.start': 'Starte deine Lernreise',
    'cta.demo': 'Demo testen',

    // Features Section
    'features.section.title': 'Leistungsstarke Funktionen für modernes Lernen',
    'features.section.subtitle': 'Entdecke, wie unsere KI-gestützte Plattform die Bildung mit personalisierten, ansprechenden und effektiven Lernerfahrungen revolutioniert.',
    
    'features.adaptive.title': 'Adaptives KI-Lernen',
    'features.adaptive.desc': 'Unsere KI passt sich an den Lernstil, das Tempo und die Vorlieben jedes Schülers an für optimale Bildungsergebnisse.',
    
    'features.voice.title': 'Sprachinteraktion',
    'features.voice.desc': 'Natürliche Sprachgespräche machen das Lernen ansprechender und zugänglicher für alle Schüler.',
    
    'features.content.title': 'Intelligente Inhaltserstellung',
    'features.content.desc': 'KI generiert personalisierte Lernmaterialien, Quizzes und Erklärungen, die auf individuelle Bedürfnisse zugeschnitten sind.',
    
    'features.gamified.title': 'Gamifizierte Erfahrung',
    'features.gamified.desc': 'Erfolgsysteme, Fortschrittsverfolgung und interaktive Herausforderungen halten Schüler motiviert.',
    
    'features.analytics.title': 'Echtzeitanalysen',
    'features.analytics.desc': 'Umfassende Einblicke in Lernfortschritte, Stärken und Verbesserungsbereiche.',
    
    'features.collaborative.title': 'Kollaboratives Lernen',
    'features.collaborative.desc': 'Verbindet Schüler, Lehrer und Eltern in einem einheitlichen Lernökosystem.',

    // Subjects Section
    'subjects.title': 'Umfassende Fächerabdeckung',
    'subjects.subtitle': 'Von elementaren Grundlagen bis zu fortgeschrittenen Themen deckt unser KI-Tutor alle Hauptfächer mit Tiefe und Expertise ab.',
    
    'subjects.mathematics.title': 'Mathematik',
    'subjects.mathematics.desc': 'Algebra, Geometrie, Analysis und mehr',
    
    'subjects.sciences.title': 'Naturwissenschaften',
    'subjects.sciences.desc': 'Physik, Chemie, Biologie, Geowissenschaften',
    
    'subjects.literature.title': 'Literatur',
    'subjects.literature.desc': 'Lesen, Schreiben, Grammatik, Literaturanalyse',
    
    'subjects.social.title': 'Gesellschaftskunde',
    'subjects.social.desc': 'Geschichte, Geographie, Bürgerkunde, Wirtschaft',
    
    'subjects.technology.title': 'Technologie',
    'subjects.technology.desc': 'Informatik, Programmierung, digitale Kompetenz',
    
    'subjects.arts.title': 'Kunst',
    'subjects.arts.desc': 'Bildende Kunst, Musik, kreativer Ausdruck',
    
    'subjects.languages.title': 'Sprachen',
    'subjects.languages.desc': 'Fremdsprachenlernen und -praxis',
    
    'subjects.health.title': 'Gesundheit & Sport',
    'subjects.health.desc': 'Sportunterricht, Gesundheit, Wohlbefinden',

    // Advanced Features
    'advanced.title': 'Fortgeschrittene Lerntechnologie',
    
    'advanced.adaptive.title': 'Personalisierte Lernpfade',
    'advanced.adaptive.desc': 'KI erstellt einzigartige Lernreisen basierend auf individuellen Stärken, Schwächen und Lernpräferenzen.',
    
    'advanced.feedback.title': 'Sofortiges Feedback',
    'advanced.feedback.desc': 'Echtzeitkorrekturen und Erklärungen helfen Schülern, sofort aus Fehlern zu lernen.',
    
    'advanced.safe.title': 'Sichere Lernumgebung',
    'advanced.safe.desc': 'Kindersichere KI mit angemessener Inhaltsfilterung und Elternkontrollen.',
    
    'advanced.availability.title': '24/7 Verfügbarkeit',
    'advanced.availability.desc': 'Lerne jederzeit, überall mit unserem immer verfügbaren KI-Tutor.',

    // Achievement Section
    'achievement.title': 'Verfolge deinen Fortschritt',
    'achievement.desc': 'Überwache Lernerfolge und feiere Meilensteine mit unserem umfassenden Fortschrittsverfolgungssystem.',
    'achievement.streak': 'Lernserie',
    'achievement.progress': 'Fortschritte machen',
    'achievement.problems': 'Probleme gelöst',
    'achievement.tracking': 'Intelligente Verfolgung',
    'achievement.level': 'Aktuelles Level',
    'achievement.growing': 'Weiterwachsen',

    // Testimonials
    'testimonials.title': 'Was Pädagogen sagen',
    'testimonials.subtitle': 'Höre von Lehrern, Eltern und Schülern, die ihre Lernerfahrung transformiert haben.',
    
    'testimonials.teacher': 'Gymnasiallehrerin',
    'testimonials.teacher.content': 'Dieser KI-Tutor hat revolutioniert, wie ich meine Schüler unterstütze. Das personalisierte Feedback und die adaptiven Lernpfade haben Engagement und Ergebnisse erheblich verbessert.',
    
    'testimonials.parent': 'Elternteil von zwei Schülern',
    'testimonials.parent.content': 'Meine Kinder lieben die interaktiven Lektionen und Sprachfunktionen. Ihre Noten haben sich verbessert und wichtiger noch, sie sind wieder begeistert vom Lernen.',
    
    'testimonials.principal': 'Schulleiter',
    'testimonials.principal.content': 'Die Implementierung dieser KI-Lernplattform war ein Wendepunkt für unsere Schule. Lehrer können sich auf Kreativität konzentrieren, während KI personalisierten Unterricht übernimmt.',

    // Pricing Section
    'pricing.title': 'Wähle deinen Lernplan',
    'pricing.subtitle': 'Flexible Preisoptionen für jeden Lernbedarf, von einzelnen Schülern bis zu ganzen Schulen.',
    
    'pricing.individual': 'Einzelperson',
    'pricing.individual.price': '9,99€',
    'pricing.individual.feature1': 'Ein Schülerkonto',
    'pricing.individual.feature2': 'Alle Fachbereiche',
    'pricing.individual.feature3': 'Fortschrittsverfolgung',
    'pricing.individual.feature4': 'Sprachinteraktion',
    
    'pricing.family': 'Familie',
    'pricing.family.price': '19,99€',
    'pricing.family.feature1': 'Bis zu 4 Schülerkonten',
    'pricing.family.feature2': 'Eltern-Dashboard',
    'pricing.family.feature3': 'Familien-Fortschrittsberichte',
    'pricing.family.feature4': 'Prioritätssupport',
    
    'pricing.school': 'Schule',
    'pricing.school.price': 'Individuell',
    'pricing.school.feature1': 'Unbegrenzte Schüler',
    'pricing.school.feature2': 'Lehrer-Dashboard',
    'pricing.school.feature3': 'Benutzerdefinierte Lehrpläne',
    'pricing.school.feature4': 'Admin-Analysen',
    
    'pricing.month': '/Monat',
    'pricing.most.popular': 'Am beliebtesten',
    'pricing.get.started': 'Loslegen',
    'pricing.contact.sales': 'Vertrieb kontaktieren',

    // FAQ Section
    'faq.title': 'Häufig gestellte Fragen',
    
    'faq.q1': 'Wie passt sich die KI an verschiedene Lernstile an?',
    'faq.a1': 'Unsere KI analysiert Schülerantworten, Lerntempo und Präferenzen, um personalisierte Lernpfade zu erstellen. Sie passt Schwierigkeitsgrade, Lehrmethoden und Inhaltsbereitstellung basierend auf individuellen Bedürfnissen an.',
    
    'faq.q2': 'Ist der Inhalt für alle Altersgruppen angemessen?',
    'faq.a2': 'Ja, unsere KI beinhaltet umfassende Inhaltsfilterung und altersgerechte Materialauswahl. Eltern und Lehrer können zusätzliche Beschränkungen setzen und alle Interaktionen überwachen.',
    
    'faq.q3': 'Können Lehrer dies in bestehende Lehrpläne integrieren?',
    'faq.a3': 'Absolut! Unsere Plattform unterstützt benutzerdefinierte Lehrplanintegration und richtet sich nach wichtigen Bildungsstandards einschließlich Common Core, IB und anderen.',
    
    'faq.q4': 'Welche Fächer werden abgedeckt?',
    'faq.a4': 'Wir decken alle Hauptfächer ab, einschließlich Mathematik, Naturwissenschaften, Sprachkunst, Gesellschaftskunde, Fremdsprachen und mehr, von der Grundschule bis zur Oberstufe.',
    
    'faq.q5': 'Wie sicher sind Schülerdaten?',
    'faq.a5': 'Wir priorisieren Schülerprivatsphäre mit Unternehmenssicherheit, COPPA-Konformität und transparenten Datenpraktiken. Schülerdaten sind verschlüsselt und werden niemals mit Dritten geteilt.',
    
    'faq.q6': 'Gibt es Offline-Funktionalität?',
    'faq.a6': 'Während Kernfunktionen Internetverbindung für KI-Verarbeitung benötigen, bieten wir Offline-Lernmaterialien und Fortschritts-Synchronisation bei wiederhergestellter Verbindung.',

    // About Section
    'about.title': 'Über TeachlyAI',
    'about.subtitle': 'Wir sind auf einer Mission, Qualitätsbildung durch künstliche Intelligenz zu demokratisieren und personalisiertes Lernen für jeden Schüler weltweit zugänglich zu machen.',
    
    'about.vision.title': 'Unsere Vision',
    'about.vision.desc1': 'Wir glauben, dass jeder Schüler personalisierte Aufmerksamkeit und die Möglichkeit verdient, in seinem eigenen Tempo zu lernen. Traditionelle Einheitsbildung lässt oft Schüler zurück oder fordert sie nicht angemessen heraus.',
    'about.vision.desc2': 'Unsere KI-gestützte Plattform schließt diese Lücke, indem sie individuellen Unterricht, Echtzeit-Feedback und adaptive Lernerfahrungen bietet, die mit jedem Schüler wachsen.',
    
    'about.impact.title': 'Unser Einfluss',
    'about.impact.desc': 'Bildung durch Innovation transformieren',
    'about.impact.ai': 'KI-gestützt',
    'about.impact.learning': 'Personalisiertes Lernen',
    'about.impact.global': '24/7',
    'about.impact.accessibility': 'Globale Zugänglichkeit',
    'about.impact.adaptive': 'Adaptiv',
    'about.impact.curriculum': 'Intelligenter Lehrplan',
    'about.impact.realtime': 'Echtzeit',
    'about.impact.analytics': 'Fortschrittsanalysen',

    // Contact Section
    'contact.title': 'Kontakt aufnehmen',
    'contact.subtitle': 'Hast du Fragen zu TeachlyAI? Wir würden gerne von dir hören und dir beim Einstieg helfen.',
    
    'contact.form.name': 'Vollständiger Name',
    'contact.form.name.placeholder': 'Gib deinen vollständigen Namen ein',
    'contact.form.email': 'E-Mail-Adresse',
    'contact.form.email.placeholder': 'Gib deine E-Mail-Adresse ein',
    'contact.form.message': 'Nachricht',
    'contact.form.message.placeholder': 'Sag uns, wie wir dir helfen können...',
    'contact.form.send': 'Nachricht senden',

    // Final CTA
    'final.cta.title': 'Bereit, das Lernen zu transformieren?',
    'final.cta.subtitle': 'Schließe dich Tausenden von Schülern, Lehrern und Eltern an, die bereits die Zukunft der Bildung erleben.',
    'final.cta.trial': 'Kostenlose Testversion starten',
    'final.cta.demo': 'Demo ansehen',

    // Footer
    'footer.description': 'Schüler weltweit mit KI-gestützten personalisierten Lernerfahrungen stärken.',
    'footer.product': 'Produkt',
    'footer.features': 'Funktionen',
    'footer.pricing': 'Preise',
    'footer.demo': 'Demo',
    'footer.company': 'Unternehmen',
    'footer.about': 'Über uns',
    'footer.blog': 'Blog',
    'footer.careers': 'Karriere',
    'footer.support': 'Support',
    'footer.help': 'Hilfe-Center',
    'footer.documentation': 'Dokumentation',
    'footer.community': 'Community',
    'footer.legal': 'Rechtliches',
    'footer.privacy': 'Datenschutzrichtlinie',
    'footer.terms': 'Nutzungsbedingungen',
    'footer.cookies': 'Cookie-Richtlinie',
    'footer.rights': 'Alle Rechte vorbehalten.',
  },
  zh: {
    // Header
    'nav.features': '功能',
    'nav.pricing': '价格',
    'nav.about': '关于我们',
    'nav.contact': '联系我们',
    'nav.login': '登录',
    'nav.signup': '注册',
    'nav.demo': '试用演示',

    // Hero Section
    'hero.title': '用AI驱动的教育改变学习',
    'hero.subtitle': '个性化、适应性学习，与每个学生一起成长。体验我们智能辅导系统的教育未来。',
    'cta.start': '开始您的学习之旅',
    'cta.demo': '试用演示',

    // Features Section
    'features.section.title': '现代学习的强大功能',
    'features.section.subtitle': '了解我们的AI驱动平台如何通过个性化、引人入胜和有效的学习体验革新教育。',
    
    'features.adaptive.title': '自适应AI学习',
    'features.adaptive.desc': '我们的AI适应每个学生的学习风格、节奏和偏好，以获得最佳教育成果。',
    
    'features.voice.title': '语音交互',
    'features.voice.desc': '自然语音对话使学习对所有学生更具吸引力和可访问性。',
    
    'features.content.title': '智能内容创建',
    'features.content.desc': 'AI生成个性化学习材料、测验和解释，tailored to individual needs。',
    
    'features.gamified.title': '游戏化体验',
    'features.gamified.desc': '成就系统、进度跟踪和互动挑战保持学生积极性。',
    
    'features.analytics.title': '实时分析',
    'features.analytics.desc': '全面了解学习进度、优势和改进领域。',
    
    'features.collaborative.title': '协作学习',
    'features.collaborative.desc': '在统一的学习生态系统中连接学生、教师和家长。',

    // Subjects Section
    'subjects.title': '全面的学科覆盖',
    'subjects.subtitle': '从基础到高级主题，我们的AI导师深入而专业地涵盖所有主要学科。',
    
    'subjects.mathematics.title': '数学',
    'subjects.mathematics.desc': '代数、几何、微积分等',
    
    'subjects.sciences.title': '科学',
    'subjects.sciences.desc': '物理、化学、生物、地球科学',
    
    'subjects.literature.title': '文学',
    'subjects.literature.desc': '阅读、写作、语法、文学分析',
    
    'subjects.social.title': '社会研究',
    'subjects.social.desc': '历史、地理、公民学、经济学',
    
    'subjects.technology.title': '技术',
    'subjects.technology.desc': '计算机科学、编程、数字素养',
    
    'subjects.arts.title': '艺术',
    'subjects.arts.desc': '视觉艺术、音乐、创意表达',
    
    'subjects.languages.title': '语言',
    'subjects.languages.desc': '外语学习和练习',
    
    'subjects.health.title': '健康与体育',
    'subjects.health.desc': '体育教育、健康、健康',

    // Advanced Features
    'advanced.title': '先进的学习技术',
    
    'advanced.adaptive.title': '个性化学习路径',
    'advanced.adaptive.desc': 'AI基于个人优势、弱点和学习偏好创建独特的学习之旅。',
    
    'advanced.feedback.title': '即时反馈',
    'advanced.feedback.desc': '实时更正和解释帮助学生立即从错误中学习。',
    
    'advanced.safe.title': '安全学习环境',
    'advanced.safe.desc': '儿童安全AI，具有适当的内容过滤和家长控制。',
    
    'advanced.availability.title': '24/7可用性',
    'advanced.availability.desc': '使用我们始终可用的AI导师随时随地学习。',

    // Achievement Section
    'achievement.title': '跟踪您的进度',
    'achievement.desc': '通过我们全面的进度跟踪系统监控学习成就并庆祝里程碑。',
    'achievement.streak': '学习连胜',
    'achievement.progress': '取得进展',
    'achievement.problems': '解决的问题',
    'achievement.tracking': '智能跟踪',
    'achievement.level': '当前等级',
    'achievement.growing': '继续成长',

    // Testimonials
    'testimonials.title': '教育工作者怎么说',
    'testimonials.subtitle': '听听已经改变学习体验的教师、家长和学生的声音。',
    
    'testimonials.teacher': '高中教师',
    'testimonials.teacher.content': '这个AI导师彻底改变了我支持学生的方式。个性化反馈和自适应学习路径显著提高了参与度和成果。',
    
    'testimonials.parent': '两个学生的家长',
    'testimonials.parent.content': '我的孩子们喜欢互动课程和语音功能。他们的成绩有所提高，更重要的是，他们再次对学习感到兴奋。',
    
    'testimonials.principal': '学校校长',
    'testimonials.principal.content': '实施这个AI学习平台对我们学校来说是一个转折点。教师可以专注于创造力，而AI处理个性化教学。',

    // Pricing Section
    'pricing.title': '选择您的学习计划',
    'pricing.subtitle': '灵活的定价选项，满足每个学习需求，从个人学生到整个学校。',
    
    'pricing.individual': '个人',
    'pricing.individual.price': '¥68',
    'pricing.individual.feature1': '一个学生账户',
    'pricing.individual.feature2': '所有学科领域',
    'pricing.individual.feature3': '进度跟踪',
    'pricing.individual.feature4': '语音交互',
    
    'pricing.family': '家庭',
    'pricing.family.price': '¥138',
    'pricing.family.feature1': '最多4个学生账户',
    'pricing.family.feature2': '家长仪表板',
    'pricing.family.feature3': '家庭进度报告',
    'pricing.family.feature4': '优先支持',
    
    'pricing.school': '学校',
    'pricing.school.price': '定制',
    'pricing.school.feature1': '无限学生',
    'pricing.school.feature2': '教师仪表板',
    'pricing.school.feature3': '定制课程',
    'pricing.school.feature4': '管理员分析',
    
    'pricing.month': '/月',
    'pricing.most.popular': '最受欢迎',
    'pricing.get.started': '开始使用',
    'pricing.contact.sales': '联系销售',

    // FAQ Section
    'faq.title': '常见问题',
    
    'faq.q1': 'AI如何适应不同的学习风格？',
    'faq.a1': '我们的AI分析学生回答、学习节奏和偏好来创建个性化学习路径。它根据个人需求调整难度级别、教学方法和内容传递。',
    
    'faq.q2': '内容对所有年龄组都合适吗？',
    'faq.a2': '是的，我们的AI包括全面的内容过滤和适龄材料选择。家长和教师可以设置额外限制并监控所有互动。',
    
    'faq.q3': '教师可以将此与现有课程整合吗？',
    'faq.a3': '绝对可以！我们的平台支持定制课程整合，并与包括Common Core、IB等主要教育标准保持一致。',
    
    'faq.q4': '涵盖哪些学科？',
    'faq.a4': '我们涵盖所有主要学科，包括数学、科学、语言艺术、社会研究、外语等，从小学到高中各级别。',
    
    'faq.q5': '学生数据有多安全？',
    'faq.a5': '我们优先考虑学生隐私，采用企业级安全、COPPA合规和透明数据实践。学生数据已加密，从不与第三方共享。',
    
    'faq.q6': '有离线功能吗？',
    'faq.a6': '虽然核心功能需要互联网连接进行AI处理，但我们提供离线学习材料和连接恢复时的进度同步。',

    // About Section
    'about.title': '关于TeachlyAI',
    'about.subtitle': '我们的使命是通过人工智能民主化优质教育，让全世界每个学生都能获得个性化学习。',
    
    'about.vision.title': '我们的愿景',
    'about.vision.desc1': '我们相信每个学生都应该得到个性化关注和按自己节奏学习的机会。传统的一刀切教育经常让学生落后或无法得到适当挑战。',
    'about.vision.desc2': '我们的AI驱动平台通过提供个性化教学、实时反馈和与每个学生一起成长的自适应学习体验来弥合这一差距。',
    
    'about.impact.title': '我们的影响',
    'about.impact.desc': '通过创新改变教育',
    'about.impact.ai': 'AI驱动',
    'about.impact.learning': '个性化学习',
    'about.impact.global': '24/7',
    'about.impact.accessibility': '全球可访问性',
    'about.impact.adaptive': '自适应',
    'about.impact.curriculum': '智能课程',
    'about.impact.realtime': '实时',
    'about.impact.analytics': '进度分析',

    // Contact Section
    'contact.title': '联系我们',
    'contact.subtitle': '对TeachlyAI有疑问吗？我们很乐意听到您的声音并帮助您开始。',
    
    'contact.form.name': '全名',
    'contact.form.name.placeholder': '输入您的全名',
    'contact.form.email': '电子邮件地址',
    'contact.form.email.placeholder': '输入您的电子邮件地址',
    'contact.form.message': '消息',
    'contact.form.message.placeholder': '告诉我们如何帮助您...',
    'contact.form.send': '发送消息',

    // Final CTA
    'final.cta.title': '准备好改变学习了吗？',
    'final.cta.subtitle': '加入数千名已经在体验教育未来的学生、教师和家长。',
    'final.cta.trial': '开始免费试用',
    'final.cta.demo': '观看演示',

    // Footer
    'footer.description': '通过AI驱动的个性化学习体验赋能全球学生。',
    'footer.product': '产品',
    'footer.features': '功能',
    'footer.pricing': '价格',
    'footer.demo': '演示',
    'footer.company': '公司',
    'footer.about': '关于我们',
    'footer.blog': '博客',
    'footer.careers': '招聘',
    'footer.support': '支持',
    'footer.help': '帮助中心',
    'footer.documentation': '文档',
    'footer.community': '社区',
    'footer.legal': '法律',
    'footer.privacy': '隐私政策',
    'footer.terms': '服务条款',
    'footer.cookies': 'Cookie政策',
    'footer.rights': '版权所有。',
  },
  ja: {
    // Header
    'nav.features': '機能',
    'nav.pricing': '料金',
    'nav.about': '私たちについて',
    'nav.contact': 'お問い合わせ',
    'nav.login': 'ログイン',
    'nav.signup': 'サインアップ',
    'nav.demo': 'デモを試す',

    // Hero Section
    'hero.title': 'AIを活用した教育で学習を変革する',
    'hero.subtitle': '各学生と共に成長するパーソナライズされた適応型学習。インテリジェント指導システムで教育の未来を体験してください。',
    'cta.start': '学習の旅を始める',
    'cta.demo': 'デモを試す',

    // Features Section
    'features.section.title': '現代学習のための強力な機能',
    'features.section.subtitle': 'AIを活用したプラットフォームが、パーソナライズされた魅力的で効果的な学習体験で教育を革新する方法をご覧ください。',
    
    'features.adaptive.title': '適応型AI学習',
    'features.adaptive.desc': '私たちのAIは、各学生の学習スタイル、ペース、好みに適応して、最適な教育成果を提供します。',
    
    'features.voice.title': '音声インタラクション',
    'features.voice.desc': '自然な音声会話により、すべての学生にとって学習がより魅力的でアクセシブルになります。',
    
    'features.content.title': 'スマートコンテンツ作成',
    'features.content.desc': 'AIが個々のニーズに合わせてパーソナライズされた学習教材、クイズ、説明を生成します。',
    
    'features.gamified.title': 'ゲーミフィケーション体験',
    'features.gamified.desc': '成果システム、進捗追跡、インタラクティブなチャレンジが学生のモチベーションを維持します。',
    
    'features.analytics.title': 'リアルタイム分析',
    'features.analytics.desc': '学習進捗、強み、改善領域に関する包括的な洞察。',
    
    'features.collaborative.title': '協調学習',
    'features.collaborative.desc': '統合された学習エコシステムで学生、教師、保護者を結びます。',

    // Subjects Section
    'subjects.title': '包括的な科目カバレッジ',
    'subjects.subtitle': '基礎から高度なトピックまで、私たちのAI講師は深さと専門知識ですべての主要科目をカバーします。',
    
    'subjects.mathematics.title': '数学',
    'subjects.mathematics.desc': '代数、幾何学、微積分など',
    
    'subjects.sciences.title': '科学',
    'subjects.sciences.desc': '物理学、化学、生物学、地球科学',
    
    'subjects.literature.title': '文学',
    'subjects.literature.desc': '読書、作文、文法、文学分析',
    
    'subjects.social.title': '社会科',
    'subjects.social.desc': '歴史、地理、公民、経済学',
    
    'subjects.technology.title': 'テクノロジー',
    'subjects.technology.desc': 'コンピュータサイエンス、プログラミング、デジタルリテラシー',
    
    'subjects.arts.title': '芸術',
    'subjects.arts.desc': '視覚芸術、音楽、創造的表現',
    
    'subjects.languages.title': '言語',
    'subjects.languages.desc': '外国語学習と実践',
    
    'subjects.health.title': '健康・体育',
    'subjects.health.desc': '体育、健康、ウェルネス',

    // Advanced Features
    'advanced.title': '高度な学習技術',
    
    'advanced.adaptive.title': 'パーソナライズされた学習パス',
    'advanced.adaptive.desc': 'AIが個々の強み、弱み、学習の好みに基づいてユニークな学習の旅を作成します。',
    
    'advanced.feedback.title': '即座のフィードバック',
    'advanced.feedback.desc': 'リアルタイムの修正と説明により、学生は間違いからすぐに学習できます。',
    
    'advanced.safe.title': '安全な学習環境',
    'advanced.safe.desc': '適切なコンテンツフィルタリングと保護者管理機能を備えた子供に安全なAI。',
    
    'advanced.availability.title': '24/7の利用可能性',
    'advanced.availability.desc': '常に利用可能なAI講師でいつでもどこでも学習。',

    // Achievement Section
    'achievement.title': '進捗を追跡',
    'achievement.desc': '包括的な進捗追跡システムで学習の成果を監視し、マイルストーンを祝いましょう。',
    'achievement.streak': '学習ストリーク',
    'achievement.progress': '進歩を作る',
    'achievement.problems': '解決した問題',
    'achievement.tracking': 'スマート追跡',
    'achievement.level': '現在のレベル',
    'achievement.growing': '成長を続ける',

    // Testimonials
    'testimonials.title': '教育者の声',
    'testimonials.subtitle': '学習体験を変革した教師、保護者、学生の声を聞いてください。',
    
    'testimonials.teacher': '高校教師',
    'testimonials.teacher.content': 'このAI講師は私が学生をサポートする方法を革新しました。パーソナライズされたフィードバックと適応型学習パスにより、エンゲージメントと成果が大幅に向上しました。',
    
    'testimonials.parent': '二人の学生の保護者',
    'testimonials.parent.content': '私の子供たちはインタラクティブなレッスンと音声機能を気に入っています。成績が向上し、さらに重要なことに、再び学習に興奮しています。',
    
    'testimonials.principal': '学校校長',
    'testimonials.principal.content': 'このAI学習プラットフォームの実装は、私たちの学校にとってゲームチェンジャーでした。教師は創造性に集中でき、AIがパーソナライズされた指導を処理します。',

    // Pricing Section
    'pricing.title': '学習プランを選択',
    'pricing.subtitle': '個人学生から学校全体まで、あらゆる学習ニーズに対応する柔軟な価格オプション。',
    
    'pricing.individual': '個人',
    'pricing.individual.price': '¥999',
    'pricing.individual.feature1': '1つの学生アカウント',
    'pricing.individual.feature2': '全科目分野',
    'pricing.individual.feature3': '進捗追跡',
    'pricing.individual.feature4': '音声インタラクション',
    
    'pricing.family': '家族',
    'pricing.family.price': '¥1,999',
    'pricing.family.feature1': '最大4つの学生アカウント',
    'pricing.family.feature2': '保護者ダッシュボード',
    'pricing.family.feature3': '家族進捗レポート',
    'pricing.family.feature4': '優先サポート',
    
    'pricing.school': '学校',
    'pricing.school.price': 'カスタム',
    'pricing.school.feature1': '無制限の学生',
    'pricing.school.feature2': '教師ダッシュボード',
    'pricing.school.feature3': 'カスタムカリキュラム',
    'pricing.school.feature4': '管理者分析',
    
    'pricing.month': '/月',
    'pricing.most.popular': '最も人気',
    'pricing.get.started': '始める',
    'pricing.contact.sales': '営業に連絡',

    // FAQ Section
    'faq.title': 'よくある質問',
    
    'faq.q1': 'AIはどのように異なる学習スタイルに適応しますか？',
    'faq.a1': '私たちのAIは学生の回答、学習ペース、好みを分析してパーソナライズされた学習パスを作成します。個人のニーズに基づいて難易度レベル、教育方法、コンテンツ配信を調整します。',
    
    'faq.q2': 'コンテンツはすべての年齢層に適していますか？',
    'faq.a2': 'はい、私たちのAIは包括的なコンテンツフィルタリングと年齢に適したマテリアル選択を含んでいます。保護者と教師は追加の制限を設定し、すべてのインタラクションを監視できます。',
    
    'faq.q3': '教師は既存のカリキュラムとこれを統合できますか？',
    'faq.a3': '絶対に！私たちのプラットフォームはカスタムカリキュラム統合をサポートし、Common Core、IBなどの主要な教育標準と整合します。',
    
    'faq.q4': 'どの科目がカバーされていますか？',
    'faq.a4': '数学、科学、言語芸術、社会科、外国語など、小学校から高校レベルまでのすべての主要科目をカバーしています。',
    
    'faq.q5': '学生データはどの程度安全ですか？',
    'faq.a5': '私たちは企業レベルのセキュリティ、COPPA準拠、透明なデータ慣行で学生のプライバシーを優先します。学生データは暗号化され、第三者と共有されることはありません。',
    
    'faq.q6': 'オフライン機能はありますか？',
    'faq.a6': 'コア機能はAI処理のためのインターネット接続が必要ですが、オフライン学習教材と接続が復元されたときの進捗同期を提供しています。',

    // About Section
    'about.title': 'TeachlyAIについて',
    'about.subtitle': '私たちは人工知能を通じて質の高い教育を民主化し、世界中のすべての学生にパーソナライズされた学習をアクセシブルにするミッションを持っています。',
    
    'about.vision.title': '私たちのビジョン',
    'about.vision.desc1': '私たちは、すべての学生がパーソナライズされた注意と自分のペースで学習する機会に値すると信じています。従来の一律教育は、しばしば学生を置き去りにするか、適切に挑戦しません。',
    'about.vision.desc2': '私たちのAIを活用したプラットフォームは、個別化された指導、リアルタイムフィードバック、各学生と共に成長する適応型学習体験を提供することで、このギャップを埋めます。',
    
    'about.impact.title': '私たちの影響',
    'about.impact.desc': 'イノベーションを通じて教育を変革',
    'about.impact.ai': 'AI駆動',
    'about.impact.learning': 'パーソナライズ学習',
    'about.impact.global': '24/7',
    'about.impact.accessibility': 'グローバルアクセシビリティ',
    'about.impact.adaptive': '適応型',
    'about.impact.curriculum': 'スマートカリキュラム',
    'about.impact.realtime': 'リアルタイム',
    'about.impact.analytics': '進捗分析',

    // Contact Section
    'contact.title': 'お問い合わせ',
    'contact.subtitle': 'TeachlyAIについてご質問がありますか？お聞かせいただき、開始のお手伝いをさせていただきます。',
    
    'contact.form.name': 'フルネーム',
    'contact.form.name.placeholder': 'フルネームを入力してください',
    'contact.form.email': 'メールアドレス',
    'contact.form.email.placeholder': 'メールアドレスを入力してください',
    'contact.form.message': 'メッセージ',
    'contact.form.message.placeholder': 'どのようにお手伝いできるかお聞かせください...',
    'contact.form.send': 'メッセージを送信',

    // Final CTA
    'final.cta.title': '学習を変革する準備はできましたか？',
    'final.cta.subtitle': 'すでに教育の未来を体験している何千人もの学生、教師、保護者に参加してください。',
    'final.cta.trial': '無料トライアルを開始',
    'final.cta.demo': 'デモを見る',

    // Footer
    'footer.description': 'AI駆動のパーソナライズされた学習体験で世界中の学生を支援。',
    'footer.product': '製品',
    'footer.features': '機能',
    'footer.pricing': '料金',
    'footer.demo': 'デモ',
    'footer.company': '会社',
    'footer.about': '私たちについて',
    'footer.blog': 'ブログ',
    'footer.careers': 'キャリア',
    'footer.support': 'サポート',
    'footer.help': 'ヘルプセンター',
    'footer.documentation': 'ドキュメント',
    'footer.community': 'コミュニティ',
    'footer.legal': '法的',
    'footer.privacy': 'プライバシーポリシー',
    'footer.terms': '利用規約',
    'footer.cookies': 'Cookieポリシー',
    'footer.rights': '全著作権所有。',
  },
  pt: {
    // Header
    'nav.features': 'Recursos',
    'nav.pricing': 'Preços',
    'nav.about': 'Sobre',
    'nav.contact': 'Contato',
    'nav.login': 'Entrar',
    'nav.signup': 'Cadastrar',
    'nav.demo': 'Testar Demo',

    // Hero Section
    'hero.title': 'Transforme o Aprendizado com Educação Alimentada por IA',
    'hero.subtitle': 'Aprendizado personalizado e adaptativo que cresce com cada estudante. Experimente o futuro da educação com nosso sistema de tutoria inteligente.',
    'cta.start': 'Comece Sua Jornada de Aprendizado',
    'cta.demo': 'Testar Demo',

    // Features Section
    'features.section.title': 'Recursos Poderosos para Aprendizado Moderno',
    'features.section.subtitle': 'Descubra como nossa plataforma alimentada por IA revoluciona a educação com experiências de aprendizado personalizadas, envolventes e eficazes.',
    
    'features.adaptive.title': 'Aprendizado IA Adaptativo',
    'features.adaptive.desc': 'Nossa IA se adapta ao estilo de aprendizado, ritmo e preferências de cada estudante para resultados educacionais ideais.',
    
    'features.voice.title': 'Interação por Voz',
    'features.voice.desc': 'Conversas por voz naturais tornam o aprendizado mais envolvente e acessível para todos os estudantes.',
    
    'features.content.title': 'Criação de Conteúdo Inteligente',
    'features.content.desc': 'IA gera materiais de aprendizado personalizados, questionários e explicações adaptadas às necessidades individuais.',
    
    'features.gamified.title': 'Experiência Gamificada',
    'features.gamified.desc': 'Sistemas de conquistas, acompanhamento de progresso e desafios interativos mantêm os estudantes motivados.',
    
    'features.analytics.title': 'Análises em Tempo Real',
    'features.analytics.desc': 'Insights abrangentes sobre progresso de aprendizado, pontos fortes e áreas de melhoria.',
    
    'features.collaborative.title': 'Aprendizado Colaborativo',
    'features.collaborative.desc': 'Conecta estudantes, professores e pais em um ecossistema de aprendizado unificado.',

    // Subjects Section
    'subjects.title': 'Cobertura Abrangente de Matérias',
    'subjects.subtitle': 'Do básico elementar a tópicos avançados, nosso tutor IA cobre todas as matérias principais com profundidade e expertise.',
    
    'subjects.mathematics.title': 'Matemática',
    'subjects.mathematics.desc': 'Álgebra, geometria, cálculo e mais',
    
    'subjects.sciences.title': 'Ciências',
    'subjects.sciences.desc': 'Física, química, biologia, ciências da terra',
    
    'subjects.literature.title': 'Literatura',
    'subjects.literature.desc': 'Leitura, escrita, gramática, análise literária',
    
    'subjects.social.title': 'Estudos Sociais',
    'subjects.social.desc': 'História, geografia, educação cívica, economia',
    
    'subjects.technology.title': 'Tecnologia',
    'subjects.technology.desc': 'Ciência da computação, programação, alfabetização digital',
    
    'subjects.arts.title': 'Artes',
    'subjects.arts.desc': 'Artes visuais, música, expressão criativa',
    
    'subjects.languages.title': 'Idiomas',
    'subjects.languages.desc': 'Aprendizado e prática de idiomas estrangeiros',
    
    'subjects.health.title': 'Saúde e EF',
    'subjects.health.desc': 'Educação física, saúde, bem-estar',

    // Advanced Features
    'advanced.title': 'Tecnologia de Aprendizado Avançada',
    
    'advanced.adaptive.title': 'Caminhos de Aprendizado Personalizados',
    'advanced.adaptive.desc': 'IA cria jornadas de aprendizado únicas baseadas em pontos fortes, fracos e preferências de aprendizado individuais.',
    
    'advanced.feedback.title': 'Feedback Instantâneo',
    'advanced.feedback.desc': 'Correções e explicações em tempo real ajudam os estudantes a aprender com os erros imediatamente.',
    
    'advanced.safe.title': 'Ambiente de Aprendizado Seguro',
    'advanced.safe.desc': 'IA segura para crianças com filtragem de conteúdo apropriada e controles parentais.',
    
    'advanced.availability.title': 'Disponibilidade 24/7',
    'advanced.availability.desc': 'Aprenda a qualquer hora, em qualquer lugar com nosso tutor IA sempre disponível.',

    // Achievement Section
    'achievement.title': 'Acompanhe Seu Progresso',
    'achievement.desc': 'Monitore conquistas de aprendizado e celebre marcos com nosso sistema abrangente de acompanhamento de progresso.',
    'achievement.streak': 'Sequência de Aprendizado',
    'achievement.progress': 'Fazendo Progresso',
    'achievement.problems': 'Problemas Resolvidos',
    'achievement.tracking': 'Acompanhamento Inteligente',
    'achievement.level': 'Nível Atual',
    'achievement.growing': 'Continue Crescendo',

    // Testimonials
    'testimonials.title': 'O que os Educadores Estão Dizendo',
    'testimonials.subtitle': 'Ouça de professores, pais e estudantes que transformaram sua experiência de aprendizado.',
    
    'testimonials.teacher': 'Professora do Ensino Médio',
    'testimonials.teacher.content': 'Este tutor IA revolucionou como apoio meus estudantes. O feedback personalizado e os caminhos de aprendizado adaptativos melhoraram significativamente o engajamento e os resultados.',
    
    'testimonials.parent': 'Pai de Dois Estudantes',
    'testimonials.parent.content': 'Meus filhos adoram as lições interativas e recursos de voz. Suas notas melhoraram e, mais importante, eles estão empolgados para aprender novamente.',
    
    'testimonials.principal': 'Diretor da Escola',
    'testimonials.principal.content': 'Implementar esta plataforma de aprendizado IA foi um divisor de águas para nossa escola. Professores podem focar na criatividade enquanto a IA cuida da instrução personalizada.',

    // Pricing Section
    'pricing.title': 'Escolha Seu Plano de Aprendizado',
    'pricing.subtitle': 'Opções de preços flexíveis para atender cada necessidade de aprendizado, de estudantes individuais a escolas inteiras.',
    
    'pricing.individual': 'Individual',
    'pricing.individual.price': 'R$ 49,99',
    'pricing.individual.feature1': 'Uma conta de estudante',
    'pricing.individual.feature2': 'Todas as áreas de matérias',
    'pricing.individual.feature3': 'Acompanhamento de progresso',
    'pricing.individual.feature4': 'Interação por voz',
    
    'pricing.family': 'Família',
    'pricing.family.price': 'R$ 99,99',
    'pricing.family.feature1': 'Até 4 contas de estudante',
    'pricing.family.feature2': 'Painel dos pais',
    'pricing.family.feature3': 'Relatórios de progresso familiar',
    'pricing.family.feature4': 'Suporte prioritário',
    
    'pricing.school': 'Escola',
    'pricing.school.price': 'Personalizado',
    'pricing.school.feature1': 'Estudantes ilimitados',
    'pricing.school.feature2': 'Painel do professor',
    'pricing.school.feature3': 'Currículos personalizados',
    'pricing.school.feature4': 'Análises de administrador',
    
    'pricing.month': '/mês',
    'pricing.most.popular': 'Mais Popular',
    'pricing.get.started': 'Começar',
    'pricing.contact.sales': 'Contatar Vendas',

    // FAQ Section
    'faq.title': 'Perguntas Frequentes',
    
    'faq.q1': 'Como a IA se adapta a diferentes estilos de aprendizado?',
    'faq.a1': 'Nossa IA analisa respostas dos estudantes, ritmo de aprendizado e preferências para criar caminhos de aprendizado personalizados. Ela ajusta níveis de dificuldade, métodos de ensino e entrega de conteúdo baseados em necessidades individuais.',
    
    'faq.q2': 'O conteúdo é apropriado para todas as faixas etárias?',
    'faq.a2': 'Sim, nossa IA inclui filtragem de conteúdo abrangente e seleção de material apropriado para a idade. Pais e professores podem definir restrições adicionais e monitorar todas as interações.',
    
    'faq.q3': 'Professores podem integrar isso com currículos existentes?',
    'faq.a3': 'Absolutamente! Nossa plataforma suporta integração de currículo personalizado e se alinha com principais padrões educacionais incluindo Common Core, IB e outros.',
    
    'faq.q4': 'Quais matérias são cobertas?',
    'faq.a4': 'Cobrimos todas as matérias principais incluindo Matemática, Ciências, Artes da Linguagem, Estudos Sociais, Idiomas Estrangeiros e mais, desde níveis elementares até ensino médio.',
    
    'faq.q5': 'Quão seguros são os dados dos estudantes?',
    'faq.a5': 'Priorizamos a privacidade dos estudantes com segurança de nível empresarial, conformidade COPPA e práticas de dados transparentes. Dados dos estudantes são criptografados e nunca compartilhados com terceiros.',
    
    'faq.q6': 'Há funcionalidade offline?',
    'faq.a6': 'Embora recursos principais requeiram conectividade à internet para processamento IA, oferecemos materiais de estudo offline e sincronização de progresso quando a conexão é restaurada.',

    // About Section
    'about.title': 'Sobre TeachlyAI',
    'about.subtitle': 'Estamos em uma missão para democratizar educação de qualidade através de inteligência artificial, tornando aprendizado personalizado acessível a cada estudante mundialmente.',
    
    'about.vision.title': 'Nossa Visão',
    'about.vision.desc1': 'Acreditamos que cada estudante merece atenção personalizada e a oportunidade de aprender em seu próprio ritmo. Educação tradicional de tamanho único frequentemente deixa estudantes para trás ou falha em desafiá-los apropriadamente.',
    'about.vision.desc2': 'Nossa plataforma alimentada por IA preenche essa lacuna fornecendo instrução individualizada, feedback em tempo real e experiências de aprendizado adaptativas que crescem com cada estudante.',
    
    'about.impact.title': 'Nosso Impacto',
    'about.impact.desc': 'Transformando educação através de inovação',
    'about.impact.ai': 'Alimentado por IA',
    'about.impact.learning': 'Aprendizado Personalizado',
    'about.impact.global': '24/7',
    'about.impact.accessibility': 'Acessibilidade Global',
    'about.impact.adaptive': 'Adaptativo',
    'about.impact.curriculum': 'Currículo Inteligente',
    'about.impact.realtime': 'Tempo Real',
    'about.impact.analytics': 'Análises de Progresso',

    // Contact Section
    'contact.title': 'Entre em Contato',
    'contact.subtitle': 'Tem perguntas sobre TeachlyAI? Adoraríamos ouvir de você e ajudá-lo a começar.',
    
    'contact.form.name': 'Nome Completo',
    'contact.form.name.placeholder': 'Digite seu nome completo',
    'contact.form.email': 'Endereço de E-mail',
    'contact.form.email.placeholder': 'Digite seu endereço de e-mail',
    'contact.form.message': 'Mensagem',
    'contact.form.message.placeholder': 'Nos conte como podemos ajudá-lo...',
    'contact.form.send': 'Enviar Mensagem',

    // Final CTA
    'final.cta.title': 'Pronto para Transformar o Aprendizado?',
    'final.cta.subtitle': 'Junte-se a milhares de estudantes, professores e pais que já estão experimentando o futuro da educação.',
    'final.cta.trial': 'Iniciar Teste Gratuito',
    'final.cta.demo': 'Assistir Demo',

    // Footer
    'footer.description': 'Empoderando estudantes mundialmente com experiências de aprendizado personalizadas alimentadas por IA.',
    'footer.product': 'Produto',
    'footer.features': 'Recursos',
    'footer.pricing': 'Preços',
    'footer.demo': 'Demo',
    'footer.company': 'Empresa',
    'footer.about': 'Sobre Nós',
    'footer.blog': 'Blog',
    'footer.careers': 'Carreiras',
    'footer.support': 'Suporte',
    'footer.help': 'Central de Ajuda',
    'footer.documentation': 'Documentação',
    'footer.community': 'Comunidade',
    'footer.legal': 'Legal',
    'footer.privacy': 'Política de Privacidade',
    'footer.terms': 'Termos de Serviço',
    'footer.cookies': 'Política de Cookies',
    'footer.rights': 'Todos os direitos reservados.',
  },
  it: {
    // Header
    'nav.features': 'Funzionalità',
    'nav.pricing': 'Prezzi',
    'nav.about': 'Chi siamo',
    'nav.contact': 'Contatti',
    'nav.login': 'Accedi',
    'nav.signup': 'Registrati',
    'nav.demo': 'Prova Demo',

    // Hero Section
    'hero.title': 'Trasforma l\'Apprendimento con l\'Educazione Alimentata dall\'IA',
    'hero.subtitle': 'Apprendimento personalizzato e adattivo che cresce con ogni studente. Sperimenta il futuro dell\'educazione con il nostro sistema di tutoraggio intelligente.',
    'cta.start': 'Inizia il Tuo Viaggio di Apprendimento',
    'cta.demo': 'Prova Demo',

    // Features Section
    'features.section.title': 'Funzionalità Potenti per l\'Apprendimento Moderno',
    'features.section.subtitle': 'Scopri come la nostra piattaforma alimentata dall\'IA rivoluziona l\'educazione con esperienze di apprendimento personalizzate, coinvolgenti ed efficaci.',
    
    'features.adaptive.title': 'Apprendimento IA Adattivo',
    'features.adaptive.desc': 'La nostra IA si adatta allo stile di apprendimento, al ritmo e alle preferenze di ogni studente per risultati educativi ottimali.',
    
    'features.voice.title': 'Interazione Vocale',
    'features.voice.desc': 'Le conversazioni vocali naturali rendono l\'apprendimento più coinvolgente e accessibile per tutti gli studenti.',
    
    'features.content.title': 'Creazione di Contenuti Intelligente',
    'features.content.desc': 'L\'IA genera materiali di apprendimento personalizzati, quiz e spiegazioni su misura per le esigenze individuali.',
    
    'features.gamified.title': 'Esperienza Gamificata',
    'features.gamified.desc': 'Sistemi di achievement, monitoraggio dei progressi e sfide interattive mantengono gli studenti motivati.',
    
    'features.analytics.title': 'Analisi in Tempo Reale',
    'features.analytics.desc': 'Insights completi sui progressi di apprendimento, punti di forza e aree di miglioramento.',
    
    'features.collaborative.title': 'Apprendimento Collaborativo',
    'features.collaborative.desc': 'Collega studenti, insegnanti e genitori in un ecosistema di apprendimento unificato.',

    // Subjects Section
    'subjects.title': 'Copertura Completa delle Materie',
    'subjects.subtitle': 'Dalle basi elementari agli argomenti avanzati, il nostro tutor IA copre tutte le materie principali con profondità ed esperienza.',
    
    'subjects.mathematics.title': 'Matematica',
    'subjects.mathematics.desc': 'Algebra, geometria, calcolo e altro',
    
    'subjects.sciences.title': 'Scienze',
    'subjects.sciences.desc': 'Fisica, chimica, biologia, scienze della terra',
    
    'subjects.literature.title': 'Letteratura',
    'subjects.literature.desc': 'Lettura, scrittura, grammatica, analisi letteraria',
    
    'subjects.social.title': 'Studi Sociali',
    'subjects.social.desc': 'Storia, geografia, educazione civica, economia',
    
    'subjects.technology.title': 'Tecnologia',
    'subjects.technology.desc': 'Informatica, programmazione, alfabetizzazione digitale',
    
    'subjects.arts.title': 'Arti',
    'subjects.arts.desc': 'Arti visive, musica, espressione creativa',
    
    'subjects.languages.title': 'Lingue',
    'subjects.languages.desc': 'Apprendimento e pratica delle lingue straniere',
    
    'subjects.health.title': 'Salute e EF',
    'subjects.health.desc': 'Educazione fisica, salute, benessere',

    // Advanced Features
    'advanced.title': 'Tecnologia di Apprendimento Avanzata',
    
    'advanced.adaptive.title': 'Percorsi di Apprendimento Personalizzati',
    'advanced.adaptive.desc': 'L\'IA crea viaggi di apprendimento unici basati su punti di forza, debolezze e preferenze di apprendimento individuali.',
    
    'advanced.feedback.title': 'Feedback Istantaneo',
    'advanced.feedback.desc': 'Correzioni e spiegazioni in tempo reale aiutano gli studenti ad imparare dagli errori immediatamente.',
    
    'advanced.safe.title': 'Ambiente di Apprendimento Sicuro',
    'advanced.safe.desc': 'IA sicura per bambini con filtraggio dei contenuti appropriato e controlli parentali.',
    
    'advanced.availability.title': 'Disponibilità 24/7',
    'advanced.availability.desc': 'Impara sempre, ovunque con il nostro tutor IA sempre disponibile.',

    // Achievement Section
    'achievement.title': 'Traccia i Tuoi Progressi',
    'achievement.desc': 'Monitora i risultati di apprendimento e celebra le pietre miliari con il nostro sistema completo di monitoraggio dei progressi.',
    'achievement.streak': 'Striscia di Apprendimento',
    'achievement.progress': 'Facendo Progressi',
    'achievement.problems': 'Problemi Risolti',
    'achievement.tracking': 'Monitoraggio Intelligente',
    'achievement.level': 'Livello Attuale',
    'achievement.growing': 'Continua a Crescere',

    // Testimonials
    'testimonials.title': 'Cosa Dicono gli Educatori',
    'testimonials.subtitle': 'Ascolta da insegnanti, genitori e studenti che hanno trasformato la loro esperienza di apprendimento.',
    
    'testimonials.teacher': 'Insegnante di Scuola Superiore',
    'testimonials.teacher.content': 'Questo tutor IA ha rivoluzionato come supporto i miei studenti. Il feedback personalizzato e i percorsi di apprendimento adattivi hanno migliorato significativamente il coinvolgimento e i risultati.',
    
    'testimonials.parent': 'Genitore di Due Studenti',
    'testimonials.parent.content': 'I miei figli adorano le lezioni interattive e le funzionalità vocali. I loro voti sono migliorati e, più importante, sono entusiasti di imparare di nuovo.',
    
    'testimonials.principal': 'Preside della Scuola',
    'testimonials.principal.content': 'Implementare questa piattaforma di apprendimento IA è stato un punto di svolta per la nostra scuola. Gli insegnanti possono concentrarsi sulla creatività mentre l\'IA gestisce l\'istruzione personalizzata.',

    // Pricing Section
    'pricing.title': 'Scegli il Tuo Piano di Apprendimento',
    'pricing.subtitle': 'Opzioni di prezzo flessibili per soddisfare ogni esigenza di apprendimento, dagli studenti individuali alle scuole intere.',
    
    'pricing.individual': 'Individuale',
    'pricing.individual.price': '€9,99',
    'pricing.individual.feature1': 'Un account studente',
    'pricing.individual.feature2': 'Tutte le aree tematiche',
    'pricing.individual.feature3': 'Monitoraggio progressi',
    'pricing.individual.feature4': 'Interazione vocale',
    
    'pricing.family': 'Famiglia',
    'pricing.family.price': '€19,99',
    'pricing.family.feature1': 'Fino a 4 account studenti',
    'pricing.family.feature2': 'Dashboard genitori',
    'pricing.family.feature3': 'Report progressi famiglia',
    'pricing.family.feature4': 'Supporto prioritario',
    
    'pricing.school': 'Scuola',
    'pricing.school.price': 'Personalizzato',
    'pricing.school.feature1': 'Studenti illimitati',
    'pricing.school.feature2': 'Dashboard insegnanti',
    'pricing.school.feature3': 'Curricula personalizzati',
    'pricing.school.feature4': 'Analisi amministratori',
    
    'pricing.month': '/mese',
    'pricing.most.popular': 'Più Popolare',
    'pricing.get.started': 'Inizia',
    'pricing.contact.sales': 'Contatta Vendite',

    // FAQ Section
    'faq.title': 'Domande Frequenti',
    
    'faq.q1': 'Come si adatta l\'IA a diversi stili di apprendimento?',
    'faq.a1': 'La nostra IA analizza le risposte degli studenti, il ritmo di apprendimento e le preferenze per creare percorsi di apprendimento personalizzati. Regola i livelli di difficoltà, i metodi di insegnamento e la consegna dei contenuti basandosi sulle esigenze individuali.',
    
    'faq.q2': 'Il contenuto è appropriato per tutte le fasce d\'età?',
    'faq.a2': 'Sì, la nostra IA include filtraggio completo dei contenuti e selezione di materiale appropriato per l\'età. Genitori e insegnanti possono impostare restrizioni aggiuntive e monitorare tutte le interazioni.',
    
    'faq.q3': 'Gli insegnanti possono integrare questo con i curricula esistenti?',
    'faq.a3': 'Assolutamente! La nostra piattaforma supporta l\'integrazione di curricula personalizzati e si allinea con i principali standard educativi inclusi Common Core, IB e altri.',
    
    'faq.q4': 'Quali materie sono coperte?',
    'faq.a4': 'Copriamo tutte le materie principali incluse Matematica, Scienze, Arti del Linguaggio, Studi Sociali, Lingue Straniere e altro, dai livelli elementari al liceo.',
    
    'faq.q5': 'Quanto sono sicuri i dati degli studenti?',
    'faq.a5': 'Prioritizziamo la privacy degli studenti con sicurezza di livello aziendale, conformità COPPA e pratiche di dati trasparenti. I dati degli studenti sono crittografati e mai condivisi con terze parti.',
    
    'faq.q6': 'C\'è funzionalità offline?',
    'faq.a6': 'Mentre le funzionalità principali richiedono connettività internet per l\'elaborazione IA, offriamo materiali di studio offline e sincronizzazione dei progressi quando la connessione viene ripristinata.',

    // About Section
    'about.title': 'Su TeachlyAI',
    'about.subtitle': 'Siamo in missione per democratizzare l\'educazione di qualità attraverso l\'intelligenza artificiale, rendendo l\'apprendimento personalizzato accessibile a ogni studente nel mondo.',
    
    'about.vision.title': 'La Nostra Visione',
    'about.vision.desc1': 'Crediamo che ogni studente meriti attenzione personalizzata e l\'opportunità di imparare al proprio ritmo. L\'educazione tradizionale taglia unica spesso lascia indietro gli studenti o non li sfida appropriatamente.',
    'about.vision.desc2': 'La nostra piattaforma alimentata dall\'IA colma questa lacuna fornendo istruzione individualizzata, feedback in tempo reale ed esperienze di apprendimento adattive che crescono con ogni studente.',
    
    'about.impact.title': 'Il Nostro Impatto',
    'about.impact.desc': 'Trasformare l\'educazione attraverso l\'innovazione',
    'about.impact.ai': 'Alimentato dall\'IA',
    'about.impact.learning': 'Apprendimento Personalizzato',
    'about.impact.global': '24/7',
    'about.impact.accessibility': 'Accessibilità Globale',
    'about.impact.adaptive': 'Adattivo',
    'about.impact.curriculum': 'Curriculum Intelligente',
    'about.impact.realtime': 'Tempo Reale',
    'about.impact.analytics': 'Analisi Progressi',

    // Contact Section
    'contact.title': 'Mettiti in Contatto',
    'contact.subtitle': 'Hai domande su TeachlyAI? Ci piacerebbe sentirti e aiutarti a iniziare.',
    
    'contact.form.name': 'Nome Completo',
    'contact.form.name.placeholder': 'Inserisci il tuo nome completo',
    'contact.form.email': 'Indirizzo Email',
    'contact.form.email.placeholder': 'Inserisci il tuo indirizzo email',
    'contact.form.message': 'Messaggio',
    'contact.form.message.placeholder': 'Raccontaci come possiamo aiutarti...',
    'contact.form.send': 'Invia Messaggio',

    // Final CTA
    'final.cta.title': 'Pronto a Trasformare l\'Apprendimento?',
    'final.cta.subtitle': 'Unisciti a migliaia di studenti, insegnanti e genitori che stanno già sperimentando il futuro dell\'educazione.',
    'final.cta.trial': 'Inizia Prova Gratuita',
    'final.cta.demo': 'Guarda Demo',

    // Footer
    'footer.description': 'Potenziare studenti in tutto il mondo con esperienze di apprendimento personalizzate alimentate dall\'IA.',
    'footer.product': 'Prodotto',
    'footer.features': 'Funzionalità',
    'footer.pricing': 'Prezzi',
    'footer.demo': 'Demo',
    'footer.company': 'Azienda',
    'footer.about': 'Chi Siamo',
    'footer.blog': 'Blog',
    'footer.careers': 'Carriere',
    'footer.support': 'Supporto',
    'footer.help': 'Centro Aiuto',
    'footer.documentation': 'Documentazione',
    'footer.community': 'Comunità',
    'footer.legal': 'Legale',
    'footer.privacy': 'Politica Privacy',
    'footer.terms': 'Termini di Servizio',
    'footer.cookies': 'Politica Cookie',
    'footer.rights': 'Tutti i diritti riservati.',
  },
  ru: {
    // Header
    'nav.features': 'Возможности',
    'nav.pricing': 'Цены',
    'nav.about': 'О нас',
    'nav.contact': 'Контакты',
    'nav.login': 'Войти',
    'nav.signup': 'Регистрация',
    'nav.demo': 'Попробовать демо',

    // Hero Section
    'hero.title': 'Трансформируйте обучение с образованием на базе ИИ',
    'hero.subtitle': 'Персонализированное адаптивное обучение, которое развивается с каждым учеником. Испытайте будущее образования с нашей интеллектуальной системой репетиторства.',
    'cta.start': 'Начните свой путь обучения',
    'cta.demo': 'Попробовать демо',

    // Features Section
    'features.section.title': 'Мощные возможности для современного обучения',
    'features.section.subtitle': 'Узнайте, как наша платформа на базе ИИ революционизирует образование с персонализированными, увлекательными и эффективными опытами обучения.',
    
    'features.adaptive.title': 'Адаптивное обучение ИИ',
    'features.adaptive.desc': 'Наш ИИ адаптируется к стилю обучения, темпу и предпочтениям каждого ученика для оптимальных образовательных результатов.',
    
    'features.voice.title': 'Голосовое взаимодействие',
    'features.voice.desc': 'Естественные голосовые разговоры делают обучение более увлекательным и доступным для всех учеников.',
    
    'features.content.title': 'Умное создание контента',
    'features.content.desc': 'ИИ генерирует персонализированные учебные материалы, тесты и объяснения, адаптированные к индивидуальным потребностям.',
    
    'features.gamified.title': 'Геймифицированный опыт',
    'features.gamified.desc': 'Системы достижений, отслеживание прогресса и интерактивные вызовы поддерживают мотивацию учеников.',
    
    'features.analytics.title': 'Аналитика в реальном времени',
    'features.analytics.desc': 'Комплексные данные о прогрессе обучения, сильных сторонах и областях для улучшения.',
    
    'features.collaborative.title': 'Совместное обучение',
    'features.collaborative.desc': 'Соединяет учеников, учителей и родителей в единой экосистеме обучения.',

    // Subjects Section
    'subjects.title': 'Всестороннее покрытие предметов',
    'subjects.subtitle': 'От элементарных основ до продвинутых тем, наш ИИ-репетитор покрывает все основные предметы с глубиной и экспертизой.',
    
    'subjects.mathematics.title': 'Математика',
    'subjects.mathematics.desc': 'Алгебра, геометрия, анализ и многое другое',
    
    'subjects.sciences.title': 'Науки',
    'subjects.sciences.desc': 'Физика, химия, биология, науки о Земле',
    
    'subjects.literature.title': 'Литература',
    'subjects.literature.desc': 'Чтение, письмо, грамматика, литературный анализ',
    
    'subjects.social.title': 'Общественные науки',
    'subjects.social.desc': 'История, geography, граждановедение, экономика',
    
    'subjects.technology.title': 'Технологии',
    'subjects.technology.desc': 'Информатика, программирование, цифровая грамотность',
    
    'subjects.arts.title': 'Искусства',
    'subjects.arts.desc': 'Изобразительное искусство, музыка, творческое самовыражение',
    
    'subjects.languages.title': 'Языки',
    'subjects.languages.desc': 'Изучение и практика иностранных языков',
    
    'subjects.health.title': 'Здоровье и физкультура',
    'subjects.health.desc': 'Физическое воспитание, здоровье, благополучие',

    // Advanced Features
    'advanced.title': 'Продвинутые технологии обучения',
    
    'advanced.adaptive.title': 'Персонализированные пути обучения',
    'advanced.adaptive.desc': 'ИИ создает уникальные образовательные пути на основе индивидуальных сильных сторон, слабостей и предпочтений в обучении.',
    
    'advanced.feedback.title': 'Мгновенная обратная связь',
    'advanced.feedback.desc': 'Исправления и объяснения в реальном времени помогают ученикам немедленно учиться на ошибках.',
    
    'advanced.safe.title': 'Безопасная среда обучения',
    'advanced.safe.desc': 'Безопасный для детей ИИ с соответствующей фильтрацией контента и родительским контролем.',
    
    'advanced.availability.title': 'Доступность 24/7',
    'advanced.availability.desc': 'Учитесь в любое время, в любом месте с нашим всегда доступным ИИ-репетитором.',

    // Achievement Section
    'achievement.title': 'Отслеживайте свой прогресс',
    'achievement.desc': 'Мониторьте достижения в обучении и празднуйте вехи с нашей комплексной системой отслеживания прогресса.',
    'achievement.streak': 'Серия обучения',
    'achievement.progress': 'Делаем прогресс',
    'achievement.problems': 'Решенные задачи',
    'achievement.tracking': 'Умное отслеживание',
    'achievement.level': 'Текущий уровень',
    'achievement.growing': 'Продолжайте расти',

    // Testimonials
    'testimonials.title': 'Что говорят педагоги',
    'testimonials.subtitle': 'Услышьте от учителей, родителей и учеников, которые трансформировали свой опыт обучения.',
    
    'testimonials.teacher': 'Учитель старших классов',
    'testimonials.teacher.content': 'Этот ИИ-репетитор революционизировал то, как я поддерживаю своих учеников. Персонализированная обратная связь и адаптивные пути обучения значительно улучшили вовлечение и результаты.',
    
    'testimonials.parent': 'Родитель двух учеников',
    'testimonials.parent.content': 'Мои дети обожают интерактивные уроки и голосовые функции. Их оценки улучшились, и что более важно, они снова увлечены обучением.',
    
    'testimonials.principal': 'Директор школы',
    'testimonials.principal.content': 'Внедрение этой платформы обучения ИИ стало переломным моментом для нашей школы. Учителя могут сосредоточиться на творчестве, пока ИИ обрабатывает персонализированное обучение.',

    // Pricing Section
    'pricing.title': 'Выберите свой план обучения',
    'pricing.subtitle': 'Гибкие варианты ценообразования для удовлетворения каждой потребности в обучении, от индивидуальных учеников до целых школ.',
    
    'pricing.individual': 'Индивидуальный',
    'pricing.individual.price': '699₽',
    'pricing.individual.feature1': 'Один аккаунт ученика',
    'pricing.individual.feature2': 'Все предметные области',
    'pricing.individual.feature3': 'Отслеживание прогресса',
    'pricing.individual.feature4': 'Голосовое взаимодействие',
    
    'pricing.family': 'Семейный',
    'pricing.family.price': '1399₽',
    'pricing.family.feature1': 'До 4 аккаунтов учеников',
    'pricing.family.feature2': 'Панель для родителей',
    'pricing.family.feature3': 'Семейные отчеты о прогрессе',
    'pricing.family.feature4': 'Приоритетная поддержка',
    
    'pricing.school': 'Школа',
    'pricing.school.price': 'Индивидуально',
    'pricing.school.feature1': 'Неограниченное количество учеников',
    'pricing.school.feature2': 'Панель учителя',
    'pricing.school.feature3': 'Пользовательские учебные программы',
    'pricing.school.feature4': 'Админ-аналитика',
    
    'pricing.month': '/месяц',
    'pricing.most.popular': 'Самый популярный',
    'pricing.get.started': 'Начать',
    'pricing.contact.sales': 'Связаться с продажами',

    // FAQ Section
    'faq.title': 'Часто задаваемые вопросы',
    
    'faq.q1': 'Как ИИ адаптируется к различным стилям обучения?',
    'faq.a1': 'Наш ИИ анализирует ответы учеников, темп обучения и предпочтения для создания персонализированных путей обучения. Он корректирует уровни сложности, методы обучения и подачу контента на основе индивидуальных потребностей.',
    
    'faq.q2': 'Подходит ли контент для всех возрастных групп?',
    'faq.a2': 'Да, наш ИИ включает комплексную фильтрацию контента и выбор материалов, соответствующих возрасту. Родители и учителя могут устанавливать дополнительные ограничения и мониторить все взаимодействия.',
    
    'faq.q3': 'Могут ли учителя интегрировать это с существующими учебными программами?',
    'faq.a3': 'Абсолютно! Наша платформа поддерживает интеграцию пользовательских учебных программ и соответствует основным образовательным стандартам, включая Common Core, IB и другие.',
    
    'faq.q4': 'Какие предметы охватываются?',
    'faq.a4': 'Мы охватываем все основные предметы, включая математику, науки, языковые искусства, общественные науки, иностранные языки и многое другое, от начальных до старших классов.',
    
    'faq.q5': 'Насколько безопасны данные учеников?',
    'faq.a5': 'Мы приоритизируем конфиденциальность учеников с корпоративной безопасностью, соответствием COPPA и прозрачными практиками данных. Данные учеников зашифрованы и никогда не передаются третьим лицам.',
    
    'faq.q6': 'Есть ли офлайн-функциональность?',
    'faq.a6': 'Хотя основные функции требуют интернет-соединения для обработки ИИ, мы предлагаем офлайн-учебные материалы и синхронизацию прогресса при восстановлении соединения.',

    // About Section
    'about.title': 'О TeachlyAI',
    'about.subtitle': 'Мы на миссии демократизации качественного образования через искусственный интеллект, делая персонализированное обучение доступным для каждого ученика по всему миру.',
    
    'about.vision.title': 'Наше видение',
    'about.vision.desc1': 'Мы верим, что каждый ученик заслуживает персонализированного внимания и возможности учиться в своем темпе. Традиционное образование "один размер для всех" часто оставляет учеников позади или не вызывает у них соответствующих вызовов.',
    'about.vision.desc2': 'Наша платформа на базе ИИ заполняет этот пробел, предоставляя индивидуализированное обучение, обратную связь в реальном времени и адаптивные опыты обучения, которые растут с каждым учеником.',
    
    'about.impact.title': 'Наше влияние',
    'about.impact.desc': 'Трансформация образования через инновации',
    'about.impact.ai': 'На базе ИИ',
    'about.impact.learning': 'Персонализированное обучение',
    'about.impact.global': '24/7',
    'about.impact.accessibility': 'Глобальная доступность',
    'about.impact.adaptive': 'Адаптивный',
    'about.impact.curriculum': 'Умная программа',
    'about.impact.realtime': 'Реальное время',
    'about.impact.analytics': 'Аналитика прогресса',

    // Contact Section
    'contact.title': 'Свяжитесь с нами',
    'contact.subtitle': 'Есть вопросы о TeachlyAI? Мы бы хотели услышать от вас и помочь начать.',
    
    'contact.form.name': 'Полное имя',
    'contact.form.name.placeholder': 'Введите ваше полное имя',
    'contact.form.email': 'Email адрес',
    'contact.form.email.placeholder': 'Введите ваш email адрес',
    'contact.form.message': 'Сообщение',
    'contact.form.message.placeholder': 'Расскажите нам, как мы можем помочь вам...',
    'contact.form.send': 'Отправить сообщение',

    // Final CTA
    'final.cta.title': 'Готовы трансформировать обучение?',
    'final.cta.subtitle': 'Присоединяйтесь к тысячам учеников, учителей и родителей, которые уже испытывают будущее образования.',
    'final.cta.trial': 'Начать бесплатную пробную версию',
    'final.cta.demo': 'Посмотреть демо',

    // Footer
    'footer.description': 'Расширение возможностей учеников по всему миру с персонализированными опытами обучения на базе ИИ.',
    'footer.product': 'Продукт',
    'footer.features': 'Возможности',
    'footer.pricing': 'Цены',
    'footer.demo': 'Демо',
    'footer.company': 'Компания',
    'footer.about': 'О нас',
    'footer.blog': 'Блог',
    'footer.careers': 'Карьера',
    'footer.support': 'Поддержка',
    'footer.help': 'Центр помощи',
    'footer.documentation': 'Документация',
    'footer.community': 'Сообщество',
    'footer.legal': 'Правовые вопросы',
    'footer.privacy': 'Политика конфиденциальности',
    'footer.terms': 'Условия обслуживания',
    'footer.cookies': 'Политика файлов cookie',
    'footer.rights': 'Все права защищены.',
  },
  ar: {
    // Header
    'nav.features': 'الميزات',
    'nav.pricing': 'الأسعار',
    'nav.about': 'من نحن',
    'nav.contact': 'اتصل بنا',
    'nav.login': 'تسجيل الدخول',
    'nav.signup': 'التسجيل',
    'nav.demo': 'جرب العرض التوضيحي',

    // Hero Section
    'hero.title': 'غيّر التعلم بالتعليم المدعوم بالذكاء الاصطناعي',
    'hero.subtitle': 'تعلم شخصي وتكيفي ينمو مع كل طالب. اختبر مستقبل التعليم مع نظام التدريس الذكي الخاص بنا.',
    'cta.start': 'ابدأ رحلة التعلم الخاصة بك',
    'cta.demo': 'جرب العرض التوضيحي',

    // Features Section
    'features.section.title': 'ميزات قوية للتعلم الحديث',
    'features.section.subtitle': 'اكتشف كيف تحدث منصتنا المدعومة بالذكاء الاصطناعي ثورة في التعليم بتجارب تعلم شخصية وجذابة وفعالة.',
    
    'features.adaptive.title': 'التعلم التكيفي بالذكاء الاصطناعي',
    'features.adaptive.desc': 'يتكيف ذكاؤنا الاصطناعي مع أسلوب التعلم والوتيرة والتفضيلات لكل طالب لتحقيق أفضل النتائج التعليمية.',
    
    'features.voice.title': 'التفاعل الصوتي',
    'features.voice.desc': 'المحادثات الصوتية الطبيعية تجعل التعلم أكثر جاذبية وإمكانية وصول لجميع الطلاب.',
    
    'features.content.title': 'إنشاء المحتوى الذكي',
    'features.content.desc': 'الذكاء الاصطناعي ينتج مواد تعلم شخصية واختبارات وشروحات مصممة خصيصاً للاحتياجات الفردية.',
    
    'features.gamified.title': 'تجربة اللعب',
    'features.gamified.desc': 'أنظمة الإنجازات وتتبع التقدم والتحديات التفاعلية تحافظ على دافعية الطلاب.',
    
    'features.analytics.title': 'التحليلات في الوقت الفعلي',
    'features.analytics.desc': 'رؤى شاملة حول تقدم التعلم ونقاط القوة ومجالات التحسين.',
    
    'features.collaborative.title': 'التعلم التعاوني',
    'features.collaborative.desc': 'يربط الطلاب والمعلمين وأولياء الأمور في نظام تعلم موحد.',

    // Subjects Section
    'subjects.title': 'تغطية شاملة للموضوعات',
    'subjects.subtitle': 'من الأساسيات الابتدائية إلى المواضيع المتقدمة، مدرسنا الذكي يغطي جميع المواد الرئيسية بعمق وخبرة.',
    
    'subjects.mathematics.title': 'الرياضيات',
    'subjects.mathematics.desc': 'الجبر والهندسة والتفاضل والتكامل وأكثر',
    
    'subjects.sciences.title': 'العلوم',
    'subjects.sciences.desc': 'الفيزياء والكيمياء والأحياء وعلوم الأرض',
    
    'subjects.literature.title': 'الأدب',
    'subjects.literature.desc': 'القراءة والكتابة والنحو وتحليل الأدب',
    
    'subjects.social.title': 'الدراسات الاجتماعية',
    'subjects.social.desc': 'التاريخ والجغرافيا والتربية المدنية والاقتصاد',
    
    'subjects.technology.title': 'التكنولوجيا',
    'subjects.technology.desc': 'علوم الكمبيوتر والبرمجة والثقافة الرقمية',
    
    'subjects.arts.title': 'الفنون',
    'subjects.arts.desc': 'الفنون البصرية والموسيقى والتعبير الإبداعي',
    
    'subjects.languages.title': 'اللغات',
    'subjects.languages.desc': 'تعلم وممارسة اللغات الأجنبية',
    
    'subjects.health.title': 'الصحة والتربية البدنية',
    'subjects.health.desc': 'التربية البدنية والصحة والعافية',

    // Advanced Features
    'advanced.title': 'تكنولوجيا التعلم المتقدمة',
    
    'advanced.adaptive.title': 'مسارات التعلم الشخصية',
    'advanced.adaptive.desc': 'الذكاء الاصطناعي يخلق رحلات تعلم فريدة بناءً على نقاط القوة والضعف وتفضيلات التعلم الفردية.',
    
    'advanced.feedback.title': 'التغذية الراجعة الفورية',
    'advanced.feedback.desc': 'التصحيحات والشروحات في الوقت الفعلي تساعد الطلاب على التعلم من الأخطاء فوراً.',
    
    'advanced.safe.title': 'بيئة تعلم آمنة',
    'advanced.safe.desc': 'ذكاء اصطناعي آمن للأطفال مع تصفية المحتوى المناسب والتحكم الأبوي.',
    
    'advanced.availability.title': 'متاحة 24/7',
    'advanced.availability.desc': 'تعلم في أي وقت وأي مكان مع مدرسنا الذكي المتاح دائماً.',

    // Achievement Section
    'achievement.title': 'تتبع تقدمك',
    'achievement.desc': 'راقب إنجازات التعلم واحتفل بالمعالم مع نظام تتبع التقدم الشامل الخاص بنا.',
    'achievement.streak': 'سلسلة التعلم',
    'achievement.progress': 'إحراز تقدم',
    'achievement.problems': 'المشاكل المحلولة',
    'achievement.tracking': 'التتبع الذكي',
    'achievement.level': 'المستوى الحالي',
    'achievement.growing': 'استمر في النمو',

    // Testimonials
    'testimonials.title': 'ما يقوله المربون',
    'testimonials.subtitle': 'استمع من المعلمين وأولياء الأمور والطلاب الذين غيروا تجربة التعلم الخاصة بهم.',
    
    'testimonials.teacher': 'معلمة الثانوية العامة',
    'testimonials.teacher.content': 'هذا المدرس الذكي ثور كيف أدعم طلابي. التغذية الراجعة الشخصية ومسارات التعلم التكيفية حسنت بشكل كبير المشاركة والنتائج.',
    
    'testimonials.parent': 'والد لطالبين',
    'testimonials.parent.content': 'أطفالي يحبون الدروس التفاعلية والميزات الصوتية. تحسنت درجاتهم والأهم من ذلك، هم متحمسون للتعلم مرة أخرى.',
    
    'testimonials.principal': 'مدير المدرسة',
    'testimonials.principal.content': 'تنفيذ منصة التعلم الذكي هذه كان نقطة تحول لمدرستنا. يمكن للمعلمين التركيز على الإبداع بينما يتولى الذكاء الاصطناعي التعليم الشخصي.',

    // Pricing Section
    'pricing.title': 'اختر خطة التعلم الخاصة بك',
    'pricing.subtitle': 'خيارات تسعير مرنة لتناسب كل احتياج تعليمي، من الطلاب الأفراد إلى المدارس بأكملها.',
    
    'pricing.individual': 'فردي',
    'pricing.individual.price': '37 ريال',
    'pricing.individual.feature1': 'حساب طالب واحد',
    'pricing.individual.feature2': 'جميع المواد الدراسية',
    'pricing.individual.feature3': 'تتبع التقدم',
    'pricing.individual.feature4': 'التفاعل الصوتي',
    
    'pricing.family': 'عائلي',
    'pricing.family.price': '75 ريال',
    'pricing.family.feature1': 'حتى 4 حسابات طلاب',
    'pricing.family.feature2': 'لوحة تحكم للوالدين',
    'pricing.family.feature3': 'تقارير تقدم العائلة',
    'pricing.family.feature4': 'دعم أولوية',
    
    'pricing.school': 'مدرسة',
    'pricing.school.price': 'مخصص',
    'pricing.school.feature1': 'طلاب غير محدودين',
    'pricing.school.feature2': 'لوحة تحكم المعلم',
    'pricing.school.feature3': 'مناهج مخصصة',
    'pricing.school.feature4': 'تحليلات الإدارة',
    
    'pricing.month': '/شهر',
    'pricing.most.popular': 'الأكثر شعبية',
    'pricing.get.started': 'ابدأ',
    'pricing.contact.sales': 'اتصل بالمبيعات',

    // FAQ Section
    'faq.title': 'الأسئلة الشائعة',
    
    'faq.q1': 'كيف يتكيف الذكاء الاصطناعي مع أساليب التعلم المختلفة؟',
    'faq.a1': 'ذكاؤنا الاصطناعي يحلل إجابات الطلاب ووتيرة التعلم والتفضيلات لإنشاء مسارات تعلم شخصية. يضبط مستويات الصعوبة وطرق التدريس وتقديم المحتوى بناءً على الاحتياجات الفردية.',
    
    'faq.q2': 'هل المحتوى مناسب لجميع الفئات العمرية؟',
    'faq.a2': 'نعم، ذكاؤنا الاصطناعي يتضمن تصفية شاملة للمحتوى واختيار مواد مناسبة للعمر. يمكن للوالدين والمعلمين وضع قيود إضافية ومراقبة جميع التفاعلات.',
    
    'faq.q3': 'هل يمكن للمعلمين دمج هذا مع المناهج الموجودة؟',
    'faq.a3': 'بالتأكيد! منصتنا تدعم تكامل المناهج المخصصة وتتماشى مع المعايير التعليمية الرئيسية بما في ذلك Common Core وIB وغيرها.',
    
    'faq.q4': 'ما هي المواد المغطاة؟',
    'faq.a4': 'نغطي جميع المواد الرئيسية بما في ذلك الرياضيات والعلوم وفنون اللغة والدراسات الاجتماعية واللغات الأجنبية وأكثر، من المستويات الابتدائية إلى الثانوية.',
    
    'faq.q5': 'ما مدى أمان بيانات الطلاب؟',
    'faq.a5': 'نعطي الأولوية لخصوصية الطلاب بأمان على مستوى المؤسسات وامتثال COPPA وممارسات بيانات شفافة. بيانات الطلاب مشفرة ولا تُشارك أبداً مع أطراف ثالثة.',
    
    'faq.q6': 'هل هناك وظائف بدون اتصال؟',
    'faq.a6': 'بينما تتطلب الميزات الأساسية اتصالاً بالإنترنت لمعالجة الذكاء الاصطناعي، نقدم مواد دراسة بدون اتصال ومزامنة التقدم عندما يتم استعادة الاتصال.',

    // About Section
    'about.title': 'حول TeachlyAI',
    'about.subtitle': 'نحن في مهمة لجعل التعليم عالي الجودة ديمقراطياً من خلال الذكاء الاصطناعي، مما يجعل التعلم الشخصي متاحاً لكل طالب في العالم.',
    
    'about.vision.title': 'رؤيتنا',
    'about.vision.desc1': 'نؤمن أن كل طالب يستحق الاهتمام الشخصي والفرصة للتعلم بوتيرته الخاصة. التعليم التقليدي الموحد غالباً ما يترك الطلاب وراءه أو يفشل في تحديهم بشكل مناسب.',
    'about.vision.desc2': 'منصتنا المدعومة بالذكاء الاصطناعي تسد هذه الفجوة من خلال توفير تعليم فردي وتغذية راجعة في الوقت الفعلي وتجارب تعلم تكيفية تنمو مع كل طالب.',
    
    'about.impact.title': 'تأثيرنا',
    'about.impact.desc': 'تحويل التعليم من خلال الابتكار',
    'about.impact.ai': 'مدعوم بالذكاء الاصطناعي',
    'about.impact.learning': 'التعلم الشخصي',
    'about.impact.global': '24/7',
    'about.impact.accessibility': 'الوصولية العالمية',
    'about.impact.adaptive': 'تكيفي',
    'about.impact.curriculum': 'منهج ذكي',
    'about.impact.realtime': 'الوقت الفعلي',
    'about.impact.analytics': 'تحليلات التقدم',

    // Contact Section
    'contact.title': 'تواصل معنا',
    'contact.subtitle': 'هل لديك أسئلة حول TeachlyAI؟ نود أن نسمع منك ونساعدك على البدء.',
    
    'contact.form.name': 'الاسم الكامل',
    'contact.form.name.placeholder': 'أدخل اسمك الكامل',
    'contact.form.email': 'عنوان البريد الإلكتروني',
    'contact.form.email.placeholder': 'أدخل عنوان بريدك الإلكتروني',
    'contact.form.message': 'الرسالة',
    'contact.form.message.placeholder': 'أخبرنا كيف يمكننا مساعدتك...',
    'contact.form.send': 'إرسال الرسالة',

    // Final CTA
    'final.cta.title': 'مستعد لتحويل التعلم؟',
    'final.cta.subtitle': 'انضم إلى آلاف الطلاب والمعلمين وأولياء الأمور الذين يختبرون بالفعل مستقبل التعليم.',
    'final.cta.trial': 'ابدأ التجربة المجانية',
    'final.cta.demo': 'شاهد العرض التوضيحي',

    // Footer
    'footer.description': 'تمكين الطلاب في جميع أنحاء العالم بتجارب تعلم شخصية مدعومة بالذكاء الاصطناعي.',
    'footer.product': 'المنتج',
    'footer.features': 'الميزات',
    'footer.pricing': 'الأسعار',
    'footer.demo': 'العرض التوضيحي',
    'footer.company': 'الشركة',
    'footer.about': 'من نحن',
    'footer.blog': 'المدونة',
    'footer.careers': 'الوظائف',
    'footer.support': 'الدعم',
    'footer.help': 'مركز المساعدة',
    'footer.documentation': 'التوثيق',
    'footer.community': 'المجتمع',
    'footer.legal': 'القانونية',
    'footer.privacy': 'سياسة الخصوصية',
    'footer.terms': 'شروط الخدمة',
    'footer.cookies': 'سياسة ملفات تعريف الارتباط',
    'footer.rights': 'جميع الحقوق محفوظة.',
  }
};

const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && translations[savedLanguage]) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
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

export { LanguageProvider };
