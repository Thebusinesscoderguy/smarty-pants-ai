
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BookOpen, Brain, Users, Trophy, Target, MessageSquare, BarChart3, Sparkles } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ContactForm } from '@/components/contact/ContactForm';
import { FeaturesDemo } from '@/components/features/FeaturesDemo';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const Index = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      <Header />
      
      {/* Hero Section */}
      <section className="relative px-6 py-20 md:py-32 text-center">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">
            AI-Powered Education for Every Student
          </h1>
          
          <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
            Experience personalized learning with our advanced AI tutor that adapts to your unique learning style and pace.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button 
              onClick={() => navigate('/auth?signup=true')}
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-2xl transform hover:scale-105 transition-all duration-200"
            >
              Start Learning
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button 
              onClick={() => navigate('/system-test')}
              variant="outline" 
              size="lg"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm px-8 py-4 rounded-xl font-semibold text-lg"
            >
              Try Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Powerful Features Section - Fixed spacing */}
      <section id="features" className="py-20 px-6 bg-black/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Powerful Features for Modern Learning
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Our AI-powered platform combines cutting-edge technology with proven educational methods
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-500/30 hover:from-blue-600/30 hover:to-purple-600/30 transition-all duration-300 cursor-pointer group">
              <CardHeader>
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl w-fit group-hover:scale-110 transition-transform duration-300">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Adaptive AI Learning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80">
                  Our AI adapts to your learning style, identifying strengths and areas for improvement to create a personalized educational experience.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-600/20 to-blue-600/20 border-green-500/30 hover:from-green-600/30 hover:to-blue-600/30 transition-all duration-300 cursor-pointer group">
              <CardHeader>
                <div className="p-3 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl w-fit group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Interactive Voice Chat</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80">
                  Engage in natural conversations with your AI tutor through voice interactions, making learning more dynamic and engaging.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30 hover:from-purple-600/30 hover:to-pink-600/30 transition-all duration-300 cursor-pointer group">
              <CardHeader>
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl w-fit group-hover:scale-110 transition-transform duration-300">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Goal-Oriented Quests</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80">
                  Complete engaging quests and challenges that align with your learning objectives, making education fun and rewarding.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-600/20 to-red-600/20 border-orange-500/30 hover:from-orange-600/30 hover:to-red-600/30 transition-all duration-300 cursor-pointer group">
              <CardHeader>
                <div className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl w-fit group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Real-time Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80">
                  Track your progress with detailed analytics and insights that help you understand your learning patterns and achievements.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border-cyan-500/30 hover:from-cyan-600/30 hover:to-blue-600/30 transition-all duration-300 cursor-pointer group">
              <CardHeader>
                <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl w-fit group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Collaborative Learning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80">
                  Connect with peers and teachers in a collaborative environment that enhances the learning experience through interaction.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-yellow-500/30 hover:from-yellow-600/30 hover:to-orange-600/30 transition-all duration-300 cursor-pointer group">
              <CardHeader>
                <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl w-fit group-hover:scale-110 transition-transform duration-300">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Achievement System</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80">
                  Earn badges and achievements as you progress, maintaining motivation and celebrating your educational milestones.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Demo */}
      <FeaturesDemo />

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-black/40">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-white/70 mb-12 max-w-3xl mx-auto">
            Choose the perfect plan for your learning journey. All plans include our core AI features.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="bg-white/5 border-white/20 hover:bg-white/10 transition-all duration-300">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-white mb-2">Individual</CardTitle>
                <div className="text-4xl font-bold text-blue-400 mb-4">$16<span className="text-lg text-white/60">/month</span></div>
                <p className="text-white/70">Perfect for personal learning</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-white/80">
                  <Sparkles className="h-4 w-4 mr-2 text-green-400" />
                  <span>AI-powered tutoring</span>
                </div>
                <div className="flex items-center text-white/80">
                  <Sparkles className="h-4 w-4 mr-2 text-green-400" />
                  <span>Voice interactions</span>
                </div>
                <div className="flex items-center text-white/80">
                  <Sparkles className="h-4 w-4 mr-2 text-green-400" />
                  <span>Progress tracking</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-blue-500/50 hover:bg-white/10 transition-all duration-300 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm">
                Popular
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-white mb-2">Business</CardTitle>
                <div className="text-4xl font-bold text-blue-400 mb-4">$25<span className="text-lg text-white/60">/month</span></div>
                <p className="text-white/70">For small teams and businesses</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-white/80">
                  <Sparkles className="h-4 w-4 mr-2 text-green-400" />
                  <span>Everything in Individual</span>
                </div>
                <div className="flex items-center text-white/80">
                  <Sparkles className="h-4 w-4 mr-2 text-green-400" />
                  <span>Team management</span>
                </div>
                <div className="flex items-center text-white/80">
                  <Sparkles className="h-4 w-4 mr-2 text-green-400" />
                  <span>Advanced analytics</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-green-500/50 hover:bg-white/10 transition-all duration-300">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-white mb-2">School</CardTitle>
                <div className="text-4xl font-bold text-green-400 mb-4">$199<span className="text-lg text-white/60">/month</span></div>
                <p className="text-white/70">For educational institutions</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-white/80">
                  <Sparkles className="h-4 w-4 mr-2 text-green-400" />
                  <span>Everything in Business</span>
                </div>
                <div className="flex items-center text-white/80">
                  <Sparkles className="h-4 w-4 mr-2 text-green-400" />
                  <span>Up to 500 students</span>
                </div>
                <div className="flex items-center text-white/80">
                  <Sparkles className="h-4 w-4 mr-2 text-green-400" />
                  <span>School-wide management</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12">
            <Button 
              onClick={() => navigate('/pricing')}
              size="lg" 
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg"
            >
              View Detailed Pricing
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                About TeachlyAI
              </h2>
              <p className="text-xl text-white/80 mb-6 leading-relaxed">
                We're revolutionizing education through artificial intelligence, making personalized learning accessible to everyone, everywhere.
              </p>
              <p className="text-white/70 mb-8 leading-relaxed">
                Our platform combines advanced AI algorithms with proven pedagogical methods to create an adaptive learning environment that grows with each student. From voice interactions to real-time progress tracking, we're building the future of education.
              </p>
              <Button 
                onClick={() => navigate('/how-it-works')}
                size="lg" 
                variant="outline"
                className="border-purple-500/50 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
              >
                Learn How It Works
                <BookOpen className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl p-8 border border-purple-500/30">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">AI-Powered</h3>
                      <p className="text-white/70 text-sm">Advanced machine learning algorithms</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Collaborative</h3>
                      <p className="text-white/70 text-sm">Connect with peers and educators</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Goal-Oriented</h3>
                      <p className="text-white/70 text-sm">Achieve your learning objectives</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-6 bg-black/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Get in Touch
            </h2>
            <p className="text-xl text-white/70">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>
          <ContactForm />
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
