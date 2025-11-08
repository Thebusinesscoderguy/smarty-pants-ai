import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Target, TrendingUp, Brain, ArrowRight, Award, Users, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

const Index = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [selectedType, setSelectedType] = useState<'study-plan' | 'quiz'>('study-plan');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [typewriterText, setTypewriterText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const studyPlanPlaceholders = [
    "Create a personalized study plan for Algebra 1",
    "Build a study plan for Fundamentals of Physics",
    "Design a learning path for Adjective Rules",
    "Plan my week of Trigonometry practice"
  ];

  const quizPlaceholders = [
    "Generate a quiz for World Geography",
    "Make a quick quiz on Photosynthesis",
    "Test me on English grammar basics",
    "Create a 10-question quiz for History"
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
        // Typing
        if (typewriterText.length < currentText.length) {
          setTypewriterText(currentText.slice(0, typewriterText.length + 1));
        } else {
          // Pause before deleting
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        // Deleting
        if (typewriterText.length > 0) {
          setTypewriterText(currentText.slice(0, typewriterText.length - 1));
        } else {
          // Move to next placeholder
          setIsDeleting(false);
          setPlaceholderIndex((prev) => (prev + 1) % currentPlaceholders.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [typewriterText, isDeleting, placeholderIndex, currentPlaceholders]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-200/40 via-amber-100/30 to-background pointer-events-none" />
        
        <div className="container mx-auto px-6 py-20 md:py-32 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in col-span-2 max-w-5xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{t('home.badge')}</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] tracking-tight">
                {t('home.hero.title')}
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {t('home.hero.subtitle')}
              </p>
              
              <form onSubmit={handleSubmit} className="mt-8 max-w-3xl mx-auto">
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                    <Select value={selectedType} onValueChange={(value: 'study-plan' | 'quiz') => setSelectedType(value)}>
                      <SelectTrigger className="w-[130px] h-9 border border-border/60 bg-background/80 backdrop-blur-sm hover:bg-muted hover:border-primary/40 rounded-full text-sm font-medium transition-all">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border border-border">
                        <SelectItem value="study-plan">Study Plan</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {!inputValue && (
                    <div className="absolute left-[160px] top-1/2 -translate-y-1/2 pointer-events-none text-base text-muted-foreground flex items-center">
                      <span>{typewriterText}</span>
                      <span className="inline-block w-0.5 h-4 bg-muted-foreground ml-0.5 animate-pulse"></span>
                    </div>
                  )}
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full pl-[160px] pr-28 py-4 text-base rounded-full border border-border/60 bg-background text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 h-9 text-sm font-medium"
                  >
                    {t('home.hero.start')} <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Why AI Learning Section */}
      <section className="py-20 md:py-32 bg-muted/30" id="features">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-6">
                <Brain className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{t('home.smartLearning')}</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                {t('home.whyAI')}
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <div className="w-6 h-6 rounded-lg bg-primary/20"></div>
                </div>
                <p className="text-base text-foreground leading-relaxed">
                  {t('home.reason1')}
                </p>
              </div>
              
              <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <div className="w-6 h-6 rounded-lg bg-primary/20"></div>
                </div>
                <p className="text-base text-foreground leading-relaxed">
                  {t('home.reason2')}
                </p>
              </div>
              
              <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <div className="w-6 h-6 rounded-lg bg-primary/20"></div>
                </div>
                <p className="text-base text-foreground leading-relaxed">
                  {t('home.reason3')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Detail Section */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <p className="text-xl md:text-2xl text-foreground mb-8 text-center font-medium">
              {t('home.tagline')}
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-10">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/5 border border-primary/20">
                <span className="text-lg font-bold text-primary">{t('home.stats.grades')}</span>
                <span className="text-sm text-muted-foreground">{t('home.stats.gradesDesc')}</span>
              </div>
              
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/5 border border-primary/20">
                <span className="text-lg font-bold text-primary">{t('home.stats.subjects')}</span>
                <span className="text-sm text-muted-foreground">{t('home.stats.subjectsDesc')}</span>
              </div>
              
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/5 border border-primary/20">
                <span className="text-lg font-bold text-primary">{t('home.stats.available')}</span>
                <span className="text-sm text-muted-foreground">{t('home.stats.availableDesc')}</span>
              </div>
              
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/5 border border-primary/20">
                <span className="text-lg font-bold text-primary">{t('home.stats.feedback')}</span>
                <span className="text-sm text-muted-foreground">{t('home.stats.feedbackDesc')}</span>
              </div>
              
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/5 border border-primary/20">
                <span className="text-lg font-bold text-primary">{t('home.stats.adaptive')}</span>
                <span className="text-sm text-muted-foreground">{t('home.stats.adaptiveDesc')}</span>
              </div>
            </div>

            <div className="text-center">
              <Button 
                size="lg"
                onClick={() => navigate('/auth')}
                className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
              >
                {t('nav.getStarted')} <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Features Section */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-8">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">{t('home.features')}</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            {t('home.advancedTitle')}
            <br />
            {t('home.advancedSubtitle')}
          </h2>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-16 max-w-2xl">
            {t('home.advancedDesc')}
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-all duration-300">
              <Target className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {t('home.feature.adaptive.title')}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('home.feature.adaptive.desc')}
              </p>
            </div>
            
            <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-all duration-300">
              <TrendingUp className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {t('home.feature.progress.title')}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('home.feature.progress.desc')}
              </p>
            </div>
            
            <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-all duration-300">
              <Award className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {t('home.feature.gamified.title')}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('home.feature.gamified.desc')}
              </p>
            </div>
            
            <div 
              className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => navigate(user ? '/quiz-generator' : '/auth')}
            >
              <Brain className="w-12 h-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {t('home.feature.studyPlans.title')}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('home.feature.studyPlans.desc')}
              </p>
            </div>
            
            <div 
              className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => navigate(user ? '/quiz-generator' : '/auth')}
            >
              <Users className="w-12 h-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {t('home.feature.parentDash.title')}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('home.feature.parentDash.desc')}
              </p>
            </div>
            
            <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-all duration-300">
              <Sparkles className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {t('home.feature.quizzes.title')}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('home.feature.quizzes.desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8 p-12 bg-card border border-border rounded-3xl shadow-xl">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
              {t('home.cta.title')}
            </h2>
            
            <p className="text-xl text-muted-foreground">
              {t('home.cta.subtitle')}
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 pt-6">
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')}
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
