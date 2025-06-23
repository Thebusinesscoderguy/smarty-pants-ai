
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Loader2, ArrowRight, CheckCircle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ContactForm } from '@/components/contact/ContactForm';
import { RoleSelection } from '@/components/RoleSelection';
import { useNavigate } from 'react-router-dom';
import { runSystemTests, type TestSuite } from '@/utils/systemTester';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const navigate = useNavigate();
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [showDemoSelection, setShowDemoSelection] = useState(false);

  const handleRunSystemTests = async () => {
    setIsRunningTests(true);
    
    try {
      toast({
        title: "Running System Tests",
        description: "Testing all APIs and integrations...",
      });

      const results = await runSystemTests();

      const totalTests = results.reduce((sum, suite) => sum + suite.totalTests, 0);
      const failedTests = results.reduce((sum, suite) => sum + suite.failedTests, 0);

      if (failedTests > 0) {
        toast({
          title: "Tests Completed with Issues",
          description: `${failedTests} out of ${totalTests} tests failed. Check system test page for details.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "All Tests Passed!",
          description: `${totalTests} tests completed successfully.`,
        });
      }

      navigate('/system-test');
    } catch (error: any) {
      toast({
        title: "Test Execution Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRunningTests(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <Header />

      <main className="relative z-10 flex-1 px-4 py-12 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="mb-8">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
                Learn Faster with{' '}
                <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  AI Power
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto mb-12 leading-relaxed">
                TeachlyAI uses adaptive artificial intelligence to personalize your learning experience, 
                adjusting to your pace and style automatically for maximum retention.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Button 
                size="lg" 
                onClick={() => setShowRoleSelection(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 px-8 py-4 text-lg font-semibold shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button 
                variant="outline"
                size="lg" 
                onClick={() => setShowDemoSelection(true)}
                className="border-2 border-white/20 bg-white/5 hover:bg-white/10 text-white px-8 py-4 text-lg font-semibold backdrop-blur-sm transition-all duration-300"
              >
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
              
              <Button 
                variant="outline"
                size="lg" 
                onClick={handleRunSystemTests}
                disabled={isRunningTests}
                className="border-2 border-white/20 bg-white/5 hover:bg-white/10 text-white px-8 py-4 text-lg font-semibold backdrop-blur-sm transition-all duration-300"
              >
                {isRunningTests ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    System Health
                  </>
                )}
              </Button>
            </div>

            {/* Video Preview */}
            <div className="relative max-w-4xl mx-auto mb-16">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm">
                <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <Button
                    onClick={() => setShowDemoSelection(true)}
                    className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-full p-6 backdrop-blur-sm transition-all duration-300 hover:scale-110"
                    size="icon"
                  >
                    <Play className="h-8 w-8" />
                  </Button>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none"></div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="group p-8 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:from-blue-500/20 hover:to-cyan-500/20 transition-all duration-300 backdrop-blur-sm">
              <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">🧠</div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Adaptive Learning</h3>
              <p className="text-white/70 leading-relaxed">Our AI adjusts to your learning pace, slowing down when you need time and speeding up when you're flying through concepts.</p>
            </div>
            
            <div className="group p-8 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:from-purple-500/20 hover:to-pink-500/20 transition-all duration-300 backdrop-blur-sm">
              <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">🗣️</div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Voice Interactions</h3>
              <p className="text-white/70 leading-relaxed">Learn on the go with natural voice conversations. Ask questions and get answers just like talking to a personal tutor.</p>
            </div>
            
            <div className="group p-8 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 hover:from-green-500/20 hover:to-emerald-500/20 transition-all duration-300 backdrop-blur-sm">
              <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">📚</div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Smart Analysis</h3>
              <p className="text-white/70 leading-relaxed">Upload your notes and documents, and our AI will help you understand and quiz you on the content instantly.</p>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">Frequently Asked Questions</h2>
            <div className="space-y-6 max-w-4xl mx-auto">
              {[
                {
                  question: "How does the gamified learning system work?",
                  answer: "Our gamification system rewards learning progress with points, badges, and level-ups. Students earn achievements for completing lessons, maintaining study streaks, and reaching milestones. The system adapts to individual learning patterns to keep motivation high while tracking meaningful progress."
                },
                {
                  question: "What can parents and teachers see in the monitoring dashboard?",
                  answer: "Parents and teachers have access to comprehensive dashboards showing student progress, time spent studying, achievement unlocks, performance analytics, and learning outcome assessments. All data is presented with privacy controls and can be customized based on user preferences."
                },
                {
                  question: "How does the AI adapt to my learning style?",
                  answer: "Our AI analyzes your learning patterns, response times, and comprehension levels to automatically adjust the pace and style of lessons. It identifies when you need more practice on certain topics and when you're ready to move forward, creating a truly personalized learning experience."
                }
              ].map((faq, index) => (
                <div key={index} className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                  <h3 className="text-xl font-semibold mb-3 text-white">{faq.question}</h3>
                  <p className="text-white/70 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
          
          <ContactForm />
        </div>
      </main>

      <Footer />
      
      <RoleSelection 
        isOpen={showRoleSelection} 
        onClose={() => setShowRoleSelection(false)} 
        mode="signup"
      />
      
      <RoleSelection 
        isOpen={showDemoSelection} 
        onClose={() => setShowDemoSelection(false)} 
        mode="demo"
      />
    </div>
  );
};

export default Index;
