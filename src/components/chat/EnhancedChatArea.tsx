
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, User, Upload, Mic, MicOff, Volume2, RotateCcw, ThumbsUp, ThumbsDown, Copy, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActivityTracking } from '@/hooks/useActivityTracking';
import { useRealTimeAnalytics } from '@/hooks/useRealTimeAnalytics';
import { ChatSidebar } from './ChatSidebar';
import { Message } from '@/types/message';

interface DatabaseMessage {
  id: string;
  content: string;
  is_from_user: boolean;
  created_at: string;
  audioUrl?: string;
  fileName?: string;
  fileUrl?: string;
}

interface Curriculum {
  id: string;
  title: string;
  content: any;
  subjects: {
    name: string;
  };
}

export const EnhancedChatArea = () => {
  const [messages, setMessages] = useState<DatabaseMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeCurriculum, setActiveCurriculum] = useState<Curriculum | null>(null);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isVoiceResponse, setIsVoiceResponse] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { logActivity } = useActivityTracking();
  const { trackInteraction, isAnalyzing } = useRealTimeAnalytics();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('EnhancedChatArea: Initializing with user:', user ? 'authenticated' : 'demo mode');
    
    if (user) {
      fetchCurricula();
      startNewChat();
    } else {
      console.log('EnhancedChatArea: Setting up demo welcome message');
      setMessages([{
        id: 'welcome',
        content: "Welcome to the AI Learning Assistant! I'm here to help you with your studies. Ask me anything about any subject, and I'll provide personalized guidance.",
        is_from_user: false,
        created_at: new Date().toISOString()
      }]);
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchCurricula = async () => {
    if (!user) return;

    try {
      const { data: schoolRelation } = await supabase
        .from('school_student_relationships')
        .select('school_id')
        .eq('student_id', user.id)
        .eq('is_active', true)
        .single();

      if (schoolRelation) {
        const { data: schoolCurricula } = await supabase
          .from('curricula')
          .select(`
            *,
            subjects (name)
          `)
          .eq('school_id', schoolRelation.school_id)
          .eq('is_active', true);

        setCurricula(schoolCurricula || []);
      }
    } catch (error) {
      console.error('Error fetching curricula:', error);
    }
  };

  const fetchMessagesForSession = async (sessionId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('conversation_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const generateChatTitle = async (messages: DatabaseMessage[]): Promise<string> => {
    if (!user || messages.length < 2) return 'New Chat';

    try {
      // Get the first few user messages to understand the topic
      const userMessages = messages
        .filter(m => m.is_from_user && m.content.length > 10)
        .slice(0, 3)
        .map(m => m.content);

      if (userMessages.length === 0) return 'New Chat';

      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [
            {
              role: 'system',
              content: 'Generate a concise 3-4 word title for this conversation based on the main topic. Respond with just the title, no quotes or extra text.'
            },
            {
              role: 'user',
              content: `Generate a title for a conversation that includes these messages: ${userMessages.join('. ')}`
            }
          ]
        }
      });

      if (error) throw error;
      return data.content.trim() || 'New Chat';
    } catch (error) {
      console.error('Error generating chat title:', error);
      return 'New Chat';
    }
  };

  const updateChatTitle = async (sessionId: string, messages: DatabaseMessage[]) => {
    if (!user || !sessionId) return;

    try {
      const title = await generateChatTitle(messages);
      
      // Store the title in a separate table or update the first message
      await supabase
        .from('chat_sessions')
        .upsert({
          id: sessionId,
          user_id: user.id,
          title: title,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error updating chat title:', error);
    }
  };

  const startNewChat = () => {
    setActiveSessionId(null);
    setMessages([{
      id: 'welcome',
      content: "Hello! I'm your AI Learning Assistant. How can I help you with your studies today?",
      is_from_user: false,
      created_at: new Date().toISOString()
    }]);
  };

  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processVoiceInput(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processVoiceInput = async (audioBlob: Blob) => {
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        if (base64Audio) {
          const { data, error } = await supabase.functions.invoke('voice-to-text', {
            body: { audio: base64Audio }
          });

          if (error) throw error;
          if (data.text) {
            setCurrentMessage(data.text);
          }
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error processing voice input:', error);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const fileMessage: DatabaseMessage = {
        id: `file_${Date.now()}`,
        content: `Uploaded file: ${selectedFile.name}`,
        is_from_user: true,
        created_at: new Date().toISOString(),
        fileName: selectedFile.name
      };

      setMessages(prev => [...prev, fileMessage]);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage = currentMessage;
    const startTime = Date.now();
    const sessionId = activeSessionId || generateSessionId();
    
    if (!activeSessionId) {
      setActiveSessionId(sessionId);
    }

    setCurrentMessage('');
    setIsLoading(true);

    try {
      const userMsg: DatabaseMessage = {
        id: `user_${Date.now()}`,
        content: userMessage,
        is_from_user: true,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMsg]);

      if (user) {
        await supabase
          .from('messages')
          .insert({
            user_id: user.id,
            content: userMessage,
            is_from_user: true,
            type: 'text',
            curriculum_id: activeCurriculum?.id || null,
            conversation_id: sessionId
          });
      }

      let systemPrompt = "You are a helpful AI tutor. Help the student learn and understand concepts clearly and engagingly.";
      
      if (activeCurriculum) {
        systemPrompt += ` You are currently teaching based on this curriculum: "${activeCurriculum.title}". `;
        systemPrompt += `Follow these specific instructions: ${activeCurriculum.content.ai_instructions}. `;
        if (activeCurriculum.content.learning_objectives) {
          systemPrompt += `The learning objectives are: ${activeCurriculum.content.learning_objectives}. `;
        }
      }

      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.slice(-5).map(m => ({
              role: m.is_from_user ? 'user' : 'assistant',
              content: m.content
            })),
            { role: 'user', content: userMessage }
          ]
        }
      });

      if (error) throw error;

      const responseTime = Date.now() - startTime;

      const aiMsg: DatabaseMessage = {
        id: `ai_${Date.now()}`,
        content: data.content,
        is_from_user: false,
        created_at: new Date().toISOString()
      };

      if (isVoiceResponse) {
        try {
          const voiceData = await supabase.functions.invoke('text-to-voice', {
            body: { 
              text: data.content,
              voice: 'alloy'
            }
          });

          if (voiceData.data?.audioContent) {
            const audioBlob = new Blob([
              new Uint8Array(atob(voiceData.data.audioContent).split('').map(c => c.charCodeAt(0)))
            ], { type: 'audio/mp3' });
            const audioUrl = URL.createObjectURL(audioBlob);
            aiMsg.audioUrl = audioUrl;
          }
        } catch (voiceError) {
          console.error('Error generating voice response:', voiceError);
        }
      }

      const updatedMessages = [...messages, userMsg, aiMsg];
      setMessages(updatedMessages);

      if (user) {
        await supabase
          .from('messages')
          .insert({
            user_id: user.id,
            content: data.content,
            is_from_user: false,
            type: 'text',
            curriculum_id: activeCurriculum?.id || null,
            conversation_id: sessionId
          });

        // Update chat title after a few exchanges
        if (updatedMessages.filter(m => m.is_from_user).length >= 2) {
          await updateChatTitle(sessionId, updatedMessages);
        }

        await trackInteraction(
          'chat',
          data.content,
          userMessage,
          activeCurriculum?.subjects.name || 'General',
          activeCurriculum?.id,
          responseTime
        );

        const subjectId = activeCurriculum?.subjects ? 
          await getSubjectId(activeCurriculum.subjects.name) : undefined;
        
        await logActivity('chat', subjectId, 5);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        content: "Sorry, I encountered an error. Please try again.",
        is_from_user: false,
        created_at: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getSubjectId = async (subjectName: string) => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id')
        .eq('name', subjectName)
        .single();

      return data?.id;
    } catch (error) {
      return undefined;
    }
  };

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    fetchMessagesForSession(sessionId);
  };

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play();
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block w-64 border-r border-gray-700`}>
        <ChatSidebar
          activeCurriculum={activeCurriculum}
          curricula={curricula}
          onSelectCurriculum={setActiveCurriculum}
          onNewChat={startNewChat}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 hover:bg-gray-700 rounded-lg text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <h1 className="text-lg font-semibold text-white">AI Learning Assistant</h1>
            </div>
            {activeCurriculum && (
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                {activeCurriculum.subjects.name}
              </Badge>
            )}
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto bg-gray-900">
          <div className="max-w-4xl mx-auto p-6 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.is_from_user ? 'justify-end' : 'justify-start'}`}
              >
                {!message.is_from_user && (
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0">
                    AI
                  </div>
                )}
                
                <div className={`max-w-[80%] ${message.is_from_user ? 'order-first' : ''}`}>
                  <div className={`p-4 rounded-2xl ${
                    message.is_from_user 
                      ? 'bg-blue-600 text-white ml-auto' 
                      : 'bg-gray-800 text-gray-100 border border-gray-700'
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    
                    {message.audioUrl && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => playAudio(message.audioUrl!)}
                        className="mt-2 p-1 hover:bg-white/10 text-gray-300"
                      >
                        <Volume2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <span>{new Date(message.created_at).toLocaleTimeString()}</span>
                    {!message.is_from_user && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyMessage(message.content)}
                          className="p-1 h-6 w-6 hover:bg-gray-700 text-gray-400"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="p-1 h-6 w-6 hover:bg-gray-700 text-gray-400"
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="p-1 h-6 w-6 hover:bg-gray-700 text-gray-400"
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="p-1 h-6 w-6 hover:bg-gray-700 text-gray-400"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {message.is_from_user && (
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
            
            {(isLoading || isAnalyzing) && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-semibold text-white">
                  AI
                </div>
                <div className="bg-gray-800 text-gray-100 p-4 rounded-2xl border border-gray-700">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  {isAnalyzing && (
                    <p className="text-xs mt-1 opacity-70">Analyzing response...</p>
                  )}
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-700 bg-gray-800 p-4">
          <div className="max-w-4xl mx-auto">
            {selectedFile && (
              <div className="mb-3 p-3 bg-blue-900/50 rounded-lg flex items-center justify-between border border-blue-800">
                <span className="text-sm text-gray-300">Selected: {selectedFile.name}</span>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleFileUpload} className="bg-blue-600 hover:bg-blue-700 text-white">
                    Upload
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedFile(null)} className="border-gray-600 text-gray-300 hover:bg-gray-700">
                    Remove
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Message AI Learning Assistant..."
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  className="min-h-[48px] py-3 pl-4 pr-32 text-base bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                  disabled={isLoading || isAnalyzing}
                />
                
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                  />
                  
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    variant="ghost"
                    size="sm"
                    className="p-2 h-8 w-8 text-gray-400 hover:text-gray-300 hover:bg-gray-600"
                    disabled={isLoading || isAnalyzing}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    onClick={isRecording ? stopRecording : startRecording}
                    variant="ghost"
                    size="sm"
                    className={`p-2 h-8 w-8 ${isRecording ? 'text-red-400 hover:text-red-300' : 'text-gray-400 hover:text-gray-300'} hover:bg-gray-600`}
                    disabled={isLoading || isAnalyzing}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  
                  <Button 
                    onClick={() => setIsVoiceResponse(!isVoiceResponse)}
                    variant="ghost"
                    size="sm"
                    className={`p-2 h-8 w-8 ${isVoiceResponse ? 'text-purple-400 hover:text-purple-300' : 'text-gray-400 hover:text-gray-300'} hover:bg-gray-600`}
                    disabled={isLoading || isAnalyzing}
                    title={isVoiceResponse ? 'Voice responses enabled' : 'Voice responses disabled'}
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <Button 
                onClick={sendMessage} 
                disabled={!currentMessage.trim() || isLoading || isAnalyzing}
                className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl min-h-[48px] disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
