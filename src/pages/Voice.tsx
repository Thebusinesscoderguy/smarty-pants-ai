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
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
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
          description: "OpenAI API key is not set in local storage",
          variant: "destructive"
        });
        return;
      }
      
      const response = await supabase.functions.invoke('voice-to-text', {
        body: { 
          audio: audioBase64,
          apiKey: localOpenAIKey 
        },
      });
      
      if (response.error) {
        console.error('Voice to text error:', response.error);
        throw new Error(response.error.message);
      }
      
      const transcribedText = response.data.text;
      const tokenCount = Math.ceil(transcribedText.length / 4);
      
      const userMessageId = await saveMessageToDatabase(
        transcribedText, 
        'voice', 
        null, 
        null, 
        true, 
        tokenCount, 
        'user_input',
        null
      );
      
      let audioUrl = null;
      if (audioData) {
        audioUrl = await uploadAudioFile(audioData, userMessageId);
        
        await supabase
          .from('messages')
          .update({ file_url: audioUrl })
          .eq('id', userMessageId);
      }
      
      const newUserMessage: Message = {
        id: userMessageId,
        text: transcribedText,
        timestamp: new Date(),
        audioUrl: audioUrl,
        isFromUser: true,
        type: 'voice',
        tokenCount: tokenCount
      };
      
      setMessages(prev => [...prev, newUserMessage]);
      setInputTokens(prev => prev + tokenCount);
      setTotalTokensUsed(prev => prev + tokenCount);
      
      await getAIResponse(transcribedText);
      
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
      const userMessageId = await saveMessageToDatabase(
        textMessage, 
        'text', 
        null, 
        null, 
        true, 
        tokenCount, 
        'user_input',
        null
      );
      
      const newUserMessage: Message = {
        id: userMessageId,
        text: textMessage,
        timestamp: new Date(),
        isFromUser: true,
        type: 'text',
        tokenCount: tokenCount
      };
      
      setMessages(prev => [...prev, newUserMessage]);
      setTextMessage('');
      setInputTokens(prev => prev + tokenCount);
      setTotalTokensUsed(prev => prev + tokenCount);
      
      await getAIResponse(textMessage);
    } catch (error: any) {
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
      const fileUrl = await uploadFile(file);
      const messageText = `Uploaded file: ${file.name}`;
      const tokenCount = Math.ceil(messageText.length / 4);
      
      const userMessageId = await saveMessageToDatabase(
        messageText, 
        'file', 
        fileUrl, 
        file.name, 
        true, 
        tokenCount, 
        'user_input',
        null
      );
      
      const newUserMessage: Message = {
        id: userMessageId,
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
      setInputTokens(prev => prev + tokenCount);
      setTotalTokensUsed(prev => prev + tokenCount);
      
      await getAIResponse(`I've uploaded a file named ${file.name}. Can you help me with this?`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to upload file: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const filePath = `${user?.id}/${Date.now()}-${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('study_materials')
        .upload(filePath, file, {
          upsert: true,
        });
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('study_materials')
        .getPublicUrl(filePath);
      
      return urlData.publicUrl;
      
    } catch (error: any) {
      console.error("Error uploading file:", error);
      return null;
    }
  };

  const getAIResponse = async (userMessage: string) => {
    try {
      const localOpenAIKey = localStorage.getItem('openai_api_key');
      
      if (!localOpenAIKey) {
        toast({
          title: "API Key Missing",
          description: "OpenAI API key is not set in local storage",
          variant: "destructive"
        });
        return;
      }
      
      const voiceResponse = await supabase.functions.invoke('text-to-voice', {
        body: { 
          text: userMessage, 
          voice: 'alloy',
          apiKey: localOpenAIKey 
        },
      });
      
      if (voiceResponse.error) {
        console.error('Text to voice error:', voiceResponse.error);
        throw new Error(voiceResponse.error.message);
      }
      
      const base64Audio = voiceResponse.data.audioContent;
      
      const audioBlob = base64ToBlob(base64Audio, 'audio/mp3');
      
      const aiMessageId = await saveMessageToDatabase(
        "I've processed your message: \"" + userMessage + "\". How can I help you further?", 
        'voice', 
        null, 
        null, 
        false, 
        10, 
        'ai_response'
      );
      
      const audioUrl = await uploadAudioFile(audioBlob, aiMessageId);
      
      await supabase
        .from('messages')
        .update({ file_url: audioUrl })
        .eq('id', aiMessageId);
      
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
          description: "OpenAI API key is not set in local storage",
          variant: "destructive"
        });
        return;
      }
      
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
        
        const audioBlob = base64ToBlob(base64Audio, 'audio/mp3');
        
        const aiMessageId = await saveMessageToDatabase(
          "I'm listening. What would you like to talk about?", 
          'voice', 
          null, 
          null, 
          false, 
          10, 
          'ai_response'
        );
        
        const audioUrl = await uploadAudioFile(audioBlob, aiMessageId);
        
        await supabase
          .from('messages')
          .update({ file_url: audioUrl })
          .eq('id', aiMessageId);
        
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
        console.error("Error generating voice response:", err);
        throw new Error(`Failed to generate voice response: ${err.message}`);
      }
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to generate voice response: " + error.message,
        variant: "destructive"
      });
    }
  };

  const uploadAudioFile = async (audioBlob: Blob, messageId: string): Promise<string | null> => {
    try {
      const filePath = `${user?.id}/${messageId}.webm`;
      
      const { data, error } = await supabase.storage
        .from('study_materials')
        .upload(filePath, audioBlob, {
          contentType: 'audio/webm',
          upsert: true,
        });
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('study_materials')
        .getPublicUrl(filePath);
      
      return urlData.publicUrl;
      
    } catch (error: any) {
      console.error("Error uploading audio:", error);
      return null;
    }
  };

  const saveMessageToDatabase = async (
    content: string, 
    type: string, 
    fileUrl: string | null,
    fileName: string | null = null,
    isFromUser: boolean = true,
    tokenCount: number = 0,
    feature: string = 'unified_chat',
    description: string | null = null
  ): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          user_id: user?.id,
          content,
          type,
          file_url: fileUrl,
          file_name: fileName,
          is_from_user: isFromUser,
          description: description
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      await supabase.from('token_usage').insert({
        user_id: user?.id,
        tokens_used: tokenCount,
        feature: feature,
      });
      
      return data.id;
    } catch (error: any) {
      console.error("Error saving message:", error);
      throw error;
    }
  };

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    return new Blob(byteArrays, { type: mimeType });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendTextMessage();
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-black text-white">
      <div className="hidden md:flex">
        <AppSidebar />
      </div>
      
      <div className="flex-1 flex flex-col h-full w-full">
        <header className="p-4 border-b border-white/20 flex justify-between items-center">
          <div className="flex items-center">
            <div className="md:hidden mr-4">
              <Button variant="ghost" size="sm" className="p-0">
                <AppSidebar />
              </Button>
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
                onClick={handleStopRecording}
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
