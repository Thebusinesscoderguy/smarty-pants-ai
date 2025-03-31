
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Square, Play, Pause } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VoiceMessage {
  id?: string;
  text: string;
  timestamp: Date;
  audioUrl?: string;
  isPlaying?: boolean;
}

const Voice = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<VoiceMessage[]>([
    {
      text: "Welcome to voice messaging! Press the microphone button to start recording.",
      timestamp: new Date(),
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

  // Fetch messages on component mount
  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user]);

  const fetchMessages = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'voice')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const formattedMessages = data.map(msg => ({
          id: msg.id,
          text: msg.content,
          timestamp: new Date(msg.created_at),
          audioUrl: msg.file_url,
          isPlaying: false
        }));
        
        setMessages(prev => [...prev, ...formattedMessages]);
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

  // Start recording
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
        
        // Convert to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result?.toString().split(',')[1];
          
          if (base64Audio) {
            await processVoiceToText(base64Audio);
          }
        };
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Start timer
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

  // Stop recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Process voice to text
  const processVoiceToText = async (audioBase64: string) => {
    try {
      const response = await supabase.functions.invoke('voice-to-text', {
        body: { audio: audioBase64 },
      });
      
      if (response.error) throw new Error(response.error.message);
      
      const transcribedText = response.data.text;
      
      // Save user message to database
      const userMessageId = await saveMessageToDatabase(transcribedText, 'voice', null);
      
      // Upload audio file to storage
      let audioUrl = null;
      if (audioData) {
        audioUrl = await uploadAudioFile(audioData, userMessageId);
        
        // Update message with file URL
        await supabase
          .from('messages')
          .update({ file_url: audioUrl })
          .eq('id', userMessageId);
      }
      
      const newUserMessage: VoiceMessage = {
        id: userMessageId,
        text: transcribedText,
        timestamp: new Date(),
        audioUrl: audioUrl,
      };
      
      setMessages(prev => [...prev, newUserMessage]);
      scrollToBottom();
      
      // Get AI response
      await getAIResponse(transcribedText);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to process voice: " + error.message,
        variant: "destructive"
      });
    }
  };

  // Get AI response
  const getAIResponse = async (userMessage: string) => {
    try {
      // Simulate AI processing (in a real app, you would call an AI service)
      const aiResponse = `I've processed your voice message: "${userMessage}". How can I help you further?`;
      
      // Convert AI response to speech
      const voiceResponse = await supabase.functions.invoke('text-to-voice', {
        body: { text: aiResponse, voice: 'alloy' },
      });
      
      if (voiceResponse.error) throw new Error(voiceResponse.error.message);
      
      const base64Audio = voiceResponse.data.audioContent;
      const audioBlob = base64ToBlob(base64Audio, 'audio/mp3');
      
      // Save AI response to database
      const aiMessageId = await saveMessageToDatabase(aiResponse, 'voice', null, false);
      
      // Upload audio file
      const audioUrl = await uploadAudioFile(audioBlob, aiMessageId);
      
      // Update message with file URL
      await supabase
        .from('messages')
        .update({ file_url: audioUrl })
        .eq('id', aiMessageId);
      
      const aiMessage: VoiceMessage = {
        id: aiMessageId,
        text: aiResponse,
        timestamp: new Date(),
        audioUrl: audioUrl,
      };
      
      setMessages(prev => [...prev, aiMessage]);
      scrollToBottom();
      
      // Auto-play the AI response
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

  // Upload audio file to storage
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
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('study_materials')
        .getPublicUrl(filePath);
      
      return urlData.publicUrl;
      
    } catch (error: any) {
      console.error("Error uploading audio:", error);
      return null;
    }
  };

  // Save message to database
  const saveMessageToDatabase = async (
    content: string, 
    type: string, 
    fileUrl: string | null,
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
          is_from_user: isFromUser,
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      // Track token usage
      await supabase.from('token_usage').insert({
        user_id: user?.id,
        tokens_used: Math.ceil(content.length / 4),
        feature: 'voice',
      });
      
      return data.id;
    } catch (error: any) {
      console.error("Error saving message:", error);
      throw error;
    }
  };

  // Convert base64 to blob
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

  // Play audio
  const handlePlayAudio = (messageId: string) => {
    // Create audio element if it doesn't exist
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
        };
      }
    }
    
    const audio = audioRefs.current[messageId];
    
    if (audio) {
      // Stop all other playing audios
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
      
      // Play this audio
      audio.play();
      
      setMessages(messages => 
        messages.map(m => 
          m.id === messageId ? { ...m, isPlaying: true } : m
        )
      );
    }
  };

  // Pause audio
  const handlePauseAudio = (messageId: string) => {
    const audio = audioRefs.current[messageId];
    
    if (audio) {
      audio.pause();
      
      setMessages(messages => 
        messages.map(m => 
          m.id === messageId ? { ...m, isPlaying: false } : m
        )
      );
    }
  };

  return (
    <div className="flex min-h-screen bg-black text-white">
      <AppSidebar />
      
      <div className="flex-1 flex flex-col max-h-screen">
        <header className="p-4 border-b border-white/20">
          <h1 className="text-xl font-bold">Voice Messages</h1>
        </header>
        
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <Card 
                key={index}
                className="p-4 bg-white/5 border-white/20"
              >
                <p className="mb-2">{message.text}</p>
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
              </Card>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4 border-t border-white/20 flex flex-col items-center">
            {isRecording && (
              <div className="mb-2 text-red-500 animate-pulse">
                Recording... {recordingTime}s
              </div>
            )}
            
            {isRecording ? (
              <Button 
                onClick={handleStopRecording}
                variant="destructive"
                size="lg"
                className="rounded-full w-16 h-16 flex items-center justify-center"
              >
                <Square className="h-6 w-6" />
              </Button>
            ) : (
              <Button 
                onClick={handleStartRecording}
                className="bg-white text-black hover:bg-gray-200 rounded-full w-16 h-16 flex items-center justify-center"
              >
                <Mic className="h-6 w-6" />
              </Button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Voice;
