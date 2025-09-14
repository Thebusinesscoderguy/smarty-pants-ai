
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { MessageSquare, Send, User, Bot, Settings, BarChart3, Upload, Mic, MicOff, Volume2, MessageSquarePlus, Trash2, VolumeX, Trophy } from 'lucide-react';
import { useVoiceSettings } from '@/hooks/useVoiceSettings';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

const Chat = () => {
  const { user } = useAuth();
  const { userRole } = useUserRole();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  // Use session role override if present (set by UserRoleSelector)
  const sessionRole = typeof window !== 'undefined'
    ? (localStorage.getItem('sessionRole') as 'student' | 'parent' | 'teacher' | null)
    : null;
  const effectiveRole = sessionRole ?? userRole;
  
  useEffect(() => {
    console.log('Chat role state', { userRole, sessionRole, effectiveRole });
  }, [userRole, sessionRole]);
  const [messages, setMessages] = useState<Array<{id: string, content: string, isUser: boolean, timestamp: Date, audioUrl?: string}>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  const [chatSessions, setChatSessions] = useState<Array<{id: string, title: string, created_at: string, message_count: number}>>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState<'chat' | 'monitoring' | 'settings'>('chat');
  const { selectedVoice } = useVoiceSettings();

  useEffect(() => {
    // Handle initial message from navigation state
    if (location.state?.message) {
      setInputMessage(location.state.message);
    }
    
    // Handle auto-titled chat with initial context
    if (location.state?.autoTitle && location.state?.initialContext) {
      const autoTitle = location.state.autoTitle;
      const initialContext = location.state.initialContext;
      
      // Create a new session with auto title and send initial message
      const newSessionId = `study-plan-${Date.now()}`;
      setActiveSessionId(newSessionId);
      setInputMessage(initialContext);
      
      // Add the session to the list with the auto title
      setChatSessions(prev => [{
        id: newSessionId,
        title: autoTitle,
        created_at: new Date().toISOString(),
        message_count: 0
      }, ...prev]);
      
      setShowWelcome(false);
    }
  }, [location.state]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchChatSessions = async () => {
      if (!user) {
        setChatSessions([]);
        return;
      }

      try {
        const { data: messagesData, error } = await supabase
          .from('messages')
          .select('conversation_id, content, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching chat sessions:', error);
          return;
        }

        if (!messagesData) {
          setChatSessions([]);
          return;
        }

        // Group messages by conversation_id
        const conversationMap = new Map();
        messagesData.forEach(message => {
          const convId = message.conversation_id || 'default';
          if (!conversationMap.has(convId)) {
            conversationMap.set(convId, {
              id: convId,
              messages: [],
              firstMessage: message,
              created_at: message.created_at
            });
          }
          conversationMap.get(convId).messages.push(message);
        });

        // Convert to sessions with AI-generated titles
        const sessions = Array.from(conversationMap.values()).map(conv => {
          const title = generateTitleFromContent(conv.firstMessage.content);
          return {
            id: conv.id,
            title,
            created_at: conv.created_at,
            message_count: conv.messages.length
          };
        });

        setChatSessions(sessions);
      } catch (error) {
        console.error('Error in fetchChatSessions:', error);
      }
    };

    fetchChatSessions();
  }, [user]);

  const generateTitleFromContent = (content: string): string => {
    if (!content) return t('chat.newChat');
    
    // Remove any file prefixes like [File: filename.ext]
    const cleanContent = content.replace(/\[File:.*?\]\s*/, '').trim();
    
    // Take first 50 characters and add ellipsis if longer
    const title = cleanContent.length > 50 ? cleanContent.substring(0, 50) + '...' : cleanContent;
    
    // If still empty, return default
    return title || t('chat.newChat');
  };

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
      {/* Study Tools for students */}
      {effectiveRole === 'student' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/quiz')}
          className="text-white hover:bg-white/10 transition-all duration-200 rounded-xl px-4 py-2"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          {t('studyTools.nav.studyTools')}
        </Button>
      )}

      {/* Chat for students */}
      {effectiveRole === 'student' && (
        <Button
          variant={currentPage === 'chat' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setCurrentPage('chat')}
          className={`${currentPage === 'chat' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'text-white hover:bg-white/10'} transition-all duration-200 rounded-xl px-4 py-2`}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          {t('chat.nav.chat')}
        </Button>
      )}

      {/* Quests & Achievements for students */}
      {effectiveRole === 'student' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/quests')}
          className="text-white hover:bg-white/10 transition-all duration-200 rounded-xl px-4 py-2"
        >
          <Trophy className="h-4 w-4 mr-2" />
          {t('quests.nav.questsAchievements')}
        </Button>
      )}
      
      {/* Show role selection prompt for parents or undefined roles */}
      {(effectiveRole === 'parent' || !effectiveRole) && (
        <div className="text-white/70 text-sm bg-white/10 px-4 py-2 rounded-xl">
          {t('chat.selectRolePrompt')}
        </div>
      )}
    </div>
  );

  const generateAIResponse = async (userMessage: string) => {
    try {
      console.log('Sending message to chat-completion:', userMessage);
      
      // Generate text response using chat completion
      const completionResponse = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [
            {
              role: "system",
              content: `You are Teachly AI, an expert educational tutor designed to help students learn effectively. Your core mission is to foster understanding, critical thinking, and academic growth.

**Your Teaching Philosophy:**
- Always encourage and build student confidence
- Break down complex topics into digestible steps
- Ask guiding questions to promote discovery learning
- Provide examples and real-world applications
- Adapt your teaching style to the student's learning pace

**Teaching Guidelines:**
1. **Clarity First**: Explain concepts clearly and simply, then build complexity
2. **Interactive Learning**: Ask questions to check understanding and engage students
3. **Mistake-Friendly**: Treat errors as learning opportunities, never criticize
4. **Practical Applications**: Show how concepts apply in real life
5. **Encourage Curiosity**: Welcome follow-up questions and deep exploration

**Response Structure:**
- Start with a brief, encouraging acknowledgment
- Provide clear, structured explanations
- Include relevant examples or analogies
- End with a question or suggestion for further exploration

**Subjects You Excel In:**
Mathematics, Science, Literature, History, Languages, Arts, Technology, and more

**Your Personality:**
- Patient and supportive
- Enthusiastic about learning
- Encouraging and positive
- Intellectually curious
- Adaptive to different learning styles

Remember: Every student learns differently. Adjust your explanations, pace, and examples based on their responses and questions. Your goal is not just to provide answers, but to inspire a love of learning.`
            },
            { role: "user", content: userMessage }
          ]
        }
      });

      console.log('Raw completion response:', completionResponse);

      if (completionResponse.error) {
        console.error('Edge function error:', completionResponse.error);
        throw new Error(completionResponse.error.message || 'Failed to generate AI response');
      }

      // The response is coming as streaming text format
      if (completionResponse.data && typeof completionResponse.data === 'string') {
        console.log('Processing streaming response:', completionResponse.data);
        
        let aiResponseText = '';
        const lines = completionResponse.data.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const dataStr = line.slice(6); // Remove 'data: ' prefix
              const data = JSON.parse(dataStr);
              if (data.content) {
                aiResponseText += data.content;
              }
            } catch (e) {
              console.log('Skipping invalid JSON line:', line);
            }
          }
        }
        
        console.log('Parsed AI response:', aiResponseText);
        return { text: aiResponseText };
      }
      
      throw new Error("Unexpected response format from edge function");
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
    setShowWelcome(false);

    // Save user message to database
    try {
      if (user) {
        const conversationId = activeSessionId || Date.now().toString();
        
        await supabase.from('messages').insert({
          user_id: user.id,
          content: userMessage.content,
          is_from_user: true,
          conversation_id: conversationId,
          type: 'text'
        });
        
        // Set active session if it's a new conversation
        if (!activeSessionId) {
          setActiveSessionId(conversationId);
        }
      }
    } catch (error) {
      console.error('Error saving user message:', error);
    }

    try {
      const response = await generateAIResponse(userMessage.content);
      
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        content: response.text,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
      
      // Save AI response to database
      try {
        if (user) {
          const conversationId = activeSessionId || Date.now().toString();
          
          await supabase.from('messages').insert({
            user_id: user.id,
            content: aiResponse.content,
            is_from_user: false,
            conversation_id: conversationId,
            type: 'text'
          });
        }
      } catch (error) {
        console.error('Error saving AI message:', error);
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('chat.errorAiResponse'),
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
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true
          }
        });
        
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });
        
        const audioChunks: BlobPart[] = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };
        
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          
          // Convert to base64
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            
            try {
              // Send to voice-to-text edge function
              const { data, error } = await supabase.functions.invoke('voice-to-text', {
                body: { audio: base64Audio }
              });
              
              if (error) {
                throw error;
              }
              
              if (data?.text) {
                // Add transcribed text to input
                setInputMessage(prev => prev + (prev ? ' ' : '') + data.text);
                toast({
                  title: t('chat.voiceTranscribed'),
                  description: t('chat.audioConverted')
                });
              }
            } catch (error) {
              console.error('Voice transcription error:', error);
              toast({
                title: t('chat.transcriptionFailed'),
                description: t('chat.voiceToTextError'),
                variant: "destructive"
              });
            }
          };
          
          reader.readAsDataURL(audioBlob);
          
          // Clean up
          stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setIsRecording(true);
        
        toast({
          title: t('chat.recordingStarted'),
          description: t('chat.speakNow')
        });
        
      } catch (error) {
        console.error('Microphone access error:', error);
        toast({
          title: t('chat.microphoneError'),
          description: t('chat.microphoneAccess'),
          variant: "destructive"
        });
      }
    }
  };

  const handleTextToSpeech = async (text: string) => {
    try {
      // Limit text length and clean it
      const cleanText = text.replace(/[^\w\s.,!?-]/g, '').trim();
      const textToSpeak = cleanText.length > 300 ? cleanText.substring(0, 300) + "..." : cleanText;
      
      if (!textToSpeak) {
        toast({
          title: "Speech Error",
          description: "No valid text to convert to speech.",
          variant: "destructive",
        });
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('text-to-voice', {
        body: {
          text: textToSpeak,
          voice: selectedVoice
        }
      });

      if (error) {
        console.error('Text-to-speech error:', error);
        
        let errorMessage = "Failed to convert text to speech.";
        if (error.message?.includes('API key')) {
          errorMessage = "Speech service not configured. Please contact support.";
        } else if (error.message?.includes('rate limit')) {
          errorMessage = "Too many requests. Please wait and try again.";
        } else if (error.message?.includes('timeout')) {
          errorMessage = "Speech service timeout. Please try again.";
        }
        
        toast({
          title: t('chat.speechError'),
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (data && data.audioContent) {
        try {
          const binaryString = atob(data.audioContent);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          const audio = new Audio(audioUrl);
          audio.volume = 0.8;
          audio.onended = () => URL.revokeObjectURL(audioUrl);
          
          await audio.play();
        } catch (audioError) {
          console.error('Audio processing error:', audioError);
          toast({
            title: t('chat.speechError'),
            description: "Failed to play the generated audio.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: t('chat.speechError'),
          description: "No audio content received from server.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Text-to-speech error:', error);
      toast({
        title: t('chat.speechError'),
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNewChat = () => {
    // Reset to welcome message for new chat
    setMessages([{
      id: 'welcome-message',
      content: t('chat.welcomeMessage'),
      isUser: false,
      timestamp: new Date()
    }]);
    setActiveSessionId(null);
    setInputMessage('');
    setSelectedFile(null);
    setShowWelcome(true);
  };

  const handleSelectSession = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    setShowWelcome(false);
    
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('id, content, is_from_user, created_at')
        .eq('user_id', user?.id)
        .eq('conversation_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading session messages:', error);
        toast({
          title: t('common.error'),
          description: t('chat.loadSessionError'),
          variant: "destructive"
        });
        return;
      }

      if (messagesData) {
        const formattedMessages = messagesData.map(msg => ({
          id: msg.id,
          content: msg.content,
          isUser: msg.is_from_user,
          timestamp: new Date(msg.created_at)
        }));
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error in handleSelectSession:', error);
      toast({
        title: t('common.error'),
        description: t('chat.loadSessionError'),
        variant: "destructive"
      });
    }
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
              {user ? `${t('chat.welcome')}, ${user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}` : t('chat.demoMode')}
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
                {t('chat.title')}
              </h1>
              <p className="text-slate-300 text-xl">
                {t('chat.subtitle')}
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
                    <h3 className="text-3xl font-bold text-white mb-2">{t('chat.readyToLearn')}</h3>
                    <p className="text-slate-300 text-xl">{t('chat.startConversation')}</p>
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
                          {!message.isUser && (
                            <Button
                              onClick={() => handleTextToSpeech(message.content)}
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto hover:bg-white/10"
                              title={t('chat.readAloud')}
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
                    placeholder={t('chat.placeholder')}
                    className="w-full px-6 py-4 pr-28 bg-white/10 border border-white/30 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 text-lg backdrop-blur-sm"
                  />
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                  />
                  
                   <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                     <Button
                       onClick={handleVoiceToggle}
                       variant="ghost"
                       size="sm"
                       className={`p-2 h-8 w-8 transition-all duration-200 rounded-lg ${
                         isRecording 
                           ? 'text-red-400 bg-red-400/20 hover:bg-red-400/30' 
                           : 'text-white/70 hover:text-white hover:bg-white/10'
                       }`}
                       title={isRecording ? t('chat.stopRecording') : t('chat.recordVoice')}
                     >
                       {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                     </Button>
                     
                     <Button
                       onClick={handleFileUpload}
                       variant="ghost"
                       size="sm"
                       className="p-2 h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                       title={t('chat.uploadFile')}
                     >
                       <Upload className="h-4 w-4" />
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
            {t('chat.newChat')}
          </Button>

          <Separator className="bg-white/20" />

          <div>
            <h3 className="text-sm font-medium text-white/70 mb-3 px-1">{t('chat.previousChats')}</h3>
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
                          {new Date(session.created_at).toLocaleDateString()} • {session.message_count} {t('chat.messages')}
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
