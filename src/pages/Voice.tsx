
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Mic, Square } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import OpenAIKeyForm from '@/components/OpenAIKeyForm';
import MessageList from '@/components/MessageList';
import MessageInput from '@/components/MessageInput';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useAudioHandler } from '@/hooks/useAudioHandler';
import { Message, MessageFromDB } from '@/types/message';

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
  
  const [totalTokensUsed, setTotalTokensUsed] = useState(0);
  const [inputTokens, setInputTokens] = useState(0);
  const [outputTokens, setOutputTokens] = useState(0);
  const [isOpenAIKeySet, setIsOpenAIKeySet] = useState(false);
  const monthlyLimit = 5000;

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
    // Check if OpenAI API key is set
    const openAiKey = localStorage.getItem('openai_api_key');
    setIsOpenAIKeySet(!!openAiKey);
    
    if (user) {
      fetchMessages();
      fetchTokenUsage();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      const localOpenAIKey = localStorage.getItem('openai_api_key');
      
      if (!localOpenAIKey) {
        toast({
          title: "API Key Missing",
          description: "OpenAI API key is not set. Please add your API key in the form above.",
          variant: "destructive"
        });
        return;
      }
      
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
        const response = await fetch("https://twfzlbockonxopuindaw.functions.supabase.co/voice-to-text", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token || ''}`
          },
          body: JSON.stringify({ 
            audio: audioBase64,
            apiKey: localOpenAIKey 
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process voice');
        }
        
        const data = await response.json();
        const transcribedText = data.text;
        
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
      const localOpenAIKey = localStorage.getItem('openai_api_key');
      
      if (!localOpenAIKey) {
        toast({
          title: "API Key Missing",
          description: "OpenAI API key is not set. Please add your API key in the form above.",
          variant: "destructive"
        });
        return;
      }
      
      // Add a temporary message to show processing
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
        const response = await fetch("https://twfzlbockonxopuindaw.functions.supabase.co/text-to-voice", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token || ''}`
          },
          body: JSON.stringify({ 
            text: "I've processed your message: \"" + userMessage + "\". How can I help you further?",
            voice: 'alloy',
            apiKey: localOpenAIKey 
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate speech');
        }
        
        const data = await response.json();
        const base64Audio = data.audioContent;
        
        // Convert base64 to blob
        const byteCharacters = atob(base64Audio);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const audioBlob = new Blob([byteArray], { type: 'audio/mp3' });
        
        // Create URL from blob
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Remove the processing message
        setMessages(prev => prev.filter(m => m.id !== processingMessageId));
        
        // Create the AI response message
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
        // Remove the processing message
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
    <div className="flex flex-col md:flex-row h-screen w-full bg-gray-900 text-white overflow-hidden">
      <div className="w-auto md:w-64 flex-shrink-0">
        <AppSidebar />
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col w-full max-w-full p-4">
        <div className="container mx-auto w-full max-w-4xl space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Voice Assistant</h1>
            
            {isRecording ? (
              <div className="flex items-center gap-2">
                <div className="animate-pulse w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-red-400">Recording: {recordingTime}s</span>
                <Button 
                  variant="destructive"
                  size="sm"
                  onClick={handleStopRecording}
                  className="ml-2"
                >
                  <Square className="h-4 w-4 mr-1" />
                  Stop
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartRecording}
                className="bg-blue-900/20 border-blue-500/30 text-blue-400 hover:bg-blue-900/30"
              >
                <Mic className="h-4 w-4 mr-1" />
                Record Voice
              </Button>
            )}
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-6 shadow-xl">
            <div className="text-sm text-gray-400 mb-4 flex items-center justify-between">
              <div>
                Token usage: {totalTokensUsed} / {monthlyLimit}
                <span className="ml-2 text-gray-500">({inputTokens} input, {outputTokens} output)</span>
              </div>
            </div>

            <OpenAIKeyForm />
            
            <div className="flex-1 flex flex-col mt-6">
              <div className="flex-1 space-y-4 mb-6 max-h-[500px] overflow-y-auto rounded-lg bg-gray-900/50 p-4">
                <MessageList 
                  messages={messages}
                  onPlayAudio={(messageId) => handlePlayAudio(messageId, messages, setMessages)}
                  onPauseAudio={(messageId) => handlePauseAudio(messageId, messages, setMessages)}
                />
                <div ref={messagesEndRef} />
              </div>
              
              <MessageInput 
                onSendText={handleSendTextMessage}
                onVoiceResponse={handleVoiceResponse}
                onFileUpload={handleFileUpload}
                textMessage={textMessage}
                setTextMessage={setTextMessage}
                file={file}
                setFile={setFile}
                onKeyPress={handleKeyPress}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Voice;
