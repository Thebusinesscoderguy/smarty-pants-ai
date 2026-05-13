import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sparkles, ArrowRight, BookOpen, Brain, Eye, Trophy, Target, BarChart3,
  Gamepad2, CheckCircle, GraduationCap, Users, School, Zap,
  MessageSquare, Globe, Star, TrendingUp, PlayCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';

const Index = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { user, isSchoolAdmin, isTeacher } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [selectedType, setSelectedType] = useState<'study-plan' | 'quiz'>('study-plan');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [typewriterText, setTypewriterText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  const isRTL = language === 'ar';

  const studyPlanPlaceholders = [
    t('home.hero.studyPlanPlaceholder1'),
    t('home.hero.studyPlanPlaceholder2'),
    t('home.hero.studyPlanPlaceholder3'),
    t('home.hero.studyPlanPlaceholder4'),
  ];
  const quizPlaceholders = [
    t('home.hero.quizPlaceholder1'),
    t('home.hero.quizPlaceholder2'),
    t('home.hero.quizPlaceholder3'),
    t('home.hero.quizPlaceholder4'),
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

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      navigate(isSchoolAdmin || isTeacher ? '/school-admin' : '/dashboard');
      return;
    }
    const params = new URLSearchParams({
      auto: '1',
      type: selectedType,
      method: 'topic',
      input: inputValue || '',
    });
    navigate(`/quiz-generator?${params.toString()}`);
  };

  const showcaseFeatures = [
    { icon: BookOpen, title: t('home.showcase.studyPlans.title'), desc: t('home.showcase.studyPlans.desc'), tag: t('home.showcase.tag.students') },
    { icon: Brain, title: t('home.showcase.quizzes.title'), desc: t('home.showcase.quizzes.desc'), tag: t('home.showcase.tag.teachers') },
    { icon: Eye, title: t('home.showcase.family.title'), desc: t('home.showcase.family.desc'), tag: t('home.showcase.tag.parents') },
    { icon: School, title: t('home.showcase.ops.title'), desc: t('home.showcase.ops.desc'), tag: t('home.showcase.tag.schools') },
  ];

  const isAr = language === 'ar';
  const roleCards = [
    {
      icon: School,
      title: isAr ? 'للمدارس' : 'For Schools',
      desc: isAr
        ? 'إدارة الفصول والدرجات والواجبات والحضور والمناهج في مكان واحد.'
        : 'Manage classes, grades, homework, attendance and curriculum in one place.',
      features: isAr
        ? ['لوحة إدارة شاملة', 'تقارير وتحليلات', 'إعداد سريع للمعلمين والطلاب']
        : ['Complete admin dashboard', 'Reports & analytics', 'Fast teacher & student onboarding'],
      cta: isAr ? 'ابدأ الآن' : 'Get started',
      href: '/auth',
      accent: 'from-primary/15 to-accent/10',
    },
    {
      icon: GraduationCap,
      title: isAr ? 'للمعلمين' : 'For Teachers',
      desc: isAr
        ? 'خطط دروس بالذكاء الاصطناعي ومولد اختبارات وسجل درجات وإدارة واجبات.'
        : 'AI lesson plans, quiz generator, gradebook and homework management.',
      features: isAr
        ? ['خطط دروس فورية', 'تصحيح آلي للواجبات', 'سجل درجات مرن']
        : ['Instant lesson plans', 'Auto-graded homework', 'Flexible gradebook'],
      cta: isAr ? 'جرّب مجاناً' : 'Try it free',
      href: '/auth',
      accent: 'from-primary/20 to-primary/5',
    },
    {
      icon: Brain,
      title: isAr ? 'للطلاب' : 'For Students',
      desc: isAr
        ? 'مدرّس ذكاء اصطناعي وخطط دراسة واختبارات وتتبع التقدم — مدرجة مع مدرستك.'
        : 'AI tutor, study plans, quizzes and progress tracking — included with your school.',
      features: isAr
        ? ['مساعد دراسة ذكي 24/7', 'خطط دراسة مخصصة', 'اختبارات تكيفية']
        : ['24/7 AI study buddy', 'Personalised study plans', 'Adaptive quizzes'],
      cta: isAr ? 'استكشف الأدوات' : 'Explore tools',
      href: '/quiz-generator',
      accent: 'from-accent/30 to-accent/5',
    },
  ];

  const competitors = [
    {
      name: 'vs ClassDojo',
      title: isAr ? 'لدينا ذكاء اصطناعي، هم لا' : 'We have AI, they don\'t',
      desc: isAr
        ? 'تواصل ClassDojo + كل أدوات التعلم بالذكاء الاصطناعي للطلاب والمعلمين.'
        : 'All of ClassDojo\'s communication, plus AI learning tools for students and teachers.',
    },
    {
      name: 'vs Educore',
      title: isAr ? 'لدينا أدوات تعلم للطلاب، هم لا' : 'We have student learning tools, they don\'t',
      desc: isAr
        ? 'إدارة مدرسية كاملة مع مدرّس ذكي وخطط دراسة لكل طالب.'
        : 'Full school management plus an AI tutor and study plans for every student.',
    },
    {
      name: 'vs Google Classroom',
      title: isAr ? 'دعم عربي كامل + ذكاء اصطناعي' : 'Arabic RTL + AI built in',
      desc: isAr
        ? 'منصة عربية أصلية بالكامل مع ذكاء اصطناعي مدمج — لا إضافات، لا حلول مؤقتة.'
        : 'Native Arabic RTL platform with AI built in — no add-ons, no workarounds.',
    },
  ];

  const testimonials = [
    { quote: t('home.testimonial1.quote'), author: t('home.testimonial1.author'), role: t('home.testimonial1.role') },
    { quote: t('home.testimonial2.quote'), author: t('home.testimonial2.author'), role: t('home.testimonial2.role') },
    { quote: t('home.testimonial3.quote'), author: t('home.testimonial3.author'), role: t('home.testimonial3.role') },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Header />

      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 -left-40 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute top-40 -right-40 w-[600px] h-[600px] rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,hsl(var(--primary)/0.08),transparent_60%)]" />
        </div>

        <div className="container mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32 relative z-10">
          <div className="max-w-5xl mx-auto text-center space-y-8 animate-fade-in">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95]">
              <span className="block text-foreground">
                {isAr ? 'منصة إدارة المدارس' : 'The school management platform'}
              </span>
              <span className="block bg-gradient-to-r from-primary via-primary to-accent-foreground bg-clip-text text-transparent">
                {isAr ? 'مع ذكاء اصطناعي مدمج' : 'with AI built in'}
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {isAr
                ? 'استبدل نظام إدارة التعلم وأدوات تواصل أولياء الأمور بمنصة واحدة — وامنح كل طالب مدرّساً ذكياً ومولّد اختبارات ومخطط دراسي مدرجاً.'
                : 'Replace your LMS and parent communication tools with one platform — and give every student an AI tutor, quiz generator, and study planner included.'}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                onClick={() => navigate('/auth')}
                size="lg"
                className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg"
              >
                <Sparkles className={`w-4 h-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                {isAr ? 'ابدأ مجاناً' : 'Start Free'}
              </Button>
              <Button
                onClick={() => navigate('/features')}
                size="lg"
                variant="outline"
                className="rounded-full px-8 border-2 border-primary/30 hover:bg-primary/10"
              >
                {isAr ? 'كيف تعمل' : 'See how it works'}
                <ArrowRight className={`${isRTL ? 'mr-1.5 rotate-180' : 'ml-1.5'} w-4 h-4`} />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 max-w-3xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-semibold">
                {isAr ? 'أو جرّب أداة الطالب فوراً' : 'Or try a student tool instantly'}
              </div>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/40 via-accent/40 to-primary/40 rounded-full opacity-50 blur group-hover:opacity-75 transition-opacity" />
                <div className="relative">
                  <div className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 z-10`}>
                    <Select value={selectedType} onValueChange={(v: 'study-plan' | 'quiz') => setSelectedType(v)}>
                      <SelectTrigger className="w-[140px] h-10 border border-border/60 bg-card hover:bg-muted rounded-full text-sm font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="study-plan">{t('home.hero.studyPlan')}</SelectItem>
                        <SelectItem value="quiz">{t('home.hero.quiz')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {!inputValue && (
                    <div className={`absolute ${isRTL ? 'right-[170px]' : 'left-[170px]'} top-1/2 -translate-y-1/2 pointer-events-none text-base text-muted-foreground flex items-center`}>
                      <span>{typewriterText}</span>
                      <span className={`inline-block w-0.5 h-4 bg-muted-foreground ${isRTL ? 'mr-0.5' : 'ml-0.5'} animate-pulse`} />
                    </div>
                  )}
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className={`w-full ${isRTL ? 'pr-[170px] pl-32' : 'pl-[170px] pr-32'} py-5 text-base rounded-full border border-border bg-card text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-lg`}
                  />
                  <Button
                    type="submit"
                    className={`absolute ${isRTL ? 'left-2' : 'right-2'} top-1/2 -translate-y-1/2 rounded-full bg-foreground hover:bg-foreground/90 text-background px-6 h-11 text-sm font-semibold`}
                  >
                    {t('home.hero.start')}
                    <ArrowRight className={`${isRTL ? 'mr-1.5 rotate-180' : 'ml-1.5'} w-4 h-4`} />
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* TRUST STRIP — curriculum frameworks */}
      <section className="border-y border-border bg-background/60">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('home.trust.label')}
            </span>
            {[
              t('home.trust.curriculum1'),
              t('home.trust.curriculum2'),
              t('home.trust.curriculum3'),
              t('home.trust.curriculum4'),
              t('home.trust.curriculum5'),
            ].map((label) => (
              <span
                key={label}
                className="text-sm font-semibold text-foreground/70 tracking-tight"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* SHOWCASE */}
      <section className="py-20 md:py-28 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mb-14">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-4">
              <Zap className="w-3.5 h-3.5" /> {t('home.showcase.eyebrow')}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight">
              {t('home.showcase.title1')}<br />
              <span className="text-muted-foreground">{t('home.showcase.title2')}</span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-5 gap-6 max-w-6xl">
            <div className="lg:col-span-2 space-y-2">
              {showcaseFeatures.map((f, i) => (
                <button
                  key={f.title}
                  onClick={() => setActiveFeature(i)}
                  className={`w-full ${isRTL ? 'text-right' : 'text-left'} p-5 rounded-2xl border transition-all duration-300 ${
                    activeFeature === i ? 'bg-card border-primary/40 shadow-lg' : 'bg-transparent border-transparent hover:bg-card/50 hover:border-border'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      activeFeature === i ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      <f.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-foreground">{f.title}</h3>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-wider">
                          {f.tag}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="lg:col-span-3 relative">
              <div className="aspect-[4/3] rounded-3xl bg-card border border-border shadow-2xl overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
                <div className={`absolute top-4 ${isRTL ? 'right-4' : 'left-4'} flex gap-1.5`}>
                  <div className="w-3 h-3 rounded-full bg-muted-foreground/20" />
                  <div className="w-3 h-3 rounded-full bg-muted-foreground/20" />
                  <div className="w-3 h-3 rounded-full bg-muted-foreground/20" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center p-12">
                  <div key={activeFeature} className="text-center animate-fade-in space-y-6 max-w-md">
                    <div className="inline-flex w-20 h-20 rounded-3xl bg-primary/10 items-center justify-center">
                      {(() => {
                        const Icon = showcaseFeatures[activeFeature].icon;
                        return <Icon className="w-10 h-10 text-primary" />;
                      })()}
                    </div>
                    <h3 className="text-3xl font-bold text-foreground">{showcaseFeatures[activeFeature].title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{showcaseFeatures[activeFeature].desc}</p>
                    <div className="flex gap-2 justify-center pt-2">
                      {showcaseFeatures.map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all ${i === activeFeature ? 'w-8 bg-primary' : 'w-1.5 bg-muted-foreground/20'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4">
              {isAr ? 'منصة واحدة لكل دور' : 'One platform, every role covered'}
            </h2>
            <p className="text-lg text-muted-foreground">
              {isAr ? 'مصمم للمدارس — مع أدوات مدمجة للمعلمين والطلاب.' : 'Built for schools — with tools baked in for teachers and students.'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {roleCards.map((card, idx) => (
              <div key={card.title} className="group relative bg-card border border-border rounded-3xl p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      <card.icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                    </div>
                    <span className="text-6xl font-bold text-muted-foreground/10 leading-none">0{idx + 1}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">{card.title}</h3>
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{card.desc}</p>
                  <div className="space-y-3 mb-8 flex-1">
                    {card.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                        <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  <Button onClick={() => navigate(card.href)} variant="outline" className="w-full rounded-full border-foreground/20 hover:bg-foreground hover:text-background transition-all">
                    {card.cta}
                    <ArrowRight className={`${isRTL ? 'mr-1.5 rotate-180' : 'ml-1.5'} w-4 h-4`} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY SWITCH */}
      <section className="py-20 md:py-28 bg-background border-t border-border">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-4">
              <Zap className="w-3.5 h-3.5" /> {isAr ? 'لماذا التبديل' : 'Why switch'}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              {isAr ? 'كيف نقارن بالأدوات الأخرى' : 'How we compare'}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {competitors.map((c) => (
              <div key={c.name} className="bg-card border border-border rounded-3xl p-8 hover:shadow-xl hover:border-primary/40 transition-all">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                  {c.name}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3 leading-snug">{c.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 md:py-28 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-primary text-primary" />
              ))}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4">
              {t('home.testimonials.title')}
            </h2>
            <p className="text-lg text-muted-foreground">{t('home.testimonials.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {testimonials.map((tm, i) => (
              <div key={i} className="bg-card border border-border rounded-3xl p-8 flex flex-col hover:shadow-xl transition-all duration-300">
                <div className="text-5xl text-primary/30 leading-none mb-2 font-serif">"</div>
                <p className="text-foreground leading-relaxed flex-1 mb-6">{tm.quote}</p>
                <div className="pt-6 border-t border-border">
                  <div className="font-semibold text-foreground">{tm.author}</div>
                  <div className="text-sm text-muted-foreground">{tm.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 max-w-6xl mx-auto items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-4">
                <Brain className="w-3.5 h-3.5" /> {t('home.why.eyebrow')}
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight mb-6">
                {t('home.why.title1')}<br />
                {t('home.why.title2')}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                {t('home.why.desc')}
              </p>
              <Button size="lg" onClick={() => navigate(user && (isSchoolAdmin || isTeacher) ? '/school-admin' : '/quiz-generator')} className="rounded-full px-8 bg-foreground text-background hover:bg-foreground/90 shadow-lg">
                {t('nav.getStarted')} <ArrowRight className={`${isRTL ? 'mr-2 rotate-180' : 'ml-2'} w-4 h-4`} />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Target, title: t('home.why.adaptive.title'), desc: t('home.why.adaptive.desc') },
                { icon: BarChart3, title: t('home.why.insightful.title'), desc: t('home.why.insightful.desc') },
                { icon: Globe, title: t('home.why.multilingual.title'), desc: t('home.why.multilingual.desc') },
                { icon: MessageSquare, title: isAr ? 'تواصل مع الأهل' : 'Parent communication', desc: isAr ? 'رسائل وتقارير أسبوعية تلقائية لكل ولي أمر.' : 'Messaging and automated weekly reports for every parent.' },
              ].map((c) => (
                <div key={c.title} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/40 hover:shadow-lg transition-all">
                  <c.icon className="w-7 h-7 text-primary mb-3" />
                  <h3 className="font-bold text-foreground mb-1">{c.title}</h3>
                  <p className="text-sm text-muted-foreground">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-primary/10 rounded-[2.5rem] blur-2xl opacity-60" />
            <div className="relative bg-card border border-border rounded-[2.5rem] p-12 md:p-20 text-center overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/25 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

              <div className="relative z-10 space-y-8">
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.95] text-foreground">
                  {t('home.finalCta.title1')}<br />
                  <span className="bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">{t('home.finalCta.title2')}</span>
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                  {t('home.finalCta.desc')}
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-4">
                  <Button size="lg" onClick={() => navigate(user && (isSchoolAdmin || isTeacher) ? '/school-admin' : '/quiz-generator')} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 shadow-lg font-semibold">
                    {t('home.cta.getStartedFree')} <ArrowRight className={`${isRTL ? 'mr-2 rotate-180' : 'ml-2'} w-5 h-5`} />
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate('/auth')} className="rounded-full px-8 border-2 border-primary/30 bg-transparent text-foreground hover:bg-primary/10">
                    {isAr ? 'سجل مدرستك' : 'Register your school'}
                    <ArrowRight className={`${isRTL ? 'mr-2 rotate-180' : 'ml-2'} w-4 h-4`} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Sticky mobile CTA — only for unauthenticated users */}
      {!user && (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-md border-t border-border p-3 shadow-lg">
          <div className="flex gap-2 max-w-md mx-auto">
            <Button
              onClick={() => navigate('/auth')}
              className="flex-1 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md"
            >
              <Sparkles className={`w-4 h-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
              {t('home.mobileCta.start')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
