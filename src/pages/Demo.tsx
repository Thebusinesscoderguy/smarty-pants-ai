
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Clock, Play, Pause, RotateCcw, MessageSquare, Send, MessageSquarePlus } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { RoleSelection } from '@/components/RoleSelection';
import { useToast } from '@/components/ui/use-toast';
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
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (demoStarted && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          const newTime = time - 1;
          if (newTime === 120) {
            setShowTimeWarning(true);
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [demoStarted, isPaused, timeLeft]);

  useEffect(() => {
    if (timeLeft <= 0 && demoStarted) {
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
    setDemoStarted(true); // Automatically start demo after role selection
  };

  if (!role) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <Header />
        <main className="flex items-center justify-center min-h-[80vh] px-6">
          <div className="text-center max-w-4xl">
            <div className="mb-12">
              <h1 className="text-7xl font-bold mb-8 bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                Experience TeachlyAI Demo
              </h1>
              <p className="text-2xl text-slate-300 leading-relaxed max-w-3xl mx-auto">
                Choose your perspective to get a personalized demo experience. You'll have 15 minutes to explore our full platform.
              </p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10 shadow-2xl">
              <Button 
                onClick={() => setShowRoleSelection(true)} 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-12 py-6 rounded-2xl text-xl font-semibold shadow-xl"
              >
                Choose Your Role
              </Button>
            </div>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <Header />
        
        <main className="px-6 py-12 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="border-white/20 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm rounded-xl px-8 py-4 text-lg"
            >
              <ArrowLeft className="mr-3 h-5 w-5" />
              Back to Home
            </Button>
          </div>

          <div className="text-center">
            <div className="mb-12">
              <h1 className="text-6xl font-bold mb-8 bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                {roleTitle} Demo
              </h1>
              <p className="text-2xl text-slate-300 max-w-5xl mx-auto leading-relaxed">
                You're about to experience TeachlyAI exactly as a real user would. You'll have full access to our platform for 15 minutes - enough time to explore all features including AI chat, voice interactions, file uploads, progress monitoring, and more.
              </p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-12 mb-12 border border-white/10 shadow-2xl">
              <h3 className="text-3xl font-semibold mb-8 text-white">What you can do in this demo:</h3>
              <div className="grid md:grid-cols-2 gap-8 text-left">
                <div className="space-y-4">
                  <p className="flex items-center text-slate-200 text-lg"><span className="text-green-400 mr-4 text-xl">✓</span> Chat with AI tutors</p>
                  <p className="flex items-center text-slate-200 text-lg"><span className="text-green-400 mr-4 text-xl">✓</span> Use voice interactions</p>
                  <p className="flex items-center text-slate-200 text-lg"><span className="text-green-400 mr-4 text-xl">✓</span> Upload and analyze files</p>
                  <p className="flex items-center text-slate-200 text-lg"><span className="text-green-400 mr-4 text-xl">✓</span> Create custom tests</p>
                </div>
                <div className="space-y-4">
                  <p className="flex items-center text-slate-200 text-lg"><span className="text-green-400 mr-4 text-xl">✓</span> Explore learning curriculums</p>
                  <p className="flex items-center text-slate-200 text-lg"><span className="text-green-400 mr-4 text-xl">✓</span> Track progress analytics</p>
                  <p className="flex items-center text-slate-200 text-lg"><span className="text-green-400 mr-4 text-xl">✓</span> Access all subjects</p>
                  <p className="flex items-center text-slate-200 text-lg"><span className="text-green-400 mr-4 text-xl">✓</span> Try gamification features</p>
                </div>
              </div>
            </div>

            <Button
              onClick={startDemo}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-16 py-6 rounded-2xl text-2xl font-semibold shadow-xl"
            >
              <Play className="mr-4 h-7 w-7" />
              Start 15-Minute Demo
            </Button>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Demo is running - show the enhanced chat interface with overlay timer
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col relative">
      {/* Demo Timer Overlay - Fixed position */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600/90 to-blue-600/90 border-b border-white/20 p-3 backdrop-blur-xl shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="sm"
              className="border-white/30 bg-white/20 hover:bg-white/30 text-white rounded-xl px-3 py-1 text-sm font-medium"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Exit Demo
            </Button>
            <span className="text-sm text-white/90 bg-white/20 px-3 py-1 rounded-xl font-medium">Demo Mode</span>
          </div>

          <div className="flex items-center space-x-3">
            {timeLeft > 0 ? (
              <>
                <div className="flex items-center space-x-2 px-3 py-1 bg-white/20 rounded-xl backdrop-blur-sm border border-white/30">
                  <Clock className="h-4 w-4 text-white" />
                  <span className={`font-mono text-sm font-semibold ${timeLeft <= 120 ? 'text-yellow-300' : 'text-white'}`}>
                    {formatTime(timeLeft)} remaining
                  </span>
                </div>
                <Button
                  onClick={() => setIsPaused(!isPaused)}
                  variant="outline"
                  size="sm"
                  className="border-white/30 bg-white/20 hover:bg-white/30 text-white rounded-xl px-2 py-1"
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
                <Button
                  onClick={resetDemo}
                  variant="outline"
                  size="sm"
                  className="border-white/30 bg-white/20 hover:bg-white/30 text-white rounded-xl px-2 py-1"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <div className="text-red-300 font-semibold text-sm bg-red-500/20 px-3 py-1 rounded-xl">Demo Time Expired</div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Area - unified with post-progress interface */}
      <div className="flex-1 pt-14">
        <div className="min-h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col">
          <main className="flex-1 flex max-w-7xl mx-auto w-full">
            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {/* Chat Container */}
              <div className="flex-1 flex flex-col bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl mx-8 mb-8 mt-8">
                {/* Messages Area */}
                <div className="flex-1 p-8 overflow-y-auto space-y-6">
                  <div className="text-center py-16">
                    <div className="p-8 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-3xl inline-block mb-8 border border-white/10">
                      <MessageSquare className="h-20 w-20 text-purple-400 mx-auto mb-4" />
                      <h3 className="text-3xl font-bold text-white mb-2">Ready to Learn?</h3>
                      <p className="text-slate-300 text-xl">Start a conversation with your AI tutor</p>
                    </div>
                  </div>
                </div>

                {/* Input Area */}
                <div className="p-6 border-t border-white/20">
                  <div className="flex space-x-4">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Ask me anything about learning..."
                        className="w-full px-6 py-4 pr-40 bg-white/10 border border-white/30 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 text-lg backdrop-blur-sm"
                      />
                    </div>
                    <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-8 py-4 rounded-2xl font-semibold shadow-xl">
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar for Previous Chats */}
            <div className="w-80 bg-white/5 border-l border-white/10 p-4 space-y-4">
              <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white h-11 text-sm font-medium rounded-xl">
                <MessageSquarePlus className="h-4 w-4 mr-2 inline" />
                New Chat
              </button>
              <div className="bg-white/20 h-px"></div>
              <div>
                <h3 className="text-sm font-medium text-white/70 mb-3 px-1">Previous Chats</h3>
                <div className="space-y-2">
                  <div className="group flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <MessageSquare className="h-3 w-3 text-purple-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white truncate font-medium">Math Help Session</p>
                        <p className="text-xs text-white/60">Today • 5 messages</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Time Warning Modal */}
      {(showTimeWarning || timeLeft <= 0) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-white/20 max-w-lg w-full shadow-2xl rounded-3xl">
            <CardHeader>
              <CardTitle className="text-white text-center text-2xl">
                {timeLeft <= 0 ? "Demo Time Complete!" : "Demo Ending Soon!"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-slate-300 text-lg">
                {timeLeft <= 0 
                  ? "Your 15-minute demo has ended. Ready to continue with full access?"
                  : `Only ${formatTime(timeLeft)} left in your demo. Continue with full access to keep learning!`
                }
              </p>
              <div className="flex flex-col gap-4">
                <Button
                  onClick={() => navigate('/auth?signup=true')}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-xl text-lg"
                >
                  Get Full Access
                </Button>
                {timeLeft > 0 && (
                  <Button
                    onClick={() => setShowTimeWarning(false)}
                    variant="outline"
                    className="border-white/20 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl"
                  >
                    Continue Demo
                  </Button>
                )}
                <Button
                  onClick={resetDemo}
                  variant="ghost"
                  className="text-slate-400 hover:text-white py-3"
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
