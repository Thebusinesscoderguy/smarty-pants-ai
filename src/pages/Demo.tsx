
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Clock, Play, MessageSquare, User, Send, BarChart3, Settings, MessageSquarePlus, Trash2, Volume2, Upload, Mic, Bot, VolumeX, Copy } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { RoleSelection } from '@/components/RoleSelection';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedStudentDashboard } from '@/components/monitoring/EnhancedStudentDashboard';
import { useVoiceSettings } from '@/hooks/useVoiceSettings';
import { useMonitoringData } from '@/hooks/useMonitoringData';
import { useTestManagement } from '@/hooks/useTestManagement';
import { useCurriculumManagement } from '@/hooks/useCurriculumManagement';
import { useQuestManagement } from '@/hooks/useQuestManagement';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';

const Demo = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const role = searchParams.get('role');
  const [showRoleSelection, setShowRoleSelection] = useState(!role);
  const [demoStarted, setDemoStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const { toast } = useToast();
  const { selectedVoice, changeVoice } = useVoiceSettings();

  // Chat functionality state
  const [messages, setMessages] = useState<Array<{id: string, content: string, isUser: boolean, timestamp: Date, audioUrl?: string}>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState<'chat' | 'monitoring' | 'settings'>('chat');
  const [showWelcome, setShowWelcome] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Chat sessions state
  const [chatSessions, setChatSessions] = useState<Array<{id: string, title: string, created_at: string, message_count: number}>>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Monitoring hooks with demo data
  const { studentProgress, overviewStats } = useMonitoringData();
  const { tests, createTest, generateAITest, deleteTest } = useTestManagement();
  const { curricula, createCurriculum, deleteCurriculum } = useCurriculumManagement();
  const { quests, createQuest, deleteQuest } = useQuestManagement();

  const VOICE_OPTIONS = [
    { value: 'alloy', label: 'Alloy (Default)', description: 'Balanced and clear' },
    { value: 'echo', label: 'Echo', description: 'Deep and resonant' },
    { value: 'fable', label: 'Fable', description: 'Warm and storytelling' },
    { value: 'onyx', label: 'Onyx', description: 'Strong and confident' },
    { value: 'nova', label: 'Nova', description: 'Bright and energetic' },
    { value: 'shimmer', label: 'Shimmer', description: 'Gentle and soothing' },
  ];

  // Check if demo was already used
  useEffect(() => {
    const demoUsed = localStorage.getItem('demo_used');
    if (demoUsed) {
      // Allow re-entry without forcing auth; just warn
      toast({
        title: t('demo.timeWarning'),
        description: t('demo.timeWarningDesc'),
      });
    }
  }, [navigate, toast]);

  // Initialize demo chat sessions
  useEffect(() => {
    setChatSessions([
      { id: '1', title: 'Math Help Session', created_at: new Date().toISOString(), message_count: 5 },
      { id: '2', title: 'Science Questions', created_at: new Date().toISOString(), message_count: 3 },
      { id: '3', title: 'History Discussion', created_at: new Date().toISOString(), message_count: 8 },
    ]);
  }, []);

  // Handle initial message from navigation state
  useEffect(() => {
    if (location.state?.message) {
      setInputMessage(location.state.message);
    }
  }, [location.state]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (demoStarted && timeLeft > 0) {
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
  }, [demoStarted, timeLeft]);

  useEffect(() => {
    if (timeLeft <= 0 && demoStarted) {
      setShowTimeWarning(true);
      localStorage.setItem('demo_used', 'true');
    }
  }, [timeLeft, demoStarted]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startDemo = () => {
    setDemoStarted(true);
    setTimeLeft(15 * 60);
  };

  const handleRoleSelect = (selectedRole: string) => {
    navigate(`/demo?role=${selectedRole}`);
    setShowRoleSelection(false);
    setDemoStarted(true);
  };

  const generateAIResponse = async (userMessage: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/chat-completion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || supabaseKey}`,
          'apikey': supabaseKey,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "You are a helpful AI tutor. Provide clear, educational responses to help students learn."
            },
            { role: "user", content: userMessage }
          ]
        })
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to generate AI response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || parsed.content;
            if (content) fullText += content;
          } catch { /* skip */ }
        }
      }

      return { text: fullText || "Hello! I'm your AI tutor. How can I help you learn today?" };
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw error;
    }
  };

  // Instant voice functionality for demo
  const handleCopyMessage = async (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Message text has been copied successfully.",
      });
    } catch (error) {
      console.error('Copy error:', error);
      toast({
        title: "Copy Failed",
        description: "Failed to copy message to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleTextToSpeech = async (text: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('text-to-voice', {
        body: {
          text: text.length > 150 ? text.substring(0, 150) + "..." : text,
          voice: selectedVoice
        }
      });

      if (error) return;

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
        await audio.play().catch(() => {});
      }
    } catch (error) {
      // Silently fail for demo
    }
  };

  const testVoice = async (voice: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('text-to-voice', {
        body: {
          text: `Hello! I'm your AI assistant speaking with the ${VOICE_OPTIONS.find(v => v.value === voice)?.label} voice.`,
          voice: voice
        }
      });

      if (error) return;

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
        await audio.play().catch(() => {});
      }
    } catch (error) {
      // Silently fail for demo
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
    setShowWelcome(false);

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

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
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
        Monitoring
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

  const formatMessageTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  if (!role) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="flex items-center justify-center min-h-[80vh] px-6">
          <div className="text-center max-w-4xl">
            <div className="mb-12">
              <h1 className="text-7xl font-bold mb-8 text-foreground">
                {t('demo.title')}
              </h1>
              <p className="text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                {t('demo.subtitle')}
              </p>
            </div>
            
            <div className="bg-card backdrop-blur-xl rounded-3xl p-12 border border-border shadow-2xl">
              <Button 
                onClick={() => setShowRoleSelection(true)} 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-6 rounded-2xl text-xl font-semibold shadow-xl"
              >
                {t('demo.chooseRole')}
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
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        
        <main className="px-6 py-12 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="border-border bg-card hover:bg-muted rounded-xl px-8 py-4 text-lg"
            >
              <ArrowLeft className="mr-3 h-5 w-5" />
              Back to Home
            </Button>
          </div>

          <div className="text-center">
            <div className="mb-12">
              <h1 className="text-6xl font-bold mb-8 text-foreground">
                {roleTitle} Demo
              </h1>
              <p className="text-2xl text-muted-foreground max-w-5xl mx-auto leading-relaxed">
                You're about to experience TeachlyAI exactly as a real user would. You'll have full access to our platform for 15 minutes - enough time to explore all features including AI chat, voice interactions, file uploads, progress monitoring, and more.
              </p>
            </div>
            
            <div className="bg-card backdrop-blur-xl rounded-3xl p-12 mb-12 border border-border shadow-2xl">
              <h3 className="text-3xl font-semibold mb-8">What you can do in this demo:</h3>
              <div className="grid md:grid-cols-2 gap-8 text-left">
                <div className="space-y-4">
                  <p className="flex items-center text-foreground text-lg"><span className="text-green-600 mr-4 text-xl">✓</span> Chat with AI tutors</p>
                  <p className="flex items-center text-foreground text-lg"><span className="text-green-600 mr-4 text-xl">✓</span> Use voice interactions</p>
                  <p className="flex items-center text-foreground text-lg"><span className="text-green-600 mr-4 text-xl">✓</span> Upload and analyze files</p>
                  <p className="flex items-center text-foreground text-lg"><span className="text-green-600 mr-4 text-xl">✓</span> Create custom tests</p>
                </div>
                <div className="space-y-4">
                  <p className="flex items-center text-foreground text-lg"><span className="text-green-600 mr-4 text-xl">✓</span> Explore learning curriculums</p>
                  <p className="flex items-center text-foreground text-lg"><span className="text-green-600 mr-4 text-xl">✓</span> Track progress analytics</p>
                  <p className="flex items-center text-foreground text-lg"><span className="text-green-600 mr-4 text-xl">✓</span> Access all subjects</p>
                  <p className="flex items-center text-foreground text-lg"><span className="text-green-600 mr-4 text-xl">✓</span> Try gamification features</p>
                </div>
              </div>
            </div>

            <Button
              onClick={startDemo}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-16 py-6 rounded-2xl text-2xl font-semibold shadow-xl"
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

  // Demo is running - show full app interface
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Demo Timer Overlay */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-primary border-b border-border p-3 backdrop-blur-xl shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="sm"
              className="border-border bg-muted hover:bg-muted/80 rounded-xl px-3 py-1 text-sm font-medium"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Exit Demo
            </Button>
            <span className="text-sm bg-muted px-3 py-1 rounded-xl font-medium">Demo Mode</span>
          </div>

           <div className="flex items-center space-x-3">
             {timeLeft > 0 ? (
               <>
                 <div className="flex items-center space-x-2 px-3 py-1 bg-muted rounded-xl backdrop-blur-sm border border-border">
                   <Clock className="h-4 w-4" />
                   <span className={`font-mono text-sm font-semibold ${timeLeft <= 120 ? 'text-yellow-600' : ''}`}>
                     {formatTime(timeLeft)} remaining
                   </span>
                 </div>
               </>
             ) : (
               <div className="text-destructive font-semibold text-sm bg-destructive/20 px-3 py-1 rounded-xl">Demo Time Expired</div>
             )}
           </div>
        </div>
      </div>
      
      {/* Copy Chat page structure exactly with padding for timer */}
      <div className="pt-20">
        <Header />
        
        {/* Modern Navigation Bar */}
        <div className="border-b border-border bg-card backdrop-blur-xl sticky top-20 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2 bg-muted rounded-2xl p-2 backdrop-blur-xl border border-border">
                  <Button
                    variant={currentPage === 'chat' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentPage('chat')}
                    className="transition-all duration-200 rounded-xl px-4 py-2"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat
                  </Button>
                  <Button
                    variant={currentPage === 'monitoring' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentPage('monitoring')}
                    className="transition-all duration-200 rounded-xl px-4 py-2"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Monitoring
                  </Button>
                  <Button
                    variant={currentPage === 'settings' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentPage('settings')}
                    className="transition-all duration-200 rounded-xl px-4 py-2"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </div>
              
              <div className="text-muted-foreground text-sm bg-muted px-4 py-2 rounded-xl">
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
                <div className="flex-1 flex flex-col bg-card backdrop-blur-xl rounded-3xl border border-border shadow-2xl mx-8 mb-8">
                   {/* Messages Area */}
                  <div className="flex-1 p-8 overflow-y-auto space-y-6">
                    {messages.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="p-8 bg-primary/10 rounded-3xl inline-block mb-8 border border-border">
                          <MessageSquare className="h-20 w-20 text-primary mx-auto mb-4" />
                          <h3 className="text-3xl font-bold mb-2">Try Our AI Chat</h3>
                          <p className="text-muted-foreground text-xl mb-4">Type a message below to see our AI in action</p>
                          
                        </div>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                          <div className={`flex items-start space-x-3 max-w-4xl ${message.isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            <div className={`p-3 rounded-2xl ${message.isUser ? 'bg-primary' : 'bg-muted'} border border-border`}>
                              {message.isUser ? <User className="h-5 w-5 text-primary-foreground" /> : <MessageSquare className="h-5 w-5 text-primary" />}
                            </div>
                             <div 
                               className={`p-6 rounded-3xl ${message.isUser ? 'bg-primary text-primary-foreground' : 'bg-card'} shadow-xl border border-border group transition-all duration-200`}
                             >
                               <p className="text-lg leading-relaxed">{message.content}</p>
                               <div className="flex items-center justify-between mt-3">
                                 <p className="text-sm opacity-70">
                                   {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </p>
                                 {!message.isUser && (
                                   <div className="flex items-center gap-2">
                                     <Button
                                       variant="ghost"
                                       size="sm"
                                       onClick={(e) => handleCopyMessage(message.content, e)}
                                       className="h-7 w-7 p-0 hover:bg-muted transition-all duration-200"
                                       title="Copy to clipboard"
                                     >
                                       <Copy className="h-4 w-4" />
                                     </Button>
                                     <Button
                                       variant="ghost"
                                       size="sm"
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         handleTextToSpeech(message.content);
                                       }}
                                       className="h-7 w-7 p-0 hover:bg-muted transition-all duration-200"
                                       title="Read aloud"
                                     >
                                       <Volume2 className="h-4 w-4" />
                                     </Button>
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
                          <div className="p-3 rounded-2xl bg-muted border border-border">
                            <MessageSquare className="h-5 w-5 text-primary" />
                          </div>
                          <div className="p-6 rounded-3xl bg-card shadow-xl border border-border">
                            <div className="flex space-x-2">
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100"></div>
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className="p-6 border-t border-border">
                    <div className="flex space-x-4">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder={timeLeft <= 0 ? "Demo time expired - Sign up to continue!" : "Ask me anything about learning..."}
                          className="w-full px-6 py-4 pr-20 bg-background border border-input rounded-2xl placeholder-muted-foreground focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring text-lg backdrop-blur-sm cursor-pointer"
                        />
                      </div>
                      
                      <Button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isLoading}
                        className="px-8 py-4 rounded-2xl font-semibold shadow-xl disabled:opacity-50"
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar for Previous Chats */}
              <div className="w-80 bg-card border-l border-border p-4 space-y-4">
                <Button
                  onClick={handleNewChat}
                  className="w-full h-11 text-sm font-medium rounded-xl"
                >
                  <MessageSquarePlus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>

                <div className="border-t border-border pt-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">Demo Conversations</h3>
                  <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
                    {chatSessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => handleSelectSession(session.id)}
                        className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                          activeSessionId === session.id
                            ? 'bg-primary/20 border border-primary/30'
                            : 'bg-muted hover:bg-muted/80 border border-border'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <MessageSquare className="h-3 w-3 text-primary flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm truncate font-medium">{session.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(session.created_at).toLocaleDateString()} • {session.message_count} messages
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => deleteSession(session.id, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto hover:bg-muted flex-shrink-0"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
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
                  <h1 className="text-4xl font-bold mb-2">
                    Progress Monitoring
                  </h1>
                  <p className="text-muted-foreground text-lg">Track learning progress and performance analytics</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-card border-border backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                        Study Sessions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold mb-2">24</div>
                      <p className="text-muted-foreground">This week</p>
                      <div className="mt-4 text-sm text-green-600">+18% from last week</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <MessageSquare className="h-5 w-5 mr-2 text-primary" />
                        Questions Asked
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold mb-2">156</div>
                      <p className="text-muted-foreground">Total questions</p>
                      <div className="mt-4 text-sm text-green-600">+12% this month</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Settings className="h-5 w-5 mr-2 text-green-600" />
                        Accuracy Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold mb-2">87%</div>
                      <p className="text-muted-foreground">Average accuracy</p>
                      <div className="mt-4 text-sm text-green-600">+5% improvement</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Subject Progress */}
                <Card className="bg-card border-border backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle>Subject Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Mathematics</span>
                        <span>85%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{width: '85%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Science</span>
                        <span>72%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{width: '72%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>English</span>
                        <span>91%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{width: '91%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>History</span>
                        <span>68%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{width: '68%'}}></div>
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
                  <h1 className="text-4xl font-bold mb-2">
                    Demo Settings
                  </h1>
                  <p className="text-muted-foreground text-lg">These are demo settings - full version has complete customization</p>
                </div>

                <Card className="bg-card border-border backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle>Learning Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <label className="font-medium">Difficulty Level</label>
                      <div className="text-muted-foreground">Currently set to: Intermediate</div>
                    </div>
                    <div className="space-y-2">
                      <label className="font-medium">Preferred Subjects</label>
                      <div className="text-muted-foreground">Math, Science, English, History</div>
                    </div>
                    <div className="space-y-2">
                      <label className="font-medium">Voice Assistant</label>
                      <div className="text-muted-foreground">Enabled with Natural Voice</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle>Voice Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="font-medium">Test Voice</label>
                      <p className="text-muted-foreground text-sm mb-3">Click to test different AI voices</p>
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={() => testVoice('alloy')}
                          variant="outline"
                        >
                          Test Alloy
                        </Button>
                        <Button
                          onClick={() => testVoice('echo')}
                          variant="outline"
                        >
                          Test Echo
                        </Button>
                        <Button
                          onClick={() => testVoice('fable')}
                          variant="outline"
                        >
                          Test Fable
                        </Button>
                        <Button
                          onClick={() => testVoice('nova')}
                          variant="outline"
                        >
                          Test Nova
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-primary/20 rounded-xl border border-primary/30">
                      <p className="text-sm">
                        💡 Voice works instantly in demo mode! Click any AI message or test button above.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="bg-primary/10 rounded-2xl p-6 border border-border">
                  <h3 className="text-xl font-semibold mb-3">🚀 Unlock Full Features</h3>
                  <p className="text-muted-foreground mb-4">
                    This is just a preview! Sign up to access full settings, personalization, parental controls, progress tracking, and much more.
                  </p>
                  <Button 
                    onClick={() => navigate('/auth?signup=true')}
                    className="px-6 py-2 rounded-xl"
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
          <Card className="bg-card border-border max-w-lg w-full shadow-2xl rounded-3xl">
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                {timeLeft <= 0 ? "Demo Time Complete!" : "Demo Ending Soon!"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-muted-foreground text-lg">
                {timeLeft <= 0 
                  ? "Your 15-minute demo has ended. Ready to continue with full access?"
                  : `Only ${formatTime(timeLeft)} left in your demo. Continue with full access to keep learning!`
                }
              </p>
              <div className="flex flex-col gap-4">
                <Button
                  onClick={() => navigate('/auth?signup=true')}
                  className="py-3 rounded-xl text-lg"
                >
                  Get Full Access
                </Button>
                {timeLeft > 0 && (
                  <Button
                    onClick={() => setShowTimeWarning(false)}
                    variant="outline"
                    className="py-3 rounded-xl"
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
