
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
  text?: string; // For backward compatibility
  tokenCount?: number; // For backward compatibility
  audioUrl?: string;
  isPlaying?: boolean;
  fileName?: string;
}

export const useMessageHandler = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Additional state for backward compatibility
  const [apiKeyError, setApiKeyError] = useState(false);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [responseTimes, setResponseTimes] = useState<any[]>([]);
  const [userStrengths, setUserStrengths] = useState<string[]>([]);
  const [userWeaknesses, setUserWeaknesses] = useState<string[]>([]);
  const [totalTokensUsed, setTotalTokensUsed] = useState(0);
  const [inputTokens, setInputTokens] = useState(0);
  const [outputTokens, setOutputTokens] = useState(0);
  const [monthlyLimit] = useState(10000);
  const [isTokenLimitReached, setIsTokenLimitReached] = useState(false);

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
        specialFeature: specialRequest,
        text: content, // Backward compatibility
        tokenCount: 0 // Backward compatibility
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
      fileUrl: fileUrl,
      text: content, // Backward compatibility
      tokenCount: Math.ceil(content.length / 4) // Backward compatibility
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
        type: 'text',
        text: data.choices[0].message.content, // Backward compatibility
        tokenCount: Math.ceil(data.choices[0].message.content.length / 4) // Backward compatibility
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
        type: 'text',
        text: "Sorry, I'm having trouble processing your request. Please try again later.",
        tokenCount: 0
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  // Backward compatibility functions
  const getAIResponse = async (message: string, voice?: string) => {
    await sendMessage(message);
  };

  const handlePlayAudio = (messageId: string) => {
    // Audio handling logic here
  };

  const handlePauseAudio = (messageId: string) => {
    // Audio handling logic here
  };

  const uploadFile = async (file: File) => {
    // File upload logic here
    return URL.createObjectURL(file);
  };

  const fetchMessages = async () => {
    // Fetch messages from database if needed
  };

  const checkOpenAIKey = () => {
    // Check OpenAI key
  };

  const trackResponseTime = (message: string, messages: Message[]) => {
    // Track response time
  };

  const incrementTokenCount = (count: number) => {
    setTotalTokensUsed(prev => prev + count);
    setInputTokens(prev => prev + count);
  };

  const getFastResponseTopics = () => {
    return userStrengths;
  };

  const getSlowResponseTopics = () => {
    return userWeaknesses;
  };

  return {
    messages,
    setMessages,
    sendMessage,
    isLoading,
    messagesEndRef,
    detectSpecialRequests,
    // Backward compatibility
    getAIResponse,
    handlePlayAudio,
    handlePauseAudio,
    uploadFile,
    apiKeyError,
    isQuizMode,
    setIsQuizMode,
    responseTimes,
    userStrengths,
    userWeaknesses,
    totalTokensUsed,
    inputTokens,
    outputTokens,
    monthlyLimit,
    isTokenLimitReached,
    getFastResponseTopics,
    getSlowResponseTopics,
    scrollToBottom,
    fetchMessages,
    checkOpenAIKey,
    trackResponseTime,
    incrementTokenCount
  };
};
