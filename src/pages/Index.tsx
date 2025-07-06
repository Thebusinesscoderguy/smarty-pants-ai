
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Brain, Gamepad2, BarChart, Users, CheckCircle, Star } from 'lucide-react';
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
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight text-gray-900">
              AI-Powered Learning Made Simple
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed">
              Personalized tutoring that adapts to your learning style. Get help with homework, 
              practice with quizzes, and track your progress.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button 
                size="lg" 
                className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 text-lg"
                onClick={handleStartLearning}
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-4 py-20 md:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">Everything You Need to Learn</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Simple, powerful tools to help you succeed in your studies.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="p-8 rounded-lg bg-white border border-gray-200">
                <Brain className="h-12 w-12 text-gray-900 mb-6" />
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Smart Tutoring</h3>
                <p className="text-gray-600 leading-relaxed">
                  Get personalized help that adapts to your learning pace and style.
                </p>
              </div>

              <div className="p-8 rounded-lg bg-white border border-gray-200">
                <BookOpen className="h-12 w-12 text-gray-900 mb-6" />
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Interactive Learning</h3>
                <p className="text-gray-600 leading-relaxed">
                  Engage with content through voice, text, and interactive exercises.
                </p>
              </div>

              <div className="p-8 rounded-lg bg-white border border-gray-200">
                <BarChart className="h-12 w-12 text-gray-900 mb-6" />
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Progress Tracking</h3>
                <p className="text-gray-600 leading-relaxed">
                  Monitor your learning progress and identify areas for improvement.
                </p>
              </div>

              <div className="p-8 rounded-lg bg-white border border-gray-200">
                <Gamepad2 className="h-12 w-12 text-gray-900 mb-6" />
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Gamified Experience</h3>
                <p className="text-gray-600 leading-relaxed">
                  Stay motivated with achievements, streaks, and fun challenges.
                </p>
              </div>

              <div className="p-8 rounded-lg bg-white border border-gray-200">
                <Users className="h-12 w-12 text-gray-900 mb-6" />
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Parent Monitoring</h3>
                <p className="text-gray-600 leading-relaxed">
                  Parents can track progress and stay involved in their child's learning.
                </p>
              </div>

              <div className="p-8 rounded-lg bg-white border border-gray-200">
                <CheckCircle className="h-12 w-12 text-gray-900 mb-6" />
                <h3 className="text-xl font-semibold mb-4 text-gray-900">All Subjects</h3>
                <p className="text-gray-600 leading-relaxed">
                  Math, science, literature, languages, and more - all in one place.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="px-4 py-20 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">Simple Pricing</h2>
              <p className="text-xl text-gray-600">Choose the plan that works for you</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              <div className="p-8 rounded-lg bg-white border-2 border-gray-200">
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Individual</h3>
                <div className="text-4xl font-bold mb-6 text-gray-900">$12<span className="text-lg text-gray-600">/month</span></div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Unlimited AI tutoring</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Progress tracking</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />All subjects</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Mobile & web access</li>
                </ul>
                <Button 
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                  onClick={handleStartLearning}
                >
                  Get Started
                </Button>
              </div>

              <div className="p-8 rounded-lg bg-gray-900 text-white relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-white text-gray-900 px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
                <h3 className="text-2xl font-bold mb-4">Family</h3>
                <div className="text-4xl font-bold mb-6">$19<span className="text-lg text-gray-300">/month</span></div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />Up to 5 students</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />Parent dashboard</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />All individual features</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />Priority support</li>
                </ul>
                <Button 
                  className="w-full bg-white text-gray-900 hover:bg-gray-100"
                  onClick={handleStartLearning}
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 py-20 md:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">Ready to Start Learning?</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of students who are already improving their grades with AI-powered tutoring.
            </p>
            <Button 
              size="lg" 
              className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 text-lg"
              onClick={handleStartLearning}
            >
              Get Started Today
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
