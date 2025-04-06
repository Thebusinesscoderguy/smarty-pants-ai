
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Pause, UserCircle2, Send, MessageCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import AIAvatar from '@/components/AIAvatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AvatarStyle } from '@/components/AIAvatar';
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
  description?: string;
}

const Avatar = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Welcome to the Avatar Interaction Page! I can speak to you with an avatar, or you can have a two-way conversation.",
      timestamp: new Date(),
      isFromUser: false,
      type: 'text',
      tokenCount: 20
    }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  
  // Avatar settings
  const [currentAvatarStyle, setCurrentAvatarStyle] = useState<AvatarStyle>('teacher');
  const [textMessage, setTextMessage] = useState('');
  const [description, setDescription] = useState('');
  const [activeSpeakingMessage, setActiveSpeakingMessage] = useState<string | null>(null);
  const [twoWayConversation, setTwoWayConversation] = useState(false);
  const [totalTokensUsed, setTotalTokensUsed] = useState(0);
  const monthlyLimit = 5000;

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        'user_input',
        description
      );
      
      const newUserMessage: Message = {
        id: userMessageId,
        text: textMessage,
        timestamp: new Date(),
        isFromUser: true,
        type: 'text',
        tokenCount: tokenCount,
        description: description || undefined
      };
      
      setMessages(prev => [...prev, newUserMessage]);
      setTextMessage('');
      setDescription('');
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
    feature: string = 'avatar_chat',
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
                    onValueChange={(value: AvatarStyle) => setCurrentAvatarStyle(value)}
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
          
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
            {messages.map((message, index) => (
              <Card 
                key={index}
                className={`p-4 ${message.isFromUser ? 'bg-purple-900/30' : 'bg-white/5'} border-white/20`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {message.isFromUser ? (
                      twoWayConversation ? 
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-600 to-blue-500 flex items-center justify-center">
                        You
                      </div> :
                      <UserCircle2 className="h-8 w-8 text-white/70" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
                        AI
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="mb-2">{message.text}</p>
                    {message.description && (
                      <div className="bg-white/5 border border-white/10 rounded p-2 mb-2">
                        <div className="flex gap-2 items-center text-blue-400">
                          <MessageCircle className="h-4 w-4" />
                          <p className="text-sm">{message.description}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      {message.audioUrl && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-white/30 hover:bg-white/10"
                          onClick={() => message.isPlaying 
                            ? handlePauseAudio(message.id!) 
                            : handlePlayAudio(message.id!)
                          }
                        >
                          {message.isPlaying ? (
                            <>
                              <Pause className="h-4 w-4 mr-1" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-1" />
                              Play
                            </>
                          )}
                        </Button>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/50">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                        <span className="text-xs text-white/50">
                          ({message.tokenCount || 0} tokens)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* AI Avatar display */}
          <div className="mx-auto mb-4 w-full max-w-md">
            <AIAvatar 
              isSpeaking={!!activeSpeakingMessage} 
              avatarStyle={currentAvatarStyle}
              className="mx-auto"
            />
          </div>
          
          <div className="border-t border-white/20 pt-4 space-y-4">
            <div className="flex flex-col gap-2">
              <Input
                placeholder="Add a description (optional)..."
                className="bg-white/5 border-white/20"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              
              <Textarea 
                placeholder="Type your message here..."
                className="bg-white/5 border-white/20 resize-none min-h-[150px]"
                value={textMessage}
                onChange={(e) => setTextMessage(e.target.value)}
                onKeyDown={handleKeyPress}
              />
              
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-white text-black hover:bg-gray-200"
                  onClick={handleSendTextMessage}
                  disabled={!textMessage.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Avatar;
