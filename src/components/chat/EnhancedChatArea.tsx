
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActivityTracking } from '@/hooks/useActivityTracking';
import { useRealTimeAnalytics } from '@/hooks/useRealTimeAnalytics';
import { ChatSidebar } from './ChatSidebar';

interface Message {
  id: string;
  content: string;
  is_from_user: boolean;
  created_at: string;
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeCurriculum, setActiveCurriculum] = useState<Curriculum | null>(null);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const { user } = useAuth();
  const { logActivity } = useActivityTracking();
  const { trackInteraction, isAnalyzing } = useRealTimeAnalytics();

  useEffect(() => {
    if (user) {
      fetchCurricula();
      startNewChat();
    } else {
      // For demo users, show welcome message
      setMessages([{
        id: 'welcome',
        content: "Welcome to the AI Learning Assistant! I'm here to help you with your studies. Ask me anything about any subject, and I'll provide personalized guidance.",
        is_from_user: false,
        created_at: new Date().toISOString()
      }]);
    }
  }, [user]);

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
      // Add user message to UI immediately
      const userMsg = {
        id: `user_${Date.now()}`,
        content: userMessage,
        is_from_user: true,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMsg]);

      // Save user message to database if authenticated
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

      // Get AI response
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

      // Add AI response to UI
      const aiMsg = {
        id: `ai_${Date.now()}`,
        content: data.content,
        is_from_user: false,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMsg]);

      // Save AI response to database if authenticated
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

        // Track interaction with analytics
        await trackInteraction(
          'chat',
          data.content,
          userMessage,
          activeCurriculum?.subjects.name || 'General',
          activeCurriculum?.id,
          responseTime
        );

        // Log activity
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

  return (
    <div className="flex h-[calc(100vh-200px)]">
      {/* Sidebar */}
      <ChatSidebar
        activeCurriculum={activeCurriculum}
        curricula={curricula}
        onSelectCurriculum={setActiveCurriculum}
        onNewChat={startNewChat}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Active Curriculum Display */}
        {activeCurriculum && (
          <div className="p-4 bg-blue-500/20 border-b border-blue-500/30">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{activeCurriculum.subjects.name}</Badge>
              <span className="text-blue-200 text-sm">{activeCurriculum.title}</span>
            </div>
            <p className="text-xs text-blue-300 mt-1">
              AI responses will follow your school's curriculum guidelines
            </p>
          </div>
        )}

        {/* Messages */}
        <Card className="flex-1 bg-white/10 border-white/20 m-4 mb-0">
          <CardContent className="p-0">
            <div className="h-full overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.is_from_user ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[80%] ${message.is_from_user ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.is_from_user ? 'bg-blue-500' : 'bg-gray-600'
                    }`}>
                      {message.is_from_user ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={`p-3 rounded-lg ${
                      message.is_from_user 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-700 text-gray-100'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {(isLoading || isAnalyzing) && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-gray-700 text-gray-100 p-3 rounded-lg">
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
            </div>
          </CardContent>
        </Card>

        {/* Input Area */}
        <div className="p-4">
          <div className="flex gap-2">
            <Input
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Ask me anything about your studies..."
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              className="bg-white/10 border-white/20 text-white flex-1"
              disabled={isLoading || isAnalyzing}
            />
            <Button 
              onClick={sendMessage} 
              disabled={!currentMessage.trim() || isLoading || isAnalyzing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
