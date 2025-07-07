
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Clock, Play, Pause, RotateCcw, MessageSquare, BarChart3, Settings, Send, User, Bot, Upload, Mic, MicOff, Volume2, MessageSquarePlus, Trash2, VolumeX } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { RoleSelection } from '@/components/RoleSelection';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';

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

  // Chat state - same as Chat page
  const [messages, setMessages] = useState<Array<{id: string, content: string, isUser: boolean, timestamp: Date, audioUrl?: string}>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceResponse, setIsVoiceResponse] = useState(true);
  const [chatSessions, setChatSessions] = useState<Array<{id: string, title: string, created_at: string, message_count: number}>>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentPage, setCurrentPage] = useState<'chat' | 'monitoring' | 'settings'>('chat');

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

  useEffect(() => {
    // Initialize with demo chat sessions
    setChatSessions([
      { id: '1', title: 'Math Help Session', created_at: new Date().toISOString(), message_count: 5 },
      { id: '2', title: 'Science Questions', created_at: new Date().toISOString(), message_count: 3 },
      { id: '3', title: 'History Discussion', created_at: new Date().toISOString(), message_count: 8 },
    ]);
  }, []);

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
    setMessages([]);
    setInputMessage('');
    setSelectedFile(null);
    setShowWelcome(true);
  };

  const handleRoleSelect = (selectedRole: string) => {
    navigate(`/demo?role=${selectedRole}`);
    setShowRoleSelection(false);
  };

  // Chat functions - same as Chat page
  const formatMessageTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const renderNavigation = () => (
    <div className="flex items-center space-x-2 bg-white/5 rounded-2xl p-2 backdrop-blur-xl border border-white/10">
      <Button
        variant={currentPage === 'chat' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setCurrentPage('chat')}
        className={`${currentPage === 'chat' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'text-white hover:bg-white/10'} transition-all duration-200 rounded-xl px-4 py-2`}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Chat
      </Button>
      <Button
        variant={currentPage === 'monitoring' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setCurrentPage('monitoring')}
        className={`${currentPage === 'monitoring' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'text-white hover:bg-white/10'} transition-all duration-200 rounded-xl px-4 py-2`}
      >
        <BarChart3 className="h-4 w-4 mr-2" />
        Dashboard
      </Button>
      <Button
        variant={currentPage === 'settings' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setCurrentPage('settings')}
        className={`${currentPage === 'settings' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'text-white hover:bg-white/10'} transition-all duration-200 rounded-xl px-4 py-2`}
      >
        <Settings className="h-4 w-4 mr-2" />
        Settings
      </Button>
    </div>
  );

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !selectedFile) return;
    if (timeLeft <= 0) return;

    const userMessage = {
      id: Date.now().toString(),
      content: selectedFile ? `[File: ${selectedFile.name}] ${inputMessage}` : inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setSelectedFile(null);
    setIsLoading(true);
    setShowWelcome(false);

    // Demo AI response
    setTimeout(() => {
      const aiResponses = [
        "That's a great question! Let me help you understand this concept step by step...",
        "I can definitely help you with that! Here's what you need to know...",
        "Excellent topic to explore! Let me break this down for you...",
        "I love that you're curious about this! Here's my explanation...",
        "Perfect question for learning! Let me guide you through this...",
      ];
      
      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        content: randomResponse,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const handleNewChat = () => {
    setMessages([]);
    setActiveSessionId(null);
    setInputMessage('');
    setSelectedFile(null);
    setShowWelcome(true);
  };

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setMessages([
      { id: '1', content: 'Hello! How can I help you today?', isUser: false, timestamp: new Date() },
      { id: '2', content: 'I need help with mathematics', isUser: true, timestamp: new Date() },
    ]);
    setShowWelcome(false);
  };

  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      handleNewChat();
    }
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

  // Demo is running - use the same chat interface as Chat page
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col">
      {/* Demo Header with Timer */}
      <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-white/10 p-6 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="sm"
              className="border-white/20 bg-white/10 hover:bg-white/20 text-white rounded-xl px-6 py-3 text-lg"
            >
              <ArrowLeft className="mr-3 h-5 w-5" />
              Exit Demo
            </Button>
            <span className="text-lg text-slate-300 bg-white/10 px-6 py-3 rounded-xl">Demo Mode Active</span>
          </div>

          <div className="flex items-center space-x-6">
            {timeLeft > 0 ? (
              <>
                <div className="flex items-center space-x-3 px-6 py-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                  <Clock className="h-5 w-5" />
                  <span className={`font-mono text-lg ${timeLeft <= 120 ? 'text-yellow-400' : 'text-white'}`}>
                    {formatTime(timeLeft)} remaining
                  </span>
                </div>
                <Button
                  onClick={() => setIsPaused(!isPaused)}
                  variant="outline"
                  size="sm"
                  className="border-white/20 bg-white/10 hover:bg-white/20 text-white rounded-xl px-4 py-3"
                >
                  {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                </Button>
                <Button
                  onClick={resetDemo}
                  variant="outline"
                  size="sm"
                  className="border-white/20 bg-white/10 hover:bg-white/20 text-white rounded-xl px-4 py-3"
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <div className="text-red-400 font-semibold text-lg">Demo Time Expired</div>
            )}
          </div>
        </div>
      </div>

      {/* Modern Navigation Bar */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {renderNavigation()}
            </div>
            <div className="text-white/60 text-sm bg-white/10 px-4 py-2 rounded-xl">
              Demo Mode
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 flex max-w-7xl mx-auto w-full">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Welcome Section - Only show when no messages and showWelcome is true */}
          {showWelcome && messages.length === 0 && (
            <div className="p-8">
              <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent flex items-center">
                <MessageSquare className="mr-4 h-14 w-14 text-purple-400" />
                AI Learning Assistant
              </h1>
              <p className="text-slate-300 text-xl">
                Your personal AI tutor is ready to help you learn anything
              </p>
            </div>
          )}

          {/* Chat Container */}
          <div className="flex-1 flex flex-col bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl mx-8 mb-8">
            {/* Messages Area */}
            <div className="flex-1 p-8 overflow-y-auto space-y-6">
              {messages.length === 0 && showWelcome ? (
                <div className="text-center py-16">
                  <div className="p-8 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-3xl inline-block mb-8 border border-white/10">
                    <MessageSquare className="h-20 w-20 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-3xl font-bold text-white mb-2">Ready to Learn?</h3>
                    <p className="text-slate-300 text-xl">Start a conversation with your AI tutor</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-start space-x-3 max-w-4xl ${message.isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`p-3 rounded-2xl ${message.isUser ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-white/10'} border border-white/20`}>
                        {message.isUser ? <User className="h-5 w-5 text-white" /> : <MessageSquare className="h-5 w-5 text-purple-400" />}
                      </div>
                      <div className={`p-6 rounded-3xl ${message.isUser ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'bg-white/10 text-white'} shadow-xl border border-white/20 group`}>
                        <p className="text-lg leading-relaxed">{message.content}</p>
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-sm opacity-70">
                            {formatMessageTime(message.timestamp)}
                          </p>
                          {!message.isUser && message.audioUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto hover:bg-white/10"
                            >
                              <Volume2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3 max-w-4xl">
                    <div className="p-3 rounded-2xl bg-white/10 border border-white/20">
                      <MessageSquare className="h-5 w-5 text-purple-400" />
                    </div>
                    <div className="p-6 rounded-3xl bg-white/10 text-white shadow-xl border border-white/20">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-white/20">
              {selectedFile && (
                <div className="mb-4 p-4 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-between backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                    <Upload className="h-5 w-5 text-blue-400" />
                    <span className="text-white font-medium">{selectedFile.name}</span>
                  </div>
                  <Button
                    onClick={() => setSelectedFile(null)}
                    variant="ghost"
                    size="sm"
                    className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
                  >
                    ×
                  </Button>
                </div>
              )}
              
              <div className="flex space-x-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask me anything about learning..."
                    className="w-full px-6 py-4 pr-40 bg-white/10 border border-white/30 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 text-lg backdrop-blur-sm"
                    disabled={timeLeft <= 0}
                  />
                  
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 h-10 w-10 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                      title="Upload file"
                      disabled={timeLeft <= 0}
                    >
                      <Upload className="h-5 w-5" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`p-2 h-10 w-10 rounded-xl transition-all duration-200 ${
                        isRecording 
                          ? 'text-red-400 hover:text-red-300 bg-red-500/20 hover:bg-red-500/30' 
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                      title={isRecording ? 'Stop recording' : 'Start recording'}
                      disabled={timeLeft <= 0}
                    >
                      {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`p-2 h-10 w-10 rounded-xl transition-all duration-200 ${
                        isVoiceResponse 
                          ? 'text-purple-400 hover:text-purple-300 bg-purple-500/20 hover:bg-purple-500/30' 
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                      disabled={timeLeft <= 0}
                      title={isVoiceResponse ? 'Voice responses enabled' : 'Voice responses disabled'}
                    >
                      {isVoiceResponse ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={(!inputMessage.trim() && !selectedFile) || isLoading || timeLeft <= 0}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-8 py-4 rounded-2xl font-semibold shadow-xl disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar for Previous Chats */}
        <div className="w-80 bg-white/5 border-l border-white/10 p-4 space-y-4">
          <Button
            onClick={handleNewChat}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white h-11 text-sm font-medium rounded-xl"
            disabled={timeLeft <= 0}
          >
            <MessageSquarePlus className="h-4 w-4 mr-2" />
            New Chat
          </Button>

          <Separator className="bg-white/20" />

          <div>
            <h3 className="text-sm font-medium text-white/70 mb-3 px-1">Previous Chats</h3>
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-2">
                {chatSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => timeLeft > 0 && handleSelectSession(session.id)}
                    className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                      activeSessionId === session.id
                        ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30'
                        : 'bg-white/5 hover:bg-white/10 border border-white/10'
                    } ${timeLeft <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <MessageSquare className="h-3 w-3 text-purple-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white truncate font-medium">{session.title}</p>
                        <p className="text-xs text-white/60">
                          {new Date(session.created_at).toLocaleDateString()} • {session.message_count} messages
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => deleteSession(session.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto hover:bg-white/10 flex-shrink-0"
                      disabled={timeLeft <= 0}
                    >
                      <Trash2 className="h-3 w-3 text-red-400" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </main>

      {/* Time Warning Modal */}
      {(showTimeWarning || timeLeft <= 0) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
