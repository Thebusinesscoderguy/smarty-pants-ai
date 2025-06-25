
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Clock, Play, Pause, RotateCcw } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { RoleSelection } from '@/components/RoleSelection';
import { EnhancedChatArea } from '@/components/chat/EnhancedChatArea';

const Demo = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = searchParams.get('role');
  const [showRoleSelection, setShowRoleSelection] = useState(!role);
  const [demoStarted, setDemoStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const [isPaused, setIsPaused] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (demoStarted && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          const newTime = time - 1;
          // Show warning at 2 minutes remaining
          if (newTime === 120) {
            setShowTimeWarning(true);
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [demoStarted, isPaused, timeLeft]);

  // Auto-redirect when time runs out
  useEffect(() => {
    if (timeLeft <= 0 && demoStarted) {
      // Show signup/pricing options
      setShowTimeWarning(true);
    }
  }, [timeLeft, demoStarted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startDemo = () => {
    setDemoStarted(true);
    setTimeLeft(15 * 60);
  };

  const resetDemo = () => {
    setDemoStarted(false);
    setTimeLeft(15 * 60);
    setIsPaused(false);
    setShowTimeWarning(false);
  };

  const handleRoleSelect = (selectedRole: string) => {
    navigate(`/demo?role=${selectedRole}`);
    setShowRoleSelection(false);
  };

  if (!role) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white">
        <Header />
        <main className="flex items-center justify-center min-h-[80vh] px-4">
          <div className="text-center max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Experience <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">TeachlyAI</span> Demo
            </h1>
            <p className="text-xl text-white/70 mb-8">
              Choose your perspective to get a personalized demo experience. You'll have 15 minutes to explore our full platform.
            </p>
            <Button onClick={() => setShowRoleSelection(true)} size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              Choose Your Role
            </Button>
          </div>
        </main>
        <Footer />
        <RoleSelection 
          isOpen={showRoleSelection} 
          onClose={() => setShowRoleSelection(false)} 
          mode="demo"
          onRoleSelect={handleRoleSelect}
        />
      </div>
    );
  }

  if (!demoStarted) {
    const roleTitle = role === 'school' ? 'School Administrator' : role === 'parent' ? 'Parent Dashboard' : 'Student Learning';
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white">
        <Header />
        
        <main className="px-4 py-12 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </div>

            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                {roleTitle} <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Demo</span>
              </h1>
              <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto mb-8">
                You're about to experience TeachlyAI exactly as a real user would. You'll have full access to our platform for 15 minutes - enough time to explore all features including AI chat, voice interactions, file uploads, progress monitoring, and more.
              </p>
              
              <div className="bg-white/5 rounded-xl p-6 mb-8 border border-white/10 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-4">What you can do in this demo:</h3>
                <div className="grid md:grid-cols-2 gap-4 text-left">
                  <div className="space-y-2">
                    <p className="flex items-center"><span className="text-green-400 mr-2">✓</span> Chat with AI tutors</p>
                    <p className="flex items-center"><span className="text-green-400 mr-2">✓</span> Use voice interactions</p>
                    <p className="flex items-center"><span className="text-green-400 mr-2">✓</span> Upload and analyze files</p>
                    <p className="flex items-center"><span className="text-green-400 mr-2">✓</span> Create custom tests</p>
                  </div>
                  <div className="space-y-2">
                    <p className="flex items-center"><span className="text-green-400 mr-2">✓</span> Explore learning modules</p>
                    <p className="flex items-center"><span className="text-green-400 mr-2">✓</span> Track progress analytics</p>
                    <p className="flex items-center"><span className="text-green-400 mr-2">✓</span> Access all subjects</p>
                    <p className="flex items-center"><span className="text-green-400 mr-2">✓</span> Try gamification features</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={startDemo}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 font-semibold px-8 py-4 text-lg"
              >
                <Play className="mr-2 h-5 w-5" />
                Start 15-Minute Demo
              </Button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Demo is running - show the actual chat interface
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Demo Header with Timer */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-white/10 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="sm"
              className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Exit Demo
            </Button>
            <span className="text-sm text-white/70">Demo Mode Active</span>
          </div>

          <div className="flex items-center space-x-4">
            {timeLeft > 0 ? (
              <>
                <div className="flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-lg backdrop-blur-sm">
                  <Clock className="h-4 w-4" />
                  <span className={`font-mono text-sm ${timeLeft <= 120 ? 'text-yellow-400' : 'text-white'}`}>
                    {formatTime(timeLeft)} remaining
                  </span>
                </div>
                <Button
                  onClick={() => setIsPaused(!isPaused)}
                  variant="outline"
                  size="sm"
                  className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
                <Button
                  onClick={resetDemo}
                  variant="outline"
                  size="sm"
                  className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <div className="text-red-400 font-semibold">Demo Time Expired</div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <main className="flex-1">
        <div className="h-full">
          <EnhancedChatArea isDemoMode={true} demoTimeLeft={timeLeft} />
        </div>
      </main>

      {/* Time Warning Modal */}
      {(showTimeWarning || timeLeft <= 0) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-gray-800 border-white/10 max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-white text-center">
                {timeLeft <= 0 ? "Demo Time Complete!" : "Demo Ending Soon!"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-white/80">
                {timeLeft <= 0 
                  ? "Your 15-minute demo has ended. Ready to continue with full access?"
                  : `Only ${formatTime(timeLeft)} left in your demo. Continue with full access to keep learning!`
                }
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => navigate('/auth?signup=true')}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  Get Full Access
                </Button>
                {timeLeft > 0 && (
                  <Button
                    onClick={() => setShowTimeWarning(false)}
                    variant="outline"
                    className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
                  >
                    Continue Demo
                  </Button>
                )}
                <Button
                  onClick={resetDemo}
                  variant="ghost"
                  className="text-white/60 hover:text-white"
                >
                  Restart Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Demo;
