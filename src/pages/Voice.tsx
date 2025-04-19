import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Mic, Square } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
    if (!user) return;
    
    try {
      const { data: tokenData, error: tokenError } = await supabase
        .from('token_usage')
        .select('tokens_used, feature')
        .eq('user_id', user.id);
        
      if (tokenError) throw tokenError;
      
      if (tokenData) {
        let inputCount = 0;
        let outputCount = 0;
        
        tokenData.forEach(token => {
          if (token.feature.includes('user_input')) {
            inputCount += token.tokens_used;
          } else {
            outputCount += token.tokens_used;
          }
        });
        
        setInputTokens(inputCount);
        setOutputTokens(outputCount);
        setTotalTokensUsed(inputCount + outputCount);
      }
    } catch (error: any) {
      console.error("Error fetching token usage:", error);
    }
  };

  const fetchMessages = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const formattedMessages = data.map((msg: MessageFromDB) => ({
          id: msg.id,
          text: msg.content,
          timestamp: new Date(msg.created_at),
          audioUrl: msg.type === 'voice' ? msg.file_url : undefined,
          fileUrl: msg.type === 'file' ? msg.file_url : undefined,
          fileName: msg.file_name || (msg.type === 'file' ? 'Attachment' : undefined),
          isPlaying: false,
          isFromUser: msg.is_from_user,
          type: msg.type as 'text' | 'voice' | 'file',
          tokenCount: Math.ceil(msg.content.length / 4),
          description: msg.description || undefined
        }));
        
        setMessages(prev => [prev[0], ...formattedMessages]);
        
        const inputCount = formattedMessages
          .filter(msg => msg.isFromUser)
          .reduce((acc, msg) => acc + (msg.tokenCount || 0), 0);
          
        const outputCount = formattedMessages
          .filter(msg => !msg.isFromUser)
          .reduce((acc, msg) => acc + (msg.tokenCount || 0), 0);
          
        setInputTokens(inputCount);
        setOutputTokens(outputCount);
        setTotalTokensUsed(inputCount + outputCount);
      }
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error fetching messages",
        description: error.message,
        variant: "destructive"
      });
    }
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
          },
          body: JSON.stringify({
            text: "I'm listening. What would you like to talk about?",
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
          text: "I'm listening. What would you like to talk about?",
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
      } catch (err: any) {
        // Remove the processing message
        setMessages(prev => prev.filter(m => m.id !== processingMessageId));
        
        console.error("Error generating voice response:", err);
        toast({
          title: "Error",
          description: "Failed to generate voice response: " + err.message,
          variant: "destructive"
        });
      }
      
    } catch (error: any) {
      console.error("Error generating voice response:", error);
      toast({
        title: "Error",
        description: "Failed to generate voice response: " + error.message,
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
    <div className="flex h-screen w-full overflow-hidden bg-black text-white">
      <div className="hidden md:block">
        <AppSidebar />
      </div>
      
      <div className="flex-1 flex flex-col h-full w-full">
        <header className="p-4 border-b border-white/20 flex justify-between items-center">
          <div className="flex items-center">
            <div className="md:hidden mr-4">
              <AppSidebar />
            </div>
            <h1 className="text-xl font-bold">Teachly AI Assistant</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="border-white/30 hover:bg-white/10"
            >
              {totalTokensUsed} / {monthlyLimit} tokens
            </Button>
          </div>
        </header>
        
        <main className="flex-1 flex flex-col p-4 overflow-hidden max-w-3xl mx-auto w-full">
          <OpenAIKeyForm />
          
          <div className="mb-6 flex justify-center">
            {isRecording ? (
              <Button 
                onClick={handleRecordStop}
                variant="destructive"
                size="lg"
                className="w-full md:w-auto flex items-center justify-center gap-2 py-6 text-lg"
              >
                <div className="animate-pulse mr-1 text-white">●</div>
                <span className="font-bold text-white">{recordingTime}s • STOP RECORDING</span>
                <Square className="h-5 w-5 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleStartRecording}
                size="lg"
                disabled={!isOpenAIKeySet}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold text-lg w-full md:w-auto py-6"
              >
                <Mic className="h-6 w-6 mr-2" />
                Record Voice Message
              </Button>
            )}
          </div>
          
          <MessageList 
            messages={messages}
            onPlayAudio={(messageId) => handlePlayAudio(messageId, messages, setMessages)}
            onPauseAudio={(messageId) => handlePauseAudio(messageId, messages, setMessages)}
          />
          <div ref={messagesEndRef} />
          
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
        </main>
      </div>
    </div>
  );
};

export default Voice;
