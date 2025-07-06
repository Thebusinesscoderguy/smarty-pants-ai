
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Message as LegacyMessage } from '@/types/message';

interface Message {
  id: string;
  content: string;
  isFromUser: boolean;
  timestamp: Date;
  type: string;
  fileUrl?: string;
  specialFeature?: any;
  text?: string;
  tokenCount?: number;
  audioUrl?: string;
  isPlaying?: boolean;
  fileName?: string;
}

export const useMessageHandler = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Simple state for backward compatibility
  const [apiKeyError, setApiKeyError] = useState<string | boolean>(false);
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
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const detectSpecialRequests = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    const quizPatterns = [
      /quiz me on (.+)/i,
      /test me on (.+)/i,
      /create a quiz about (.+)/i,
    ];

    const homeworkPatterns = [
      /help with (.+) problem/i,
      /homework help/i,
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
    if (!content.trim()) return;

    const specialRequest = detectSpecialRequests(content);
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: content,
      isFromUser: true,
      timestamp: new Date(),
      type: type,
      fileUrl: fileUrl,
      text: content,
      tokenCount: Math.ceil(content.length / 4)
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Handle special requests
      if (specialRequest) {
        const responseMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `I'll help you with that! Let me prepare a ${specialRequest.type === 'quiz' ? 'personalized quiz' : 'homework guidance'} for you.`,
          isFromUser: false,
          timestamp: new Date(),
          type: 'text',
          specialFeature: specialRequest,
          text: content,
          tokenCount: 0
        };

        setMessages(prev => [...prev, responseMessage]);
        setIsLoading(false);
        return;
      }

      // Regular AI response
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [
            ...messages.slice(-5).map(m => ({ 
              role: m.isFromUser ? 'user' : 'assistant', 
              content: m.content 
            })),
            { role: 'user', content: content }
          ]
        }
      });

      if (error) throw error;

      const responseContent = data?.choices?.[0]?.message?.content || "I'm sorry, I couldn't process your request right now. Please try again.";
      
      const aiResponse: Message = {
        id: (Date.now() + 2).toString(),
        content: responseContent,
        isFromUser: false,
        timestamp: new Date(),
        type: 'text',
        text: responseContent,
        tokenCount: Math.ceil(responseContent.length / 4)
      };
      
      setMessages(prev => [...prev, aiResponse]);

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
      
      const errorResponse: Message = {
        id: (Date.now() + 3).toString(),
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

  // Convert to legacy format with proper error handling
  const convertToLegacyMessage = (msg: Message): LegacyMessage => ({
    id: msg.id,
    text: msg.content,
    timestamp: msg.timestamp,
    isFromUser: msg.isFromUser,
    type: msg.type as 'text' | 'voice' | 'file',
    audioUrl: msg.audioUrl,
    isPlaying: msg.isPlaying || false,
    fileUrl: msg.fileUrl,
    fileName: msg.fileName,
    tokenCount: msg.tokenCount || 0
  });

  const getLegacyMessages = (): LegacyMessage[] => {
    if (!Array.isArray(messages)) {
      return [];
    }
    return messages.map(convertToLegacyMessage);
  };

  const getAIResponse = async (message: string, voice?: string) => {
    await sendMessage(message);
  };

  const handlePlayAudio = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isPlaying: true } : { ...msg, isPlaying: false }
    ));
  };

  const handlePauseAudio = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isPlaying: false } : msg
    ));
  };

  const uploadFile = async (file: File) => {
    return URL.createObjectURL(file);
  };

  const fetchMessages = async () => {
    // Implementation for fetching messages if needed
  };

  const checkOpenAIKey = () => {
    // Implementation for checking OpenAI key
    setApiKeyError(false);
  };

  const trackResponseTime = (message: string, messageList: Message[]) => {
    // Implementation for tracking response time
  };

  const incrementTokenCount = (count: number) => {
    setTotalTokensUsed(prev => prev + count);
    setInputTokens(prev => prev + count);
  };

  const getFastResponseTopics = (): string[] => {
    return userStrengths;
  };

  const getSlowResponseTopics = (): string[] => {
    return userWeaknesses;
  };

  return {
    messages,
    setMessages,
    sendMessage,
    isLoading,
    messagesEndRef,
    detectSpecialRequests,
    getLegacyMessages,
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
