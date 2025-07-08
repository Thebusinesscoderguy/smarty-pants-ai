import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useVoiceSettings } from '@/hooks/useVoiceSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatInput } from './ChatInput';
import MessageList from '@/components/MessageList';
import { Message } from '@/types/message';

export const EnhancedChatInterface = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    isVoiceEnabled,
    selectedVoice,
    toggleVoice
  } = useVoiceSettings();

  const {
    isRecording,
    recordingTime,
    audioData,
    setAudioData,
    handleStartRecording,
    handleStopRecording
  } = useVoiceRecorder();

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      text: "Hello! I'm your AI Learning Assistant. I can help you with any subject - just ask me a question, upload a file, or start a conversation. What would you like to learn about today?",
      timestamp: new Date(),
      isFromUser: false,
      type: 'text',
      tokenCount: 35
    };
    setMessages([welcomeMessage]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const processVoiceToText = async (audioBase64: string) => {
    try {
      const response = await supabase.functions.invoke('voice-to-text', {
        body: { audio: audioBase64 }
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to process voice');
      }
      
      const transcribedText = response.data.text;
      setCurrentMessage(transcribedText);
      
      toast({
        title: "Voice processed",
        description: "Your voice message has been transcribed"
      });
      
    } catch (error: any) {
      console.error("Error in processVoiceToText:", error);
      toast({
        title: "Error",
        description: `Failed to process voice: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleVoiceRecordStop = async () => {
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

  const handleFileUpload = async () => {
    if (!selectedFile || !user) return;
    
    try {
      setIsAnalyzing(true);
      
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('study_materials')
        .upload(filePath, selectedFile);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('study_materials')
        .getPublicUrl(filePath);

      const fileMessage: Message = {
        id: `file-${Date.now()}`,
        text: `Uploaded file: ${selectedFile.name}`,
        timestamp: new Date(),
        fileUrl: publicUrl,
        fileName: selectedFile.name,
        isFromUser: true,
        type: 'file',
        tokenCount: 10
      };
      
      setMessages(prev => [...prev, fileMessage]);
      setSelectedFile(null);
      
      await getAIResponse(`I've uploaded a file named ${selectedFile.name}. Can you help me analyze this?`);
      
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: `Failed to upload file: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getAIResponse = async (messageText: string) => {
    if (!messageText.trim()) return;
    
    try {
      setIsLoading(true);
      
      const response = await supabase.functions.invoke('chat-completion', {
        body: { 
          message: messageText,
          conversation_history: messages.slice(-10)
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        text: response.data.response,
        timestamp: new Date(),
        isFromUser: false,
        type: 'text',
        tokenCount: Math.ceil(response.data.response.length / 4)
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Generate voice response if enabled
      if (isVoiceEnabled && response.data.response) {
        await generateVoiceResponse(response.data.response, aiMessage.id);
      }
      
    } catch (error: any) {
      console.error("Error getting AI response:", error);
      toast({
        title: "Error",
        description: `Failed to get AI response: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateVoiceResponse = async (text: string, messageId: string) => {
    try {
      const response = await supabase.functions.invoke('text-to-voice', {
        body: { 
          text: text,
          voice: selectedVoice 
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      // Update message with audio content
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, audioContent: response.data.audioContent }
          : msg
      ));
      
    } catch (error: any) {
      console.error("Error generating voice response:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: currentMessage,
      timestamp: new Date(),
      isFromUser: true,
      type: 'text',
      tokenCount: Math.ceil(currentMessage.length / 4)
    };
    
    setMessages(prev => [...prev, userMessage]);
    const messageToSend = currentMessage;
    setCurrentMessage('');
    
    await getAIResponse(messageToSend);
  };

  const handlePlayAudio = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message?.audioContent) {
      const audio = new Audio(`data:audio/mp3;base64,${message.audioContent}`);
      audio.play();
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isPlaying: true }
          : { ...msg, isPlaying: false }
      ));
      
      audio.onended = () => {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, isPlaying: false }
            : msg
        ));
      };
    }
  };

  const handlePauseAudio = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isPlaying: false }
        : msg
    ));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <MessageList 
              messages={messages}
              onPlayAudio={handlePlayAudio}
              onPauseAudio={handlePauseAudio}
            />
            {isLoading && (
              <div className="flex justify-center py-8">
                <div className="flex items-center space-x-3 text-white/70 bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-sm">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white/70"></div>
                  <span className="text-lg">AI is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {isRecording && (
          <div className="px-6 py-2 bg-red-900/20 border-t border-red-500/30">
            <div className="flex items-center justify-center text-red-400 text-sm">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse mr-2"></div>
              Recording... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
            </div>
          </div>
        )}

        <div className="flex-shrink-0">
          <ChatInput
            currentMessage={currentMessage}
            setCurrentMessage={setCurrentMessage}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            isAnalyzing={isAnalyzing}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            isRecording={isRecording}
            onStartRecording={handleStartRecording}
            onStopRecording={handleVoiceRecordStop}
            isVoiceResponse={isVoiceEnabled}
            onToggleVoiceResponse={toggleVoice}
            onFileUpload={handleFileUpload}
          />
        </div>
      </div>
    </div>
  );
};
