
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Send, 
  Mic, 
  MicOff, 
  Upload, 
  Bot,
  User,
  Volume2,
  VolumeX,
  Plus,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageList from '@/components/MessageList';
import { useMessageHandler } from '@/hooks/useMessageHandler';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useVoiceSettings } from '@/hooks/useVoiceSettings';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

export const ImprovedChatInterface = () => {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [chatSessions, setChatSessions] = useState([{ id: '1', name: 'New Chat', active: true }]);
  const [activeChatId, setActiveChatId] = useState('1');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    messages,
    isLoading,
    messagesEndRef,
    totalTokensUsed,
    monthlyLimit,
    isTokenLimitReached,
    sendMessage,
    getLegacyMessages
  } = useMessageHandler();

  const {
    isRecording,
    recordingTime,
    audioData,
    handleStartRecording,
    handleStopRecording,
    setAudioData
  } = useVoiceRecorder();

  const { selectedVoice, isVoiceEnabled, toggleVoice } = useVoiceSettings();

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (audioData && !isRecording) {
      handleVoiceMessage();
    }
  }, [audioData, isRecording]);

  const handleVoiceMessage = async () => {
    if (!audioData) return;

    try {
      // Convert audio blob to text (placeholder - would need voice-to-text service)
      const audioText = "Voice message received"; // This would be the transcribed text
      await sendMessage(audioText, 'voice');
      setAudioData(null);
    } catch (error) {
      console.error('Error processing voice message:', error);
      toast({
        title: "Voice processing error",
        description: "Could not process voice message",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() && !file) return;

    const messageText = input.trim();
    const messageType = file ? 'file' : 'text';
    const fileUrl = file ? URL.createObjectURL(file) : undefined;

    setInput('');
    setFile(null);
    
    try {
      await sendMessage(messageText || `Uploaded file: ${file?.name}`, messageType, fileUrl);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: "Could not send your message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const createNewChat = () => {
    const newChatId = Date.now().toString();
    const newChat = {
      id: newChatId,
      name: `Chat ${chatSessions.length + 1}`,
      active: true
    };
    
    setChatSessions(prev => [
      ...prev.map(chat => ({ ...chat, active: false })),
      newChat
    ]);
    setActiveChatId(newChatId);
  };

  const switchChat = (chatId: string) => {
    setChatSessions(prev => prev.map(chat => ({
      ...chat,
      active: chat.id === chatId
    })));
    setActiveChatId(chatId);
  };

  const legacyMessages = getLegacyMessages() || [];

  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <Button
            onClick={createNewChat}
            className="w-full flex items-center space-x-2"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
              <History className="h-4 w-4" />
              <span>Previous Chats</span>
            </div>
            {chatSessions.map((chat) => (
              <Button
                key={chat.id}
                onClick={() => switchChat(chat.id)}
                variant={chat.active ? "default" : "ghost"}
                className="w-full justify-start text-left"
              >
                {chat.name}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <Card className="rounded-none border-l-0 border-r-0 border-t-0">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gray-900 rounded-lg">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl flex items-center">
                    AI Learning Assistant
                  </CardTitle>
                  <p className="text-gray-600">Your personalized learning companion</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  onClick={toggleVoice}
                  variant="outline"
                  size="sm"
                  className={isVoiceEnabled ? 'bg-green-50 text-green-700 border-green-200' : ''}
                >
                  {isVoiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
                
                <Badge variant="outline">
                  {totalTokensUsed.toLocaleString()}/{monthlyLimit.toLocaleString()} tokens
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              {legacyMessages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-96 text-center"
                >
                  <div className="w-24 h-24 rounded-full bg-gray-900 flex items-center justify-center mb-6">
                    <MessageSquare className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">
                    Welcome to Your AI Tutor
                  </h3>
                  <p className="text-gray-600 max-w-2xl text-lg leading-relaxed mb-8">
                    Ask me anything about your studies! I can help with homework, explain concepts, 
                    create quizzes, solve problems, and guide your learning journey.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                    <Card className="p-4 hover:bg-gray-50 transition-all cursor-pointer border-gray-200"
                          onClick={() => setInput("Help me with my math homework")}>
                      <p className="text-gray-700 text-sm">📚 Help with homework</p>
                    </Card>
                    <Card className="p-4 hover:bg-gray-50 transition-all cursor-pointer border-gray-200"
                          onClick={() => setInput("Create a quiz on science topics")}>
                      <p className="text-gray-700 text-sm">🧪 Create a quiz</p>
                    </Card>
                    <Card className="p-4 hover:bg-gray-50 transition-all cursor-pointer border-gray-200"
                          onClick={() => setInput("Explain quantum physics simply")}>
                      <p className="text-gray-700 text-sm">💡 Explain concepts</p>
                    </Card>
                  </div>
                </motion.div>
              ) : (
                <MessageList 
                  messages={legacyMessages}
                  onPlayAudio={() => {}}
                  onPauseAudio={() => {}}
                />
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Input Area */}
        <Card className="rounded-none border-l-0 border-r-0 border-b-0">
          <CardContent className="p-6">
            {file && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between border border-blue-200"
              >
                <span className="text-blue-700 text-sm">📎 {file.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setFile(null)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Remove
                </Button>
              </motion.div>
            )}

            <div className="flex items-end space-x-4">
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your studies..."
                  className="min-h-[60px] py-4 px-6 text-lg resize-none"
                  disabled={isLoading || isTokenLimitReached}
                />
                
                {isRecording && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2"
                  >
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-600 text-sm font-medium">
                      {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                    </span>
                  </motion.div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="lg"
                  className="p-4"
                  disabled={isLoading}
                >
                  <Upload className="h-5 w-5" />
                </Button>

                <Button
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  variant="outline"
                  size="lg"
                  className={`p-4 ${
                    isRecording 
                      ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
                      : ''
                  }`}
                  disabled={isLoading}
                >
                  {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>

                <Button
                  onClick={handleSendMessage}
                  disabled={(!input.trim() && !file) || isLoading || isTokenLimitReached}
                  size="lg"
                  className="p-4"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
