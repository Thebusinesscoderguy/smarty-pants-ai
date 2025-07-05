import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/AppSidebar';
import { toast } from '@/components/ui/use-toast';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useMessageHandler } from '@/hooks/useMessageHandler';
import { useVoiceSettings } from '@/hooks/useVoiceSettings';
import { ModernChatInterface } from '@/components/voice/ModernChatInterface';
import { VoiceControlPanel } from '@/components/voice/VoiceControlPanel';
import { StatsOverlay } from '@/components/voice/StatsOverlay';
import { supabase } from '@/integrations/supabase/client';

const Voice = () => {
  const { user } = useAuth();
  const [textMessage, setTextMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  const {
    isVoiceEnabled,
    selectedVoice,
    toggleVoice,
    changeVoice
  } = useVoiceSettings();

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
    incrementTokenCount,
    getLegacyMessages
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
      const processingMessageId = `processing-${Date.now()}`;
      const processingMessage = {
        id: processingMessageId,
        content: "🎤 Processing your voice message...",
        timestamp: new Date(),
        isFromUser: false,
        type: 'text',
        text: "🎤 Processing your voice message...",
        tokenCount: 0
      };
      
      setMessages(prev => [...prev, processingMessage]);
      
      try {
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
        
        setMessages(prev => prev.filter(m => m.id !== processingMessageId));
        
        const userMessage = {
          id: `voice-${Date.now()}`,
          content: transcribedText,
          timestamp: new Date(),
          isFromUser: true,
          type: 'voice',
          text: transcribedText,
          tokenCount: Math.ceil(transcribedText.length / 4),
          audioUrl: audioData ? URL.createObjectURL(audioData) : undefined
        };
        
        setMessages(prev => [...prev, userMessage]);
        
        incrementTokenCount(userMessage.tokenCount || 0);
        trackResponseTime(transcribedText, messages);
        
        await getAIResponse(transcribedText, selectedVoice);
        
      } catch (error: any) {
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
      
      const tempId = `text-${Date.now()}`;
      
      const newUserMessage = {
        id: tempId,
        content: textMessage,
        timestamp: new Date(),
        isFromUser: true,
        type: 'text',
        text: textMessage,
        tokenCount: tokenCount
      };
      
      setMessages(prev => [...prev, newUserMessage]);
      setTextMessage('');
      
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
      const messageText = `📎 Uploaded file: ${file.name}`;
      const tokenCount = Math.ceil(messageText.length / 4);
      
      const fileUrl = URL.createObjectURL(file);
      
      const newUserMessage = {
        id: `file-${Date.now()}`,
        content: messageText,
        timestamp: new Date(),
        fileUrl: fileUrl,
        fileName: file.name,
        isFromUser: true,
        type: 'file',
        text: messageText,
        tokenCount: tokenCount
      };
      
      setMessages(prev => [...prev, newUserMessage]);
      setFile(null);
      
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

  const handleRecordStop = async () => {
    handleStopRecording();
    
    if (audioData) {
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

  const legacyMessages = getLegacyMessages();

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-purple-900/30 to-slate-900/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-700/20 via-slate-900/20 to-slate-900/20"></div>
      </div>

      {/* Sidebar */}
      <div className="relative z-10 w-64 flex-shrink-0 border-r border-white/10 backdrop-blur-xl bg-black/20">
        <AppSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10 backdrop-blur-sm">
        {/* Control Panel */}
        <VoiceControlPanel
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
          apiKeyError={apiKeyError}
          isTokenLimitReached={isTokenLimitReached}
          monthlyLimit={monthlyLimit}
          selectedVoice={selectedVoice}
          changeVoice={changeVoice}
          isQuizMode={isQuizMode}
          setIsQuizMode={setIsQuizMode}
          totalTokensUsed={totalTokensUsed}
          inputTokens={inputTokens}
          outputTokens={outputTokens}
          isVoiceEnabled={isVoiceEnabled}
          toggleVoice={toggleVoice}
          responseTimes={responseTimes}
          userStrengths={userStrengths}
          userWeaknesses={userWeaknesses}
          getFastResponseTopics={() => getFastResponseTopics().join(', ')}
          getSlowResponseTopics={() => getSlowResponseTopics().join(', ')}
        />

        {/* Chat Interface */}
        <div className="flex-1 overflow-hidden">
          <ModernChatInterface
            messages={legacyMessages}
            textMessage={textMessage}
            setTextMessage={setTextMessage}
            file={file}
            setFile={setFile}
            onSendText={handleSendTextMessage}
            onFileUpload={handleFileUpload}
            onKeyPress={handleKeyPress}
            onPlayAudio={(messageId) => handlePlayAudio(messageId)}
            onPauseAudio={(messageId) => handlePauseAudio(messageId)}
            messagesEndRef={messagesEndRef}
            disabled={isTokenLimitReached}
          />
        </div>

        {/* Stats Overlay */}
        <StatsOverlay
          totalTokensUsed={totalTokensUsed}
          monthlyLimit={monthlyLimit}
          isQuizMode={isQuizMode}
          responseTimes={responseTimes}
        />
      </div>
    </div>
  );
};

export default Voice;
