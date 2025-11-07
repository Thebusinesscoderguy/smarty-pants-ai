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
      {/* Soft animated gradient background - Purple → Blue → Pink */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[1000px] h-[1000px] bg-gradient-to-br from-[hsl(280,80%,50%)]/15 via-[hsl(250,75%,60%)]/10 to-transparent rounded-full blur-3xl animate-glow" />
        <div className="absolute bottom-0 right-1/4 w-[1200px] h-[1200px] bg-gradient-to-br from-[hsl(250,75%,60%)]/10 via-[hsl(330,85%,55%)]/8 to-transparent rounded-full blur-3xl animate-glow" style={{ animationDelay: '3s' }} />
      </div>

      <Header />

      <main className="relative z-10">
        {/* Hero Section - Ultra Minimal */}
        <section className="px-6 pt-40 pb-32 md:pt-56 md:pb-48">
          <div className="max-w-5xl mx-auto text-center">
            {/* Centered hero text */}
            <h1 className="text-7xl md:text-9xl font-bold mb-10 tracking-tight leading-tight">
              Learn Smarter.<br />Feel Smarter.
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-20 leading-relaxed font-light">
              AI-powered lessons, quizzes, and progress tracking that adapt to you.
            </p>

            {/* Interactive prompt - minimal, floating */}
            <div className="max-w-2xl mx-auto mb-16 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[hsl(280,80%,50%)]/20 via-[hsl(250,75%,60%)]/20 to-[hsl(330,85%,55%)]/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <input
                  type="text"
                  placeholder="Teachly, make me a 1-week study plan for Algebra 📘"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="relative w-full bg-background/40 backdrop-blur-sm border border-border/30 rounded-full px-8 py-5 text-lg text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-all duration-300"
                />
              </div>
            </div>

            {/* Minimal CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <Button 
                size="lg"
                onClick={handleStartLearning}
                className="gradient-bg hover:opacity-90 text-white border-0 font-medium px-10 py-6 text-lg rounded-full glow-effect btn-ripple transition-all duration-300 hover:scale-105"
              >
                Start Learning
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg"
                variant="ghost"
                onClick={handleTryDemo}
                className="border border-border/30 hover:border-primary/50 bg-transparent hover:bg-transparent px-10 py-6 text-lg rounded-full font-medium transition-all duration-300"
              >
                See Demo
              </Button>
            </div>
          </div>
        </section>

        {/* Features - Floating, No Cards */}
        <section className="px-6 py-32 md:py-48">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-20 md:gap-32">
              {/* Feature 1 */}
              <div className="text-center animate-fade-in-up transition-all duration-500 hover:transform hover:scale-105" style={{ animationDelay: '0.1s' }}>
                <div className="inline-flex items-center justify-center mb-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[hsl(280,80%,50%)]/30 to-[hsl(250,75%,60%)]/30 rounded-full blur-xl" />
                    <div className="relative text-6xl">🎮</div>
                  </div>
                </div>
                <h3 className="text-2xl font-semibold mb-4">Gamified Learning</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Level up as you master topics
                </p>
              </div>

              {/* Feature 2 */}
              <div className="text-center animate-fade-in-up transition-all duration-500 hover:transform hover:scale-105" style={{ animationDelay: '0.2s' }}>
                <div className="inline-flex items-center justify-center mb-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[hsl(250,75%,60%)]/30 to-[hsl(330,85%,55%)]/30 rounded-full blur-xl" />
                    <div className="relative text-6xl">📊</div>
                  </div>
                </div>
                <h3 className="text-2xl font-semibold mb-4">Smart Progress</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Track goals in real time
                </p>
              </div>

              {/* Feature 3 */}
              <div className="text-center animate-fade-in-up transition-all duration-500 hover:transform hover:scale-105" style={{ animationDelay: '0.3s' }}>
                <div className="inline-flex items-center justify-center mb-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[hsl(330,85%,55%)]/30 to-[hsl(280,80%,50%)]/30 rounded-full blur-xl" />
                    <div className="relative text-6xl">🤖</div>
                  </div>
                </div>
                <h3 className="text-2xl font-semibold mb-4">AI Study Assistant</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Personalized help anytime
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Minimal Testimonial */}
        <section className="px-6 py-32 md:py-40">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-4xl md:text-5xl font-light mb-8 leading-relaxed">
              Built for students.<br />
              <span className="gradient-text font-semibold">Loved by teachers.</span>
            </p>
            <p className="text-muted-foreground text-lg">
              Join thousands transforming education with AI
            </p>
          </div>
        </section>

        {/* Final CTA - Minimal */}
        <section className="px-6 py-32 md:py-40">
          <div className="max-w-4xl mx-auto text-center">
            <Button 
              size="lg"
              onClick={handleStartLearning}
              className="gradient-bg hover:opacity-90 text-white border-0 font-medium px-12 py-7 text-xl rounded-full glow-effect btn-ripple transition-all duration-300 hover:scale-105"
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
