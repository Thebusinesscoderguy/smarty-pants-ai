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
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % currentPlaceholders.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [currentPlaceholders.length]);

  useEffect(() => {
    setPlaceholderIndex(0);
  }, [selectedType]);

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
                      <SelectTrigger className="w-[140px] h-10 border-2 border-border bg-background hover:bg-muted rounded-full text-sm font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border border-border">
                        <SelectItem value="study-plan">Study Plan</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={currentPlaceholders[placeholderIndex]}
                    className="w-full pl-[168px] pr-32 py-5 text-lg rounded-full border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all duration-500"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-6"
                  >
                    {t('home.hero.start')} <ArrowRight className="ml-2 w-4 h-4" />
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-8">
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">{t('home.smartLearning')}</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-16">
            {t('home.whyAI')}
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4 p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300">
              <div className="text-5xl font-bold text-primary/20">01</div>
              <h3 className="text-xl font-semibold text-foreground">
                {t('home.reason1')}
              </h3>
            </div>
            
            <div className="space-y-4 p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300">
              <div className="text-5xl font-bold text-primary/20">02</div>
              <h3 className="text-xl font-semibold text-foreground">
                {t('home.reason2')}
              </h3>
            </div>
            
            <div className="space-y-4 p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300">
              <div className="text-5xl font-bold text-primary/20">03</div>
              <h3 className="text-xl font-semibold text-foreground">
                {t('home.reason3')}
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* Features Detail Section */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              {t('home.tagline')}
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-4xl mx-auto mb-16">
            <div className="text-center space-y-2 p-6 bg-card border border-border rounded-2xl hover:shadow-md transition-shadow">
              <div className="text-2xl font-bold text-primary">{t('home.stats.grades')}</div>
              <div className="text-sm text-muted-foreground">{t('home.stats.gradesDesc')}</div>
            </div>
            <div className="text-center space-y-2 p-6 bg-card border border-border rounded-2xl hover:shadow-md transition-shadow">
              <div className="text-2xl font-bold text-primary">{t('home.stats.available')}</div>
              <div className="text-sm text-muted-foreground">{t('home.stats.availableDesc')}</div>
            </div>
            <div className="text-center space-y-2 p-6 bg-card border border-border rounded-2xl hover:shadow-md transition-shadow">
              <div className="text-2xl font-bold text-primary">{t('home.stats.subjects')}</div>
              <div className="text-sm text-muted-foreground">{t('home.stats.subjectsDesc')}</div>
            </div>
            <div className="text-center space-y-2 p-6 bg-card border border-border rounded-2xl hover:shadow-md transition-shadow">
              <div className="text-2xl font-bold text-primary">{t('home.stats.feedback')}</div>
              <div className="text-sm text-muted-foreground">{t('home.stats.feedbackDesc')}</div>
            </div>
            <div className="text-center space-y-2 p-6 bg-card border border-border rounded-2xl hover:shadow-md transition-shadow">
              <div className="text-2xl font-bold text-primary">{t('home.stats.adaptive')}</div>
              <div className="text-sm text-muted-foreground">{t('home.stats.adaptiveDesc')}</div>
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
