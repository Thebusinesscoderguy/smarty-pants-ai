import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Mic } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { VoiceMessageSection } from '@/components/voice/VoiceMessageSection';
import { TextChatSection } from '@/components/chat/TextChatSection';
import { ContactForm } from '@/components/contact/ContactForm';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { testApiConnections } from '@/utils/apiService';
import type { VoiceMessage } from '@/types/voice';
import type { Message } from '@/types/message';

const Index = () => {
  const [showVoiceSection, setShowVoiceSection] = useState(false);
  const [showChatSection, setShowChatSection] = useState(false);
  const [voiceMessages, setVoiceMessages] = useState<VoiceMessage[]>([]);
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: 'Hello! I\'m EduAI, your adaptive learning assistant. What would you like to learn today?',
    timestamp: new Date()
  }]);
  const [input, setInput] = useState('');
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioData, setAudioData] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});

  useEffect(() => {
    if (user && showVoiceSection) {
      fetchMessages();
    }
  }, [user, showVoiceSection]);

  useEffect(() => {
    if (user) {
      testApiConnections();
    }
  }, [user]);

  const fetchMessages = async () => {
    if (!user) return;
    try {
      const {
        data,
        error
      } = await supabase.from('messages').select('*').eq('user_id', user.id).eq('type', 'voice').order('created_at', {
        ascending: true
      });
      if (error) throw error;
      if (data && data.length > 0) {
        const formattedMessages = data.map(msg => ({
          id: msg.id,
          text: msg.content,
          timestamp: new Date(msg.created_at),
          audioUrl: msg.file_url,
          isPlaying: false
        }));
        setVoiceMessages(formattedMessages);
      }
    } catch (error: any) {
      toast({
        title: "Error fetching messages",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = event => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm'
        });
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
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please log in to use voice messages",
        variant: "destructive"
      });
      return;
    }
    try {
      const response = await supabase.functions.invoke('voice-to-text', {
        body: {
          audio: audioBase64
        }
      });
      if (response.error) throw new Error(response.error.message);
      const transcribedText = response.data.text;
      let userMessageId = null;
      let audioUrl = null;
      if (user) {
        userMessageId = await saveMessageToDatabase(transcribedText, 'voice', null);
        if (audioData) {
          audioUrl = await uploadAudioFile(audioData, userMessageId);
          await supabase.from('messages').update({
            file_url: audioUrl
          }).eq('id', userMessageId);
        }
      }
      const newUserMessage: VoiceMessage = {
        id: userMessageId,
        text: transcribedText,
        timestamp: new Date(),
        audioUrl: audioUrl
      };
      setVoiceMessages(prev => [...prev, newUserMessage]);
      scrollToBottom();
      await getAIResponse(transcribedText);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to process voice: " + error.message,
        variant: "destructive"
      });
    }
  };

  const getAIResponse = async (userMessage: string) => {
    try {
      const aiResponse = `I've processed your voice message: "${userMessage}". How can I help you further?`;
      let aiMessageId = null;
      let audioUrl = null;
      if (user) {
        const voiceResponse = await supabase.functions.invoke('text-to-voice', {
          body: {
            text: aiResponse,
            voice: 'alloy'
          }
        });
        if (voiceResponse.error) throw new Error(voiceResponse.error.message);
        const base64Audio = voiceResponse.data.audioContent;
        const audioBlob = base64ToBlob(base64Audio, 'audio/mp3');
        aiMessageId = await saveMessageToDatabase(aiResponse, 'voice', null, false);
        audioUrl = await uploadAudioFile(audioBlob, aiMessageId);
        await supabase.from('messages').update({
          file_url: audioUrl
        }).eq('id', aiMessageId);
      }
      const aiMessage: VoiceMessage = {
        id: aiMessageId,
        text: aiResponse,
        timestamp: new Date(),
        audioUrl: audioUrl
      };
      setVoiceMessages(prev => [...prev, aiMessage]);
      scrollToBottom();
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
    if (!user) return null;
    try {
      const filePath = `${user.id}/${messageId}.webm`;
      const {
        data,
        error
      } = await supabase.storage.from('study_materials').upload(filePath, audioBlob, {
        contentType: 'audio/webm',
        upsert: true
      });
      if (error) throw error;
      const {
        data: urlData
      } = supabase.storage.from('study_materials').getPublicUrl(filePath);
      return urlData.publicUrl;
    } catch (error: any) {
      console.error("Error uploading audio:", error);
      return null;
    }
  };

  const saveMessageToDatabase = async (content: string, type: string, fileUrl: string | null, isFromUser: boolean = true): Promise<string> => {
    if (!user) throw new Error("User not authenticated");
    try {
      const {
        data,
        error
      } = await supabase.from('messages').insert({
        user_id: user.id,
        content,
        type,
        file_url: fileUrl,
        is_from_user: isFromUser
      }).select('id').single();
      if (error) throw error;
      await supabase.from('token_usage').insert({
        user_id: user.id,
        tokens_used: Math.ceil(content.length / 4),
        feature: 'voice'
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
    return new Blob(byteArrays, {
      type: mimeType
    });
  };

  const handlePlayAudio = (messageId: string) => {
    if (!audioRefs.current[messageId]) {
      const message = voiceMessages.find(m => m.id === messageId);
      if (message?.audioUrl) {
        const audio = new Audio(message.audioUrl);
        audioRefs.current[messageId] = audio;
        audio.onended = () => {
          setVoiceMessages(messages => messages.map(m => 
            m.id === messageId ? { ...m, isPlaying: false } : m
          ));
        };
      }
    }

    const audio = audioRefs.current[messageId];
    if (audio) {
      Object.entries(audioRefs.current).forEach(([id, audioElement]) => {
        if (id !== messageId && audioElement) {
          audioElement.pause();
          audioElement.currentTime = 0;
          setVoiceMessages(messages => messages.map(m => 
            m.id === id ? { ...m, isPlaying: false } : m
          ));
        }
      });
      audio.play();
      setVoiceMessages(messages => messages.map(m => 
        m.id === messageId ? { ...m, isPlaying: true } : m
      ));
    }
  };

  const handlePauseAudio = (messageId: string) => {
    const audio = audioRefs.current[messageId];
    if (audio) {
      audio.pause();
      setVoiceMessages(messages => messages.map(m => 
        m.id === messageId ? { ...m, isPlaying: false } : m
      ));
    }
  };

  const handleSendMessage = () => {
    if (!input.trim()) return;
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setTimeout(() => {
      const aiResponse = `Thank you for your message: "${input}". I'm here to help you learn.`;
      const assistantMessage: Message = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <main className="flex-1 px-4 py-12 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Learn Faster with <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">AI</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
              Teachly uses adaptive AI to personalize your learning experience, adjusting to your pace and style automatically.
            </p>
            <div className="mt-8 space-x-4">
              {user ? (
                <>
                  <Button 
                    size="lg" 
                    className="bg-white text-black hover:bg-gray-200"
                    onClick={() => {
                      setShowVoiceSection(!showVoiceSection);
                      setShowChatSection(false);
                    }}
                  >
                    <Mic className="mr-2 h-4 w-4" />
                    {showVoiceSection ? "Hide Voice Messages" : "Open Voice Messages"}
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white/30 hover:bg-white/10"
                    onClick={() => {
                      setShowChatSection(!showChatSection);
                      setShowVoiceSection(false);
                    }}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    {showChatSection ? "Hide Text Chat" : "Open Text Chat"}
                  </Button>
                </>
              ) : (
                <Button size="lg" className="bg-white text-black hover:bg-gray-200">
                  Get Started
                </Button>
              )}
            </div>
          </div>

          {showVoiceSection && user && (
            <VoiceMessageSection
              messages={voiceMessages}
              onPlayAudio={handlePlayAudio}
              onPauseAudio={handlePauseAudio}
              onVoiceResponse={() => {}}
              isRecording={isRecording}
              recordingTime={recordingTime}
              handleStartRecording={handleStartRecording}
              handleStopRecording={handleStopRecording}
            />
          )}

          {showChatSection && user && (
            <TextChatSection
              messages={messages}
              input={input}
              onInputChange={(value) => setInput(value)}
              onSendMessage={handleSendMessage}
              onKeyDown={handleKeyDown}
              onVoiceResponse={() => {}}
            />
          )}

          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="text-blue-400 text-2xl mb-4">🧠</div>
              <h3 className="text-xl font-semibold mb-2">Adaptive Learning</h3>
              <p className="text-white/70">Our AI adjusts to your learning pace, slowing down when you need time and speeding up when you're flying.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="text-purple-400 text-2xl mb-4">🗣️</div>
              <h3 className="text-xl font-semibold mb-2">Voice Interactions</h3>
              <p className="text-white/70">Learn on the go with natural voice conversations. Ask questions and get answers just like talking to a tutor.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="text-green-400 text-2xl mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-2">Study Material Analysis</h3>
              <p className="text-white/70">Upload your notes and documents, and our AI will help you understand and quiz you on the content.</p>
            </div>
          </div>
          
          <div className="mt-24 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">Why Choose Teachly in 2025?</h2>
            <div className="grid md:grid-cols-2 gap-8 mt-12">
              <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-left">
                <h3 className="text-xl font-semibold mb-4">Personalized Learning Path</h3>
                <p className="text-white/70">Our AI analyzes your learning style, strengths, and weaknesses to create a custom curriculum that evolves as you progress.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-left">
                <h3 className="text-xl font-semibold mb-4">Real-time Feedback</h3>
                <p className="text-white/70">Get immediate, constructive feedback on your work that helps you understand mistakes and improve faster.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-left">
                <h3 className="text-xl font-semibold mb-4">Interactive Practice</h3>
                <p className="text-white/70">Engage with dynamic exercises that adapt to your skill level, making learning both challenging and enjoyable.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-left">
                <h3 className="text-xl font-semibold mb-4">Learn Anywhere</h3>
                <p className="text-white/70">Access your personalized learning experience on any device, with progress synced automatically across platforms.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-24 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">Frequently Asked Questions</h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto mb-12">
              Find answers to common questions about using Teachly and maximizing your learning experience.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-blue-500/50 transition-all duration-300 text-left">
                <h3 className="text-xl font-semibold mb-4">How does adaptive learning work?</h3>
                <p className="text-white/70 mb-3">Our AI system analyzes your learning patterns and adjusts the difficulty and pace of content to match your individual needs, creating a personalized experience that evolves as you progress.</p>
                <div className="flex justify-end">
                  
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-purple-500/50 transition-all duration-300 text-left">
                <h3 className="text-xl font-semibold mb-4">How does voice learning work?</h3>
                <p className="text-white/70 mb-3">Click on the "Open Voice Messages" button after logging in to access our voice learning feature. You can record questions and receive spoken responses from our AI tutor.</p>
                <div className="flex justify-end">
                  
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-green-500/50 transition-all duration-300 text-left">
                <h3 className="text-xl font-semibold mb-4">What content can Teachly help me with?</h3>
                <p className="text-white/70 mb-3">Teachly can assist with a wide range of subjects including mathematics, science, languages, programming, and more. Our AI adapts to your specific learning needs.</p>
                <div className="flex justify-end">
                  
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-yellow-500/50 transition-all duration-300 text-left">
                <h3 className="text-xl font-semibold mb-4">Can I use Teachly on mobile devices?</h3>
                <p className="text-white/70 mb-3">Yes! Teachly is fully responsive and works on all devices including smartphones and tablets. Your learning progress syncs across all platforms automatically.</p>
                <div className="flex justify-end">
                  
                </div>
              </div>
            </div>
          </div>

          <ContactForm />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
