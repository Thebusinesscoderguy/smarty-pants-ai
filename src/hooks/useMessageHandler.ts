import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface Message {
  id: string;
  content: string;
  isFromUser: boolean;
  timestamp: Date;
  type: string;
  fileUrl?: string;
  specialFeature?: any;
}

export const useMessageHandler = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const detectSpecialRequests = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    // Quiz detection patterns
    const quizPatterns = [
      /quiz me on (.+)/i,
      /test me on (.+)/i,
      /test my knowledge (.+)/i,
      /create a quiz about (.+)/i,
      /quiz about (.+)/i,
      /can you quiz me/i
    ];

    // Learning path detection patterns
    const pathPatterns = [
      /what should i learn next/i,
      /recommend (.+) topics/i,
      /learning path/i,
      /what to study next/i,
      /suggest topics/i
    ];

    // Homework help detection patterns
    const homeworkPatterns = [
      /help with (.+) problem/i,
      /homework help/i,
      /solve this problem/i,
      /help me understand/i,
      /step by step/i
    ];

    for (const pattern of quizPatterns) {
      const match = message.match(pattern);
      if (match) {
        return {
          type: 'quiz',
          topic: match[1] || 'general',
          originalMessage: message
        };
      }
    }

    for (const pattern of pathPatterns) {
      if (pattern.test(message)) {
        return {
          type: 'learning_path',
          originalMessage: message
        };
      }
    }

    for (const pattern of homeworkPatterns) {
      const match = message.match(pattern);
      if (match) {
        return {
          type: 'homework',
          problem: match[1] || message,
          originalMessage: message
        };
      }
    }

    return null;
  };

  const sendMessage = async (content: string, type: string = 'text', fileUrl?: string) => {
    if (!user) return;

    // Check for special requests first
    const specialRequest = detectSpecialRequests(content);
    
    if (specialRequest) {
      // Handle special learning features
      const responseMessage: Message = {
        id: Date.now().toString(),
        content: `I'll help you with that! Let me prepare a ${specialRequest.type === 'quiz' ? 'personalized quiz' : specialRequest.type === 'learning_path' ? 'learning path' : 'homework guidance'} for you.`,
        isFromUser: false,
        timestamp: new Date(),
        type: 'text',
        specialFeature: specialRequest
      };

      setMessages(prev => [...prev, responseMessage]);
      return;
    }

    setIsLoading(true);
    const newMessage: Message = {
      id: Date.now().toString(),
      content: content,
      isFromUser: true,
      timestamp: new Date(),
      type: type,
      fileUrl: fileUrl
    };
    setMessages(prev => [...prev, newMessage]);

    try {
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [
            ...messages.slice(-5).map(m => ({ role: m.isFromUser ? 'user' : 'assistant', content: m.content })),
            { role: 'user', content: content }
          ]
        }
      });

      if (error) throw error;

      const aiResponse: Message = {
        id: Date.now().toString(),
        content: data.choices[0].message.content,
        isFromUser: false,
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, aiResponse]);

    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
      const errorResponse: Message = {
        id: Date.now().toString(),
        content: "Sorry, I'm having trouble processing your request. Please try again later.",
        isFromUser: false,
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    sendMessage,
    isLoading,
    messagesEndRef,
    detectSpecialRequests
  };
};
