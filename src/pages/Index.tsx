import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Gamepad2, BarChart, Brain, CheckCircle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const Index = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');

  const handleStartLearning = () => {
    navigate('/auth');
  };

  const handleTryDemo = () => {
    navigate('/demo');
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative">
      {/* Animated gradient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-transparent rounded-full blur-3xl animate-glow" />
        <div className="absolute bottom-0 right-1/4 w-[800px] h-[800px] bg-gradient-to-br from-violet-500/15 via-orange-500/10 to-transparent rounded-full blur-3xl animate-glow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-3xl animate-float" />
      </div>

      <Header />

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="px-6 pt-32 pb-20 md:pt-40 md:pb-32">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight">
              Make Learning <span className="gradient-text">✨Lovable</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
              Teachly turns studying into an AI-powered adventure — for students, teachers, and parents.
            </p>

            {/* Interactive Input */}
            <div className="max-w-2xl mx-auto mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="glass-card rounded-2xl p-2 glow-effect">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Ask Teachly to create a study plan for me..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="flex-1 bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground px-4 py-3 text-lg"
                  />
                  <Button 
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8 glow-effect"
                    onClick={handleStartLearning}
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Try it
                  </Button>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <Button 
                size="lg"
                onClick={handleStartLearning}
                className="gradient-bg hover:opacity-90 text-white border-0 font-semibold px-8 py-6 text-lg rounded-xl shadow-lg glow-effect"
              >
                Start with AI
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={handleTryDemo}
                className="glass border-border/50 hover:bg-accent/50 px-8 py-6 text-lg rounded-xl"
              >
                View Demo
              </Button>
            </div>
          </div>
        </section>

        {/* Three Floating Cards */}
        <section className="px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="glass-card rounded-2xl p-8 hover:scale-105 transition-transform duration-300 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-6">
                  <Gamepad2 className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">🎮 Gamified Learning Paths</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Turn studying into an adventure with quests, achievements, and rewards that keep students motivated.
                </p>
              </div>

              <div className="glass-card rounded-2xl p-8 hover:scale-105 transition-transform duration-300 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-6">
                  <BarChart className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">📊 Progress Dashboards</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Real-time analytics for teachers and parents to track learning progress and identify areas for growth.
                </p>
              </div>

              <div className="glass-card rounded-2xl p-8 hover:scale-105 transition-transform duration-300 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center mb-6">
                  <Brain className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">🧠 AI Study Coach</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Personalized AI tutoring that adapts to each student's learning style and pace.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How Teachly Works */}
        <section className="px-6 py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
              How Teachly Works
            </h2>

            <div className="space-y-12">
              <div className="flex items-start gap-6 animate-fade-in-up">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary font-bold text-xl">
                  1
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Create Your Profile</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Sign up as a student, teacher, or parent. Set your learning goals and preferences.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary font-bold text-xl">
                  2
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Start Your AI-Powered Journey</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Our AI creates personalized study plans, quizzes, and lessons tailored to your needs.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary font-bold text-xl">
                  3
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Track Progress & Celebrate Wins</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Watch progress in real-time, earn achievements, and see learning come alive.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="px-6 py-20">
          <div className="max-w-3xl mx-auto">
            <div className="glass-card rounded-2xl p-12 text-center">
              <p className="text-2xl md:text-3xl font-medium mb-6 leading-relaxed">
                "Built for students. <span className="gradient-text">Loved by teachers.</span>"
              </p>
              <p className="text-muted-foreground text-lg">
                Join thousands of learners transforming education with AI
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-6 py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Ready to make learning lovable?
            </h2>
            <p className="text-xl text-muted-foreground mb-10">
              Start your AI-powered learning journey today.
            </p>
            <Button 
              size="lg"
              onClick={handleStartLearning}
              className="gradient-bg hover:opacity-90 text-white border-0 font-semibold px-12 py-7 text-xl rounded-xl shadow-lg glow-effect"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
