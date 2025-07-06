
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Send, 
  Mic, 
  MicOff, 
  Upload, 
  Sparkles,
  Bot,
  User,
  Volume2,
  VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageList from '@/components/MessageList';
import { useMessageHandler } from '@/hooks/useMessageHandler';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useVoiceSettings } from '@/hooks/useVoiceSettings';
import { useAuth } from '@/contexts/AuthContext';

export const ImprovedChatInterface = () => {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  const {
    messages,
    setMessages,
    messagesEndRef,
    apiKeyError,
    isQuizMode,
    setIsQuizMode,
    totalTokensUsed,
    monthlyLimit,
    isTokenLimitReached,
    scrollToBottom,
    fetchMessages,
    checkOpenAIKey,
    getAIResponse,
    handlePlayAudio,
    handlePauseAudio,
    getLegacyMessages
  } = useMessageHandler();

  const {
    isRecording,
    recordingTime,
    handleStartRecording,
    handleStopRecording
  } = useVoiceRecorder();

  const { selectedVoice, isVoiceEnabled, toggleVoice } = useVoiceSettings();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMessages();
      checkOpenAIKey();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const messageText = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      await getAIResponse(messageText, selectedVoice);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const legacyMessages = getLegacyMessages();

  return (
    <div className="flex h-full bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <Card className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-500/30 rounded-none border-l-0 border-r-0 border-t-0">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-white flex items-center">
                    AI Learning Assistant
                    <Sparkles className="ml-2 h-5 w-5 text-yellow-400" />
                  </CardTitle>
                  <p className="text-white/70">Your personalized learning companion</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  onClick={toggleVoice}
                  variant="outline"
                  size="sm"
                  className={`border-white/30 ${
                    isVoiceEnabled 
                      ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                      : 'bg-white/10 text-white/70'
                  }`}
                >
                  {isVoiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
                
                <Badge variant="outline" className="border-blue-400/30 text-blue-300">
                  {totalTokensUsed.toLocaleString()}/{monthlyLimit.toLocaleString()} tokens
                </Badge>

                <Button
                  onClick={() => setIsQuizMode(!isQuizMode)}
                  variant={isQuizMode ? "default" : "outline"}
                  size="sm"
                  className={isQuizMode 
                    ? "bg-gradient-to-r from-purple-600 to-blue-600" 
                    : "border-white/30 bg-white/10 text-white hover:bg-white/20"
                  }
                >
                  Quiz Mode
                </Button>
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
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center mb-6 animate-pulse">
                    <MessageSquare className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">
                    Welcome to Your AI Tutor
                  </h3>
                  <p className="text-white/60 max-w-2xl text-lg leading-relaxed">
                    Ask me anything about your studies! I can help with homework, explain concepts, 
                    create quizzes, solve problems, and guide your learning journey. 
                    <br />
                    <span className="text-purple-300 font-medium">What would you like to learn today?</span>
                  </p>
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                    <Card className="bg-white/5 border-white/10 p-4 hover:bg-white/10 transition-all cursor-pointer"
                          onClick={() => setInput("Help me with my math homework")}>
                      <p className="text-white text-sm">📚 Help with homework</p>
                    </Card>
                    <Card className="bg-white/5 border-white/10 p-4 hover:bg-white/10 transition-all cursor-pointer"
                          onClick={() => setInput("Create a quiz on science topics")}>
                      <p className="text-white text-sm">🧪 Create a quiz</p>
                    </Card>
                    <Card className="bg-white/5 border-white/10 p-4 hover:bg-white/10 transition-all cursor-pointer"
                          onClick={() => setInput("Explain quantum physics simply")}>
                      <p className="text-white text-sm">💡 Explain concepts</p>
                    </Card>
                  </div>
                </motion.div>
              ) : (
                <MessageList 
                  messages={legacyMessages}
                  onPlayAudio={handlePlayAudio}
                  onPauseAudio={handlePauseAudio}
                />
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Input Area */}
        <Card className="bg-black/30 backdrop-blur-xl border-white/20 rounded-none border-l-0 border-r-0 border-b-0">
          <CardContent className="p-6">
            {file && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-blue-500/20 rounded-lg flex items-center justify-between border border-blue-500/30"
              >
                <span className="text-blue-200 text-sm">📎 {file.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setFile(null)}
                  className="text-blue-300 hover:text-white hover:bg-blue-500/20"
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
                  className="min-h-[60px] py-4 px-6 text-lg bg-white/10 border-white/30 text-white placeholder-white/50 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-2xl resize-none"
                  disabled={isLoading || isTokenLimitReached}
                />
                
                {isRecording && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2"
                  >
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-400 text-sm font-medium">
                      {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                    </span>
                  </motion.div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                />
                <Button
                  onClick={() => document.getElementById('file-upload')?.click()}
                  variant="outline"
                  size="lg"
                  className="border-white/30 bg-white/10 hover:bg-white/20 text-white rounded-xl p-4"
                  disabled={isLoading}
                >
                  <Upload className="h-5 w-5" />
                </Button>

                <Button
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  variant="outline"
                  size="lg"
                  className={`border-white/30 rounded-xl p-4 ${
                    isRecording 
                      ? 'bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30' 
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                  disabled={isLoading}
                >
                  {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>

                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading || isTokenLimitReached}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl p-4 disabled:opacity-50"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>

            {apiKeyError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg"
              >
                <p className="text-red-300 text-sm">{apiKeyError}</p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
