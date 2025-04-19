
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
  const [messages, setMessages] = useState<Message[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  
  // Avatar settings
  const [currentAvatarStyle, setCurrentAvatarStyle] = useState<'teacher' | 'casual' | 'professional' | 'friendly'>('teacher');
  const [textMessage, setTextMessage] = useState('');
  const [activeSpeakingMessage, setActiveSpeakingMessage] = useState<string | null>(null);
  const [twoWayConversation, setTwoWayConversation] = useState(true);
  const [totalTokensUsed, setTotalTokensUsed] = useState(0);
  const monthlyLimit = 5000;
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioData, setAudioData] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Avatar animation states
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
  const [isAvatarListening, setIsAvatarListening] = useState(false);
  const [isAvatarThinking, setIsAvatarThinking] = useState(false);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Set avatar speaking state based on active speaking message
    setIsAvatarSpeaking(!!activeSpeakingMessage);
  }, [activeSpeakingMessage]);

  useEffect(() => {
    // Set avatar listening state based on recording state
    setIsAvatarListening(isRecording);
  }, [isRecording]);

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
            setIsAvatarThinking(true);
            await processVoiceToText(base64Audio);
            setIsAvatarThinking(false);
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
      setIsAvatarListening(false);
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
      setIsAvatarThinking(false);
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
      setIsAvatarThinking(true);
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
      setIsAvatarThinking(false);
    } catch (error: any) {
      setIsAvatarThinking(false);
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
      setIsAvatarSpeaking(false);
      setIsAvatarThinking(false);
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
      // Stop any other playing audio
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
      
      audio.play().catch(error => {
        console.error("Error playing audio:", error);
        toast({
          title: "Error",
          description: "Could not play audio: " + error.message,
          variant: "destructive"
        });
      });
      
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
            <div className="flex items-center space-x-2 mr-4">
              <Select 
                value={currentAvatarStyle} 
                onValueChange={(value: 'teacher' | 'casual' | 'professional' | 'friendly') => setCurrentAvatarStyle(value)}
              >
                <SelectTrigger className="w-[160px] bg-white/5 border-white/20">
                  <SelectValue placeholder="Avatar Style" />
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
                <Label htmlFor="conversation-mode">Two-way</Label>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              className="border-white/30 hover:bg-white/10"
            >
              {totalTokensUsed} / {monthlyLimit} tokens
            </Button>
          </div>
        </header>
        
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* AI Avatar display - covers full screen */}
          <div className="absolute inset-0 flex items-center justify-center z-0">
            <AIAvatar 
              isSpeaking={isAvatarSpeaking} 
              isListening={isAvatarListening}
              isThinking={isAvatarThinking}
              avatarStyle={currentAvatarStyle}
              className="w-full h-full"
            />
          </div>
          
          {/* Voice message controls - display for last message */}
          {messages.length > 0 && !messages[messages.length - 1].isFromUser && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
              <Card className="bg-black/50 border-white/20 p-2 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  {activeSpeakingMessage === messages[messages.length - 1].id ? (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-white/30 bg-white/10"
                      onClick={() => messages[messages.length - 1].id && handlePauseAudio(messages[messages.length - 1].id)}
                    >
                      <Pause className="h-4 w-4 mr-2" /> Pause
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-white/30 bg-white/10"
                      onClick={() => messages[messages.length - 1].id && handlePlayAudio(messages[messages.length - 1].id)}
                    >
                      <Play className="h-4 w-4 mr-2" /> Play
                    </Button>
                  )}
                  
                  <div className="text-sm max-w-[250px] truncate">
                    {messages[messages.length - 1].text}
                  </div>
                </div>
              </Card>
            </div>
          )}
          
          {/* Text input positioned at the bottom */}
          <div className="mt-auto relative z-10 p-4 bg-gradient-to-t from-black to-transparent">
            <div className="max-w-3xl mx-auto w-full">
              <div className="border-t border-white/20 pt-4 space-y-4">
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
                
                <div className="flex gap-2">
                  <Textarea 
                    placeholder={messages.length === 0 ? "The avatar will respond when you send a message..." : "Type your message here..."}
                    className="bg-white/5 border-white/20 resize-none min-h-[100px]"
                    value={textMessage}
                    onChange={(e) => setTextMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                  />
                  
                  <div className="flex flex-col gap-2">
                    <Button
                      className="h-1/2 bg-green-600 hover:bg-green-700"
                      onClick={handleSendTextMessage}
                      disabled={!textMessage.trim()}
                      title="Send message"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      className="h-1/2 bg-blue-500 hover:bg-blue-600"
                      onClick={handleStartRecording}
                      disabled={isRecording}
                      title="Record voice message"
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Hidden messages for state management */}
              <div className="sr-only">
                {messages.map((message, index) => (
                  <div key={index}>{message.text}</div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Avatar;
