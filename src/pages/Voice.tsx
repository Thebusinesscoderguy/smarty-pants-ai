
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/AppSidebar';
import { toast } from '@/components/ui/use-toast';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useMessageHandler } from '@/hooks/useMessageHandler';
import ChatHeader from '@/components/voice/ChatHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import MessageList from '@/components/MessageList';
import VoiceMessageInput from '@/components/VoiceMessageInput';
import ApiKeyErrorAlert from '@/components/voice/ApiKeyErrorAlert';
import TokenLimitAlert from '@/components/voice/TokenLimitAlert';
import VoiceSettings from '@/components/voice/VoiceSettings';
import QuizModeAnalysis from '@/components/voice/QuizModeAnalysis';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/message';

const Voice = () => {
  const { user } = useAuth();
  const [textMessage, setTextMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('alloy');

  const {
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
  } = useMessageHandler();

  const {
    isRecording,
    recordingTime,
    audioData,
    setAudioData,
    handleStartRecording,
    handleStopRecording
  } = useVoiceRecorder();

  useEffect(() => {
    if (user) {
      fetchMessages();
      checkOpenAIKey();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const processVoiceToText = async (audioBase64: string) => {
    try {
      // Add a temporary message to show processing
      const processingMessageId = `processing-${Date.now()}`;
      const processingMessage: Message = {
        id: processingMessageId,
        text: "Processing your voice message...",
        timestamp: new Date(),
        isFromUser: false,
        type: 'text',
        tokenCount: 0
      };
      
      setMessages(prev => [...prev, processingMessage]);
      
      try {
        // Use supabase.functions.invoke instead of direct fetch
        const response = await supabase.functions.invoke('voice-to-text', {
          body: { audio: audioBase64 }
        });
        
        if (response.error) {
          if (response.error.message && response.error.message.includes('API key')) {
            checkOpenAIKey();
          }
          throw new Error(response.error.message || 'Failed to process voice');
        }
        
        const transcribedText = response.data.text;
        
        // Remove the processing message
        setMessages(prev => prev.filter(m => m.id !== processingMessageId));
        
        // Create a user message with the transcribed text
        const userMessage: Message = {
          id: `voice-${Date.now()}`,
          text: transcribedText,
          timestamp: new Date(),
          isFromUser: true,
          type: 'voice',
          tokenCount: Math.ceil(transcribedText.length / 4)
        };
        
        if (audioData) {
          // Convert audioData to a URL
          const audioUrl = URL.createObjectURL(audioData);
          userMessage.audioUrl = audioUrl;
        }
        
        setMessages(prev => [...prev, userMessage]);
        
        // Track tokens and response time
        incrementTokenCount(userMessage.tokenCount || 0);
        trackResponseTime(transcribedText, messages);
        
        await getAIResponse(transcribedText, selectedVoice);
        
      } catch (error: any) {
        // Remove the processing message
        setMessages(prev => prev.filter(m => m.id !== processingMessageId));
        
        console.error("Error in processVoiceToText:", error);
        toast({
          title: "Error",
          description: `Failed to process voice: ${error.message}`,
          variant: "destructive"
        });
      }
      
    } catch (error: any) {
      console.error("Error in processVoiceToText:", error);
      toast({
        title: "Error",
        description: `Failed to process voice: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleSendTextMessage = async () => {
    if (!textMessage.trim()) return;
    
    try {
      const tokenCount = Math.ceil(textMessage.length / 4);
      
      // Create a temporary ID for this message
      const tempId = `text-${Date.now()}`;
      
      const newUserMessage: Message = {
        id: tempId,
        text: textMessage,
        timestamp: new Date(),
        isFromUser: true,
        type: 'text',
        tokenCount: tokenCount
      };
      
      setMessages(prev => [...prev, newUserMessage]);
      setTextMessage('');
      
      // Track tokens and response time
      incrementTokenCount(tokenCount);
      trackResponseTime(textMessage, messages);
      
      await getAIResponse(textMessage, selectedVoice);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;
    
    try {
      const messageText = `Uploaded file: ${file.name}`;
      const tokenCount = Math.ceil(messageText.length / 4);
      
      // Create file URL directly
      const fileUrl = URL.createObjectURL(file);
      
      const newUserMessage: Message = {
        id: `file-${Date.now()}`,
        text: messageText,
        timestamp: new Date(),
        fileUrl: fileUrl,
        fileName: file.name,
        isFromUser: true,
        type: 'file',
        tokenCount: tokenCount
      };
      
      setMessages(prev => [...prev, newUserMessage]);
      setFile(null);
      
      // Track tokens
      incrementTokenCount(tokenCount);
      
      await getAIResponse(`I've uploaded a file named ${file.name}. Can you help me with this?`, selectedVoice);
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: `Failed to upload file: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleVoiceResponse = async () => {
    // Voice response handling logic
    if (textMessage.trim()) {
      await getAIResponse(textMessage, selectedVoice);
    } else {
      toast({
        title: "Empty Message",
        description: "Please enter a message to get a voice response.",
        variant: "destructive"
      });
    }
  };

  const handleRecordStop = async () => {
    handleStopRecording();
    
    if (audioData) {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioData);
      reader.onloadend = function() {
        const base64data = (reader.result as string).split(',')[1];
        processVoiceToText(base64data);
      };
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendTextMessage();
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden">
      <div className="w-64 flex-shrink-0 border-r border-white/10">
        <AppSidebar />
      </div>

      <div className="flex-1 flex flex-col max-h-screen overflow-hidden shadow-2xl">
        <ChatHeader
          isRecording={isRecording}
          recordingTime={recordingTime}
          onStartRecording={isTokenLimitReached ? () => {
            toast({
              title: "Token Limit Reached",
              description: "You've reached your monthly token limit. Please try again next month.",
              variant: "destructive"
            });
          } : handleStartRecording}
          onStopRecording={handleRecordStop}
        />

        <div className="flex-1 flex flex-col px-4 py-2 space-y-4 overflow-hidden bg-gray-900/50">
          <ApiKeyErrorAlert visible={apiKeyError} />
          <TokenLimitAlert isTokenLimitReached={isTokenLimitReached} monthlyLimit={monthlyLimit} />

          <VoiceSettings 
            selectedVoice={selectedVoice}
            setSelectedVoice={setSelectedVoice}
            isQuizMode={isQuizMode}
            setIsQuizMode={setIsQuizMode}
            totalTokensUsed={totalTokensUsed}
            monthlyLimit={monthlyLimit}
            inputTokens={inputTokens}
            outputTokens={outputTokens}
            isTokenLimitReached={isTokenLimitReached}
          />

          <QuizModeAnalysis 
            isQuizMode={isQuizMode}
            hasResponseData={responseTimes.length > 0}
            userStrengths={userStrengths}
            userWeaknesses={userWeaknesses}
            getFastResponseTopics={getFastResponseTopics}
            getSlowResponseTopics={getSlowResponseTopics}
          />

          <div className="flex-1 flex flex-col space-y-4">
            <ScrollArea className="flex-1 pr-4">
              <MessageList 
                messages={messages}
                onPlayAudio={(messageId) => handlePlayAudio(messageId, messages, setMessages)}
                onPauseAudio={(messageId) => handlePauseAudio(messageId, messages, setMessages)}
              />
              <div ref={messagesEndRef} />
            </ScrollArea>

            <div className="pt-4 border-t border-white/10">
              <VoiceMessageInput 
                onSendText={handleSendTextMessage}
                onVoiceResponse={handleVoiceResponse}
                onFileUpload={handleFileUpload}
                textMessage={textMessage}
                setTextMessage={setTextMessage}
                file={file}
                setFile={setFile}
                onKeyPress={handleKeyPress}
                disabled={isTokenLimitReached}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Voice;
