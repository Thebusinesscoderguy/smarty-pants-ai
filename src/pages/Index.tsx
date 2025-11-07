import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Gamepad2, BarChart, Brain, BookOpen, Zap, Users } from 'lucide-react';
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
      {/* Animated gradient background - Navy → Purple → Magenta */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[800px] h-[800px] bg-gradient-to-br from-[hsl(230,35%,25%)]/30 via-[hsl(280,80%,50%)]/20 to-transparent rounded-full blur-3xl animate-glow" />
        <div className="absolute bottom-0 right-1/3 w-[900px] h-[900px] bg-gradient-to-br from-[hsl(280,80%,50%)]/25 via-[hsl(330,85%,55%)]/15 to-transparent rounded-full blur-3xl animate-glow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-gradient-to-br from-[hsl(250,75%,60%)]/10 to-transparent rounded-full blur-3xl animate-float" />
      </div>

      <Header />

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="px-6 pt-32 pb-24 md:pt-48 md:pb-36">
          <div className="max-w-6xl mx-auto text-center">
            {/* Hero glow effect */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-[hsl(280,80%,50%)]/20 via-[hsl(250,75%,60%)]/30 to-[hsl(330,85%,55%)]/20 blur-3xl rounded-full pointer-events-none" />
            
            <div className="relative">
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold mb-8 tracking-tight leading-tight">
                Make Learning <span className="gradient-text">✨Lovable</span>
              </h1>
              
              <p className="text-xl md:text-2xl lg:text-3xl text-muted-foreground max-w-4xl mx-auto mb-16 leading-relaxed font-light">
                Teachly helps students learn smarter through AI, gamified lessons, and progress tracking.
              </p>

              {/* Interactive Demo Input */}
              <div className="max-w-3xl mx-auto mb-12 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="glass-card rounded-3xl p-3 glow-effect hover-lift transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Ask Teachly to create a study plan for..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="flex-1 bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground px-6 py-4 text-lg"
                    />
                    <Button 
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl px-10 py-6 text-lg btn-ripple glow-effect"
                      onClick={handleStartLearning}
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Try it
                    </Button>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-5 justify-center items-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <Button 
                  size="lg"
                  onClick={handleStartLearning}
                  className="gradient-bg hover:opacity-90 text-white border-0 font-semibold px-12 py-7 text-lg rounded-2xl shadow-2xl glow-effect btn-ripple hover:scale-105 transition-all duration-300"
                >
                  Try Teachly Free
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={handleTryDemo}
                  className="glass border-border/50 hover:bg-accent/10 px-12 py-7 text-lg rounded-2xl hover-lift font-semibold"
                >
                  See How It Works
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights - Three Animated Cards */}
        <section className="px-6 py-24 md:py-32">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="glass-card rounded-3xl p-10 hover-lift animate-fade-in-up transition-all duration-500" style={{ animationDelay: '0.1s' }}>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(280,80%,50%)]/20 to-[hsl(250,75%,60%)]/20 flex items-center justify-center mb-8 glow-effect">
                  <Gamepad2 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-3xl font-bold mb-4">Gamified Learning Paths</h3>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  Turn studying into an adventure with quests, achievements, and rewards that keep students motivated every step of the way.
                </p>
              </div>

              {/* Card 2 */}
              <div className="glass-card rounded-3xl p-10 hover-lift animate-fade-in-up transition-all duration-500" style={{ animationDelay: '0.2s' }}>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(250,75%,60%)]/20 to-[hsl(330,85%,55%)]/20 flex items-center justify-center mb-8 glow-effect">
                  <BarChart className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-3xl font-bold mb-4">Parent & Teacher Dashboards</h3>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  Real-time analytics and insights help parents and teachers track learning progress and celebrate wins together.
                </p>
              </div>

              {/* Card 3 */}
              <div className="glass-card rounded-3xl p-10 hover-lift animate-fade-in-up transition-all duration-500" style={{ animationDelay: '0.3s' }}>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(330,85%,55%)]/20 to-[hsl(280,80%,50%)]/20 flex items-center justify-center mb-8 glow-effect">
                  <Brain className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-3xl font-bold mb-4">AI Study Assistant</h3>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  Personalized AI tutoring adapts to each student's learning style, making every session uniquely effective.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="px-6 py-24 md:py-32">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold text-center mb-20 tracking-tight">
              How Teachly Works
            </h2>

            <div className="space-y-16">
              {/* Step 1 */}
              <div className="flex items-start gap-8 animate-fade-in-up group">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-2xl border border-primary/20 group-hover:bg-primary/20 transition-all duration-300">
                  1
                </div>
                <div>
                  <h3 className="text-3xl font-bold mb-3">Create Your Profile</h3>
                  <p className="text-muted-foreground text-xl leading-relaxed">
                    Sign up as a student, teacher, or parent. Set your learning goals and let Teachly personalize your journey.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-8 animate-fade-in-up group" style={{ animationDelay: '0.1s' }}>
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-2xl border border-primary/20 group-hover:bg-primary/20 transition-all duration-300">
                  2
                </div>
                <div>
                  <h3 className="text-3xl font-bold mb-3">Start Your AI-Powered Journey</h3>
                  <p className="text-muted-foreground text-xl leading-relaxed">
                    Our AI creates personalized study plans, interactive quizzes, and adaptive lessons tailored just for you.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-8 animate-fade-in-up group" style={{ animationDelay: '0.2s' }}>
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-2xl border border-primary/20 group-hover:bg-primary/20 transition-all duration-300">
                  3
                </div>
                <div>
                  <h3 className="text-3xl font-bold mb-3">Track Progress & Celebrate Wins</h3>
                  <p className="text-muted-foreground text-xl leading-relaxed">
                    Watch progress in real-time, earn achievements, and see learning transform into an experience students love.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="px-6 py-24 md:py-32">
          <div className="max-w-5xl mx-auto">
            <div className="glass-card rounded-3xl p-16 text-center hover-lift">
              <div className="flex justify-center gap-6 mb-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-[hsl(250,75%,60%)] border-2 border-primary/50 flex items-center justify-center text-2xl">
                  👨‍🏫
                </div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(250,75%,60%)] to-[hsl(330,85%,55%)] border-2 border-primary/50 flex items-center justify-center text-2xl">
                  👩‍🎓
                </div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(330,85%,55%)] to-primary border-2 border-primary/50 flex items-center justify-center text-2xl">
                  👨‍👩‍👧
                </div>
              </div>
              
              <p className="text-3xl md:text-4xl font-semibold mb-6 leading-relaxed">
                "Built for students. <span className="gradient-text">Loved by teachers.</span>"
              </p>
              <p className="text-muted-foreground text-xl">
                Join thousands of learners transforming education with AI
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-6 py-32 md:py-40">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight leading-tight">
              Ready to make learning lovable?
            </h2>
            <p className="text-2xl text-muted-foreground mb-12 font-light">
              Start your AI-powered learning journey today — no credit card required.
            </p>
            <Button 
              size="lg"
              onClick={handleStartLearning}
              className="gradient-bg hover:opacity-90 text-white border-0 font-semibold px-16 py-8 text-xl rounded-2xl shadow-2xl glow-effect btn-ripple hover:scale-105 transition-all duration-300"
            >
              Get Started Free
              <ArrowRight className="ml-3 h-7 w-7" />
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
