import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/AppSidebar';
import { toast } from '@/components/ui/use-toast';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useMessageHandler } from '@/hooks/useMessageHandler';
import { useVoiceSettings } from '@/hooks/useVoiceSettings';
import ChatHeader from '@/components/voice/ChatHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import MessageList from '@/components/MessageList';
import ApiKeyErrorAlert from '@/components/voice/ApiKeyErrorAlert';
import TokenLimitAlert from '@/components/voice/TokenLimitAlert';
import VoiceSettings from '@/components/voice/VoiceSettings';
import QuizModeAnalysis from '@/components/voice/QuizModeAnalysis';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/message';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizontal, Mic, MicOff, Upload, X, Settings, BarChart3, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Voice = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden">
      <div className="w-64 flex-shrink-0 border-r border-white/10">
        <AppSidebar />
      </div>

      <div className="flex-1 flex flex-col max-h-screen overflow-hidden shadow-2xl">
        {/* Top Navigation */}
        <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-white">Voice Chat</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/progress')}
                className="text-white hover:bg-white/10 rounded-xl px-4 py-2"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/settings')}
                className="text-white hover:bg-white/10 rounded-xl px-4 py-2"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col px-4 py-2 space-y-4 overflow-hidden bg-gray-900/50">
          <ApiKeyErrorAlert visible={apiKeyError} />
          <TokenLimitAlert isTokenLimitReached={isTokenLimitReached} monthlyLimit={monthlyLimit} />

          <VoiceSettings 
            selectedVoice={selectedVoice}
            setSelectedVoice={changeVoice}
            isQuizMode={isQuizMode}
            setIsQuizMode={setIsQuizMode}
            totalTokensUsed={totalTokensUsed}
            monthlyLimit={monthlyLimit}
            inputTokens={inputTokens}
            outputTokens={outputTokens}
            isTokenLimitReached={isTokenLimitReached}
            isVoiceEnabled={isVoiceEnabled}
            onToggleVoice={toggleVoice}
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

            {/* Enhanced Message Input */}
            <div className="pt-4 border-t border-white/10">
              <div className={`${isTokenLimitReached ? 'opacity-60 pointer-events-none' : ''}`}>
                {file && (
                  <div className="mb-3 flex items-center gap-2 bg-white/10 p-2 rounded-xl">
                    <Upload className="h-4 w-4 text-blue-400" />
                    <span className="flex-1 truncate text-sm">{file.name}</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setFile(null)}
                      className="h-6 w-6 p-0 hover:bg-white/10"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                
                <div className="flex items-end space-x-2">
                  <div className="relative flex-1">
                    <Textarea
                      placeholder="Type your message..."
                      value={textMessage}
                      onChange={(e) => setTextMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="min-h-[60px] bg-white/5 border-white/30 resize-none pr-32 text-white placeholder-white/60"
                      disabled={isTokenLimitReached}
                    />
                    
                    {/* Input Controls */}
                    <div className="absolute right-2 top-2 flex items-center space-x-1">
                      {/* File Input */}
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isTokenLimitReached}
                        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
                        disabled={isTokenLimitReached}
                        title="Upload file"
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                      
                      {/* Voice Input */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={isRecording ? handleRecordStop : (isTokenLimitReached ? () => {
                          toast({
                            title: "Token Limit Reached",
                            description: "You've reached your monthly token limit. Please try again next month.",
                            variant: "destructive"
                          });
                        } : handleStartRecording)}
                        className={`h-8 w-8 p-0 ${isRecording ? 'text-red-400 hover:text-red-300' : 'text-white/70 hover:text-white'} hover:bg-white/10`}
                        disabled={isTokenLimitReached}
                        title={isRecording ? 'Stop recording' : 'Start recording'}
                      >
                        {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                      
                      {/* Voice Response Toggle */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleVoice}
                        className={`h-8 w-8 p-0 ${isVoiceEnabled ? 'text-purple-400 hover:text-purple-300' : 'text-white/70 hover:text-white'} hover:bg-white/10`}
                        disabled={isTokenLimitReached}
                        title={isVoiceEnabled ? 'Voice responses enabled' : 'Voice responses disabled'}
                      >
                        {isVoiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Send Button */}
                  <Button
                    onClick={handleSendTextMessage}
                    disabled={!textMessage.trim() || isTokenLimitReached}
                    className="bg-white/10 hover:bg-white/20 px-4 py-3 rounded-xl"
                  >
                    <SendHorizontal className="h-5 w-5" />
                  </Button>
                  
                  {/* File Upload Button */}
                  {file && (
                    <Button 
                      onClick={handleFileUpload}
                      disabled={isTokenLimitReached}
                      className="bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-xl"
                    >
                      Upload
                    </Button>
                  )}
                </div>
                
                {/* Recording Indicator */}
                {isRecording && (
                  <div className="mt-2 flex items-center justify-center text-red-400 text-sm">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse mr-2"></div>
                    Recording... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Voice;
