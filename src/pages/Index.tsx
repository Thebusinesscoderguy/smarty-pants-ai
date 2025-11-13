import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Target, TrendingUp, Brain, ArrowRight, Award, Users, Zap, BookOpen, Trophy, Eye, Gamepad2, CheckCircle, BarChart3 } from 'lucide-react';
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
    
    // If user is signed in, take them to role selection
    if (user) {
      navigate('/dashboard');
      return;
    }
    
    // Otherwise, take them to demo/quiz-generator
    const params = new URLSearchParams({
      auto: '1',
      type: selectedType,
      method: 'topic',
      input: inputValue || ''
    });
    navigate(`/quiz-generator?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background pointer-events-none" />
        
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

      {/* Core Features Section */}
      <section className="py-12 md:py-16 bg-background" id="features">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Powerful Learning Tools</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Everything You Need for Academic Success
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive tools designed to help students excel, parents stay informed, and learning stay engaging
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Study Plans Feature */}
            <div className="group bg-gradient-to-br from-card to-card/50 border border-border rounded-3xl p-8 hover:shadow-2xl hover:border-primary/30 transition-all duration-500 hover:-translate-y-2">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Personalized Study Plans</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                AI-generated study plans tailored to your curriculum, learning pace, and goals. Break down complex topics into manageable daily tasks with adaptive scheduling.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Curriculum-aligned content for all subjects</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Adaptive pacing based on your progress</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Smart reminders and progress tracking</span>
                </div>
              </div>
            </div>

            {/* Quiz Generator Feature */}
            <div className="group bg-gradient-to-br from-card to-card/50 border border-border rounded-3xl p-8 hover:shadow-2xl hover:border-primary/30 transition-all duration-500 hover:-translate-y-2">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">AI Quiz Generator</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Create unlimited practice quizzes from any topic, textbook, or study material. Get instant feedback and detailed explanations for every answer.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Generate quizzes from any topic or material</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Instant feedback with explanations</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Track performance and identify weak areas</span>
                </div>
              </div>
            </div>

            {/* Parent Monitoring Feature */}
            <div className="group bg-gradient-to-br from-card to-card/50 border border-border rounded-3xl p-8 hover:shadow-2xl hover:border-primary/30 transition-all duration-500 hover:-translate-y-2">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                <Eye className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Parent Monitoring Dashboard</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Stay informed with real-time insights into your child's learning progress, strengths, and areas that need attention. Comprehensive analytics at your fingertips.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Real-time progress tracking and alerts</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Detailed analytics on strengths & weaknesses</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Activity summaries and engagement metrics</span>
                </div>
              </div>
            </div>

            {/* Gamification Feature */}
            <div className="group bg-gradient-to-br from-card to-card/50 border border-border rounded-3xl p-8 hover:shadow-2xl hover:border-primary/30 transition-all duration-500 hover:-translate-y-2">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Gamification & Rewards</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Make learning fun with quests, achievements, and rewards. Students earn points, unlock badges, and level up as they master new concepts.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Daily quests and learning challenges</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Achievement badges and progress levels</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Motivation through rewards and milestones</span>
                </div>
              </div>
            </div>
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
                <span className="text-sm font-medium text-foreground">Smart AI Learning</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Why Teachly Works
              </h2>
              
              <p className="text-xl text-muted-foreground mb-12">
                Powered by advanced AI that adapts to each student's unique learning style
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Adaptive Learning</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  AI adjusts difficulty and pacing based on performance, ensuring optimal challenge levels
                </p>
              </div>
              
              <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Data-Driven Insights</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Track progress with detailed analytics that identify strengths and areas for improvement
                </p>
              </div>
              
              <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Gamepad2 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Engaging Experience</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Gamified learning keeps students motivated and excited to learn every day
                </p>
              </div>
            </div>

            <div className="text-center mt-12">
              <Button 
                size="lg"
                onClick={() => navigate('/quiz-generator')}
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
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
              {t('home.cta.title')}
            </h2>
            
            <p className="text-xl text-muted-foreground">
              {t('home.cta.subtitle')}
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 pt-6">
              <Button 
                size="lg" 
                onClick={() => navigate('/quiz-generator')}
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
