
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
        
        // No system prompt - let AI respond naturally without instructions

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
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(`https://twfzlbockonxopuindaw.supabase.co/functions/v1/chat-completion`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3ZnpsYm9ja29ueG9wdWluZGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0MDE5NTAsImV4cCI6MjA1ODk3Nzk1MH0.MKUGpLxfF5bhtqOAo0aBs0daOMpMfkIqgwZ2ntIvQi4'}`
          },
          body: JSON.stringify({
            messages: [
              ...conversationHistory,
              { role: "user", content: userMessage }
            ],
            language: localStorage.getItem('selectedLanguage') || 'en'
          })
        });

        if (!response.ok) {
          // Try to parse error body for detailed message
          let errorMsg = 'Failed to get response from AI';
          try {
            const errorData = await response.json();
            errorMsg = errorData?.error || errorData?.message || errorData?.details || errorMsg;
          } catch { /* ignore parse errors */ }
          throw new Error(errorMsg);
        }
        if (!response.body) {
          throw new Error('No response body from AI');
        }

        // Process streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            // Process complete lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith(':')) continue;
              
              if (trimmed.startsWith('data: ')) {
                const data = trimmed.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.content;
                  if (content) {
                    fullText += content;
                    // Update immediately for each token
                    setMessages(prev => 
                      prev.map(m => 
                        m.id === aiMessageId 
                          ? { ...m, text: fullText }
                          : m
                      )
                    );
                    // Force scroll to bottom as text appears
                    scrollToBottom();
                  }
                } catch (e) {
                  console.error('Error parsing stream data:', e);
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream reading error:', error);
        }

        if (!fullText) {
          throw new Error('Failed to generate AI response');
        }

        const aiResponseText = fullText;
        
        // Check if this is a quiz question and update state
        if (isQuizMode && aiResponseText.includes('?')) {
          setLastQuestionTime(new Date());
        }

        // Generate speech from the AI response text only if voice is enabled
        let audioUrl = null;
        
        // Check if voice is enabled before generating speech
        if (isVoiceEnabled) {
          try {
            // Limit text length for voice generation
            const textForVoice = aiResponseText.length > 500 ? aiResponseText.substring(0, 500) + "..." : aiResponseText;
            
            console.log('Generating voice response with voice:', selectedVoice);
            const voiceResponse = await supabase.functions.invoke('text-to-voice', {
              body: { 
                text: textForVoice,
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
            } else if (voiceResponse.data?.audioContent) {
              try {
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
              } catch (audioProcessingError) {
                console.error('Audio processing error:', audioProcessingError);
                // Continue without voice
              }
            }
          } catch (voiceError) {
            console.error('Voice generation failed:', voiceError);
            // Continue without voice - don't break the chat flow
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
