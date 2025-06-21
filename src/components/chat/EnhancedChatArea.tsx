import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActivityTracking } from '@/hooks/useActivityTracking';
import { useRealTimeAnalytics } from '@/hooks/useRealTimeAnalytics';
import { ChatSidebar } from './ChatSidebar';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { getDemoSession, getDemoResponse } from '@/utils/demoChatData';

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
        content: "Welcome to the AI Learning Assistant! I'm here to help you with your studies. Try our demo conversations in the sidebar, or ask me anything about any subject. I'll provide personalized guidance to help you learn and understand concepts clearly.",
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
    if (!user) {
      // Load demo session
      const demoSession = getDemoSession(sessionId);
      if (demoSession) {
        const demoMessages = demoSession.messages.map(msg => ({
          ...msg,
          created_at: msg.created_at
        }));
        setMessages(demoMessages);
        setActiveSessionId(sessionId);
      }
      return;
    }

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

  const startNewChat = () => {
    setActiveSessionId(null);
    if (user) {
      setMessages([{
        id: 'welcome',
        content: "Hello! I'm your AI Learning Assistant. How can I help you with your studies today?",
        is_from_user: false,
        created_at: new Date().toISOString()
      }]);
    } else {
      setMessages([{
        id: 'welcome',
        content: "Welcome to the AI Learning Assistant demo! I'm here to help you learn. Try asking me about math, science, writing, or any other subject. You can also explore the demo conversations in the sidebar!",
        is_from_user: false,
        created_at: new Date().toISOString()
      }]);
    }
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

      // Handle demo vs real responses
      if (!user) {
        // Demo response with realistic delay
        setTimeout(() => {
          const demoResponse = getDemoResponse(userMessage);
          const aiMsg: DatabaseMessage = {
            id: `ai_${Date.now()}`,
            content: demoResponse,
            is_from_user: false,
            created_at: new Date().toISOString()
          };
          setMessages(prev => [...prev, aiMsg]);
          setIsLoading(false);
        }, 1000 + Math.random() * 2000); // 1-3 second delay
        return;
      }

      // Real API call for authenticated users
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
      <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block flex-shrink-0`}>
        <ChatSidebar
          activeCurriculum={activeCurriculum}
          curricula={curricula}
          onSelectCurriculum={setActiveCurriculum}
          onNewChat={startNewChat}
          activeSessionId={activeSessionId}
          onSelectSession={fetchMessagesForSession}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <ChatHeader
          activeCurriculum={activeCurriculum}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto bg-gray-900">
          <div className="max-w-4xl mx-auto p-6 space-y-6">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onPlayAudio={playAudio}
                onCopyMessage={copyMessage}
              />
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
        <ChatInput
          currentMessage={currentMessage}
          setCurrentMessage={setCurrentMessage}
          onSendMessage={sendMessage}
          isLoading={isLoading}
          isAnalyzing={isAnalyzing}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          isRecording={isRecording}
          onStartRecording={() => {}} // Placeholder - implement voice recording
          onStopRecording={() => {}} // Placeholder - implement voice recording
          isVoiceResponse={isVoiceResponse}
          onToggleVoiceResponse={() => setIsVoiceResponse(!isVoiceResponse)}
          onFileUpload={handleFileUpload}
        />
      </div>
    </div>
  );
};
