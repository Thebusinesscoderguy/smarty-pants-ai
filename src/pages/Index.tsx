import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sparkles, ArrowRight, BookOpen, Brain, Eye, Trophy, Target, BarChart3,
  Gamepad2, CheckCircle, GraduationCap, Users, School, Calendar, Zap,
  MessageSquare, Globe, Star, TrendingUp, PlayCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { BookDemoModal } from '@/components/demo/BookDemoModal';

const Index = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { user, isSchoolAdmin, isTeacher } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [selectedType, setSelectedType] = useState<'study-plan' | 'quiz'>('study-plan');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [demoOpen, setDemoOpen] = useState(false);
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

  // Auto-rotate the showcase
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

  const stats = [
    { value: '50K+', label: 'Active learners' },
    { value: '200+', label: 'Schools onboard' },
    { value: '1M+', label: 'Quizzes generated' },
    { value: '4.9★', label: 'Avg. rating' },
  ];

  const showcaseFeatures = [
    {
      icon: BookOpen,
      title: 'AI Study Plans',
      desc: 'Adaptive learning paths built around your pace, goals, and curriculum.',
      tag: 'For students',
    },
    {
      icon: Brain,
      title: 'Smart Quizzes',
      desc: 'Generate questions from any topic, document, or lesson — graded instantly.',
      tag: 'For teachers',
    },
    {
      icon: Eye,
      title: 'Family Insights',
      desc: 'Real-time dashboards so parents see exactly where their kids stand.',
      tag: 'For parents',
    },
    {
      icon: School,
      title: 'School Operations',
      desc: 'Grade books, attendance, homework, and analytics in one place.',
      tag: 'For schools',
    },
  ];

  const roleCards = [
    {
      icon: GraduationCap,
      title: t('home.roles.student.title'),
      desc: t('home.roles.student.desc'),
      features: [t('home.roles.student.feature1'), t('home.roles.student.feature2'), t('home.roles.student.feature3')],
      cta: t('home.roles.student.cta'),
      href: '/quiz-generator',
      accent: 'from-primary/20 to-primary/5',
    },
    {
      icon: Users,
      title: t('home.roles.parent.title'),
      desc: t('home.roles.parent.desc'),
      features: [t('home.roles.parent.feature1'), t('home.roles.parent.feature2'), t('home.roles.parent.feature3')],
      cta: t('home.roles.parent.cta'),
      href: '/auth',
      accent: 'from-accent/30 to-accent/5',
    },
    {
      icon: School,
      title: t('home.roles.school.title'),
      desc: t('home.roles.school.desc'),
      features: [t('home.roles.school.feature1'), t('home.roles.school.feature2'), t('home.roles.school.feature3')],
      cta: t('home.roles.school.cta'),
      href: '/auth',
      accent: 'from-primary/15 to-accent/10',
    },
  ];

  const testimonials = [
    {
      quote: 'My daughter went from dreading homework to asking for extra quizzes. The AI tutor actually meets her where she is.',
      author: 'Sarah M.',
      role: 'Parent of two',
    },
    {
      quote: 'I generate a full week of differentiated lesson plans in under 10 minutes. It gave me my evenings back.',
      author: 'David L.',
      role: 'Middle school teacher',
    },
    {
      quote: 'Onboarding 400 students took an afternoon. The principal digest is the first email I open every Monday.',
      author: 'Dr. Amina K.',
      role: 'School principal',
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Header />

      {/* ============== HERO ============== */}
      <section className="relative">
        {/* Background flourishes */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 -left-40 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute top-40 -right-40 w-[600px] h-[600px] rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,hsl(var(--primary)/0.08),transparent_60%)]" />
        </div>

        <div className="container mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32 relative z-10">
          <div className="max-w-5xl mx-auto text-center space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card border border-border shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="text-xs font-medium tracking-wide uppercase text-foreground">
                Now live · AI Tutor v2
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95]">
              <span className="block text-foreground">Learning that</span>
              <span className="block bg-gradient-to-r from-primary via-primary to-accent-foreground bg-clip-text text-transparent">
                actually adapts.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              The AI-native platform for students, parents, teachers, and schools.
              Generate study plans, run smart quizzes, and track real progress — all in one place.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSubmit} className="mt-10 max-w-3xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
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

            {/* Quick CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Button
                onClick={() => navigate('/auth')}
                variant="ghost"
                className="rounded-full text-sm font-medium hover:bg-muted"
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                Start free
              </Button>
              <span className="text-muted-foreground/40">·</span>
              <Button
                onClick={() => setDemoOpen(true)}
                variant="ghost"
                className="rounded-full text-sm font-medium hover:bg-muted"
              >
                <Calendar className="w-4 h-4 mr-1.5" />
                Book a demo
              </Button>
              <span className="text-muted-foreground/40">·</span>
              <Button
                onClick={() => navigate('/demo')}
                variant="ghost"
                className="rounded-full text-sm font-medium hover:bg-muted"
              >
                <PlayCircle className="w-4 h-4 mr-1.5" />
                Watch it work
              </Button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-20 max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden border border-border shadow-sm">
              {stats.map((s) => (
                <div key={s.label} className="bg-card px-6 py-6 text-center">
                  <div className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">{s.value}</div>
                  <div className="text-xs md:text-sm text-muted-foreground mt-1 uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============== INTERACTIVE SHOWCASE ============== */}
      <section className="py-20 md:py-28 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mb-14">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-4">
              <Zap className="w-3.5 h-3.5" /> One platform · Four perspectives
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight">
              Everything education needs.<br />
              <span className="text-muted-foreground">Nothing it doesn't.</span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-5 gap-6 max-w-6xl">
            {/* Tabs */}
            <div className="lg:col-span-2 space-y-2">
              {showcaseFeatures.map((f, i) => (
                <button
                  key={f.title}
                  onClick={() => setActiveFeature(i)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 ${
                    activeFeature === i
                      ? 'bg-card border-primary/40 shadow-lg'
                      : 'bg-transparent border-transparent hover:bg-card/50 hover:border-border'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      activeFeature === i ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      <f.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
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

            {/* Visual panel */}
            <div className="lg:col-span-3 relative">
              <div className="aspect-[4/3] rounded-3xl bg-card border border-border shadow-2xl overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
                <div className="absolute top-4 left-4 flex gap-1.5">
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
                        <div
                          key={i}
                          className={`h-1.5 rounded-full transition-all ${
                            i === activeFeature ? 'w-8 bg-primary' : 'w-1.5 bg-muted-foreground/20'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== ROLES ============== */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4">
              {t('home.roles.title')}
            </h2>
            <p className="text-lg text-muted-foreground">{t('home.roles.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {roleCards.map((card, idx) => (
              <div
                key={card.title}
                className={`group relative bg-card border border-border rounded-3xl p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col overflow-hidden`}
              >
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
                  <Button
                    onClick={() => navigate(card.href)}
                    variant="outline"
                    className="w-full rounded-full border-foreground/20 hover:bg-foreground hover:text-background transition-all"
                  >
                    {card.cta}
                    <ArrowRight className={`${isRTL ? 'mr-1.5 rotate-180' : 'ml-1.5'} w-4 h-4`} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== TESTIMONIALS ============== */}
      <section className="py-20 md:py-28 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-primary text-primary" />
              ))}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4">
              Loved by learners everywhere
            </h2>
            <p className="text-lg text-muted-foreground">
              From individual students to entire school districts.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-3xl p-8 flex flex-col hover:shadow-xl transition-all duration-300"
              >
                <div className="text-5xl text-primary/30 leading-none mb-2 font-serif">"</div>
                <p className="text-foreground leading-relaxed flex-1 mb-6">{t.quote}</p>
                <div className="pt-6 border-t border-border">
                  <div className="font-semibold text-foreground">{t.author}</div>
                  <div className="text-sm text-muted-foreground">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== WHY ============== */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 max-w-6xl mx-auto items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-4">
                <Brain className="w-3.5 h-3.5" /> Why it works
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight mb-6">
                Built on real pedagogy.<br />
                Powered by frontier AI.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                Most edtech bolts AI onto old workflows. We rebuilt learning from scratch — adaptive content, multilingual support, and analytics that actually move outcomes.
              </p>
              <Button
                size="lg"
                onClick={() => navigate(user && (isSchoolAdmin || isTeacher) ? '/school-admin' : '/quiz-generator')}
                className="rounded-full px-8 bg-foreground text-background hover:bg-foreground/90 shadow-lg"
              >
                {t('nav.getStarted')} <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Target, title: 'Adaptive', desc: 'Content shifts to each learner.' },
                { icon: BarChart3, title: 'Insightful', desc: 'Analytics teachers actually use.' },
                { icon: Globe, title: 'Multilingual', desc: 'Arabic, English, and more.' },
                { icon: Gamepad2, title: 'Engaging', desc: 'Quests, streaks, and rewards.' },
              ].map((c) => (
                <div
                  key={c.title}
                  className="bg-card border border-border rounded-2xl p-6 hover:border-primary/40 hover:shadow-lg transition-all"
                >
                  <c.icon className="w-7 h-7 text-primary mb-3" />
                  <h3 className="font-bold text-foreground mb-1">{c.title}</h3>
                  <p className="text-sm text-muted-foreground">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============== FINAL CTA ============== */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10 rounded-[2.5rem] blur-2xl opacity-50" />
            <div className="relative bg-foreground text-background rounded-[2.5rem] p-12 md:p-20 text-center overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

              <div className="relative z-10 space-y-8">
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.95]">
                  Ready to learn<br />
                  <span className="text-background/60">differently?</span>
                </h2>
                <p className="text-lg md:text-xl text-background/70 max-w-2xl mx-auto">
                  Join the students, parents, and schools rethinking education with AI that actually teaches.
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-4">
                  <Button
                    size="lg"
                    onClick={() => navigate(user && (isSchoolAdmin || isTeacher) ? '/school-admin' : '/quiz-generator')}
                    className="bg-background text-foreground hover:bg-background/90 rounded-full px-8 shadow-xl font-semibold"
                  >
                    Get started free <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setDemoOpen(true)}
                    className="rounded-full px-8 border-2 border-background/30 bg-transparent text-background hover:bg-background/10"
                  >
                    <Calendar className="mr-2 w-4 h-4" />
                    Book a demo
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <BookDemoModal open={demoOpen} onOpenChange={setDemoOpen} />
    </div>
  );
};

export default Index;
