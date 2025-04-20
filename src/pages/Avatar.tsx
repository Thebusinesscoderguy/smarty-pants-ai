import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Pause, Send, Mic, Square, Settings } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAudioHandler } from '@/hooks/useAudioHandler';
import TokenUsageDisplay from '@/components/voice/TokenUsageDisplay';
import AvatarDescriptionDialog from '@/components/AvatarDescriptionDialog';
import UserAvatar from '@/components/UserAvatar';
import Avatar3D from '@/components/Avatar3D';

interface Message {
  id?: string;
  text: string;
  timestamp: Date;
  audioUrl?: string;
  isPlaying?: boolean;
  isFromUser: boolean;
  type: 'text' | 'voice';
  tokenCount?: number;
  sentiment?: 'neutral' | 'happy' | 'sad' | 'surprised' | 'angry';
}

const Avatar = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [currentAvatarStyle, setCurrentAvatarStyle] = useState<'teacher' | 'casual' | 'professional' | 'friendly'>('teacher');
  const [textMessage, setTextMessage] = useState('');
  const [twoWayConversation, setTwoWayConversation] = useState(true);
  const [totalTokensUsed, setTotalTokensUsed] = useState(0);
  const [inputTokens, setInputTokens] = useState(0);
  const [outputTokens, setOutputTokens] = useState(0);
  const monthlyLimit = 5000;
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioData, setAudioData] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
  const [isAvatarListening, setIsAvatarListening] = useState(false);
  const [isAvatarThinking, setIsAvatarThinking] = useState(false);
  const [currentSentiment, setCurrentSentiment] = useState<'neutral' | 'happy' | 'sad' | 'surprised' | 'angry'>('neutral');
  const [speechIntensity, setSpeechIntensity] = useState(0.5);

  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [hasCheckedFirstTime, setHasCheckedFirstTime] = useState(false);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);

  const {
    handlePlayAudio,
    handlePauseAudio,
    activeSpeakingMessage
  } = useAudioHandler();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    if (user) {
      fetchTokenUsage();
      if (!hasCheckedFirstTime) {
        checkFirstTimeUser();
      }
    }
  }, [messages, user, hasCheckedFirstTime]);

  useEffect(() => {
    setIsAvatarSpeaking(!!activeSpeakingMessage);
    
    if (activeSpeakingMessage) {
      const activeMessage = messages.find(m => m.id === activeSpeakingMessage);
      if (activeMessage) {
        analyzeSentiment(activeMessage.text);
        const intensity = Math.min(0.5 + (activeMessage.text.length / 500), 1);
        setSpeechIntensity(intensity);
      }
    } else {
      setCurrentSentiment('neutral');
      setSpeechIntensity(0.5);
    }
  }, [activeSpeakingMessage, messages]);

  useEffect(() => {
    setIsAvatarListening(isRecording);
  }, [isRecording]);

  const checkFirstTimeUser = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .eq('file_type', 'avatar')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error checking for existing avatar:", error);
        throw error;
      }
      
      if (!data) {
        console.log("No avatar found, showing dialog");
        setShowAvatarDialog(true);
      } else {
        console.log("Avatar found:", data.file_path);
        setUserAvatarUrl(data.file_path);
      }
      
      setHasCheckedFirstTime(true);
    } catch (error) {
      console.error("Error checking for existing avatar:", error);
      setHasCheckedFirstTime(true);
    }
  };

  const fetchTokenUsage = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('token_usage')
        .select('tokens_used, feature')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      if (data) {
        let total = 0;
        let input = 0;
        let output = 0;
        
        data.forEach(item => {
          total += item.tokens_used;
          if (item.feature === 'user_input') {
            input += item.tokens_used;
          } else if (item.feature === 'ai_response') {
            output += item.tokens_used;
          }
        });
        
        setTotalTokensUsed(total);
        setInputTokens(input);
        setOutputTokens(output);
      }
    } catch (error) {
      console.error("Error fetching token usage:", error);
    }
  };

  const analyzeSentiment = (text: string) => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('happy') || lowerText.includes('great') || lowerText.includes('excellent') || 
        lowerText.includes('good') || lowerText.includes('love') || lowerText.includes('yes') || 
        lowerText.includes('wonderful') || lowerText.includes('thank you')) {
      setCurrentSentiment('happy');
    } else if (lowerText.includes('sad') || lowerText.includes('sorry') || lowerText.includes('unfortunately') || 
               lowerText.includes('regret') || lowerText.includes('bad') || lowerText.includes('no')) {
      setCurrentSentiment('sad');
    } else if (lowerText.includes('wow') || lowerText.includes('amazing') || lowerText.includes('incredible') || 
               lowerText.includes('unbelievable') || lowerText.includes('surprise')) {
      setCurrentSentiment('surprised');
    } else if (lowerText.includes('angry') || lowerText.includes('upset') || lowerText.includes('annoyed') || 
               lowerText.includes('frustrat') || lowerText.includes('concern')) {
      setCurrentSentiment('angry');
    } else {
      setCurrentSentiment('neutral');
    }
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
      const tempMessageId = `processing-${Date.now()}`;
      setMessages(prev => [...prev, {
        id: tempMessageId,
        text: "Processing your voice message...",
        timestamp: new Date(),
        isFromUser: false,
        type: 'text'
      }]);
      
      const response = await supabase.functions.invoke('voice-to-text', {
        body: { audio: audioBase64 },
      });
      
      if (response.error) throw new Error(response.error.message);
      
      const transcribedText = response.data.text;
      const tokenCount = Math.ceil(transcribedText.length / 4);
      
      setMessages(prev => prev.filter(m => m.id !== tempMessageId));
      
      const newUserMessage: Message = {
        id: `voice-${Date.now()}`,
        text: transcribedText,
        timestamp: new Date(),
        isFromUser: true,
        type: 'voice',
        tokenCount: tokenCount
      };
      
      if (audioData) {
        const audioUrl = URL.createObjectURL(audioData);
        newUserMessage.audioUrl = audioUrl;
      }
      
      setMessages(prev => [...prev, newUserMessage]);
      setTotalTokensUsed(prev => prev + tokenCount);
      setInputTokens(prev => prev + tokenCount);
      
      if (user) {
        try {
          const { data, error } = await supabase
            .from('token_usage')
            .insert({
              user_id: user.id,
              tokens_used: tokenCount,
              feature: 'user_input',
            });
          
          if (error) throw error;
        } catch (dbError) {
          console.error("Error saving token usage:", dbError);
        }
      }
      
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
      
      const newUserMessage: Message = {
        id: `text-${Date.now()}`,
        text: textMessage,
        timestamp: new Date(),
        isFromUser: true,
        type: 'text',
        tokenCount: tokenCount
      };
      
      setMessages(prev => [...prev, newUserMessage]);
      setTextMessage('');
      setTotalTokensUsed(prev => prev + tokenCount);
      setInputTokens(prev => prev + tokenCount);
      
      if (user) {
        try {
          const { data, error } = await supabase
            .from('token_usage')
            .insert({
              user_id: user.id,
              tokens_used: tokenCount,
              feature: 'user_input',
            });
          
          if (error) throw error;
        } catch (dbError) {
          console.error("Error saving token usage:", dbError);
        }
      }
      
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
      const tempMessageId = `processing-${Date.now()}`;
      setMessages(prev => [...prev, {
        id: tempMessageId,
        text: "Generating response...",
        timestamp: new Date(),
        isFromUser: false,
        type: 'text'
      }]);
      
      let aiResponse = `I've processed your message: "${userMessage}". `;
      
      if (userMessage.toLowerCase().includes('hello') || userMessage.toLowerCase().includes('hi')) {
        aiResponse += "Hello! It's great to meet you. How can I assist you today?";
      } else if (userMessage.toLowerCase().includes('thank')) {
        aiResponse += "You're very welcome! Is there anything else I can help with?";
      } else if (userMessage.toLowerCase().includes('no')) {
        aiResponse += "I understand. Is there something else you'd prefer to discuss?";
      } else if (userMessage.toLowerCase().includes('yes')) {
        aiResponse += "That's great! Let's proceed then.";
      } else {
        aiResponse += "How can I help you further?";
      }
      
      const tokenCount = Math.ceil(aiResponse.length / 4);
      
      const sentiment = analyzeSentiment(aiResponse);
      
      const voiceResponse = await supabase.functions.invoke('text-to-voice', {
        body: { text: aiResponse, voice: 'alloy' },
      });
      
      if (voiceResponse.error) throw new Error(voiceResponse.error.message);
      
      const base64Audio = voiceResponse.data.audioContent;
      const audioBlob = base64ToBlob(base64Audio, 'audio/mp3');
      const audioUrl = URL.createObjectURL(audioBlob);
      
      setMessages(prev => prev.filter(m => m.id !== tempMessageId));
      
      const aiMessageId = `ai-${Date.now()}`;
      const aiMessage: Message = {
        id: aiMessageId,
        text: aiResponse,
        timestamp: new Date(),
        audioUrl: audioUrl,
        isFromUser: false,
        type: 'voice',
        tokenCount: tokenCount,
        sentiment: currentSentiment
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setTotalTokensUsed(prev => prev + tokenCount);
      setOutputTokens(prev => prev + tokenCount);
      
      if (user) {
        try {
          const { data, error } = await supabase
            .from('token_usage')
            .insert({
              user_id: user.id,
              tokens_used: tokenCount,
              feature: 'ai_response',
            });
          
          if (error) throw error;
        } catch (dbError) {
          console.error("Error saving token usage:", dbError);
        }
      }
      
      setTimeout(() => {
        handlePlayAudio(aiMessageId, messages, setMessages);
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

  const handleAvatarGenerated = (avatarUrl: string) => {
    console.log("Avatar generated:", avatarUrl);
    setUserAvatarUrl(avatarUrl);
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
            <h1 className="text-xl font-bold">AI Avatar Conversation</h1>
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
              
              <Button 
                variant="outline" 
                className="border-white/20 text-white flex items-center gap-2"
                onClick={() => setShowAvatarDialog(true)}
              >
                <Settings className="h-4 w-4" />
                <span>Customize Avatar</span>
                {userAvatarUrl && (
                  <UserAvatar avatarUrl={userAvatarUrl} size="sm" />
                )}
              </Button>
            </div>
            
            <TokenUsageDisplay
              totalTokensUsed={totalTokensUsed}
              monthlyLimit={monthlyLimit}
              inputTokens={inputTokens}
              outputTokens={outputTokens}
            />
          </div>
        </header>
        
        <main className="flex-1 flex flex-col overflow-hidden relative">
          <div className="absolute inset-0 flex items-center justify-center z-0">
            <Avatar3D 
              isSpeaking={isAvatarSpeaking} 
              isListening={isAvatarListening}
              isThinking={isAvatarThinking}
              avatarStyle={currentAvatarStyle}
              className="w-full h-full"
              currentSentiment={currentSentiment}
              speechIntensity={speechIntensity}
            />
          </div>
          
          {userAvatarUrl && (
            <div className="absolute top-4 right-4 z-20">
              <UserAvatar avatarUrl={userAvatarUrl} size="lg" />
            </div>
          )}
          
          {messages.length > 0 && !messages[messages.length - 1].isFromUser && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
              <Card className="bg-black/50 border-white/20 p-2 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  {activeSpeakingMessage === messages[messages.length - 1].id ? (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-white/30 bg-white/10"
                      onClick={() => messages[messages.length - 1].id && handlePauseAudio(messages[messages.length - 1].id, messages, setMessages)}
                    >
                      <Pause className="h-4 w-4 mr-2" /> Pause
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-white/30 bg-white/10"
                      onClick={() => messages[messages.length - 1].id && handlePlayAudio(messages[messages.length - 1].id, messages, setMessages)}
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendTextMessage();
                      }
                    }}
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
      
      <AvatarDescriptionDialog 
        open={showAvatarDialog} 
        onClose={() => setShowAvatarDialog(false)}
        onAvatarGenerated={handleAvatarGenerated}
      />
    </div>
  );
};

export default Avatar;
