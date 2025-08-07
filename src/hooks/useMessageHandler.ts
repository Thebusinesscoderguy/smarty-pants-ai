
import { useState, useRef } from 'react';
import { Message } from '@/types/message';
import { useAudioHandler } from '@/hooks/useAudioHandler';
import { useTokenUsage } from '@/hooks/useTokenUsage';
import { useQuizMode } from '@/hooks/useQuizMode';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useMessageHandler = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  
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

  const getAIResponse = async (userMessage: string, selectedVoice: string, curriculumContext?: any, isVoiceEnabled: boolean = true) => {
    try {
      const processingMessageId = `processing-${Date.now()}`;
      const aiMessageId = `ai-${Date.now() + 1}`; // Ensure unique ID
      
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
          .filter(m => !m.id?.startsWith('processing-'))
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
        
        // Natural AI tutor system prompt
        let systemPrompt = `You are a friendly and knowledgeable AI tutor. You help students learn by:

- Being conversational and approachable
- Explaining concepts clearly and at an appropriate level
- Breaking down complex topics into understandable parts
- Encouraging questions and curiosity
- Providing examples and practical applications
- Being patient and supportive

Respond naturally to whatever the student asks about. Don't assume everything is curriculum-related unless explicitly mentioned.`;

        // Only add curriculum context if it's actually provided and relevant
        if (curriculumContext && curriculumContext.title) {
          systemPrompt += `\n\nNote: The student is currently working with the "${curriculumContext.title}" curriculum, but respond naturally to their questions regardless of whether they're curriculum-specific.`;
        }

        // Add quiz mode context if active
        if (isQuizMode) {
          systemPrompt += `\n\nYou're currently in quiz mode! Ask thoughtful educational questions and provide encouraging feedback on answers. Make learning fun and interactive.`;
        }

        // Add performance context if available
        if (responseTimes.length > 0) {
          systemPrompt += `\n\nBased on previous interactions, the student seems to be strong in: ${userStrengths.join(', ') || 'various areas'} and could use more practice with: ${userWeaknesses.join(', ') || 'some topics'}. Tailor your help accordingly.`;
        }

        // Create a placeholder message for streaming
        const streamingMessage: Message = {
          id: aiMessageId,
          text: "",
          timestamp: new Date(),
          isFromUser: false,
          type: 'text',
          tokenCount: 0
        };

        // Remove processing message and add streaming message
        setMessages(prev => prev.filter(m => m.id !== processingMessageId).concat(streamingMessage));

        // Generate AI response using OpenAI's chat completion API with streaming
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

        // Handle streaming response
        let aiResponseText = '';
        const response = new Response(completionResponse.data);
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

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
                    
                    // Update the streaming message in real-time
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
          aiResponseText = completionResponse.data.content || completionResponse.data;
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, text: aiResponseText }
              : msg
          ));
        }
        
        // Check if this is a quiz question and update state
        if (isQuizMode && aiResponseText.includes('?')) {
          setLastQuestionTime(new Date());
        }

        // Generate speech from the AI response text only if voice is enabled
        let audioUrl = null;
        
        // Check if voice is enabled before generating speech
        if (isVoiceEnabled) {
          console.log('Generating voice response with voice:', selectedVoice);
          const voiceResponse = await supabase.functions.invoke('text-to-voice', {
            body: { 
              text: aiResponseText,
              voice: selectedVoice || 'alloy'
            }
          });

          if (voiceResponse.error) {
            console.error('Voice generation error:', voiceResponse.error);
            if (voiceResponse.error.message && voiceResponse.error.message.includes('API key')) {
              setApiKeyError(true);
            }
            // Don't throw error, just log it and continue without voice
            console.warn('Continuing without voice due to error:', voiceResponse.error.message);
          } else {
            const base64Audio = voiceResponse.data.audioContent;

            const byteCharacters = atob(base64Audio);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const audioBlob = new Blob([byteArray], { type: 'audio/mp3' });

            audioUrl = URL.createObjectURL(audioBlob);
            console.log('Voice response generated successfully');
          }
        }

        // Update final message with audio and token count
        const tokenCount = Math.ceil(aiResponseText.length / 4);
        
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { 
                ...msg, 
                audioUrl: audioUrl,
                type: audioUrl ? 'voice' : 'text',
                tokenCount: tokenCount
              }
            : msg
        ));
        incrementTokenCount(0, tokenCount);

        // Only auto-play if voice is enabled and audio was generated
        if (audioUrl && isVoiceEnabled) {
          setTimeout(() => {
            if (aiMessageId) {
              handlePlayAudio(aiMessageId, messages, setMessages);
            }
          }, 500);
        }

      } catch (error: any) {
        // Remove both processing and streaming messages on error
        setMessages(prev => prev.filter(m => m.id !== processingMessageId && m.id !== aiMessageId));
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
