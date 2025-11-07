import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Sparkles, Target, TrendingUp, Brain, ArrowRight, Award, Users, Zap } from 'lucide-react';
import { useState } from 'react';

const Index = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/auth');
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
            <div className="space-y-6 animate-fade-in col-span-2 max-w-5xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">AI-Powered Education</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-8xl font-bold text-foreground leading-[1.1] tracking-tight">
                Learn Smarter,
                <br />
                Not Harder
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Your personal AI tutor that adapts to your learning style, tracks your progress, and makes education engaging through gamification.
              </p>
              
              <form onSubmit={handleSubmit} className="mt-8 max-w-3xl mx-auto">
                <div className="relative group">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Create a personalized study plan for…"
                    className="w-full px-6 py-5 text-lg rounded-full border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors pr-32"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-6"
                  >
                    Start <ArrowRight className="ml-2 w-4 h-4" />
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
            <span className="text-sm font-medium text-foreground">Smart Learning</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-16">
            Why AI-Powered Learning
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4 p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300">
              <div className="text-5xl font-bold text-primary/20">01</div>
              <h3 className="text-xl font-semibold text-foreground">
                We're giving students a personalized path to success
              </h3>
            </div>
            
            <div className="space-y-4 p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300">
              <div className="text-5xl font-bold text-primary/20">02</div>
              <h3 className="text-xl font-semibold text-foreground">
                We're bringing adaptive intelligence to where learning happens
              </h3>
            </div>
            
            <div className="space-y-4 p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300">
              <div className="text-5xl font-bold text-primary/20">03</div>
              <h3 className="text-xl font-semibold text-foreground">
                We're creating companions, not replacements for teachers
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
              Teachly personalizes learning paths and adapts to every interaction. Helping students focus on what they do best: create, solve, and grow.
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-4xl mx-auto mb-16">
            <div className="text-center space-y-2 p-6 bg-card border border-border rounded-2xl hover:shadow-md transition-shadow">
              <div className="text-2xl font-bold text-primary">K-12</div>
              <div className="text-sm text-muted-foreground">All Grades</div>
            </div>
            <div className="text-center space-y-2 p-6 bg-card border border-border rounded-2xl hover:shadow-md transition-shadow">
              <div className="text-2xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
            <div className="text-center space-y-2 p-6 bg-card border border-border rounded-2xl hover:shadow-md transition-shadow">
              <div className="text-2xl font-bold text-primary">10+</div>
              <div className="text-sm text-muted-foreground">Subjects</div>
            </div>
            <div className="text-center space-y-2 p-6 bg-card border border-border rounded-2xl hover:shadow-md transition-shadow">
              <div className="text-2xl font-bold text-primary">Real-time</div>
              <div className="text-sm text-muted-foreground">Feedback</div>
            </div>
            <div className="text-center space-y-2 p-6 bg-card border border-border rounded-2xl hover:shadow-md transition-shadow">
              <div className="text-2xl font-bold text-primary">Adaptive</div>
              <div className="text-sm text-muted-foreground">Learning</div>
            </div>
          </div>

          <div className="text-center">
            <Button 
              size="lg"
              onClick={() => navigate('/auth')}
              className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
            >
              Get Started <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="space-y-6 p-12 bg-card border border-border rounded-3xl shadow-lg">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Experience the Future Today
              </h2>
              
              <p className="text-lg md:text-xl text-muted-foreground">
                Our cutting-edge AI learning platform is designed to transform how students interact with education in any environment.
              </p>
              
              <div className="space-y-4 pt-6">
                <h3 className="text-2xl font-semibold text-foreground">
                  Next Generation Learning
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Built with precision AI and sophisticated pedagogy, Teachly seamlessly integrates into various environments, from homes to schools, providing personalized assistance and enriching educational experiences.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Features Section */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-8">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Features</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Advanced Intelligence,
            <br />
            Human-Like Intuition
          </h2>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-16 max-w-2xl">
            Built with cutting-edge technology to understand, learn, and adapt to your unique needs.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-all duration-300">
              <Target className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Adaptive Learning
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Our AI learns your unique style and adjusts in real-time to maximize understanding and retention.
              </p>
            </div>
            
            <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-all duration-300">
              <TrendingUp className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Progress Tracking
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Comprehensive analytics show growth across all subjects, helping you stay motivated and on track.
              </p>
            </div>
            
            <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-all duration-300">
              <Award className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Gamified Experience
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Earn achievements, level up, and complete quests as you master new concepts and skills.
              </p>
            </div>
            
            <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-all duration-300">
              <Brain className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-3">
                AI Study Assistant
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Get instant help with homework, explanations, and study plans tailored to your curriculum.
              </p>
            </div>
            
            <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-all duration-300">
              <Users className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Parent Dashboard
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Parents and teachers can monitor progress, set goals, and provide support when needed.
              </p>
            </div>
            
            <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-all duration-300">
              <Sparkles className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Smart Quizzes
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                AI-generated quizzes that adapt to your knowledge level and focus on areas needing improvement.
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
              Ready to Transform Your Learning Journey?
            </h2>
            
            <p className="text-xl text-muted-foreground">
              Join thousands of students already learning smarter with Teachly's AI-powered platform.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 pt-6">
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 shadow-lg"
              >
                Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/how-it-works')}
                className="rounded-full px-8 border-2 border-border bg-background hover:bg-muted"
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
