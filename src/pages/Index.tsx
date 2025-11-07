import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Sparkles, Target, TrendingUp, Brain, ArrowRight, Award, Users, Zap } from 'lucide-react';

const Index = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStartLearning = () => {
    if (user) {
      navigate('/chat');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Orange gradient glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-200/40 via-amber-100/30 to-background pointer-events-none" />
        
        <div className="container mx-auto px-6 py-20 md:py-32 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="space-y-6 animate-fade-in col-span-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Purpose</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
                Teachly: Where AI Meets Learning
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
                The AI-powered learning companion that adapts and grows alongside you.
              </p>
              
              <div className="flex flex-wrap gap-4 pt-4">
                <Button 
                  size="lg" 
                  onClick={handleStartLearning}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 shadow-lg"
                >
                  Start Learning <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="rounded-full px-8 border-2"
                >
                  See How It Works
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why AI Learning Section */}
      <section className="py-20 md:py-32 bg-background" id="features">
        <div className="container mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Smart Learning</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-16">
            Why AI-Powered Learning
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4 p-6 rounded-2xl hover:bg-card/50 transition-colors">
              <div className="text-5xl font-bold text-foreground/10">01</div>
              <h3 className="text-xl font-semibold text-foreground">
                We're giving students a personalized path to success
              </h3>
            </div>
            
            <div className="space-y-4 p-6 rounded-2xl hover:bg-card/50 transition-colors">
              <div className="text-5xl font-bold text-foreground/10">02</div>
              <h3 className="text-xl font-semibold text-foreground">
                We're bringing adaptive intelligence to where learning happens
              </h3>
            </div>
            
            <div className="space-y-4 p-6 rounded-2xl hover:bg-card/50 transition-colors">
              <div className="text-5xl font-bold text-foreground/10">03</div>
              <h3 className="text-xl font-semibold text-foreground">
                We're creating companions, not replacements for teachers
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* Features Detail Section */}
      <section className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Teachly works alongside students and teachers. By handling repetitive tasks, personalizing learning paths, and adapting to every interaction, Teachly helps humans focus on what they do best: create, solve, and grow.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-3xl mx-auto mb-16">
            <div className="text-center space-y-2 p-6 bg-card rounded-2xl shadow-sm">
              <div className="text-2xl font-bold text-foreground">K-12</div>
              <div className="text-sm text-muted-foreground">All Grades</div>
            </div>
            <div className="text-center space-y-2 p-6 bg-card rounded-2xl shadow-sm">
              <div className="text-2xl font-bold text-foreground">24/7</div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
            <div className="text-center space-y-2 p-6 bg-card rounded-2xl shadow-sm">
              <div className="text-2xl font-bold text-foreground">10+</div>
              <div className="text-sm text-muted-foreground">Subjects</div>
            </div>
            <div className="text-center space-y-2 p-6 bg-card rounded-2xl shadow-sm">
              <div className="text-2xl font-bold text-foreground">Real-time</div>
              <div className="text-sm text-muted-foreground">Feedback</div>
            </div>
            <div className="text-center space-y-2 p-6 bg-card rounded-2xl shadow-sm">
              <div className="text-2xl font-bold text-foreground">Adaptive</div>
              <div className="text-sm text-muted-foreground">Learning</div>
            </div>
          </div>

          <div className="text-center">
            <Button 
              size="lg"
              onClick={handleStartLearning}
              variant="outline"
              className="rounded-full px-8 border-2"
            >
              Request a Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Experience the Future Today
              </h2>
              
              <p className="text-lg text-muted-foreground">
                Our cutting-edge AI learning platform is designed to transform how students interact with education in any environment.
              </p>
              
              <div className="space-y-4 pt-4">
                <h3 className="text-2xl font-semibold text-foreground">
                  Next Generation Learning
                </h3>
                <p className="text-muted-foreground">
                  Built with precision AI and sophisticated pedagogy, Teachly seamlessly integrates into various environments, from homes to schools, providing personalized assistance and enriching educational experiences.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Features Section */}
      <section className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Features</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Advanced Intelligence,
            <br />
            Human-Like Intuition
          </h2>
          
          <p className="text-lg text-muted-foreground mb-16 max-w-2xl">
            Built with cutting-edge technology to understand, learn, and adapt to your unique needs.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <Target className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Adaptive Learning
              </h3>
              <p className="text-muted-foreground">
                Our AI learns your unique style and adjusts in real-time to maximize understanding and retention.
              </p>
            </div>
            
            <div className="bg-card rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <TrendingUp className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Progress Tracking
              </h3>
              <p className="text-muted-foreground">
                Comprehensive analytics show growth across all subjects, helping you stay motivated and on track.
              </p>
            </div>
            
            <div className="bg-card rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <Award className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Gamified Experience
              </h3>
              <p className="text-muted-foreground">
                Earn achievements, level up, and complete quests as you master new concepts and skills.
              </p>
            </div>
            
            <div className="bg-card rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <Brain className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-3">
                AI Study Assistant
              </h3>
              <p className="text-muted-foreground">
                Get instant help with homework, explanations, and study plans tailored to your curriculum.
              </p>
            </div>
            
            <div className="bg-card rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <Users className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Parent Dashboard
              </h3>
              <p className="text-muted-foreground">
                Parents and teachers can monitor progress, set goals, and provide support when needed.
              </p>
            </div>
            
            <div className="bg-card rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <Sparkles className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Smart Quizzes
              </h3>
              <p className="text-muted-foreground">
                AI-generated quizzes that adapt to your knowledge level and focus on areas needing improvement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
              Ready to Transform Your Learning Journey?
            </h2>
            
            <p className="text-xl text-muted-foreground">
              Join thousands of students already learning smarter with Teachly's AI-powered platform.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Button 
                size="lg" 
                onClick={handleStartLearning}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 shadow-lg"
              >
                Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/how-it-works')}
                className="rounded-full px-8 border-2"
              >
                Learn More
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
