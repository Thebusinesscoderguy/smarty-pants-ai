
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useVoiceSettings } from '@/hooks/useVoiceSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatInput } from './ChatInput';
import { Message } from '@/types/message';
import { Button } from '@/components/ui/button';
import { User, Volume2, VolumeX, Send, Upload, Mic, MicOff } from 'lucide-react';

export const EnhancedChatInterface = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isVoiceEnabled,
    selectedVoice,
    toggleVoice
  } = useVoiceSettings();

  const {
    isRecording,
    recordingTime,
    audioData,
    setAudioData,
    handleStartRecording,
    handleStopRecording
  } = useVoiceRecorder();

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      text: "Hello! I'm your AI Learning Assistant. I can help you with any subject - just ask me a question, upload a file, or start a conversation. What would you like to learn about today?",
      timestamp: new Date(),
      isFromUser: false,
      type: 'text',
      tokenCount: 35
    };
    setMessages([welcomeMessage]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const processVoiceToText = async (audioBase64: string) => {
    try {
      const response = await supabase.functions.invoke('voice-to-text', {
        body: { audio: audioBase64 }
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to process voice');
      }
      
      const transcribedText = response.data?.text || '';
      setCurrentMessage(transcribedText);
      
      toast({
        title: "Voice processed",
        description: "Your voice message has been transcribed"
      });
      
    } catch (error: any) {
      console.error("Error in processVoiceToText:", error);
      toast({
        title: "Error",
        description: `Failed to process voice: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleVoiceRecordStop = async () => {
    handleStopRecording();
    
    if (audioData) {
      const reader = new FileReader();
      reader.readAsDataURL(audioData);
      reader.onloadend = function() {
        const base64data = (reader.result as string).split(',')[1];
        processVoiceToText(base64data);
      };
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !user) return;
    
    try {
      setIsAnalyzing(true);
      
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('study_materials')
        .upload(filePath, selectedFile);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('study_materials')
        .getPublicUrl(filePath);

      const fileMessage: Message = {
        id: `file-${Date.now()}`,
        text: `Uploaded file: ${selectedFile.name}`,
        timestamp: new Date(),
        fileUrl: publicUrl,
        fileName: selectedFile.name,
        isFromUser: true,
        type: 'file',
        tokenCount: 10
      };
      
      setMessages(prev => [...prev, fileMessage]);
      setSelectedFile(null);
      
      await getAIResponse(`I've uploaded a file named ${selectedFile.name}. Can you help me analyze this?`);
      
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: `Failed to upload file: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getAIResponse = async (messageText: string) => {
    if (!messageText || !messageText.trim()) return;
    
    try {
      setIsLoading(true);
      
      const response = await supabase.functions.invoke('chat-completion', {
        body: { 
          message: messageText,
          conversation_history: messages.slice(-10)
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to get AI response');
      }
      
      const responseText = response.data?.response || response.data?.content || 'I apologize, but I couldn\'t generate a response. Please try again.';
      
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        text: responseText,
        timestamp: new Date(),
        isFromUser: false,
        type: 'text',
        tokenCount: Math.ceil(responseText.length / 4)
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Generate voice response if enabled
      if (isVoiceEnabled && responseText) {
        await generateVoiceResponse(responseText, aiMessage.id);
      }
      
    } catch (error: any) {
      console.error("Error getting AI response:", error);
      toast({
        title: "Error",
        description: `Failed to get AI response: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateVoiceResponse = async (text: string, messageId: string) => {
    try {
      const response = await supabase.functions.invoke('text-to-voice', {
        body: { 
          text: text,
          voice: selectedVoice 
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate voice');
      }
      
      // Update message with audio content
      if (response.data?.audioContent) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, audioContent: response.data.audioContent }
            : msg
        ));
        
        // Auto-play the audio
        const audio = new Audio(`data:audio/mp3;base64,${response.data.audioContent}`);
        audio.play().catch(console.error);
      }
      
    } catch (error: any) {
      console.error("Error generating voice response:", error);
      toast({
        title: "Voice Error",
        description: "Could not generate voice response",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: currentMessage,
      timestamp: new Date(),
      isFromUser: true,
      type: 'text',
      tokenCount: Math.ceil(currentMessage.length / 4)
    };
    
    setMessages(prev => [...prev, userMessage]);
    const messageToSend = currentMessage;
    setCurrentMessage('');
    
    await getAIResponse(messageToSend);
  };

  const handlePlayAudio = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message?.audioContent) {
      const audio = new Audio(`data:audio/mp3;base64,${message.audioContent}`);
      audio.play();
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isPlaying: true }
          : { ...msg, isPlaying: false }
      ));
      
      audio.onended = () => {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, isPlaying: false }
            : msg
        ));
      };
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.isFromUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start space-x-3 max-w-3xl ${message.isFromUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.isFromUser ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-gradient-to-r from-green-500 to-blue-500'
                  }`}>
                    {message.isFromUser ? (
                      <User className="h-5 w-5 text-white" />
                    ) : (
                      <span className="text-white text-sm font-bold">AI</span>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={`p-4 rounded-2xl shadow-lg ${
                    message.isFromUser 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                      : 'bg-white/90 text-gray-900 backdrop-blur-sm'
                  }`}>
                    <div className="text-base leading-relaxed whitespace-pre-wrap">
                      {message.text}
                    </div>
                    
                    {/* File content */}
                    {message.fileUrl && (
                      <div className="mt-3 p-3 bg-black/10 rounded-xl">
                        <p className="text-sm opacity-80">📎 {message.fileName}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2">
                        {!message.isFromUser && message.audioContent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePlayAudio(message.id)}
                            className="p-1 h-8 w-8 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg"
                          >
                            <Volume2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <span className="text-xs opacity-60">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-center py-8">
                <div className="flex items-center space-x-3 text-white/70 bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-sm">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white/70"></div>
                  <span className="text-lg">AI is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Recording indicator */}
        {isRecording && (
          <div className="px-6 py-2 bg-red-900/20 border-t border-red-500/30">
            <div className="flex items-center justify-center text-red-400 text-sm">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse mr-2"></div>
              Recording... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
            </div>
          </div>
        )}

        {/* Enhanced Input Area - Fixed at bottom */}
        <div className="flex-shrink-0 p-6 border-t border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto">
            {selectedFile && (
              <div className="mb-4 p-4 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-between backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <Upload className="h-5 w-5 text-blue-400" />
                  <span className="text-white font-medium">{selectedFile.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={handleFileUpload}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? 'Uploading...' : 'Upload'}
                  </Button>
                  <Button
                    onClick={() => setSelectedFile(null)}
                    variant="outline"
                    size="sm"
                    className="border-white/20 bg-white/10 hover:bg-white/20 text-white rounded-xl"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}
            
            <div className="relative">
              <textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about learning..."
                className="w-full px-6 py-4 pr-32 bg-white/10 border border-white/30 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-white/60 backdrop-blur-sm text-lg"
                rows={1}
                style={{ minHeight: '60px', maxHeight: '120px' }}
                disabled={isLoading}
              />
              
              <div className="absolute right-3 bottom-3 flex items-center space-x-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                />
                
                <Button
                  onClick={handleFileSelect}
                  variant="ghost"
                  size="sm"
                  className="p-2 h-10 w-10 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                  disabled={isLoading}
                >
                  <Upload className="h-5 w-5" />
                </Button>
                
                <Button
                  onClick={isRecording ? handleVoiceRecordStop : handleStartRecording}
                  variant="ghost"
                  size="sm"
                  className={`p-2 h-10 w-10 rounded-xl transition-all duration-200 ${
                    isRecording 
                      ? 'text-red-400 hover:text-red-300 bg-red-500/20 hover:bg-red-500/30' 
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                  disabled={isLoading}
                >
                  {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
                
                <Button
                  onClick={toggleVoice}
                  variant="ghost"
                  size="sm"
                  className={`p-2 h-10 w-10 rounded-xl transition-all duration-200 ${
                    isVoiceEnabled 
                      ? 'text-purple-400 hover:text-purple-300 bg-purple-500/20 hover:bg-purple-500/30' 
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                  disabled={isLoading}
                  title={isVoiceEnabled ? 'Voice responses enabled' : 'Voice responses disabled'}
                >
                  {isVoiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </Button>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || isLoading}
                  className="h-10 w-10 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white flex items-center justify-center p-0 disabled:opacity-50 transition-all duration-200 shadow-lg"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
