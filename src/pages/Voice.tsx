import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Square, Play, Pause, UserCircle2, Send, Paperclip } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AIAvatar from '@/components/AIAvatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface Message {
  id?: string;
  text: string;
  timestamp: Date;
  audioUrl?: string;
  isPlaying?: boolean;
  fileUrl?: string;
  fileName?: string;
  isFromUser: boolean;
  type: 'text' | 'voice' | 'file';
}

const Voice = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Welcome to the unified messaging! You can now use voice, text, or file uploads in a single conversation.",
      timestamp: new Date(),
      isFromUser: false,
      type: 'text'
    }
  ]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioData, setAudioData] = useState<Blob | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [avatarStyle, setAvatarStyle] = useState<'teacher' | 'casual' | 'professional' | 'friendly'>('teacher');
  const [avatarEmotion, setAvatarEmotion] = useState<'neutral' | 'happy' | 'confused' | 'excited'>('neutral');
  
  const [textMessage, setTextMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        const formattedMessages = data.map(msg => ({
          id: msg.id,
          text: msg.content,
          timestamp: new Date(msg.created_at),
          audioUrl: msg.type === 'voice' ? msg.file_url : undefined,
          fileUrl: msg.type === 'file' ? msg.file_url : undefined,
          fileName: msg.file_name || (msg.type === 'file' ? 'Attachment' : undefined),
          isPlaying: false,
          isFromUser: msg.is_from_user,
          type: msg.type as 'text' | 'voice' | 'file'
        }));
        
        setMessages(prev => [prev[0], ...formattedMessages]);
      }
    } catch (error: any) {
      toast({
        title: "Error fetching messages",
        description: error.message,
        variant: "destructive"
      });
    }
  };

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
      
      const userMessageId = await saveMessageToDatabase(transcribedText, 'voice', null);
      
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
        type: 'voice'
      };
      
      setMessages(prev => [...prev, newUserMessage]);
      
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
      const userMessageId = await saveMessageToDatabase(textMessage, 'text', null);
      
      const newUserMessage: Message = {
        id: userMessageId,
        text: textMessage,
        timestamp: new Date(),
        isFromUser: true,
        type: 'text'
      };
      
      setMessages(prev => [...prev, newUserMessage]);
      setTextMessage('');
      
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
      
      const userMessageId = await saveMessageToDatabase(`Uploaded file: ${file.name}`, 'file', fileUrl, file.name);
      
      const newUserMessage: Message = {
        id: userMessageId,
        text: `Uploaded file: ${file.name}`,
        timestamp: new Date(),
        fileUrl: fileUrl,
        fileName: file.name,
        isFromUser: true,
        type: 'file'
      };
      
      setMessages(prev => [...prev, newUserMessage]);
      setFile(null);
      
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
      setAvatarEmotion('neutral');
      setIsSpeaking(false);
      
      const aiResponse = `I've processed your message: "${userMessage}". How can I help you further?`;
      
      const voiceResponse = await supabase.functions.invoke('text-to-voice', {
        body: { text: aiResponse, voice: 'alloy' },
      });
      
      if (voiceResponse.error) throw new Error(voiceResponse.error.message);
      
      const base64Audio = voiceResponse.data.audioContent;
      const audioBlob = base64ToBlob(base64Audio, 'audio/mp3');
      
      const aiMessageId = await saveMessageToDatabase(aiResponse, 'voice', null, null, false);
      
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
        type: 'voice'
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
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
    fileName: string | null = null,
    isFromUser: boolean = true
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
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      await supabase.from('token_usage').insert({
        user_id: user?.id,
        tokens_used: Math.ceil(content.length / 4),
        feature: 'unified_chat',
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
        
        audio.onplay = () => {
          setIsSpeaking(true);
        };
        
        audio.onended = () => {
          setIsSpeaking(false);
          setMessages(messages => 
            messages.map(m => 
              m.id === messageId ? { ...m, isPlaying: false } : m
            )
          );
        };
        
        audio.onpause = () => {
          setIsSpeaking(false);
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
      setIsSpeaking(false);
      
      setMessages(messages => 
        messages.map(m => 
          m.id === messageId ? { ...m, isPlaying: false } : m
        )
      );
    }
  };

  const handleAvatarStyleChange = (value: string) => {
    setAvatarStyle(value as 'teacher' | 'casual' | 'professional' | 'friendly');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendTextMessage();
    }
  };

  return (
    <div className="flex min-h-screen bg-black text-white">
      <AppSidebar />
      
      <div className="flex-1 flex flex-col max-h-screen">
        <header className="p-4 border-b border-white/20 flex justify-between items-center">
          <h1 className="text-xl font-bold">Unified Chat</h1>
          <div className="flex items-center gap-2">
            <label className="text-sm text-white/70">Avatar Style</label>
            <Select value={avatarStyle} onValueChange={handleAvatarStyleChange}>
              <SelectTrigger className="w-40 bg-white/5 border-white/20">
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-white/20">
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </header>
        
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 h-full">
            <div className="col-span-1 flex flex-col space-y-4 md:border-r border-white/20 md:pr-4">
              <AIAvatar 
                isSpeaking={isSpeaking}
                isListening={isRecording}
                avatarStyle={avatarStyle}
                emotion={avatarEmotion}
                className="w-full"
              />
              
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Current Settings</h3>
                <p className="text-sm text-white/70">Style: <span className="text-white">{avatarStyle}</span></p>
                <p className="text-sm text-white/70">Status: <span className="text-white">
                  {isSpeaking ? 'Speaking' : isRecording ? 'Listening' : 'Idle'}
                </span></p>
              </div>
            </div>
            
            <div className="col-span-1 md:col-span-2 flex-1 flex flex-col h-full">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                {messages.map((message, index) => (
                  <Card 
                    key={index}
                    className={`p-4 ${message.isFromUser ? 'bg-purple-900/30' : 'bg-white/5'} border-white/20`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {message.isFromUser ? (
                          <UserCircle2 className="h-8 w-8 text-white/70" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
                            AI
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="mb-2">{message.text}</p>
                        {message.type === 'file' && message.fileUrl && (
                          <div className="bg-white/10 p-2 rounded mb-2">
                            <a 
                              href={message.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:underline flex items-center gap-1"
                            >
                              <Paperclip className="h-4 w-4" />
                              {message.fileName || 'Attachment'}
                            </a>
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
                          <span className="text-xs text-white/50">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="border-t border-white/20 pt-4 space-y-4">
                {file && (
                  <div className="flex items-center gap-2 bg-white/10 p-2 rounded">
                    <Paperclip className="h-4 w-4" />
                    <span className="flex-1 truncate">{file.name}</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setFile(null)}
                    >
                      ×
                    </Button>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                  <div className="md:col-span-9">
                    <Textarea 
                      placeholder="Type your message here..."
                      className="bg-white/5 border-white/20 resize-none min-h-[80px]"
                      value={textMessage}
                      onChange={(e) => setTextMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                    />
                  </div>
                  
                  <div className="md:col-span-3 flex flex-col h-full gap-2">
                    <Button
                      className="flex-1 bg-white text-black hover:bg-gray-200"
                      onClick={handleSendTextMessage}
                      disabled={!textMessage.trim()}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </Button>
                    
                    <div className="flex gap-2 h-10">
                      <Input 
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                      />
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 border-white/30 hover:bg-white/10"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      
                      {isRecording ? (
                        <Button 
                          onClick={handleStopRecording}
                          variant="destructive"
                          className="flex-1 flex items-center justify-center"
                        >
                          <div className="animate-pulse mr-1">●</div>
                          {recordingTime}s
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleStartRecording}
                          className="flex-1 bg-white/10 hover:bg-white/20 border border-white/30"
                        >
                          <Mic className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    {file && (
                      <Button
                        onClick={handleFileUpload}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Upload File
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Voice;
