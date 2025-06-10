
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Play, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ContactForm } from '@/components/contact/ContactForm';
import { useNavigate } from 'react-router-dom';
import { runSystemTests, type TestSuite } from '@/utils/systemTester';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const navigate = useNavigate();
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<TestSuite[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleRunSystemTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    setShowResults(false);
    
    try {
      toast({
        title: "Running System Tests",
        description: "Testing all APIs and integrations...",
      });

      const results = await runSystemTests();
      setTestResults(results);
      setShowResults(true);

      const totalTests = results.reduce((sum, suite) => sum + suite.totalTests, 0);
      const failedTests = results.reduce((sum, suite) => sum + suite.failedTests, 0);

      if (failedTests > 0) {
        toast({
          title: "Tests Completed with Issues",
          description: `${failedTests} out of ${totalTests} tests failed. Check results below.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "All Tests Passed!",
          description: `${totalTests} tests completed successfully.`,
        });
      }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'skip':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800';
      case 'fail':
        return 'bg-red-100 text-red-800';
      case 'skip':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <main className="flex-1 px-4 py-12 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Learn Faster with <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">AI</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8">
              Teachly uses adaptive AI to personalize your learning experience, adjusting to your pace and style automatically.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/auth?signup=true')}
              >
                Get Started
              </Button>
              <Button 
                variant="outline"
                size="lg" 
                onClick={handleRunSystemTests}
                disabled={isRunningTests}
                className="flex items-center gap-2"
              >
                {isRunningTests ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Test System Health
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* System Test Results */}
          {showResults && testResults.length > 0 && (
            <div className="mb-16">
              <h2 className="text-2xl font-bold mb-6 text-center">System Health Report</h2>
              {testResults.map((suite, suiteIndex) => (
                <Card key={suiteIndex} className="bg-white/10 border-white/20 mb-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-white">{suite.name}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-white">
                          {suite.totalTests} total
                        </Badge>
                        <Badge className="bg-green-100 text-green-800">
                          {suite.passedTests} passed
                        </Badge>
                        {suite.failedTests > 0 && (
                          <Badge className="bg-red-100 text-red-800">
                            {suite.failedTests} failed
                          </Badge>
                        )}
                        {suite.skippedTests > 0 && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            {suite.skippedTests} skipped
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 max-h-64 overflow-y-auto">
                      {suite.results.map((result, resultIndex) => (
                        <div 
                          key={resultIndex}
                          className="flex items-start justify-between p-3 border border-white/10 rounded-lg"
                        >
                          <div className="flex items-start gap-3 flex-1">
                            {getStatusIcon(result.status)}
                            <div className="flex-1">
                              <h4 className="font-medium text-sm text-white">{result.name}</h4>
                              <p className="text-sm text-gray-400 mt-1">{result.message}</p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(result.status)}>
                            {result.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="text-blue-400 text-2xl mb-4">🧠</div>
              <h3 className="text-xl font-semibold mb-2">Adaptive Learning</h3>
              <p className="text-white/70">Our AI adjusts to your learning pace, slowing down when you need time and speeding up when you're flying.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="text-purple-400 text-2xl mb-4">🗣️</div>
              <h3 className="text-xl font-semibold mb-2">Voice Interactions</h3>
              <p className="text-white/70">Learn on the go with natural voice conversations. Ask questions and get answers just like talking to a tutor.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="text-green-400 text-2xl mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-2">Study Material Analysis</h3>
              <p className="text-white/70">Upload your notes and documents, and our AI will help you understand and quiz you on the content.</p>
            </div>
          </div>

          <div className="mt-24">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3">How does the gamified learning system work?</h3>
                <p className="text-white/70">
                  Our gamification system rewards learning progress with points, badges, and level-ups. Students earn achievements for completing lessons, maintaining study streaks, and reaching milestones. The system adapts to individual learning patterns to keep motivation high while tracking meaningful progress.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3">What can parents and teachers see in the monitoring dashboard?</h3>
                <p className="text-white/70">
                  Parents and teachers have access to comprehensive dashboards showing student progress, time spent studying, achievement unlocks, performance analytics, and learning outcome assessments. All data is presented with privacy controls and can be customized based on user preferences.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3">How does the AI adapt to my learning style?</h3>
                <p className="text-white/70">
                  Our AI analyzes your learning patterns, response times, and comprehension levels to automatically adjust the pace and style of lessons. It identifies when you need more practice on certain topics and when you're ready to move forward, creating a truly personalized learning experience.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3">Can I use voice interactions on mobile devices?</h3>
                <p className="text-white/70">
                  Yes! Our voice interaction feature works seamlessly across all devices. You can ask questions, get explanations, and practice conversations with the AI tutor using natural speech, making learning possible even when you're on the go.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3">What types of study materials can I upload?</h3>
                <p className="text-white/70">
                  You can upload various document types including PDFs, text files, images of handwritten notes, and presentations. Our AI will analyze the content and create interactive quizzes, summaries, and study guides based on your materials.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3">Is my learning data private and secure?</h3>
                <p className="text-white/70">
                  Absolutely. We use enterprise-grade security to protect all user data. Learning progress, uploaded materials, and personal information are encrypted and stored securely. You have full control over your privacy settings and data sharing preferences.
                </p>
              </div>
            </div>
          </div>
          
          <ContactForm />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
