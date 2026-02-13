
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { MessageSquare, Send, User, Bot, Settings, BarChart3, Upload, Mic, MicOff, Volume2, MessageSquarePlus, Trash2, VolumeX, Trophy, Copy, BookOpen } from 'lucide-react';
import { useVoiceSettings } from '@/hooks/useVoiceSettings';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { QuestProgressNotification } from '@/components/quests/QuestProgressNotification';
import { useGamification } from '@/hooks/useGamification';

const Chat = () => {
  const { user } = useAuth();
  const { userRole } = useUserRole();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
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
  const { questProgressNotification, clearQuestNotification } = useGamification();

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

        // Group messages by conversation_id and filter out empty conversations
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

        // Convert to sessions with AI-generated titles, only include conversations with messages
        const sessions = Array.from(conversationMap.values())
          .filter(conv => conv.messages.length > 0) // Filter out conversations with no messages
          .map(conv => {
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
    <div className="flex items-center gap-2 bg-muted/50 rounded-2xl p-2 backdrop-blur-xl border border-border w-fit">
      {/* Study Plan */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/quiz-generator')}
        className="text-foreground hover:bg-muted rounded-xl px-4 py-2"
      >
        <BookOpen className="h-4 w-4 mr-2" />
        Study Plan
      </Button>

      {/* Chat */}
      <Button
        variant="default"
        size="sm"
        onClick={() => navigate('/chat')}
        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-4 py-2"
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Chat
      </Button>

      {/* Quests */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/quests')}
        className="text-foreground hover:bg-muted rounded-xl px-4 py-2"
      >
        <Trophy className="h-4 w-4 mr-2" />
        Quests
      </Button>
    </div>
  );

  const generateAIResponse = async (userMessage: string) => {
    try {
      console.log('Sending message to chat-completion:', userMessage);
      
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = 'https://twfzlbockonxopuindaw.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3ZnpsYm9ja29ueG9wdWluZGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1OTIxMzMsImV4cCI6MjA1OTE2ODEzM30.8i4PeOsf-vWuKOeukSIAJHCMYMUaraO579wvuaFzpn0';
      
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
          ],
          language: localStorage.getItem('selectedLanguage') || 'en'
        })
      });

      if (!response.ok) {
        let errorMsg = 'Failed to generate AI response';
        try {
          const errorData = await response.json();
          errorMsg = errorData?.error || errorData?.message || errorMsg;
        } catch { /* ignore */ }
        throw new Error(errorMsg);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Parse streaming SSE response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let aiResponseText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || parsed.content;
              if (content) aiResponseText += content;
            } catch { /* skip */ }
          }
        }
      }
      
      if (!aiResponseText) {
        throw new Error('No response generated');
      }

      console.log('Parsed AI response:', aiResponseText);
      return { text: aiResponseText };
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
    } catch (error: any) {
      console.error('Chat error:', error);
      toast({
        title: t('common.error'),
        description: error?.message || t('chat.errorAiResponse'),
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

  const handleCopyMessage = async (text: string) => {
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

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    try {
      // Delete messages from database
      await supabase
        .from('messages')
        .delete()
        .eq('user_id', user.id)
        .eq('conversation_id', sessionId);

      // Update local state
      setChatSessions(prev => prev.filter(s => s.id !== sessionId));
      
      if (activeSessionId === sessionId) {
        handleNewChat();
      }
      
      toast({
        title: "Chat Deleted",
        description: "The chat session has been deleted successfully."
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: t('common.error'),
        description: "Failed to delete chat session. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      
      {/* Modern Navigation Bar */}
      <div className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {renderNavigation()}
            </div>
            <div className="text-muted-foreground text-sm bg-muted px-4 py-2 rounded-xl">
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
              <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent flex items-center">
                <MessageSquare className="mr-4 h-14 w-14 text-primary" />
                {t('chat.title')}
              </h1>
              <p className="text-muted-foreground text-xl">
                {t('chat.subtitle')}
              </p>
            </div>
          )}

          {/* Chat Container */}
          <div className="flex-1 flex flex-col bg-card rounded-3xl border border-border shadow-lg mx-8 mb-8">
            {/* Messages Area */}
            <div className="flex-1 p-8 overflow-y-auto space-y-6">
              {messages.length === 0 && showWelcome ? (
                <div className="text-center py-16">
                  <div className="p-8 bg-gradient-to-r from-primary/10 to-accent/10 rounded-3xl inline-block mb-8 border border-border">
                    <MessageSquare className="h-20 w-20 text-primary mx-auto mb-4" />
                    <h3 className="text-3xl font-bold text-foreground mb-2">{t('chat.readyToLearn')}</h3>
                    <p className="text-muted-foreground text-xl">{t('chat.startConversation')}</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-start space-x-3 max-w-4xl ${message.isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`p-3 rounded-2xl ${message.isUser ? 'bg-primary' : 'bg-muted'} border border-border`}>
                        {message.isUser ? <User className="h-5 w-5 text-primary-foreground" /> : <MessageSquare className="h-5 w-5 text-primary" />}
                      </div>
                      <div className={`p-6 rounded-3xl ${message.isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'} shadow-md border border-border group`}>
                        <p className="text-lg leading-relaxed">{message.content}</p>
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-sm opacity-70">
                            {formatTime(message.timestamp)}
                          </p>
                          {!message.isUser && (
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                onClick={() => handleCopyMessage(message.content)}
                                variant="ghost"
                                size="sm"
                                className="p-1 h-auto hover:bg-muted"
                                title="Copy to clipboard"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => handleTextToSpeech(message.content)}
                                variant="ghost"
                                size="sm"
                                className="p-1 h-auto hover:bg-muted"
                                title={t('chat.readAloud')}
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
                    <div className="p-6 rounded-3xl bg-muted text-foreground shadow-md border border-border">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-border">
              {selectedFile && (
                <div className="mb-4 p-4 bg-muted rounded-2xl border border-border flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Upload className="h-5 w-5 text-primary" />
                    <span className="text-foreground font-medium">{selectedFile.name}</span>
                  </div>
                  <Button
                    onClick={() => setSelectedFile(null)}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl"
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
                    className="w-full px-6 py-4 pr-28 bg-background border border-border rounded-2xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 text-lg"
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
                           ? 'text-destructive bg-destructive/20 hover:bg-destructive/30' 
                           : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                       }`}
                       title={isRecording ? t('chat.stopRecording') : t('chat.recordVoice')}
                     >
                       {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                     </Button>
                     
                     <Button
                       onClick={handleFileUpload}
                       variant="ghost"
                       size="sm"
                       className="p-2 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200"
                       title={t('chat.uploadFile')}
                     >
                       <Upload className="h-4 w-4" />
                     </Button>
                   </div>
                </div>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={(!inputMessage.trim() && !selectedFile) || isLoading}
                  className="bg-primary hover:bg-primary/90 px-8 py-4 rounded-2xl font-semibold shadow-button disabled:opacity-50"
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
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 text-sm font-medium rounded-xl"
          >
            <MessageSquarePlus className="h-4 w-4 mr-2" />
            {t('chat.newChat')}
          </Button>

          <Separator className="bg-border" />

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">{t('chat.previousChats')}</h3>
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-2">
                {chatSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleSelectSession(session.id)}
                    className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                      activeSessionId === session.id
                        ? 'bg-primary/10 border border-primary/30'
                        : 'bg-muted hover:bg-muted/80 border border-border'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <MessageSquare className="h-3 w-3 text-primary flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground truncate font-medium">{session.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.created_at).toLocaleDateString()} • {session.message_count} {t('chat.messages')}
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
            </ScrollArea>
          </div>
        </div>
      </main>

      <Footer />
      
      {/* Quest Progress Notification */}
      <QuestProgressNotification
        progressUpdate={questProgressNotification}
        onComplete={clearQuestNotification}
      />
    </div>
  );
};

export default Chat;
