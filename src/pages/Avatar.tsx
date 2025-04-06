
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Pause, Send, Mic, Square } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import AIAvatar from '@/components/AIAvatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface Message {
  id?: string;
  text: string;
  timestamp: Date;
  audioUrl?: string;
  isPlaying?: boolean;
  isFromUser: boolean;
  type: 'text' | 'voice';
  tokenCount?: number;
}

const Avatar = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Welcome to the Avatar Interaction Page! Type a message below to see the avatar speak.",
      timestamp: new Date(),
      isFromUser: false,
      type: 'text',
      tokenCount: 20
    }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  
  // Avatar settings
  const [currentAvatarStyle, setCurrentAvatarStyle] = useState<'teacher' | 'casual' | 'professional' | 'friendly'>('teacher');
  const [textMessage, setTextMessage] = useState('');
  const [activeSpeakingMessage, setActiveSpeakingMessage] = useState<string | null>(null);
  const [twoWayConversation, setTwoWayConversation] = useState(false);
  const [totalTokensUsed, setTotalTokensUsed] = useState(0);
  const monthlyLimit = 5000;
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioData, setAudioData] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioData(audioBlob);
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result?.toString().split(',')[1];
          
          if (base64Audio) {
            await processVoiceToText(base64Audio);
          }
        };
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Could not access microphone: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const processVoiceToText = async (audioBase64: string) => {
    try {
      const response = await supabase.functions.invoke('voice-to-text', {
        body: { audio: audioBase64 },
      });
      
      if (response.error) throw new Error(response.error.message);
      
      const transcribedText = response.data.text;
      const tokenCount = Math.ceil(transcribedText.length / 4);
      
      const userMessageId = await saveMessageToDatabase(
        transcribedText, 
        'voice', 
        null, 
        true, 
        tokenCount, 
        'user_input'
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
      setTotalTokensUsed(prev => prev + tokenCount);
      
      await getAIResponse(transcribedText);
      
    } catch (error: any) {
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
        true, 
        tokenCount, 
        'user_input'
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

  const getAIResponse = async (userMessage: string) => {
    try {
      const aiResponse = `I've processed your message: "${userMessage}". How can I help you further?`;
      const tokenCount = Math.ceil(aiResponse.length / 4);
      
      const voiceResponse = await supabase.functions.invoke('text-to-voice', {
        body: { text: aiResponse, voice: 'alloy' },
      });
      
      if (voiceResponse.error) throw new Error(voiceResponse.error.message);
      
      const base64Audio = voiceResponse.data.audioContent;
      const audioBlob = base64ToBlob(base64Audio, 'audio/mp3');
      
      const aiMessageId = await saveMessageToDatabase(aiResponse, 'voice', null, false, tokenCount, 'ai_response');
      
      const audioUrl = await uploadAudioFile(audioBlob, aiMessageId);
      
      await supabase
        .from('messages')
        .update({ file_url: audioUrl })
        .eq('id', aiMessageId);
      
      const aiMessage: Message = {
        id: aiMessageId,
        text: aiResponse,
        timestamp: new Date(),
        audioUrl: audioUrl,
        isFromUser: false,
        type: 'voice',
        tokenCount: tokenCount
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setTotalTokensUsed(prev => prev + tokenCount);
      
      setTimeout(() => {
        if (aiMessageId) {
          handlePlayAudio(aiMessageId);
        }
      }, 500);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to get AI response: " + error.message,
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
    isFromUser: boolean = true,
    tokenCount: number = 0,
    feature: string = 'avatar_chat'
  ): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          user_id: user?.id,
          content,
          type,
          file_url: fileUrl,
          is_from_user: isFromUser
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

  const handlePlayAudio = (messageId: string) => {
    if (!audioRefs.current[messageId]) {
      const message = messages.find(m => m.id === messageId);
      
      if (message?.audioUrl) {
        const audio = new Audio(message.audioUrl);
        audioRefs.current[messageId] = audio;
        
        audio.onended = () => {
          setMessages(messages => 
            messages.map(m => 
              m.id === messageId ? { ...m, isPlaying: false } : m
            )
          );
          setActiveSpeakingMessage(null);
        };
      }
    }
    
    const audio = audioRefs.current[messageId];
    
    if (audio) {
      Object.entries(audioRefs.current).forEach(([id, audioElement]) => {
        if (id !== messageId && audioElement) {
          audioElement.pause();
          audioElement.currentTime = 0;
          
          setMessages(messages => 
            messages.map(m => 
              m.id === id ? { ...m, isPlaying: false } : m
            )
          );
        }
      });
      
      audio.play();
      setActiveSpeakingMessage(messageId);
      
      setMessages(messages => 
        messages.map(m => 
          m.id === messageId ? { ...m, isPlaying: true } : m
        )
      );
    }
  };

  const handlePauseAudio = (messageId: string) => {
    const audio = audioRefs.current[messageId];
    
    if (audio) {
      audio.pause();
      setActiveSpeakingMessage(null);
      
      setMessages(messages => 
        messages.map(m => 
          m.id === messageId ? { ...m, isPlaying: false } : m
        )
      );
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
            <h1 className="text-xl font-bold">Avatar Interactions</h1>
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
        
        <main className="flex-1 flex flex-col p-4 overflow-hidden">
          <Card className="mb-4 p-4 bg-white/5 border-white/20">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="space-y-2">
                <h2 className="text-lg font-medium">Avatar Settings</h2>
                <div className="flex items-center gap-4">
                  <Select 
                    value={currentAvatarStyle} 
                    onValueChange={(value: 'teacher' | 'casual' | 'professional' | 'friendly') => setCurrentAvatarStyle(value)}
                  >
                    <SelectTrigger className="w-[180px] bg-white/5 border-white/20">
                      <SelectValue placeholder="Select avatar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="conversation-mode"
                      checked={twoWayConversation}
                      onCheckedChange={setTwoWayConversation}
                    />
                    <Label htmlFor="conversation-mode">Two-way conversation</Label>
                  </div>
                </div>
              </div>
              
              <div className="text-center text-white/70">
                {twoWayConversation ? 
                  "Both you and the AI will use avatars during conversation" :
                  "Only the AI will use an avatar during conversation"
                }
              </div>
            </div>
          </Card>
          
          {/* AI Avatar display - takes full width and height */}
          <div className="flex-1 flex items-center justify-center mb-4">
            <AIAvatar 
              isSpeaking={!!activeSpeakingMessage} 
              avatarStyle={currentAvatarStyle}
              className="w-full h-full max-h-[60vh]"
            />
          </div>
          
          {/* Messages history - hidden visually but maintains scroll position */}
          <div className="sr-only">
            {messages.map((message, index) => (
              <div key={index}>{message.text}</div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="border-t border-white/20 pt-4 space-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Textarea 
                  placeholder="Type your message here..."
                  className="bg-white/5 border-white/20 resize-none min-h-[100px]"
                  value={textMessage}
                  onChange={(e) => setTextMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                />
                
                <Button
                  className="self-end bg-purple-600 hover:bg-purple-700"
                  onClick={handleStartRecording}
                  disabled={isRecording}
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
              
              {isRecording && (
                <div className="flex justify-center my-2">
                  <Button 
                    onClick={handleStopRecording}
                    variant="destructive"
                    className="animate-pulse"
                  >
                    Recording... {recordingTime}s <Square className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
              
              <Button
                className="w-full bg-white text-black hover:bg-gray-200 font-bold text-lg py-6"
                onClick={handleSendTextMessage}
                disabled={!textMessage.trim() && !isRecording}
              >
                <Send className="h-5 w-5 mr-2" />
                Send Message
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Avatar;
