import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/AppSidebar';
import { toast } from '@/components/ui/use-toast';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useAudioHandler } from '@/hooks/useAudioHandler';
import { Message } from '@/types/message';
import TokenUsageDisplay from '@/components/voice/TokenUsageDisplay';
import ChatHeader from '@/components/voice/ChatHeader';
import ChatContainer from '@/components/voice/ChatContainer';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import OpenAIKeyForm from '@/components/OpenAIKeyForm';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

const OPENAI_VOICES = [
  { label: 'Alloy (Default)', value: 'alloy' },
  { label: 'Echo', value: 'echo' },
  { label: 'Fable', value: 'fable' },
  { label: 'Onyx', value: 'onyx' },
  { label: 'Nova', value: 'nova' },
  { label: 'Shimmer', value: 'shimmer' },
];

const Voice = () => {
  const { user, session } = useAuth();
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
  const [textMessage, setTextMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [selectedVoice, setSelectedVoice] = useState('alloy');

  const [totalTokensUsed, setTotalTokensUsed] = useState(0);
  const [inputTokens, setInputTokens] = useState(0);
  const [outputTokens, setOutputTokens] = useState(0);
  const monthlyLimit = 5000;

  const [apiKeyError, setApiKeyError] = useState(false);

  const {
    isRecording,
    recordingTime,
    audioData,
    setAudioData,
    handleStartRecording,
    handleStopRecording
  } = useVoiceRecorder();

  const {
    handlePlayAudio,
    handlePauseAudio,
    activeSpeakingMessage
  } = useAudioHandler();

  useEffect(() => {
    if (user) {
      fetchMessages();
      fetchTokenUsage();
      checkOpenAIKey();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTokenUsage = async () => {
    // Placeholder for token usage fetching logic
    // This would typically fetch from your backend or database
    // For now, we'll just use the state values
  };

  const fetchMessages = async () => {
    // Placeholder for messages fetching logic
    // This would typically fetch from your backend or database
    // For now, we'll just use the initial welcome message
  };

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
            setApiKeyError(true);
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
        
        // Simulate token counting without database access
        setInputTokens(prev => prev + (userMessage.tokenCount || 0));
        setTotalTokensUsed(prev => prev + (userMessage.tokenCount || 0));
        
        await getAIResponse(transcribedText);
        
      } catch (error: any) {
        // Remove the processing message
        setMessages(prev => prev.filter(m => m.id !== processingMessageId));
        
        console.error("Error in processVoiceToText:", error);
        toast({
          title: "Error",
          description: "Failed to process voice: " + error.message,
          variant: "destructive"
        });
      }
      
    } catch (error: any) {
      console.error("Error in processVoiceToText:", error);
      toast({
        title: "Error",
        description: "Failed to process voice: " + error.message,
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
      
      // Simulate token counting without database access
      setInputTokens(prev => prev + tokenCount);
      setTotalTokensUsed(prev => prev + tokenCount);
      
      await getAIResponse(textMessage);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message: " + error.message,
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
      
      // Simulate token counting without database access
      setInputTokens(prev => prev + tokenCount);
      setTotalTokensUsed(prev => prev + tokenCount);
      
      await getAIResponse(`I've uploaded a file named ${file.name}. Can you help me with this?`);
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: "Failed to upload file: " + error.message,
        variant: "destructive"
      });
    }
  };

  const getAIResponse = async (userMessage: string) => {
    try {
      const processingMessageId = `processing-${Date.now()}`;
      const processingMessage: Message = {
        id: processingMessageId,
        text: "Generating voice response...",
        timestamp: new Date(),
        isFromUser: false,
        type: 'text',
        tokenCount: 0
      };

      setMessages(prev => [...prev, processingMessage]);

      try {
        // Pass selectedVoice here
        const response = await supabase.functions.invoke('text-to-voice', {
          body: { 
            text: "I've processed your message: \"" + userMessage + "\". How can I help you further?",
            voice: selectedVoice || 'alloy'
          }
        });

        if (response.error) {
          if (response.error.message && response.error.message.includes('API key')) {
            setApiKeyError(true);
          }
          throw new Error(response.error.message || 'Failed to generate speech');
        }

        const base64Audio = response.data.audioContent;

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
        const aiMessage: Message = {
          id: aiMessageId,
          text: "I've processed your message: \"" + userMessage + "\". How can I help you further?",
          timestamp: new Date(),
          audioUrl: audioUrl,
          isFromUser: false,
          type: 'voice',
          tokenCount: 10
        };

        setMessages(prev => [...prev, aiMessage]);
        setOutputTokens(prev => prev + 10);
        setTotalTokensUsed(prev => prev + 10);

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

  const handleVoiceResponse = async () => {
    // Voice response handling logic
    if (textMessage.trim()) {
      await getAIResponse(textMessage);
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
          onStartRecording={handleStartRecording}
          onStopRecording={handleRecordStop}
        />

        <div className="flex-1 flex flex-col px-4 py-2 space-y-4 overflow-hidden bg-gray-900/50">
          {apiKeyError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>OpenAI API Key Error</AlertTitle>
              <AlertDescription>
                The OpenAI API key is not configured on the server. Please contact the administrator to set up the OpenAI API key in Supabase secrets.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-row items-center gap-4 mb-2">
            <TokenUsageDisplay
              totalTokensUsed={totalTokensUsed}
              monthlyLimit={monthlyLimit}
              inputTokens={inputTokens}
              outputTokens={outputTokens}
            />
            <div className="flex items-center gap-2">
              <label htmlFor="voice-select" className="text-sm font-medium text-white/80">Voice:</label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger id="voice-select" className="w-[140px] bg-white/5 border-white/20">
                  <SelectValue placeholder="Choose voice" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 z-50">
                  {OPENAI_VOICES.map(voice => (
                    <SelectItem key={voice.value} value={voice.value}>
                      {voice.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <ChatContainer
            messages={messages}
            textMessage={textMessage}
            file={file}
            onSendText={handleSendTextMessage}
            onVoiceResponse={handleVoiceResponse}
            onFileUpload={handleFileUpload}
            setTextMessage={setTextMessage}
            setFile={setFile}
            onKeyPress={handleKeyPress}
            onPlayAudio={(messageId) => handlePlayAudio(messageId, messages, setMessages)}
            onPauseAudio={(messageId) => handlePauseAudio(messageId, messages, setMessages)}
            messagesEndRef={messagesEndRef}
          />
        </div>
      </div>
    </div>
  );
};

export default Voice;
