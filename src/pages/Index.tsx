
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Play, CheckCircle, XCircle, Clock, Loader2, PlayCircle, Pause, Volume2 } from 'lucide-react';
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
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const videoDemoRef = useRef<HTMLDivElement>(null);

  const videoSlides = [
    {
      title: "Sign Up & Get Started",
      description: "Create your account and set up your learning profile",
      image: "/images/auth-signup.png",
      audioText: "Start your learning journey by creating your account and setting up your personalized learning preferences."
    },
    {
      title: "Student Dashboard",
      description: "Track your progress and manage your subjects",
      image: "/images/student-dashboard.png",
      audioText: "Your student dashboard provides a comprehensive view of your learning progress, current subjects, and daily achievements."
    },
    {
      title: "AI Tutor Chat",
      description: "Get instant help from your AI tutor",
      image: "/images/ai-chat-interface.png",
      audioText: "Chat with your AI tutor anytime to get explanations, ask questions, and receive personalized learning guidance."
    },
    {
      title: "Quests & Achievements",
      description: "Complete challenges and unlock rewards",
      image: "/images/quests-achievements.png",
      audioText: "Stay motivated with our gamified learning system featuring daily quests, achievements, and progress rewards."
    },
    {
      title: "School Administration",
      description: "Monitor student progress and manage your school",
      image: "/images/school-admin-dashboard.png",
      audioText: "Educators can monitor student progress, assign subjects, and track learning outcomes across their institution."
    }
  ];

  // Auto-start video when scrolled into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVideoPlaying) {
            startVideoDemo();
          }
        });
      },
      {
        threshold: 0.6,
      }
    );

    if (videoDemoRef.current) {
      observer.observe(videoDemoRef.current);
    }

    return () => {
      if (videoDemoRef.current) {
        observer.unobserve(videoDemoRef.current);
      }
    };
  }, [isVideoPlaying]);

  const generateAudio = async (text: string) => {
    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice: 'alloy'
        })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        return new Audio(audioUrl);
      }
    } catch (error) {
      console.log('Audio generation not available, continuing without audio');
    }
    return null;
  };

  const startVideoDemo = async () => {
    setIsVideoPlaying(true);
    setCurrentSlide(0);
    
    // Generate and play audio for first slide
    const audio = await generateAudio(videoSlides[0].audioText);
    if (audio) {
      setCurrentAudio(audio);
      audio.play();
    }
    
    // Auto-advance slides every 4 seconds
    const interval = setInterval(async () => {
      setCurrentSlide(prev => {
        const nextSlide = prev + 1;
        if (nextSlide >= videoSlides.length) {
          setIsVideoPlaying(false);
          if (currentAudio) {
            currentAudio.pause();
            setCurrentAudio(null);
          }
          clearInterval(interval);
          return 0;
        }
        
        // Generate audio for next slide
        generateAudio(videoSlides[nextSlide].audioText).then(audio => {
          if (currentAudio) {
            currentAudio.pause();
          }
          if (audio) {
            setCurrentAudio(audio);
            audio.play();
          }
        });
        
        return nextSlide;
      });
    }, 4000);
  };

  const pauseVideoDemo = () => {
    setIsVideoPlaying(false);
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }
  };

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
              TeachlyAI uses adaptive AI to personalize your learning experience, adjusting to your pace and style automatically.
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

          {/* Video Demo Section */}
          <div className="mb-16" ref={videoDemoRef}>
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">See TeachlyAI in Action</h2>
              <p className="text-lg text-white/80 mb-6">
                Explore our platform features - from student dashboards to AI tutoring and gamified learning.
              </p>
            </div>

            <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl max-w-4xl mx-auto">
              {/* Video Player Interface */}
              <div className="relative aspect-video bg-gray-900">
                <img
                  src={videoSlides[currentSlide].image}
                  alt={videoSlides[currentSlide].title}
                  className="w-full h-full object-cover"
                />
                
                {/* Video overlay with content */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {videoSlides[currentSlide].title}
                    </h3>
                    <p className="text-gray-200 text-lg">
                      {videoSlides[currentSlide].description}
                    </p>
                  </div>
                </div>

                {/* Video Controls */}
                {isVideoPlaying && (
                  <div className="absolute top-4 right-4">
                    <Button
                      onClick={pauseVideoDemo}
                      className="bg-black/50 hover:bg-black/70 text-white border-0 rounded-full"
                      size="icon"
                    >
                      <Pause className="h-5 w-5" />
                    </Button>
                  </div>
                )}

                {/* Progress indicator */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white/30 rounded-full h-1">
                      <div 
                        className="bg-white rounded-full h-full transition-all duration-300"
                        style={{ width: `${((currentSlide + 1) / videoSlides.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-white text-sm font-mono">
                      {currentSlide + 1}/{videoSlides.length}
                    </span>
                  </div>
                </div>
              </div>
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
