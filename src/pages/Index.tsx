
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Brain, Gamepad2, BarChart, Users, Lightbulb, Target, CheckCircle, Star, MessageSquare, Zap, Shield, Clock } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleStartLearning = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-4 py-20 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
              AI-Powered Learning Assistant
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed">
              Get personalized help with homework, explanations, and interactive learning through our intelligent chat interface.
            </p>
            
            <div className="flex justify-center mb-16">
              <Button 
                size="lg" 
                className="px-8 py-4 text-lg"
                onClick={handleStartLearning}
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-4 py-20 md:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Key Features</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Everything you need for effective learning in one place
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              <div className="p-8 rounded-xl bg-white border border-gray-200 hover:shadow-lg transition-all duration-300">
                <MessageSquare className="h-12 w-12 text-blue-600 mb-6" />
                <h3 className="text-xl font-semibold mb-4">Interactive Chat</h3>
                <p className="text-gray-600 leading-relaxed">
                  Get instant help with homework, explanations, and problem-solving through our intelligent chat interface.
                </p>
              </div>

              <div className="p-8 rounded-xl bg-white border border-gray-200 hover:shadow-lg transition-all duration-300">
                <Brain className="h-12 w-12 text-purple-600 mb-6" />
                <h3 className="text-xl font-semibold mb-4">Adaptive Learning</h3>
                <p className="text-gray-600 leading-relaxed">
                  AI adapts to your learning style and pace, providing personalized content and recommendations.
                </p>
              </div>

              <div className="p-8 rounded-xl bg-white border border-gray-200 hover:shadow-lg transition-all duration-300">
                <Lightbulb className="h-12 w-12 text-green-600 mb-6" />
                <h3 className="text-xl font-semibold mb-4">Smart Content</h3>
                <p className="text-gray-600 leading-relaxed">
                  Generate quizzes, explanations, and practice problems tailored to your specific needs.
                </p>
              </div>

              <div className="p-8 rounded-xl bg-white border border-gray-200 hover:shadow-lg transition-all duration-300">
                <Gamepad2 className="h-12 w-12 text-orange-600 mb-6" />
                <h3 className="text-xl font-semibold mb-4">Gamified Learning</h3>
                <p className="text-gray-600 leading-relaxed">
                  Stay motivated with achievements, progress tracking, and interactive learning experiences.
                </p>
              </div>

              <div className="p-8 rounded-xl bg-white border border-gray-200 hover:shadow-lg transition-all duration-300">
                <BarChart className="h-12 w-12 text-teal-600 mb-6" />
                <h3 className="text-xl font-semibold mb-4">Progress Analytics</h3>
                <p className="text-gray-600 leading-relaxed">
                  Track your learning progress with detailed analytics and insights.
                </p>
              </div>

              <div className="p-8 rounded-xl bg-white border border-gray-200 hover:shadow-lg transition-all duration-300">
                <Users className="h-12 w-12 text-indigo-600 mb-6" />
                <h3 className="text-xl font-semibold mb-4">Multi-Subject Support</h3>
                <p className="text-gray-600 leading-relaxed">
                  Get help across all subjects from math and science to literature and history.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Advanced Features */}
        <section className="px-4 py-20 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Advanced Capabilities</h2>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">File & Voice Input</h3>
                    <p className="text-gray-600">
                      Upload documents, images, or use voice input to get help with your assignments and questions.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Zap className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Instant Feedback</h3>
                    <p className="text-gray-600">
                      Get immediate responses and explanations to help you understand concepts better.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Safe Learning Environment</h3>
                    <p className="text-gray-600">
                      Secure and private platform designed specifically for educational purposes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">24/7 Availability</h3>
                    <p className="text-gray-600">
                      Access your AI tutor anytime, anywhere. Perfect for late-night study sessions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">Start Learning Today</h3>
                  <p className="text-gray-600">
                    Join thousands of students already improving their grades with AI assistance.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <span className="text-gray-700">Homework Help</span>
                    <span className="text-green-600 font-semibold">✓ Available in Chat</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <span className="text-gray-700">Quiz Generation</span>
                    <span className="text-blue-600 font-semibold">⚡ Instant</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <span className="text-gray-700">Progress Tracking</span>
                    <span className="text-purple-600 font-semibold">📊 Detailed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="px-4 py-20 md:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Simple Pricing</h2>
              <p className="text-xl text-gray-600">Choose the plan that works for you</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 rounded-xl bg-white border border-gray-200">
                <h3 className="text-2xl font-bold mb-4">Individual</h3>
                <div className="text-4xl font-bold mb-6">$9<span className="text-lg text-gray-600">/month</span></div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Unlimited chat sessions</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />File & voice input</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Progress tracking</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />All subjects</li>
                </ul>
                <Button 
                  className="w-full"
                  onClick={handleStartLearning}
                >
                  Get Started
                </Button>
              </div>

              <div className="p-8 rounded-xl bg-blue-50 border-2 border-blue-200 relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
                <h3 className="text-2xl font-bold mb-4">Family</h3>
                <div className="text-4xl font-bold mb-6">$19<span className="text-lg text-gray-600">/month</span></div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Up to 5 students</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Parent monitoring</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Progress reports</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Priority support</li>
                </ul>
                <Button 
                  className="w-full"
                  onClick={handleStartLearning}
                >
                  Get Started
                </Button>
              </div>

              <div className="p-8 rounded-xl bg-white border border-gray-200">
                <h3 className="text-2xl font-bold mb-4">School</h3>
                <div className="text-4xl font-bold mb-6">$32<span className="text-lg text-gray-600">/month</span></div>
                <div className="text-sm text-gray-600 mb-4">+ $3 for each additional student</div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Up to 30 students</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Teacher dashboard</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Class management</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Analytics & reports</li>
                </ul>
                <Button variant="outline" className="w-full">
                  Contact Sales
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 py-20 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gray-900 text-white rounded-2xl p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Learning?</h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of students who are already achieving better results with AI-powered learning assistance.
              </p>
              <Button 
                size="lg" 
                className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 text-lg"
                onClick={handleStartLearning}
              >
                Start Learning Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
