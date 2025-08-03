
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Clock, Play, MessageSquare, User, Send, BarChart3, Settings, MessageSquarePlus, Trash2, Volume2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { RoleSelection } from '@/components/RoleSelection';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useVoiceSettings } from '@/hooks/useVoiceSettings';
import VoiceSettings from '@/components/voice/VoiceSettings';

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

  // Chat functionality state
  const [messages, setMessages] = useState<Array<{id: string, content: string, isUser: boolean, timestamp: Date}>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState<'chat' | 'monitoring' | 'settings'>('chat');
  
  // Chat sessions state
  const [chatSessions, setChatSessions] = useState<Array<{id: string, title: string, created_at: string, messages: Array<{id: string, content: string, isUser: boolean, timestamp: Date}>}>>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  // Voice functionality
  const { isVoiceEnabled, selectedVoice, toggleVoice, changeVoice } = useVoiceSettings();

  // Check if demo was already used
  useEffect(() => {
    const demoUsed = localStorage.getItem('demo_used');
    if (demoUsed) {
      navigate('/auth');
      toast({
        title: "Demo Already Used",
        description: "You've already tried our demo. Please sign up for full access!",
        variant: "destructive"
      });
    }
  }, [navigate, toast]);

  // Initialize demo chat sessions
  useEffect(() => {
    setChatSessions([
      {
        id: '1',
        title: 'Math Algebra Help',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        messages: [
          { id: '1', content: 'Hello! How can I help you with math today?', isUser: false, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
          { id: '2', content: 'I need help solving quadratic equations', isUser: true, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30000) },
          { id: '3', content: 'Great! Quadratic equations are in the form ax² + bx + c = 0. We can solve them using the quadratic formula: x = (-b ± √(b²-4ac)) / 2a. Would you like me to walk through an example?', isUser: false, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 60000) },
          { id: '4', content: 'Yes please! Can you solve x² - 5x + 6 = 0?', isUser: true, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 90000) },
          { id: '5', content: 'Absolutely! For x² - 5x + 6 = 0, we have a=1, b=-5, c=6. Using the quadratic formula: x = (5 ± √(25-24))/2 = (5 ± 1)/2. So x = 3 or x = 2.', isUser: false, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 120000) }
        ]
      },
      {
        id: '2',
        title: 'Science - Photosynthesis',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        messages: [
          { id: '6', content: 'Hi! What would you like to learn about science today?', isUser: false, timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
          { id: '7', content: 'Can you explain photosynthesis to me?', isUser: true, timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 30000) },
          { id: '8', content: 'Of course! Photosynthesis is the process plants use to make food from sunlight. The equation is: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂. Plants absorb carbon dioxide and water, then use chlorophyll to convert light into glucose and oxygen.', isUser: false, timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 60000) }
        ]
      },
      {
        id: '3',
        title: 'History - Ancient Rome',
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        messages: [
          { id: '9', content: 'Welcome! What historical topic interests you?', isUser: false, timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) },
          { id: '10', content: 'Tell me about the Roman Empire', isUser: true, timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000 + 30000) },
          { id: '11', content: 'The Roman Empire was one of history\'s largest and most influential civilizations! It began as a republic in 509 BCE and became an empire in 27 BCE under Augustus. At its peak, it controlled much of Europe, North Africa, and the Middle East. Would you like to know about a specific aspect?', isUser: false, timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000 + 60000) },
          { id: '12', content: 'What were some of their greatest achievements?', isUser: true, timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000 + 90000) },
          { id: '13', content: 'Rome had many incredible achievements! They built amazing architecture like the Colosseum and Pantheon, created an extensive road network ("All roads lead to Rome"), developed advanced engineering with aqueducts, established a legal system that influences us today, and spread Latin which became the basis for Romance languages.', isUser: false, timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000 + 120000) }
        ]
      }
    ]);
  }, []);

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
      // Mark demo as used when time expires
      localStorage.setItem('demo_used', 'true');
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

  const generateAIResponse = async (userMessage: string) => {
    try {
      // Generate text response using chat completion
      const completionResponse = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [
            {
              role: "system",
              content: "You are a helpful AI tutor. Provide clear, educational responses to help students learn."
            },
            { role: "user", content: userMessage }
          ]
        }
      });

      if (completionResponse.error) {
        throw new Error(completionResponse.error.message || 'Failed to generate AI response');
      }

      // Check if it's a test/mock response (non-streaming)
      if (completionResponse.data?.content) {
        const aiResponseText = completionResponse.data.content;
        return { text: aiResponseText };
      }

      // For streaming response, fall back to a simple response
      return { text: "Hello! I'm your AI tutor. How can I help you learn today?" };
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw error;
    }
  };

  const handleTextToSpeech = async (text: string) => {
    if (!isVoiceEnabled) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('text-to-voice', {
        body: {
          text: text,
          voice: selectedVoice
        }
      });

      if (error) {
        console.error('Speech Error:', error);
        return;
      }

      if (data && data.audioContent) {
        const binaryString = atob(data.audioContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const audio = new Audio(audioUrl);
        audio.onended = () => URL.revokeObjectURL(audioUrl);
        await audio.play();
      }
    } catch (error) {
      console.error('Speech Error:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || timeLeft <= 0) return;
    
    const userMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      const response = await generateAIResponse(userMessage.content);
      
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        content: response.text,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setActiveSessionId(null);
    setInputMessage('');
  };

  const handleSelectSession = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setActiveSessionId(sessionId);
      setMessages([...session.messages]);
    }
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

  // Demo is running - copy the exact Chat page design but with timer
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col">
      {/* Demo Timer Overlay - Fixed position at top */}
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
               </>
             ) : (
               <div className="text-red-300 font-semibold text-sm bg-red-500/20 px-3 py-1 rounded-xl">Demo Time Expired</div>
             )}
           </div>
        </div>
      </div>
      
      {/* Copy Chat page structure exactly with padding for timer */}
      <div className="pt-20">
        <Header />
        
        {/* Modern Navigation Bar */}
        <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-20 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
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
                    onClick={() => {
                      navigate('/auth');
                      toast({
                        title: "Sign Up for Full Monitoring",
                        description: "Access detailed analytics and progress tracking with a free account!",
                      });
                    }}
                    className={`${currentPage === 'monitoring' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'text-white hover:bg-white/10'} transition-all duration-200 rounded-xl px-4 py-2`}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Monitoring
                  </Button>
                  <Button
                    variant={currentPage === 'settings' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      navigate('/auth');
                      toast({
                        title: "Sign Up for Full Settings",
                        description: "Customize your learning experience with a free account!",
                      });
                    }}
                    className={`${currentPage === 'settings' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'text-white hover:bg-white/10'} transition-all duration-200 rounded-xl px-4 py-2`}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </div>
              
              {/* Voice Settings Bar */}
              <div className="bg-white/5 border-t border-white/10 p-4">
                <VoiceSettings
                  selectedVoice={selectedVoice}
                  setSelectedVoice={changeVoice}
                  isQuizMode={false}
                  setIsQuizMode={() => {}}
                  totalTokensUsed={0}
                  monthlyLimit={1000}
                  inputTokens={0}
                  outputTokens={0}
                  isTokenLimitReached={false}
                  isVoiceEnabled={isVoiceEnabled}
                  onToggleVoice={toggleVoice}
                />
              </div>
              
              <div className="text-white/60 text-sm bg-white/10 px-4 py-2 rounded-xl">
                Demo Mode
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 flex max-w-7xl mx-auto w-full">
          {currentPage === 'chat' && (
            <>
              {/* Chat Area */}
              <div className="flex-1 flex flex-col">
                {/* Chat Container */}
                <div className="flex-1 flex flex-col bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl mx-8 mb-8">
                   {/* Messages Area */}
                  <div className="flex-1 p-8 overflow-y-auto space-y-6">
                    {messages.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="p-8 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-3xl inline-block mb-8 border border-white/10">
                          <MessageSquare className="h-20 w-20 text-purple-400 mx-auto mb-4" />
                          <h3 className="text-3xl font-bold text-white mb-2">Try Our AI Chat</h3>
                          <p className="text-slate-300 text-xl mb-4">Type a message below to see our AI in action</p>
                          <p className="text-yellow-300 text-sm">Demo mode - Sign up to continue chatting!</p>
                        </div>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                          <div className={`flex items-start space-x-3 max-w-4xl ${message.isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            <div className={`p-3 rounded-2xl ${message.isUser ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-white/10'} border border-white/20`}>
                              {message.isUser ? <User className="h-5 w-5 text-white" /> : <MessageSquare className="h-5 w-5 text-purple-400" />}
                            </div>
                            <div 
                              className={`p-6 rounded-3xl ${message.isUser ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'bg-white/10 text-white hover:bg-white/15 cursor-pointer'} shadow-xl border border-white/20 group transition-all duration-200`}
                              onClick={() => !message.isUser && handleTextToSpeech(message.content)}
                              title={!message.isUser ? 'Click to hear this message' : undefined}
                            >
                              <p className="text-lg leading-relaxed">{message.content}</p>
                              <div className="flex items-center justify-between mt-3">
                                <p className="text-sm opacity-70">
                                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                {!message.isUser && isVoiceEnabled && (
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-purple-300">
                                    🔊 Click to speak
                                  </div>
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
                    <div className="flex space-x-4">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder={timeLeft <= 0 ? "Demo time expired - Sign up to continue!" : "Ask me anything about learning..."}
                          className="w-full px-6 py-4 pr-20 bg-white/10 border border-white/30 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 text-lg backdrop-blur-sm cursor-pointer"
                        />
                      </div>
                      
                      <Button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isLoading}
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
                >
                  <MessageSquarePlus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>

                <div className="border-t border-white/20 pt-4">
                  <h3 className="text-sm font-medium text-white/70 mb-3 px-1">Demo Conversations</h3>
                  <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
                    {chatSessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => handleSelectSession(session.id)}
                        className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                          activeSessionId === session.id
                            ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30'
                            : 'bg-white/5 hover:bg-white/10 border border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <MessageSquare className="h-3 w-3 text-purple-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-white truncate font-medium">{session.title}</p>
                            <p className="text-xs text-white/60">
                              {new Date(session.created_at).toLocaleDateString()} • {session.messages.length} messages
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => deleteSession(session.id, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto hover:bg-white/10 flex-shrink-0"
                        >
                          <Trash2 className="h-3 w-3 text-red-400" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {currentPage === 'monitoring' && (
            // Monitoring Dashboard with Demo Data
            <div className="flex-1 p-8">
              <div className="space-y-8">
                <div>
                  <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                    Progress Monitoring
                  </h1>
                  <p className="text-slate-300 text-lg">Track learning progress and performance analytics</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-white/5 border-white/20 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2 text-purple-400" />
                        Study Sessions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-white mb-2">24</div>
                      <p className="text-slate-300">This week</p>
                      <div className="mt-4 text-sm text-green-400">+18% from last week</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/20 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <MessageSquare className="h-5 w-5 mr-2 text-blue-400" />
                        Questions Asked
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-white mb-2">156</div>
                      <p className="text-slate-300">Total questions</p>
                      <div className="mt-4 text-sm text-green-400">+12% this month</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/20 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Settings className="h-5 w-5 mr-2 text-green-400" />
                        Accuracy Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-white mb-2">87%</div>
                      <p className="text-slate-300">Average accuracy</p>
                      <div className="mt-4 text-sm text-green-400">+5% improvement</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Subject Progress */}
                <Card className="bg-white/5 border-white/20 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-white">Subject Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-white mb-2">
                        <span>Mathematics</span>
                        <span>85%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full" style={{width: '85%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-white mb-2">
                        <span>Science</span>
                        <span>72%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full" style={{width: '72%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-white mb-2">
                        <span>English</span>
                        <span>91%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full" style={{width: '91%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-white mb-2">
                        <span>History</span>
                        <span>68%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full" style={{width: '68%'}}></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {currentPage === 'settings' && (
            // Settings Page
            <div className="flex-1 p-8">
              <div className="space-y-8">
                <div>
                  <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                    Demo Settings
                  </h1>
                  <p className="text-slate-300 text-lg">These are demo settings - full version has complete customization</p>
                </div>

                <Card className="bg-white/5 border-white/20 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-white">Learning Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-white font-medium">Difficulty Level</label>
                      <div className="text-slate-300">Currently set to: Intermediate</div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-white font-medium">Preferred Subjects</label>
                      <div className="text-slate-300">Math, Science, English, History</div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-white font-medium">Voice Assistant</label>
                      <div className="text-slate-300">Enabled with Natural Voice</div>
                    </div>
                  </CardContent>
                </Card>

                <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-xl font-semibold text-white mb-3">🚀 Unlock Full Features</h3>
                  <p className="text-slate-300 mb-4">
                    This is just a preview! Sign up to access full settings, personalization, parental controls, progress tracking, and much more.
                  </p>
                  <Button 
                    onClick={() => navigate('/auth?signup=true')}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2 rounded-xl"
                  >
                    Get Full Access
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
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
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Demo;
