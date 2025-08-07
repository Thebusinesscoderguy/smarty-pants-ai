
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, BarChart3, Menu, X, Send, BookOpen, Upload, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { ChatSidebar } from './ChatSidebar';
import MessageList from '@/components/MessageList';
import { useMessageHandler } from '@/hooks/useMessageHandler';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { curricula } from '@/utils/curriculaData';
import { getDemoChatSessions, createDemoMessage, type DemoMessage } from '@/utils/demoChatData';

interface EnhancedChatAreaProps {
  isDemoMode?: boolean;
  demoTimeLeft?: number;
  selectedCurriculum?: any;
}

export const EnhancedChatArea = ({ isDemoMode = false, demoTimeLeft, selectedCurriculum }: EnhancedChatAreaProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeCurriculum, setActiveCurriculum] = useState<any>(selectedCurriculum || null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [textMessage, setTextMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Demo-specific state
  const [demoMessages, setDemoMessages] = useState<DemoMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    messages,
    setMessages,
    messagesEndRef,
    apiKeyError,
    isQuizMode,
    setIsQuizMode,
    totalTokensUsed,
    inputTokens,
    outputTokens,
    monthlyLimit,
    isTokenLimitReached,
    scrollToBottom,
    getAIResponse,
    handlePlayAudio,
    handlePauseAudio,
    trackResponseTime,
    incrementTokenCount
  } = useMessageHandler();

  // Set curriculum from props
  useEffect(() => {
    if (selectedCurriculum) {
      setActiveCurriculum(selectedCurriculum);
      const curriculumWelcome = {
        id: 'curriculum-welcome',
        text: `Welcome! I'm ready to help you learn ${selectedCurriculum.title}. This curriculum covers ${selectedCurriculum.subjects.join(', ')} for ${selectedCurriculum.gradeLevel} students. What would you like to start with?`,
        timestamp: new Date(),
        isFromUser: false,
        type: 'text' as const,
        tokenCount: 35
      };
      
      if (isDemoMode) {
        setDemoMessages([curriculumWelcome]);
      } else {
        setMessages([curriculumWelcome]);
      }
    }
  }, [selectedCurriculum, isDemoMode, setMessages]);

  // Initialize demo messages only in demo mode
  useEffect(() => {
    if (isDemoMode && !selectedCurriculum && !user) {
      setDemoMessages([
        {
          id: 'demo-welcome',
          text: "Hello! I'm your AI tutor. I can help you learn anything - just ask me a question, upload a file, or start a conversation. What would you like to explore today?",
          timestamp: new Date(),
          isFromUser: false,
          type: 'text',
          tokenCount: 35
        }
      ]);
    }
  }, [isDemoMode, selectedCurriculum, user]);

  const renderNavigation = () => (
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/chat')}
        className="text-blue-400 hover:bg-gray-700 hover:text-blue-300 flex items-center"
      >
        <MessageSquare className="h-4 w-4 mr-1" />
        {t('nav.chat') || 'Chat'}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/progress')}
        className="text-gray-400 hover:bg-gray-700 hover:text-white flex items-center"
      >
        <BarChart3 className="h-4 w-4 mr-1" />
        {t('nav.progress') || 'Progress'}
      </Button>
    </div>
  );

  const handleSendText = async () => {
    if (!textMessage.trim() || isProcessing) return;

    if (isDemoMode && demoTimeLeft && demoTimeLeft <= 0) {
      return;
    }

    const userMessage = textMessage.trim();
    setTextMessage('');

    if (isDemoMode) {
      const newUserMessage = createDemoMessage(userMessage, true);
      setDemoMessages(prev => [...prev, newUserMessage]);
      
      setIsProcessing(true);
      
      setTimeout(() => {
        const aiResponses = [
          "That's a great question! Let me help you understand this concept step by step...",
          "I can definitely help you with that! Here's what you need to know...",
          "Excellent topic to explore! Let me break this down for you...",
          "I love that you're curious about this! Here's my explanation...",
          "Perfect question for learning! Let me guide you through this...",
        ];
        
        const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
        const aiMessage = createDemoMessage(randomResponse, false);
        
        setDemoMessages(prev => [...prev, aiMessage]);
        setIsProcessing(false);
      }, 1500);
    } else {
      if (isTokenLimitReached) {
        alert('Monthly token limit reached. Please upgrade your plan.');
        return;
      }

      const userMessageObj = {
        id: `user-${Date.now()}`,
        text: userMessage,
        timestamp: new Date(),
        isFromUser: true,
        type: 'text' as const,
        tokenCount: Math.ceil(userMessage.length / 4)
      };

      setMessages(prev => [...prev, userMessageObj]);
      incrementTokenCount(userMessageObj.tokenCount, 0);
      
      await getAIResponse(userMessage, 'alloy', activeCurriculum);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      // Stop recording logic here
    } else {
      setIsRecording(true);
      // Start recording logic here
    }
  };

  const handleNewChat = () => {
    if (isDemoMode && !user) {
      setDemoMessages([
        {
          id: 'demo-welcome-new',
          text: "Hello! I'm your AI tutor. What would you like to learn about?",
          timestamp: new Date(),
          isFromUser: false,
          type: 'text',
          tokenCount: 15
        }
      ]);
    } else {
      const welcomeText = activeCurriculum 
        ? `New chat started! I'm ready to help you with ${activeCurriculum.title}. What would you like to learn?`
        : "Hello! I'm your AI tutor. I can help you learn anything. What would you like to explore today?";
      
      setMessages([{
        id: 'welcome-message',
        text: welcomeText,
        timestamp: new Date(),
        isFromUser: false,
        type: 'text',
        tokenCount: Math.ceil(welcomeText.length / 4)
      }]);
    }
    setActiveSessionId(null);
  };

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    if (isDemoMode && !user) {
      const demoSessions = getDemoChatSessions();
      const session = demoSessions.find(s => s.id === sessionId);
      if (session) {
        setDemoMessages(session.messages);
      }
    }
    // For real mode, load actual chat sessions from database
    // This functionality should be implemented when needed
  };

  const displayMessages = (isDemoMode && !user) ? demoMessages : messages;
  
  return (
    <div className="flex h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden flex-shrink-0`}>
        <ChatSidebar
          activeCurriculum={activeCurriculum}
          curricula={[]}
          onSelectCurriculum={setActiveCurriculum}
          onNewChat={handleNewChat}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          isDemoMode={isDemoMode}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-800/50 to-purple-800/50 backdrop-blur-sm">
        {/* Chat Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-gray-400 hover:bg-white/10 hover:text-white rounded-xl"
              >
                {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              
              {renderNavigation()}
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">AI</span>
                </div>
                <h2 className="text-xl font-semibold text-white">
                  {activeCurriculum ? activeCurriculum.title : 'AI Learning Assistant'}
                </h2>
              </div>
              
              <div className="flex items-center space-x-2">
                {!isDemoMode && (
                  <Badge variant="outline" className="border-white/30 text-white/80 bg-white/10 text-sm px-3 py-1">
                    {totalTokensUsed.toLocaleString()} tokens used
                  </Badge>
                )}
                {isQuizMode && (
                  <Badge className="bg-green-600 text-white text-sm px-3 py-1">
                    Quiz Mode
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-900/80 via-purple-900/80 to-slate-900/80 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <MessageList
              messages={displayMessages}
              onPlayAudio={handlePlayAudio}
              onPauseAudio={handlePauseAudio}
            />
            {isProcessing && (
              <div className="flex justify-center py-8">
                <div className="flex items-center space-x-3 text-white/70 bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-sm">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white/70"></div>
                  <span className="text-lg">AI is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Enhanced Input Area */}
        <div className="flex-shrink-0 p-6 border-t border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto">
            {selectedFile && (
              <div className="mb-4 p-4 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-between backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <Upload className="h-5 w-5 text-blue-400" />
                  <span className="text-white font-medium">{selectedFile.name}</span>
                  <Badge className="bg-blue-600 text-white">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </Badge>
                </div>
                <Button
                  onClick={() => setSelectedFile(null)}
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div className="relative">
              <textarea
                value={textMessage}
                onChange={(e) => setTextMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about learning..."
                className="w-full px-6 py-4 pr-32 bg-white/10 border border-white/30 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-white/60 backdrop-blur-sm text-lg"
                rows={1}
                style={{ minHeight: '60px', maxHeight: '120px' }}
                disabled={isDemoMode && demoTimeLeft !== undefined && demoTimeLeft <= 0}
              />
              
              <div className="absolute right-3 bottom-3 flex items-center space-x-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                />
                
                <Button
                  onClick={handleFileUpload}
                  variant="ghost"
                  size="sm"
                  className="p-2 h-10 w-10 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                  disabled={isDemoMode && demoTimeLeft !== undefined && demoTimeLeft <= 0}
                >
                  <Upload className="h-5 w-5" />
                </Button>
                
                <Button
                  onClick={handleVoiceToggle}
                  variant="ghost"
                  size="sm"
                  className={`p-2 h-10 w-10 rounded-xl transition-all duration-200 ${
                    isRecording 
                      ? 'text-red-400 hover:text-red-300 bg-red-500/20 hover:bg-red-500/30' 
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                  disabled={isDemoMode && demoTimeLeft !== undefined && demoTimeLeft <= 0}
                >
                  {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
                
                <Button
                  onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                  variant="ghost"
                  size="sm"
                  className={`p-2 h-10 w-10 rounded-xl transition-all duration-200 ${
                    isVoiceEnabled 
                      ? 'text-purple-400 hover:text-purple-300 bg-purple-500/20 hover:bg-purple-500/30' 
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                  disabled={isDemoMode && demoTimeLeft !== undefined && demoTimeLeft <= 0}
                  title={isVoiceEnabled ? 'Voice responses enabled' : 'Voice responses disabled'}
                >
                  {isVoiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </Button>
                
                <Button
                  onClick={handleSendText}
                  disabled={!textMessage.trim() || isProcessing || (isDemoMode && demoTimeLeft !== undefined && demoTimeLeft <= 0)}
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
