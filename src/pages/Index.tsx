import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, ArrowRight, BookOpen, Brain, Eye, Trophy, Target, BarChart3, Gamepad2, CheckCircle, GraduationCap, Users, School } from 'lucide-react';
import { useState, useEffect } from 'react';

const Index = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, isSchoolAdmin, isTeacher } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [selectedType, setSelectedType] = useState<'study-plan' | 'quiz'>('study-plan');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [typewriterText, setTypewriterText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const studyPlanPlaceholders = [
    t('home.hero.studyPlanPlaceholder1'),
    t('home.hero.studyPlanPlaceholder2'),
    t('home.hero.studyPlanPlaceholder3'),
    t('home.hero.studyPlanPlaceholder4')
  ];

  const quizPlaceholders = [
    t('home.hero.quizPlaceholder1'),
    t('home.hero.quizPlaceholder2'),
    t('home.hero.quizPlaceholder3'),
    t('home.hero.quizPlaceholder4')
  ];

  const currentPlaceholders = selectedType === 'study-plan' ? studyPlanPlaceholders : quizPlaceholders;

  useEffect(() => {
    setPlaceholderIndex(0);
    setTypewriterText('');
    setIsDeleting(false);
  }, [selectedType]);

  useEffect(() => {
    const currentText = currentPlaceholders[placeholderIndex];
    const typingSpeed = isDeleting ? 30 : 50;
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (typewriterText.length < currentText.length) {
          setTypewriterText(currentText.slice(0, typewriterText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (typewriterText.length > 0) {
          setTypewriterText(currentText.slice(0, typewriterText.length - 1));
        } else {
          setIsDeleting(false);
          setPlaceholderIndex((prev) => (prev + 1) % currentPlaceholders.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [typewriterText, isDeleting, placeholderIndex, currentPlaceholders]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      if (isSchoolAdmin || isTeacher) {
        navigate('/school-admin');
      } else {
        navigate('/dashboard');
      }
      return;
    }
    const params = new URLSearchParams({
      auto: '1',
      type: selectedType,
      method: 'topic',
      input: inputValue || ''
    });
    navigate(`/quiz-generator?${params.toString()}`);
  };

  const roleCards = [
    {
      icon: GraduationCap,
      title: t('home.roles.student.title'),
      desc: t('home.roles.student.desc'),
      features: [
        t('home.roles.student.feature1'),
        t('home.roles.student.feature2'),
        t('home.roles.student.feature3'),
      ],
      cta: t('home.roles.student.cta'),
      href: '/quiz-generator',
    },
    {
      icon: Users,
      title: t('home.roles.parent.title'),
      desc: t('home.roles.parent.desc'),
      features: [
        t('home.roles.parent.feature1'),
        t('home.roles.parent.feature2'),
        t('home.roles.parent.feature3'),
      ],
      cta: t('home.roles.parent.cta'),
      href: '/auth',
    },
    {
      icon: School,
      title: t('home.roles.school.title'),
      desc: t('home.roles.school.desc'),
      features: [
        t('home.roles.school.feature1'),
        t('home.roles.school.feature2'),
        t('home.roles.school.feature3'),
      ],
      cta: t('home.roles.school.cta'),
      href: '/auth',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background pointer-events-none" />
        
        <div className="container mx-auto px-6 py-20 md:py-32 relative z-10">
          <div className="max-w-5xl mx-auto text-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{t('home.badge')}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.15] tracking-tight">
              {t('home.hero.title')}
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t('home.hero.subtitle')}
            </p>
            
            <form onSubmit={handleSubmit} className="mt-8 max-w-3xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
              <div className="relative group">
                <div className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 z-10`}>
                  <Select value={selectedType} onValueChange={(value: 'study-plan' | 'quiz') => setSelectedType(value)}>
                    <SelectTrigger className="w-[130px] h-9 border border-border/60 bg-background/80 backdrop-blur-sm hover:bg-muted hover:border-primary/40 rounded-full text-sm font-medium transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      <SelectItem value="study-plan">{t('home.hero.studyPlan')}</SelectItem>
                      <SelectItem value="quiz">{t('home.hero.quiz')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {!inputValue && (
                  <div className={`absolute ${isRTL ? 'right-[160px]' : 'left-[160px]'} top-1/2 -translate-y-1/2 pointer-events-none text-base text-muted-foreground flex items-center`}>
                    <span>{typewriterText}</span>
                    <span className={`inline-block w-0.5 h-4 bg-muted-foreground ${isRTL ? 'mr-0.5' : 'ml-0.5'} animate-pulse`}></span>
                  </div>
                )}
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className={`w-full ${isRTL ? 'pr-[160px] pl-28' : 'pl-[160px] pr-28'} py-4 text-base rounded-full border border-border/60 bg-background text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all`}
                />
                <Button
                  type="submit"
                  size="sm"
                  className={`absolute ${isRTL ? 'left-1.5' : 'right-1.5'} top-1/2 -translate-y-1/2 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 h-9 text-sm font-medium`}
                >
                  {t('home.hero.start')} <ArrowRight className={`${isRTL ? 'mr-1.5 rotate-180' : 'ml-1.5'} w-3.5 h-3.5`} />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Role Segmentation Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              {t('home.roles.title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('home.roles.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {roleCards.map((card) => (
              <div
                key={card.title}
                className="group bg-card border border-border rounded-2xl p-8 hover:shadow-xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                  <card.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{card.title}</h3>
                <p className="text-muted-foreground text-sm mb-5 leading-relaxed">{card.desc}</p>
                <div className="space-y-2.5 mb-6 flex-1">
                  {card.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm text-foreground">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => navigate(card.href)}
                  className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {card.cta} <ArrowRight className={`${isRTL ? 'mr-1.5 rotate-180' : 'ml-1.5'} w-4 h-4`} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-12 md:py-16 bg-background" id="features">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{t('home.features.badge')}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {t('home.features.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('home.features.subtitle')}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {[
              { icon: BookOpen, key: 'studyPlans' },
              { icon: Brain, key: 'quizGen' },
              { icon: Eye, key: 'parentMonitoring' },
              { icon: Trophy, key: 'gamification' },
            ].map(({ icon: Icon, key }) => (
              <div key={key} className="group bg-gradient-to-br from-card to-card/50 border border-border rounded-3xl p-8 hover:shadow-2xl hover:border-primary/30 transition-all duration-500 hover:-translate-y-2">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">{t(`home.features.${key}.title`)}</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">{t(`home.features.${key}.desc`)}</p>
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex items-center gap-3 text-sm text-foreground">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      <span>{t(`home.features.${key}.feature${n}`)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Teachly Section */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-6">
                <Brain className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{t('home.why.badge')}</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">{t('home.why.title')}</h2>
              <p className="text-xl text-muted-foreground mb-12">{t('home.why.subtitle')}</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Target, key: 'adaptive' },
                { icon: BarChart3, key: 'insights' },
                { icon: Gamepad2, key: 'engaging' },
              ].map(({ icon: Icon, key }) => (
                <div key={key} className="bg-card border border-border rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">{t(`home.why.${key}.title`)}</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">{t(`home.why.${key}.desc`)}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button 
                size="lg"
                onClick={() => navigate(user && (isSchoolAdmin || isTeacher) ? '/school-admin' : '/quiz-generator')}
                className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
              >
                {t('nav.getStarted')} <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8 p-12 bg-card border border-border rounded-3xl shadow-xl">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">{t('home.cta.title')}</h2>
            <p className="text-xl text-muted-foreground">{t('home.cta.subtitle')}</p>
            <div className="flex flex-wrap justify-center gap-4 pt-6">
              <Button 
                size="lg" 
                onClick={() => navigate(user && (isSchoolAdmin || isTeacher) ? '/school-admin' : '/quiz-generator')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 shadow-lg"
              >
                {t('home.cta.getStarted')} <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/how-it-works')}
                className="rounded-full px-8 border-2 border-border bg-background hover:bg-muted"
              >
                {t('home.cta.learnMore')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
