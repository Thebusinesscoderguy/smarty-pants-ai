
import { useState, useRef } from 'react';
import { Message } from '@/types/message';
import { useAudioHandler } from '@/hooks/useAudioHandler';
import { useTokenUsage } from '@/hooks/useTokenUsage';
import { useQuizMode } from '@/hooks/useQuizMode';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useMessageHandler = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-message',
      text: "Welcome to Teachly! How can I assist you today? You can send text, voice messages, or upload files.",
      timestamp: new Date(),
      isFromUser: false,
      type: 'text',
      tokenCount: 18
    }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [apiKeyError, setApiKeyError] = useState(false);
  
  const { 
    isQuizMode, 
    setIsQuizMode,
    lastQuestionTime,
    setLastQuestionTime,
    responseTimes,
    userStrengths,
    userWeaknesses,
    getFastResponseTopics,
    getSlowResponseTopics,
    trackResponseTime
  } = useQuizMode();
  
  const {
    totalTokensUsed,
    inputTokens,
    outputTokens,
    monthlyLimit,
    incrementTokenCount,
    isTokenLimitReached
  } = useTokenUsage();
  
  const {
    handlePlayAudio,
    handlePauseAudio
  } = useAudioHandler();
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const fetchMessages = async () => {
    // Placeholder for messages fetching logic
    // This would typically fetch from your backend or database
  };
  
  const checkOpenAIKey = async () => {
    try {
      const response = await supabase.functions.invoke('text-to-voice', {
        body: { text: "Test", voice: 'alloy' }
      });
      if (response.error && response.error.message && response.error.message.includes('API key')) {
        setApiKeyError(true);
        console.error("API key error from function:", response.error);
      } else {
        setApiKeyError(false);
      }
    } catch (error: any) {
      console.error("Error checking OpenAI API key:", error);
      if (error.message && error.message.includes('API key')) {
        setApiKeyError(true);
      }
    }
  };

  const getAIResponse = async (userMessage: string, selectedVoice: string) => {
    try {
      const processingMessageId = `processing-${Date.now()}`;
      const processingMessage: Message = {
        id: processingMessageId,
        text: "Processing your request...",
        timestamp: new Date(),
        isFromUser: false,
        type: 'text',
        tokenCount: 0
      };

      setMessages(prev => [...prev, processingMessage]);

      try {
        // Get previous messages for context (limit to last 8 for token efficiency)
        const conversationHistory = messages
          .filter(m => m.id !== 'welcome-message' && !m.id?.startsWith('processing-'))
          .slice(-8)
          .map(m => ({
            role: m.isFromUser ? "user" : "assistant", 
            content: m.text
          }));
        
        // Check if this appears to be a quiz-related message
        const isQuizRequest = userMessage.toLowerCase().includes('quiz') || 
                             userMessage.toLowerCase().includes('test') || 
                             userMessage.toLowerCase().includes('question');
        
        // If we're starting a quiz, enable quiz mode
        if (isQuizRequest && !isQuizMode) {
          setIsQuizMode(true);
        }
        
        // Create a natural, conversational system prompt
        let systemPrompt = `You are Teachly, a friendly and knowledgeable AI tutor. You're here to help students learn in a warm, encouraging way. Be conversational and natural - like a helpful friend who happens to know a lot about various subjects.

Keep your responses engaging and personalized. Don't be overly formal or robotic. If someone asks a question, dive right into helping them rather than announcing that you're processing their message.`;

        // Add quiz mode context if active
        if (isQuizMode) {
          systemPrompt += `\n\nYou're currently in quiz mode! Ask thoughtful educational questions and provide encouraging feedback on answers. Make learning fun and interactive.`;
        }

        // Add performance context if available
        if (responseTimes.length > 0) {
          systemPrompt += `\n\nBased on previous interactions, the student seems to be strong in: ${userStrengths.join(', ') || 'various areas'} and could use more practice with: ${userWeaknesses.join(', ') || 'some topics'}. Tailor your help accordingly.`;
        }

        // Generate AI response using OpenAI's chat completion API
        const completionResponse = await supabase.functions.invoke('chat-completion', {
          body: {
            messages: [
              {
                role: "system",
                content: systemPrompt
              },
              ...conversationHistory,
              { role: "user", content: userMessage }
            ]
          }
        });

        if (completionResponse.error) {
          throw new Error(completionResponse.error.message || 'Failed to generate AI response');
        }

        const aiResponseText = completionResponse.data.content;
        
        // Check if this is a quiz question and update state
        if (isQuizMode && aiResponseText.includes('?')) {
          setLastQuestionTime(new Date());
        }

        // Generate speech from the AI response text
        const voiceResponse = await supabase.functions.invoke('text-to-voice', {
          body: { 
            text: aiResponseText,
            voice: selectedVoice || 'alloy'
          }
        });

        if (voiceResponse.error) {
          if (voiceResponse.error.message && voiceResponse.error.message.includes('API key')) {
            setApiKeyError(true);
          }
          throw new Error(voiceResponse.error.message || 'Failed to generate speech');
        }

        const base64Audio = voiceResponse.data.audioContent;

        const byteCharacters = atob(base64Audio);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const audioBlob = new Blob([byteArray], { type: 'audio/mp3' });

        const audioUrl = URL.createObjectURL(audioBlob);

        setMessages(prev => prev.filter(m => m.id !== processingMessageId));

        const aiMessageId = `ai-${Date.now()}`;
        const tokenCount = Math.ceil(aiResponseText.length / 4);
        
        const aiMessage: Message = {
          id: aiMessageId,
          text: aiResponseText,
          timestamp: new Date(),
          audioUrl: audioUrl,
          isFromUser: false,
          type: 'voice',
          tokenCount: tokenCount
        };

        setMessages(prev => [...prev, aiMessage]);
        incrementTokenCount(0, tokenCount);

        setTimeout(() => {
          if (aiMessageId) {
            handlePlayAudio(aiMessageId, messages, setMessages);
          }
        }, 500);

      } catch (error: any) {
        setMessages(prev => prev.filter(m => m.id !== processingMessageId));
        console.error("Error in getAIResponse:", error);
        toast({
          title: "Error",
          description: "Failed to get AI response: " + error.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Error in getAIResponse:", error);
      toast({
        title: "Error",
        description: "Failed to get AI response: " + error.message,
        variant: "destructive"
      });
    }
  };

  return {
    messages,
    setMessages,
    messagesEndRef,
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
    getAIResponse,
    handlePlayAudio,
    handlePauseAudio,
    trackResponseTime,
    incrementTokenCount
  };
};
