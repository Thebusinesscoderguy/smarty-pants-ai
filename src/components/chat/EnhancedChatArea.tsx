import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActivityTracking } from '@/hooks/useActivityTracking';
import { useRealTimeAnalytics } from '@/hooks/useRealTimeAnalytics';

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
  const [messageStartTime, setMessageStartTime] = useState<number | null>(null);
  const { user } = useAuth();
  const { logActivity } = useActivityTracking();
  const { trackInteraction, isAnalyzing } = useRealTimeAnalytics();

  useEffect(() => {
    if (user) {
      fetchCurricula();
      fetchMessages();
    }
  }, [user]);

  const fetchCurricula = async () => {
    if (!user) return;

    try {
      // Get user's school
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

  const fetchMessages = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !user) return;

    const userMessage = currentMessage;
    const startTime = Date.now();
    setCurrentMessage('');
    setIsLoading(true);
    setMessageStartTime(startTime);

    try {
      // Save user message
      const { data: userMsg, error: userError } = await supabase
        .from('messages')
        .insert({
          user_id: user.id,
          content: userMessage,
          is_from_user: true,
          type: 'text',
          curriculum_id: activeCurriculum?.id || null
        })
        .select()
        .single();

      if (userError) throw userError;

      setMessages(prev => [...prev, userMsg]);

      // Get AI response with curriculum context
      let systemPrompt = "You are a helpful AI tutor. Help the student learn and understand concepts.";
      
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
            { role: 'user', content: userMessage }
          ]
        }
      });

      if (error) throw error;

      const responseTime = Date.now() - startTime;

      // Save AI response
      const { data: aiMsg, error: aiError } = await supabase
        .from('messages')
        .insert({
          user_id: user.id,
          content: data.content,
          is_from_user: false,
          type: 'text',
          curriculum_id: activeCurriculum?.id || null
        })
        .select()
        .single();

      if (aiError) throw aiError;

      setMessages(prev => [...prev, aiMsg]);

      // Track interaction with real-time analytics
      await trackInteraction(
        'chat',
        data.content, // AI's question/response as context
        userMessage, // Student's response
        activeCurriculum?.subjects.name || 'General',
        activeCurriculum?.id,
        responseTime
      );

      // Log activity
      const subjectId = activeCurriculum?.subjects ? 
        await getSubjectId(activeCurriculum.subjects.name) : undefined;
      
      await logActivity('chat', subjectId, 5);

    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
      setMessageStartTime(null);
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

  const selectCurriculum = (curriculum: Curriculum) => {
    setActiveCurriculum(curriculum);
  };

  return (
    <div className="space-y-4">
      {/* Curriculum Selection */}
      {curricula.length > 0 && (
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <BookOpen className="h-5 w-5" />
              Select Learning Context
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={!activeCurriculum ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCurriculum(null)}
              >
                General Chat
              </Button>
              {curricula.map((curriculum) => (
                <Button
                  key={curriculum.id}
                  variant={activeCurriculum?.id === curriculum.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => selectCurriculum(curriculum)}
                  className="flex items-center gap-2"
                >
                  {curriculum.title}
                  <Badge variant="secondary" className="text-xs">
                    {curriculum.subjects.name}
                  </Badge>
                </Button>
              ))}
            </div>
            {activeCurriculum && (
              <div className="mt-3 p-3 bg-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-200">
                  <strong>Active:</strong> {activeCurriculum.title} ({activeCurriculum.subjects.name})
                </p>
                <p className="text-xs text-blue-300 mt-1">
                  The AI will follow your school's curriculum guidelines for this subject.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Chat Messages */}
      <Card className="bg-white/10 border-white/20">
        <CardContent className="p-0">
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Start a conversation! Ask me anything about your studies.</p>
                {activeCurriculum && (
                  <p className="text-sm mt-2">
                    I'll help you with {activeCurriculum.subjects.name} based on your school's curriculum.
                  </p>
                )}
              </div>
            ) : (
              messages.map((message) => (
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
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
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
          
          {/* Input Area */}
          <div className="border-t border-white/20 p-4">
            <div className="flex gap-2">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Ask me anything about your studies..."
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
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
        </CardContent>
      </Card>
    </div>
  );
};
