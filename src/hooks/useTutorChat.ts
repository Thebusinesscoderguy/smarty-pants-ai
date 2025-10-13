import { useState, useRef, useEffect } from 'react';
import { Message } from '@/types/message';
import { useAudioHandler } from '@/hooks/useAudioHandler';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuestEvents } from '@/hooks/useQuestEvents';

interface Lesson {
  id: string;
  title: string;
  content: string;
  duration: number;
  type: 'reading' | 'video' | 'interactive';
  completed?: boolean;
}

export const useTutorChat = (lesson: Lesson) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [textMessage, setTextMessage] = useState('');
  const [isLessonComplete, setIsLessonComplete] = useState(false);
  const [lessonProgress, setLessonProgress] = useState(0);
  const [conversationDepth, setConversationDepth] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    handlePlayAudio,
    handlePauseAudio
  } = useAudioHandler();
  const questEvents = useQuestEvents();

  // Initialize conversation with AI tutor introduction
  useEffect(() => {
    const initializeConversation = async () => {
      const welcomeMessage: Message = {
        id: `welcome-${Date.now()}`,
        text: `Hello! I'm your AI tutor for today's lesson: "${lesson.title}". 

I'm here to guide you through this topic using interactive questioning and discussion. Instead of just telling you information, I'll help you discover and understand concepts through conversation.

Let's start: What do you already know about this topic, or what would you like to learn first?`,
        timestamp: new Date(),
        isFromUser: false,
        type: 'text',
        tokenCount: 0
      };

      setMessages([welcomeMessage]);
      setLessonProgress(10); // Starting progress
    };

    initializeConversation();
  }, [lesson]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim()) return;

    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      text: userMessage.trim(),
      timestamp: new Date(),
      isFromUser: true,
      type: 'text',
      tokenCount: Math.ceil(userMessage.length / 4)
    };

    setMessages(prev => [...prev, userMsg]);
    
    // Log quest event for AI classification
    await questEvents.logQuestEvent({
      source: 'chat',
      event_type: 'chat_message',
      payload: {
        lesson_id: lesson.id,
        lesson_title: lesson.title,
        message_length: userMessage.trim().length,
        conversation_depth: conversationDepth
      }
    });
    
    // Track conversation depth for progress
    setConversationDepth(prev => prev + 1);
    const newProgress = Math.min(10 + (conversationDepth * 15), 90);
    setLessonProgress(newProgress);

    try {
      const processingMessage: Message = {
        id: `processing-${Date.now()}`,
        text: "Thinking...",
        timestamp: new Date(),
        isFromUser: false,
        type: 'text',
        tokenCount: 0
      };

      setMessages(prev => [...prev, processingMessage]);

      // Get conversation history for context
      const conversationHistory = messages
        .concat(userMsg)
        .slice(-10) // Keep last 10 messages for context
        .map(m => ({
          role: m.isFromUser ? "user" : "assistant",
          content: m.text
        }));

      // Call AI tutor with specialized system prompt
      const tutorResponse = await supabase.functions.invoke('ai-tutor', {
        body: {
          lessonTitle: lesson.title,
          lessonContent: lesson.content,
          conversationHistory,
          userMessage: userMessage.trim(),
          conversationDepth
        }
      });

      if (tutorResponse.error) {
        throw new Error(tutorResponse.error.message || 'Failed to get tutor response');
      }

      let aiResponseText = '';
      const response = new Response(tutorResponse.data);
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      const aiMessageId = `ai-${Date.now()}`;
      const streamingMessage: Message = {
        id: aiMessageId,
        text: "",
        timestamp: new Date(),
        isFromUser: false,
        type: 'text',
        tokenCount: 0
      };

      // Remove processing message and add streaming message
      setMessages(prev => prev.filter(m => !m.id?.startsWith('processing-')).concat(streamingMessage));

      if (reader) {
        let buffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  aiResponseText += data.content;
                  
                  setMessages(prev => prev.map(msg => 
                    msg.id === aiMessageId 
                      ? { ...msg, text: aiResponseText }
                      : msg
                  ));
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      } else {
        // Fallback for non-streaming response
        if (typeof tutorResponse.data === 'string') {
          aiResponseText = tutorResponse.data;
        } else if (tutorResponse.data.content) {
          aiResponseText = tutorResponse.data.content;
        }
        
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, text: aiResponseText }
            : msg
        ));
      }

      // Update final message with token count
      const tokenCount = Math.ceil(aiResponseText.length / 4);
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { ...msg, tokenCount: tokenCount }
          : msg
      ));

      // Check if lesson should be marked as complete
      if (conversationDepth >= 5 && aiResponseText.toLowerCase().includes('complete')) {
        setIsLessonComplete(true);
        setLessonProgress(100);
      }

    } catch (error: any) {
      console.error('Error getting tutor response:', error);
      setMessages(prev => prev.filter(m => !m.id?.startsWith('processing-')));
      
      toast({
        title: "Error",
        description: "Failed to get tutor response. Please try again.",
        variant: "destructive"
      });
    }
  };

  return {
    messages,
    textMessage,
    setTextMessage,
    messagesEndRef,
    sendMessage,
    isLessonComplete,
    lessonProgress,
    conversationDepth,
    handlePlayAudio: (messageId: string) => handlePlayAudio(messageId, messages, setMessages),
    handlePauseAudio: (messageId: string) => handlePauseAudio(messageId, messages, setMessages)
  };
};