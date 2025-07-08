
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Send, User, Bot, Settings, BarChart3, Upload, Mic, MicOff, Volume2, MessageSquarePlus, Trash2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

const Chat = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Array<{id: string, content: string, isUser: boolean, timestamp: Date, audioUrl?: string}>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceResponse, setIsVoiceResponse] = useState(true);
  const [chatSessions, setChatSessions] = useState<Array<{id: string, title: string, created_at: string, message_count: number}>>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState<'chat' | 'monitoring' | 'settings'>('chat');

  useEffect(() => {
    // Handle initial message from navigation state
    if (location.state?.message) {
      setInputMessage(location.state.message);
    }
  }, [location.state]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize with demo chat sessions
    setChatSessions([
      { id: '1', title: 'Math Help Session', created_at: new Date().toISOString(), message_count: 5 },
      { id: '2', title: 'Science Questions', created_at: new Date().toISOString(), message_count: 3 },
      { id: '3', title: 'History Discussion', created_at: new Date().toISOString(), message_count: 8 },
    ]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (date: Date) => {
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
        onClick={() => {
          setCurrentPage('monitoring');
          navigate('/monitoring');
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
          setCurrentPage('settings');
          navigate('/settings');
        }}
        className={`${currentPage === 'settings' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'text-white hover:bg-white/10'} transition-all duration-200 rounded-xl px-4 py-2`}
      >
        <Settings className="h-4 w-4 mr-2" />
        Settings
      </Button>
    </div>
  );

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

      const aiResponseText = completionResponse.data.content;
      
      // Generate voice response if enabled
      let audioUrl = undefined;
      if (isVoiceResponse) {
        const voiceResponse = await supabase.functions.invoke('text-to-voice', {
          body: { 
            text: aiResponseText,
            voice: 'alloy'
          }
        });

        if (!voiceResponse.error && voiceResponse.data?.audioContent) {
          const base64Audio = voiceResponse.data.audioContent;
          const byteCharacters = atob(base64Audio);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const audioBlob = new Blob([byteArray], { type: 'audio/mp3' });
          audioUrl = URL.createObjectURL(audioBlob);
        }
      }

      return { text: aiResponseText, audioUrl };
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !selectedFile) return;

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
    setShowWelcome(false); // Hide welcome message after first message

    try {
      const response = await generateAIResponse(userMessage.content);
      
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        content: response.text,
        isUser: false,
        timestamp: new Date(),
        audioUrl: response.audioUrl
      };

      setMessages(prev => [...prev, aiResponse]);
      
      // Auto-play voice response if available
      if (response.audioUrl && isVoiceResponse) {
        setTimeout(() => {
          const audio = new Audio(response.audioUrl);
          audio.play().catch(console.error);
        }, 500);
      }
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

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      setIsRecording(false);
      // Stop recording logic would go here
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsRecording(true);
        // Start recording logic would go here
        // For now, just simulate recording for 3 seconds
        setTimeout(() => {
          setIsRecording(false);
          stream.getTracks().forEach(track => track.stop());
        }, 3000);
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not access microphone",
          variant: "destructive"
        });
      }
    }
  };

  const handlePlayAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play().catch(console.error);
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
    // Load messages for selected session (demo data)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col">
      <Header />
      
      {/* Modern Navigation Bar */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {renderNavigation()}
            </div>
            <div className="text-white/60 text-sm bg-white/10 px-4 py-2 rounded-xl">
              {user ? `Welcome, ${user.email?.split('@')[0]}` : 'Demo Mode'}
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
                            {formatTime(message.timestamp)}
                          </p>
                          {!message.isUser && message.audioUrl && (
                            <Button
                              onClick={() => handlePlayAudio(message.audioUrl!)}
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
              <div ref={messagesEndRef} />
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
                  />
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                  />
                  
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-2">
                    <Button
                      onClick={handleFileUpload}
                      variant="ghost"
                      size="sm"
                      className="p-2 h-10 w-10 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                      title="Upload file"
                    >
                      <Upload className="h-5 w-5" />
                    </Button>
                    
                    <Button
                      onClick={handleVoiceToggle}
                      variant="ghost"
                      size="sm"
                      className={`p-2 h-10 w-10 rounded-xl transition-all duration-200 ${
                        isRecording 
                          ? 'text-red-400 hover:text-red-300 bg-red-500/20 hover:bg-red-500/30' 
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                      title={isRecording ? 'Stop recording' : 'Start recording'}
                    >
                      {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>
                    
                    <Button
                      onClick={() => setIsVoiceResponse(!isVoiceResponse)}
                      variant="ghost"
                      size="sm"
                      className={`p-2 h-10 w-10 rounded-xl transition-all duration-200 ${
                        isVoiceResponse 
                          ? 'text-purple-400 hover:text-purple-300 bg-purple-500/20 hover:bg-purple-500/30' 
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                      title={isVoiceResponse ? 'Voice responses enabled' : 'Voice responses disabled'}
                    >
                      {isVoiceResponse ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={(!inputMessage.trim() && !selectedFile) || isLoading}
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

          <Separator className="bg-white/20" />

          <div>
            <h3 className="text-sm font-medium text-white/70 mb-3 px-1">Previous Chats</h3>
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-2">
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
                          {new Date(session.created_at).toLocaleDateString()} • {session.message_count} messages
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
            </ScrollArea>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Chat;
