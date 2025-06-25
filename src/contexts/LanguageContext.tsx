import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LanguageContextProps {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

const translations = {
  en: {
    common: {
      loading: 'Loading...',
      back: 'Back',
      more: 'more',
    },
    modules: {
      title: 'Learning Modules',
      description: 'Explore our curated collection of learning modules and curricula designed by education experts',
      searchPlaceholder: 'Search modules...',
      categories: {
        all: 'All Modules',
        math: 'Mathematics',
        science: 'Science',
        english: 'English',
        history: 'History',
        programming: 'Programming'
      },
      subjects: 'Subjects',
      standards: 'Standards',
      startLearning: 'Start Learning',
      noModulesFound: 'No modules found',
      adjustFilters: 'Try adjusting your search or filter criteria'
    },
    progress: {
      title: 'Learning Dashboard',
      demoTitle: 'Parent Dashboard Demo',
      description: 'Track your quests, monitor progress, and see your learning analytics.',
      demoDescription: 'See how you can monitor your child\'s learning progress, quests, and achievements.',
      demoNotice: 'This is a demo showing Emma Johnson\'s learning progress. Sign up to track your child\'s actual progress!',
      notAvailable: 'Monitoring dashboard not available for students.',
      tabs: {
        monitoring: 'Overview',
        childProgress: 'Child Progress',
        quests: 'Quests',
        achievements: 'Achievements',
        subjects: 'Subjects',
        analytics: 'Analytics'
      }
    },
    testing: {
      title: 'Testing',
      createTest: 'Create a Test',
      quizLibrary: 'Quiz Library'
    },
    chat: {
      title: 'AI Tutor Chat',
      newChat: 'New Chat',
      previousChats: 'Previous Chats',
      sendMessage: 'Send message',
      voiceResponse: 'Voice Response',
      uploadFile: 'Upload File',
      navigation: {
        chat: 'Chat',
        progress: 'Progress',
        modules: 'Modules'
      }
    },
    auth: {
      title: 'Welcome to TeachlyAI',
      subtitle: 'Sign in to access your personalized learning experience',
      signInTab: 'Sign In',
      signUpTab: 'Sign Up',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      signInButton: 'Sign In',
      signUpButton: 'Create Account',
      forgotPassword: 'Forgot your password?',
      noAccount: 'Don\'t have an account?',
      hasAccount: 'Already have an account?',
      signUpLink: 'Sign up here',
      signInLink: 'Sign in here',
      errors: {
        invalidCredentials: 'Invalid email or password',
        emailInUse: 'Email already in use',
        weakPassword: 'Password should be at least 6 characters',
        passwordMismatch: 'Passwords do not match',
        genericError: 'An error occurred. Please try again.'
      }
    }
  },
  es: {
    common: {
      loading: 'Cargando...',
      back: 'Atrás',
      more: 'más',
    },
    modules: {
      title: 'Módulos de Aprendizaje',
      description: 'Explora nuestra colección curada de módulos de aprendizaje y currículos diseñados por expertos en educación',
      searchPlaceholder: 'Buscar módulos...',
      categories: {
        all: 'Todos los Módulos',
        math: 'Matemáticas',
        science: 'Ciencias',
        english: 'Inglés',
        history: 'Historia',
        programming: 'Programación'
      },
      subjects: 'Materias',
      standards: 'Estándares',
      startLearning: 'Comenzar a Aprender',
      noModulesFound: 'No se encontraron módulos',
      adjustFilters: 'Intenta ajustar tu búsqueda o criterios de filtro'
    },
    progress: {
      title: 'Panel de Aprendizaje',
      demoTitle: 'Demo del Panel para Padres',
      description: 'Rastrea tus misiones, monitorea el progreso y ve tus análisis de aprendizaje.',
      demoDescription: 'Ve cómo puedes monitorear el progreso de aprendizaje, misiones y logros de tu hijo.',
      demoNotice: 'Esta es una demo mostrando el progreso de aprendizaje de Emma Johnson. ¡Regístrate para rastrear el progreso real de tu hijo!',
      notAvailable: 'El panel de monitoreo no está disponible para estudiantes.',
      tabs: {
        monitoring: 'Resumen',
        childProgress: 'Progreso del Niño',
        quests: 'Misiones',
        achievements: 'Logros',
        subjects: 'Materias',
        analytics: 'Análisis'
      }
    },
    testing: {
      title: 'Pruebas',
      createTest: 'Crear una Prueba',
      quizLibrary: 'Biblioteca de Cuestionarios'
    },
    chat: {
      title: 'Chat del Tutor IA',
      newChat: 'Nuevo Chat',
      previousChats: 'Chats Anteriores',
      sendMessage: 'Enviar mensaje',
      voiceResponse: 'Respuesta de Voz',
      uploadFile: 'Subir Archivo',
      navigation: {
        chat: 'Chat',
        progress: 'Progreso',
        modules: 'Módulos'
      }
    },
    auth: {
      title: 'Bienvenido a TeachlyAI',
      subtitle: 'Inicia sesión para acceder a tu experiencia de aprendizaje personalizada',
      signInTab: 'Iniciar Sesión',
      signUpTab: 'Registrarse',
      email: 'Correo Electrónico',
      password: 'Contraseña',
      confirmPassword: 'Confirmar Contraseña',
      signInButton: 'Iniciar Sesión',
      signUpButton: 'Crear Cuenta',
      forgotPassword: '¿Olvidaste tu contraseña?',
      noAccount: '¿No tienes una cuenta?',
      hasAccount: '¿Ya tienes una cuenta?',
      signUpLink: 'Regístrate aquí',
      signInLink: 'Inicia sesión aquí',
      errors: {
        invalidCredentials: 'Correo o contraseña inválidos',
        emailInUse: 'Correo ya en uso',
        weakPassword: 'La contraseña debe tener al menos 6 caracteres',
        passwordMismatch: 'Las contraseñas no coinciden',
        genericError: 'Ocurrió un error. Por favor intenta de nuevo.'
      }
    }
  },
  fr: {
    common: {
      loading: 'Chargement...',
      back: 'Retour',
      more: 'plus',
    },
    modules: {
      title: 'Modules d\'Apprentissage',
      description: 'Explorez notre collection sélectionnée de modules d\'apprentissage et de programmes conçus par des experts en éducation',
      searchPlaceholder: 'Rechercher des modules...',
      categories: {
        all: 'Tous les Modules',
        math: 'Mathématiques',
        science: 'Sciences',
        english: 'Anglais',
        history: 'Histoire',
        programming: 'Programmation'
      },
      subjects: 'Sujets',
      standards: 'Standards',
      startLearning: 'Commencer l\'Apprentissage',
      noModulesFound: 'Aucun module trouvé',
      adjustFilters: 'Essayez d\'ajuster votre recherche ou vos critères de filtre'
    },
    progress: {
      title: 'Tableau de Bord d\'Apprentissage',
      demoTitle: 'Démo du Tableau de Bord Parent',
      description: 'Suivez vos quêtes, surveillez les progrès et consultez vos analyses d\'apprentissage.',
      demoDescription: 'Voyez comment vous pouvez surveiller les progrès d\'apprentissage, les quêtes et les réalisations de votre enfant.',
      demoNotice: 'Ceci est une démo montrant les progrès d\'apprentissage d\'Emma Johnson. Inscrivez-vous pour suivre les vrais progrès de votre enfant!',
      notAvailable: 'Tableau de bord de surveillance non disponible pour les étudiants.',
      tabs: {
        monitoring: 'Aperçu',
        childProgress: 'Progrès de l\'Enfant',
        quests: 'Quêtes',
        achievements: 'Réalisations',
        subjects: 'Sujets',
        analytics: 'Analyses'
      }
    },
    testing: {
      title: 'Tests',
      createTest: 'Créer un Test',
      quizLibrary: 'Bibliothèque de Quiz'
    },
    chat: {
      title: 'Chat Tuteur IA',
      newChat: 'Nouveau Chat',
      previousChats: 'Chats Précédents',
      sendMessage: 'Envoyer un message',
      voiceResponse: 'Réponse Vocale',
      uploadFile: 'Télécharger un Fichier',
      navigation: {
        chat: 'Chat',
        progress: 'Progrès',
        modules: 'Modules'
      }
    },
    auth: {
      title: 'Bienvenue sur TeachlyAI',
      subtitle: 'Connectez-vous pour accéder à votre expérience d\'apprentissage personnalisée',
      signInTab: 'Se Connecter',
      signUpTab: 'S\'Inscrire',
      email: 'Email',
      password: 'Mot de Passe',
      confirmPassword: 'Confirmer le Mot de Passe',
      signInButton: 'Se Connecter',
      signUpButton: 'Créer un Compte',
      forgotPassword: 'Mot de passe oublié?',
      noAccount: 'Vous n\'avez pas de compte?',
      hasAccount: 'Vous avez déjà un compte?',
      signUpLink: 'Inscrivez-vous ici',
      signInLink: 'Connectez-vous ici',
      errors: {
        invalidCredentials: 'Email ou mot de passe invalide',
        emailInUse: 'Email déjà utilisé',
        weakPassword: 'Le mot de passe doit contenir au moins 6 caractères',
        passwordMismatch: 'Les mots de passe ne correspondent pas',
        genericError: 'Une erreur s\'est produite. Veuillez réessayer.'
      }
    }
  },
  de: {
    common: {
      loading: 'Laden...',
      back: 'Zurück',
      more: 'mehr',
    },
    modules: {
      title: 'Lernmodule',
      description: 'Entdecken Sie unsere kuratierte Sammlung von Lernmodulen und Lehrplänen, die von Bildungsexperten entwickelt wurden',
      searchPlaceholder: 'Module suchen...',
      categories: {
        all: 'Alle Module',
        math: 'Mathematik',
        science: 'Wissenschaft',
        english: 'Englisch',
        history: 'Geschichte',
        programming: 'Programmierung'
      },
      subjects: 'Fächer',
      standards: 'Standards',
      startLearning: 'Lernen Beginnen',
      noModulesFound: 'Keine Module gefunden',
      adjustFilters: 'Versuchen Sie, Ihre Such- oder Filterkriterien anzupassen'
    },
    progress: {
      title: 'Lern-Dashboard',
      demoTitle: 'Eltern-Dashboard Demo',
      description: 'Verfolgen Sie Ihre Quests, überwachen Sie Fortschritte und sehen Sie Ihre Lernanalysen.',
      demoDescription: 'Sehen Sie, wie Sie die Lernfortschritte, Quests und Errungenschaften Ihres Kindes überwachen können.',
      demoNotice: 'Dies ist eine Demo, die Emma Johnsons Lernfortschritt zeigt. Melden Sie sich an, um die tatsächlichen Fortschritte Ihres Kindes zu verfolgen!',
      notAvailable: 'Überwachungs-Dashboard für Schüler nicht verfügbar.',
      tabs: {
        monitoring: 'Übersicht',
        childProgress: 'Kindfortschritt',
        quests: 'Quests',
        achievements: 'Errungenschaften',
        subjects: 'Fächer',
        analytics: 'Analysen'
      }
    },
    testing: {
      title: 'Tests',
      createTest: 'Test Erstellen',
      quizLibrary: 'Quiz-Bibliothek'
    },
    chat: {
      title: 'KI-Tutor Chat',
      newChat: 'Neuer Chat',
      previousChats: 'Vorherige Chats',
      sendMessage: 'Nachricht senden',
      voiceResponse: 'Sprachantwort',
      uploadFile: 'Datei hochladen',
      navigation: {
        chat: 'Chat',
        progress: 'Fortschritt',
        modules: 'Module'
      }
    },
    auth: {
      title: 'Willkommen bei TeachlyAI',
      subtitle: 'Melden Sie sich an, um auf Ihre personalisierte Lernerfahrung zuzugreifen',
      signInTab: 'Anmelden',
      signUpTab: 'Registrieren',
      email: 'E-Mail',
      password: 'Passwort',
      confirmPassword: 'Passwort Bestätigen',
      signInButton: 'Anmelden',
      signUpButton: 'Konto Erstellen',
      forgotPassword: 'Passwort vergessen?',
      noAccount: 'Haben Sie kein Konto?',
      hasAccount: 'Haben Sie bereits ein Konto?',
      signUpLink: 'Hier registrieren',
      signInLink: 'Hier anmelden',
      errors: {
        invalidCredentials: 'Ungültige E-Mail oder Passwort',
        emailInUse: 'E-Mail bereits in Verwendung',
        weakPassword: 'Passwort sollte mindestens 6 Zeichen haben',
        passwordMismatch: 'Passwörter stimmen nicht überein',
        genericError: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.'
      }
    }
  },
  zh: {
    common: {
      loading: '加载中...',
      back: '返回',
      more: '更多',
    },
    modules: {
      title: '学习模块',
      description: '探索我们由教育专家设计的精选学习模块和课程集合',
      searchPlaceholder: '搜索模块...',
      categories: {
        all: '所有模块',
        math: '数学',
        science: '科学',
        english: '英语',
        history: '历史',
        programming: '编程'
      },
      subjects: '科目',
      standards: '标准',
      startLearning: '开始学习',
      noModulesFound: '未找到模块',
      adjustFilters: '尝试调整您的搜索或筛选条件'
    },
    progress: {
      title: '学习仪表板',
      demoTitle: '家长仪表板演示',
      description: '跟踪您的任务，监控进度，查看您的学习分析。',
      demoDescription: '了解如何监控孩子的学习进度、任务和成就。',
      demoNotice: '这是展示Emma Johnson学习进度的演示。注册以跟踪您孩子的实际进度！',
      notAvailable: '学生无法使用监控仪表板。',
      tabs: {
        monitoring: '概览',
        childProgress: '孩子进度',
        quests: '任务',
        achievements: '成就',
        subjects: '科目',
        analytics: '分析'
      }
    },
    testing: {
      title: '测试',
      createTest: '创建测试',
      quizLibrary: '测验库'
    },
    chat: {
      title: 'AI导师聊天',
      newChat: '新聊天',
      previousChats: '之前的聊天',
      sendMessage: '发送消息',
      voiceResponse: '语音回复',
      uploadFile: '上传文件',
      navigation: {
        chat: '聊天',
        progress: '进度',
        modules: '模块'
      }
    },
    auth: {
      title: '欢迎来到TeachlyAI',
      subtitle: '登录以访问您的个性化学习体验',
      signInTab: '登录',
      signUpTab: '注册',
      email: '邮箱',
      password: '密码',
      confirmPassword: '确认密码',
      signInButton: '登录',
      signUpButton: '创建账户',
      forgotPassword: '忘记密码？',
      noAccount: '没有账户？',
      hasAccount: '已有账户？',
      signUpLink: '在此注册',
      signInLink: '在此登录',
      errors: {
        invalidCredentials: '邮箱或密码无效',
        emailInUse: '邮箱已被使用',
        weakPassword: '密码应至少6个字符',
        passwordMismatch: '密码不匹配',
        genericError: '发生错误。请重试。'
      }
    }
  },
  ja: {
    common: {
      loading: '読み込み中...',
      back: '戻る',
      more: 'もっと',
    },
    modules: {
      title: '学習モジュール',
      description: '教育専門家によって設計された厳選された学習モジュールとカリキュラムのコレクションを探索してください',
      searchPlaceholder: 'モジュールを検索...',
      categories: {
        all: 'すべてのモジュール',
        math: '数学',
        science: '科学',
        english: '英語',
        history: '歴史',
        programming: 'プログラミング'
      },
      subjects: '科目',
      standards: '標準',
      startLearning: '学習を開始',
      noModulesFound: 'モジュールが見つかりません',
      adjustFilters: '検索やフィルター条件を調整してみてください'
    },
    progress: {
      title: '学習ダッシュボード',
      demoTitle: '保護者ダッシュボードデモ',
      description: 'クエストを追跡し、進捗を監視し、学習分析を確認します。',
      demoDescription: 'お子様の学習進捗、クエスト、実績を監視する方法をご覧ください。',
      demoNotice: 'これはEmma Johnsonの学習進捗を示すデモです。お子様の実際の進捗を追跡するにはサインアップしてください！',
      notAvailable: '学生は監視ダッシュボードを利用できません。',
      tabs: {
        monitoring: '概要',
        childProgress: '子供の進捗',
        quests: 'クエスト',
        achievements: '実績',
        subjects: '科目',
        analytics: '分析'
      }
    },
    testing: {
      title: 'テスト',
      createTest: 'テストを作成',
      quizLibrary: 'クイズライブラリ'
    },
    chat: {
      title: 'AIチューターチャット',
      newChat: '新しいチャット',
      previousChats: '以前のチャット',
      sendMessage: 'メッセージを送信',
      voiceResponse: '音声応答',
      uploadFile: 'ファイルをアップロード',
      navigation: {
        chat: 'チャット',
        progress: '進捗',
        modules: 'モジュール'
      }
    },
    auth: {
      title: 'TeachlyAIへようこそ',
      subtitle: 'パーソナライズされた学習体験にアクセスするためにサインインしてください',
      signInTab: 'サインイン',
      signUpTab: 'サインアップ',
      email: 'メール',
      password: 'パスワード',
      confirmPassword: 'パスワード確認',
      signInButton: 'サインイン',
      signUpButton: 'アカウント作成',
      forgotPassword: 'パスワードをお忘れですか？',
      noAccount: 'アカウントをお持ちではありませんか？',
      hasAccount: 'すでにアカウントをお持ちですか？',
      signUpLink: 'こちらでサインアップ',
      signInLink: 'こちらでサインイン',
      errors: {
        invalidCredentials: '無効なメールまたはパスワード',
        emailInUse: 'メールは既に使用されています',
        weakPassword: 'パスワードは少なくとも6文字である必要があります',
        passwordMismatch: 'パスワードが一致しません',
        genericError: 'エラーが発生しました。もう一度お試しください。'
      }
    }
  },
  pt: {
    common: {
      loading: 'Carregando...',
      back: 'Voltar',
      more: 'mais',
    },
    modules: {
      title: 'Módulos de Aprendizagem',
      description: 'Explore nossa coleção selecionada de módulos de aprendizagem e currículos projetados por especialistas em educação',
      searchPlaceholder: 'Pesquisar módulos...',
      categories: {
        all: 'Todos os Módulos',
        math: 'Matemática',
        science: 'Ciências',
        english: 'Inglês',
        history: 'História',
        programming: 'Programação'
      },
      subjects: 'Matérias',
      standards: 'Padrões',
      startLearning: 'Começar a Aprender',
      noModulesFound: 'Nenhum módulo encontrado',
      adjustFilters: 'Tente ajustar sua pesquisa ou critérios de filtro'
    },
    progress: {
      title: 'Painel de Aprendizagem',
      demoTitle: 'Demo do Painel dos Pais',
      description: 'Acompanhe suas missões, monitore o progresso e veja suas análises de aprendizagem.',
      demoDescription: 'Veja como você pode monitorar o progresso de aprendizagem, missões e conquistas do seu filho.',
      demoNotice: 'Esta é uma demo mostrando o progresso de aprendizagem de Emma Johnson. Cadastre-se para acompanhar o progresso real do seu filho!',
      notAvailable: 'Painel de monitoramento não disponível para estudantes.',
      tabs: {
        monitoring: 'Visão Geral',
        childProgress: 'Progresso da Criança',
        quests: 'Missões',
        achievements: 'Conquistas',
        subjects: 'Matérias',
        analytics: 'Análises'
      }
    },
    testing: {
      title: 'Testes',
      createTest: 'Criar Teste',
      quizLibrary: 'Biblioteca de Quiz'
    },
    chat: {
      title: 'Chat do Tutor IA',
      newChat: 'Novo Chat',
      previousChats: 'Chats Anteriores',
      sendMessage: 'Enviar mensagem',
      voiceResponse: 'Resposta por Voz',
      uploadFile: 'Enviar Arquivo',
      navigation: {
        chat: 'Chat',
        progress: 'Progresso',
        modules: 'Módulos'
      }
    },
    auth: {
      title: 'Bem-vindo ao TeachlyAI',
      subtitle: 'Faça login para acessar sua experiência de aprendizagem personalizada',
      signInTab: 'Entrar',
      signUpTab: 'Cadastrar',
      email: 'E-mail',
      password: 'Senha',
      confirmPassword: 'Confirmar Senha',
      signInButton: 'Entrar',
      signUpButton: 'Criar Conta',
      forgotPassword: 'Esqueceu sua senha?',
      noAccount: 'Não tem uma conta?',
      hasAccount: 'Já tem uma conta?',
      signUpLink: 'Cadastre-se aqui',
      signInLink: 'Entre aqui',
      errors: {
        invalidCredentials: 'E-mail ou senha inválidos',
        emailInUse: 'E-mail já em uso',
        weakPassword: 'A senha deve ter pelo menos 6 caracteres',
        passwordMismatch: 'As senhas não coincidem',
        genericError: 'Ocorreu um erro. Tente novamente.'
      }
    }
  },
  it: {
    common: {
      loading: 'Caricamento...',
      back: 'Indietro',
      more: 'altro',
    },
    modules: {
      title: 'Moduli di Apprendimento',
      description: 'Esplora la nostra collezione curata di moduli di apprendimento e curricoli progettati da esperti di educazione',
      searchPlaceholder: 'Cerca moduli...',
      categories: {
        all: 'Tutti i Moduli',
        math: 'Matematica',
        science: 'Scienze',
        english: 'Inglese',
        history: 'Storia',
        programming: 'Programmazione'
      },
      subjects: 'Materie',
      standards: 'Standard',
      startLearning: 'Inizia ad Imparare',
      noModulesFound: 'Nessun modulo trovato',
      adjustFilters: 'Prova ad aggiustare la tua ricerca o i criteri di filtro'
    },
    progress: {
      title: 'Dashboard di Apprendimento',
      demoTitle: 'Demo Dashboard Genitori',
      description: 'Traccia le tue missioni, monitora i progressi e vedi le tue analisi di apprendimento.',
      demoDescription: 'Vedi come puoi monitorare i progressi di apprendimento, le missioni e i risultati di tuo figlio.',
      demoNotice: 'Questa è una demo che mostra i progressi di apprendimento di Emma Johnson. Registrati per tracciare i veri progressi di tuo figlio!',
      notAvailable: 'Dashboard di monitoraggio non disponibile per gli studenti.',
      tabs: {
        monitoring: 'Panoramica',
        childProgress: 'Progresso del Bambino',
        quests: 'Missioni',
        achievements: 'Risultati',
        subjects: 'Materie',
        analytics: 'Analisi'
      }
    },
    testing: {
      title: 'Test',
      createTest: 'Crea un Test',
      quizLibrary: 'Libreria Quiz'
    },
    chat: {
      title: 'Chat Tutor IA',
      newChat: 'Nuova Chat',
      previousChats: 'Chat Precedenti',
      sendMessage: 'Invia messaggio',
      voiceResponse: 'Risposta Vocale',
      uploadFile: 'Carica File',
      navigation: {
        chat: 'Chat',
        progress: 'Progresso',
        modules: 'Moduli'
      }
    },
    auth: {
      title: 'Benvenuto in TeachlyAI',
      subtitle: 'Accedi per accedere alla tua esperienza di apprendimento personalizzata',
      signInTab: 'Accedi',
      signUpTab: 'Registrati',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Conferma Password',
      signInButton: 'Accedi',
      signUpButton: 'Crea Account',
      forgotPassword: 'Password dimenticata?',
      noAccount: 'Non hai un account?',
      hasAccount: 'Hai già un account?',
      signUpLink: 'Registrati qui',
      signInLink: 'Accedi qui',
      errors: {
        invalidCredentials: 'Email o password non validi',
        emailInUse: 'Email già in uso',
        weakPassword: 'La password dovrebbe essere di almeno 6 caratteri',
        passwordMismatch: 'Le password non corrispondono',
        genericError: 'Si è verificato un errore. Riprova.'
      }
    }
  },
  ru: {
    common: {
      loading: 'Загрузка...',
      back: 'Назад',
      more: 'больше',
    },
    modules: {
      title: 'Учебные Модули',
      description: 'Изучите нашу тщательно отобранную коллекцию учебных модулей и учебных программ, разработанных экспертами в области образования',
      searchPlaceholder: 'Поиск модулей...',
      categories: {
        all: 'Все Модули',
        math: 'Математика',
        science: 'Науки',
        english: 'Английский',
        history: 'История',
        programming: 'Программирование'
      },
      subjects: 'Предметы',
      standards: 'Стандарты',
      startLearning: 'Начать Обучение',
      noModulesFound: 'Модули не найдены',
      adjustFilters: 'Попробуйте настроить поиск или критерии фильтра'
    },
    progress: {
      title: 'Панель Обучения',
      demoTitle: 'Демо Панели Родителей',
      description: 'Отслеживайте свои квесты, контролируйте прогресс и смотрите аналитику обучения.',
      demoDescription: 'Посмотрите, как вы можете контролировать прогресс обучения, квесты и достижения вашего ребенка.',
      demoNotice: 'Это демо, показывающее прогресс обучения Эммы Джонсон. Зарегистрируйтесь, чтобы отслеживать реальный прогресс вашего ребенка!',
      notAvailable: 'Панель мониторинга недоступна для студентов.',
      tabs: {
        monitoring: 'Обзор',
        childProgress: 'Прогресс Ребенка',
        quests: 'Квесты',
        achievements: 'Достижения',
        subjects: 'Предметы',
        analytics: 'Аналитика'
      }
    },
    testing: {
      title: 'Тестирование',
      createTest: 'Создать Тест',
      quizLibrary: 'Библиотека Викторин'
    },
    chat: {
      title: 'Чат ИИ Репетитора',
      newChat: 'Новый Чат',
      previousChats: 'Предыдущие Чаты',
      sendMessage: 'Отправить сообщение',
      voiceResponse: 'Голосовой Ответ',
      uploadFile: 'Загрузить Файл',
      navigation: {
        chat: 'Чат',
        progress: 'Прогресс',
        modules: 'Модули'
      }
    },
    auth: {
      title: 'Добро пожаловать в TeachlyAI',
      subtitle: 'Войдите, чтобы получить доступ к вашему персонализированному опыту обучения',
      signInTab: 'Войти',
      signUpTab: 'Регистрация',
      email: 'Электронная почта',
      password: 'Пароль',
      confirmPassword: 'Подтвердить Пароль',
      signInButton: 'Войти',
      signUpButton: 'Создать Аккаунт',
      forgotPassword: 'Забыли пароль?',
      noAccount: 'Нет аккаунта?',
      hasAccount: 'Уже есть аккаунт?',
      signUpLink: 'Зарегистрируйтесь здесь',
      signInLink: 'Войдите здесь',
      errors: {
        invalidCredentials: 'Неверная электронная почта или пароль',
        emailInUse: 'Электронная почта уже используется',
        weakPassword: 'Пароль должен содержать не менее 6 символов',
        passwordMismatch: 'Пароли не совпадают',
        genericError: 'Произошла ошибка. Попробуйте еще раз.'
      }
    }
  },
  ar: {
    common: {
      loading: 'جار التحميل...',
      back: 'عودة',
      more: 'المزيد',
    },
    modules: {
      title: 'وحدات التعلم',
      description: 'استكشف مجموعتنا المنتقاة من وحدات التعلم والمناهج المصممة من قبل خبراء التعليم',
      searchPlaceholder: 'البحث في الوحدات...',
      categories: {
        all: 'جميع الوحدات',
        math: 'الرياضيات',
        science: 'العلوم',
        english: 'الإنجليزية',
        history: 'التاريخ',
        programming: 'البرمجة'
      },
      subjects: 'المواد',
      standards: 'المعايير',
      startLearning: 'بدء التعلم',
      noModulesFound: 'لم يتم العثور على وحدات',
      adjustFilters: 'حاول تعديل معايير البحث أو التصفية'
    },
    progress: {
      title: 'لوحة التعلم',
      demoTitle: 'عرض توضيحي للوحة الوالدين',
      description: 'تتبع مهامك، راقب التقدم، واطلع على تحليلات التعلم الخاصة بك.',
      demoDescription: 'اطلع على كيفية مراقبة تقدم التعلم والمهام والإنجازات لطفلك.',
      demoNotice: 'هذا عرض توضيحي يظهر تقدم التعلم لإيما جونسون. سجل لتتبع التقدم الحقيقي لطفلك!',
      notAvailable: 'لوحة المراقبة غير متاحة للطلاب.',
      tabs: {
        monitoring: 'نظرة عامة',
        childProgress: 'تقدم الطفل',
        quests: 'المهام',
        achievements: 'الإنجازات',
        subjects: 'المواد',
        analytics: 'التحليلات'
      }
    },
    testing: {
      title: 'الاختبارات',
      createTest: 'إنشاء اختبار',
      quizLibrary: 'مكتبة الاختبارات'
    },
    chat: {
      title: 'محادثة المعلم الذكي',
      newChat: 'محادثة جديدة',
      previousChats: 'المحادثات السابقة',
      sendMessage: 'إرسال رسالة',
      voiceResponse: 'رد صوتي',
      uploadFile: 'رفع ملف',
      navigation: {
        chat: 'المحادثة',
        progress: 'التقدم',
        modules: 'الوحدات'
      }
    },
    auth: {
      title: 'مرحباً بك في TeachlyAI',
      subtitle: 'سجل الدخول للوصول إلى تجربة التعلم الشخصية الخاصة بك',
      signInTab: 'تسجيل الدخول',
      signUpTab: 'إنشاء حساب',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      confirmPassword: 'تأكيد كلمة المرور',
      signInButton: 'تسجيل الدخول',
      signUpButton: 'إنشاء حساب',
      forgotPassword: 'نسيت كلمة المرور؟',
      noAccount: 'ليس لديك حساب؟',
      hasAccount: 'لديك حساب بالفعل؟',
      signUpLink: 'سجل هنا',
      signInLink: 'سجل الدخول هنا',
      errors: {
        invalidCredentials: 'بريد إلكتروني أو كلمة مرور غير صحيحة',
        emailInUse: 'البريد الإلكتروني مستخدم بالفعل',
        weakPassword: 'يجب أن تكون كلمة المرور على الأقل 6 أحرف',
        passwordMismatch: 'كلمات المرور غير متطابقة',
        genericError: 'حدث خطأ. يرجى المحاولة مرة أخرى.'
      }
    }
  }
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState('en');

  const t = (key: string): string => {
    const keys = key.split('.');
    let translation: any = translations[language];

    for (const k of keys) {
      if (translation && k in translation) {
        translation = translation[k];
      } else {
        return key; // fallback to key if translation missing
      }
    }
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
