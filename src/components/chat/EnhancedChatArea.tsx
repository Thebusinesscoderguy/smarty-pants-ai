
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, FileText, Users, BarChart3, BookOpen, Settings, Menu, X, Info, Send } from 'lucide-react';
import { ChatSidebar } from './ChatSidebar';
import MessageList from '@/components/MessageList';
import VoiceMessageInput from '@/components/VoiceMessageInput';
import { useMessageHandler } from '@/hooks/useMessageHandler';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<'chat' | 'monitoring' | 'modules'>('chat');
  const [activeCurriculum, setActiveCurriculum] = useState<any>(selectedCurriculum || null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [textMessage, setTextMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  
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
      // Initialize with curriculum-specific welcome message
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

  // Initialize demo messages
  useEffect(() => {
    if (isDemoMode && !selectedCurriculum) {
      const demoSessions = getDemoChatSessions();
      if (demoSessions.length > 0) {
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
    }
  }, [isDemoMode, selectedCurriculum]);

  const handleSendText = async () => {
    if (!textMessage.trim() || isProcessing) return;

    if (isDemoMode && demoTimeLeft && demoTimeLeft <= 0) {
      return; // Don't allow new messages if demo time expired
    }

    const userMessage = textMessage.trim();
    setTextMessage('');

    if (isDemoMode) {
      // Demo mode - simulate AI responses
      const newUserMessage = createDemoMessage(userMessage, true);
      setDemoMessages(prev => [...prev, newUserMessage]);
      
      setIsProcessing(true);
      
      // Simulate AI thinking time
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
      // Real mode - use actual AI with curriculum context
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
      
      // Include curriculum context in the AI request only if curriculum is selected
      let contextualMessage = userMessage;
      if (activeCurriculum) {
        contextualMessage = `[Curriculum Context: ${activeCurriculum.title} - ${activeCurriculum.description}. Subjects: ${activeCurriculum.subjects.join(', ')}. Grade Level: ${activeCurriculum.gradeLevel}] User Question: ${userMessage}`;
      }
      
      await getAIResponse(contextualMessage, 'alloy');
    }
  };

  const handleFileUpload = () => {
    if (!file) return;
    console.log('Uploading file:', file.name);
    setFile(null);
  };

  const handleVoiceResponse = async () => {
    if (!textMessage.trim()) return;
    await handleSendText();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleNewChat = () => {
    if (isDemoMode) {
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
    if (isDemoMode) {
      const demoSessions = getDemoChatSessions();
      const session = demoSessions.find(s => s.id === sessionId);
      if (session) {
        setDemoMessages(session.messages);
      }
    }
  };

  const renderNavigation = () => (
    <div className="flex items-center space-x-1 bg-white/5 rounded-lg p-1">
      <Button
        variant={currentPage === 'chat' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setCurrentPage('chat')}
        className={currentPage === 'chat' ? 'bg-blue-600 hover:bg-blue-700' : 'text-white hover:bg-white/10'}
      >
        <MessageSquare className="h-4 w-4 mr-1" />
        Chat
      </Button>
      <Button
        variant={currentPage === 'monitoring' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setCurrentPage('monitoring')}
        className={currentPage === 'monitoring' ? 'bg-blue-600 hover:bg-blue-700' : 'text-white hover:bg-white/10'}
      >
        <BarChart3 className="h-4 w-4 mr-1" />
        Monitoring
      </Button>
      <Button
        variant={currentPage === 'modules' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setCurrentPage('modules')}
        className={currentPage === 'modules' ? 'bg-blue-600 hover:bg-blue-700' : 'text-white hover:bg-white/10'}
      >
        <BookOpen className="h-4 w-4 mr-1" />
        Modules
      </Button>
    </div>
  );

  const renderChatInterface = () => {
    const displayMessages = isDemoMode ? demoMessages : messages;
    
    return (
      <div className="flex h-full bg-white">
        {/* Sidebar */}
        <div className={`${isSidebarOpen ? 'block' : 'hidden'} md:block flex-shrink-0 w-64 bg-gray-50 border-r border-gray-200`}>
          <ChatSidebar
            activeCurriculum={activeCurriculum}
            curricula={curricula}
            onSelectCurriculum={setActiveCurriculum}
            onNewChat={handleNewChat}
            activeSessionId={activeSessionId}
            onSelectSession={handleSelectSession}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="md:hidden text-gray-600 hover:bg-gray-100"
                >
                  {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {activeCurriculum ? activeCurriculum.title : 'AI Tutor'}
                  </h2>
                  {activeCurriculum && (
                    <p className="text-sm text-gray-500">{activeCurriculum.description}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {!isDemoMode && (
                  <Badge variant="outline" className="border-gray-300 text-gray-600 bg-gray-50">
                    {totalTokensUsed.toLocaleString()} / {monthlyLimit.toLocaleString()} tokens
                  </Badge>
                )}
                {isQuizMode && (
                  <Badge className="bg-green-600 text-white">
                    Quiz Mode
                  </Badge>
                )}
                {activeCurriculum && (
                  <Badge className="bg-blue-600 text-white">
                    <Info className="h-3 w-3 mr-1" />
                    {activeCurriculum.gradeLevel}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="max-w-4xl mx-auto">
              <MessageList
                messages={displayMessages}
                onPlayAudio={handlePlayAudio}
                onPauseAudio={handlePauseAudio}
              />
              {isProcessing && (
                <div className="flex justify-center py-4">
                  <div className="flex items-center space-x-2 text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                    <span>AI is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <textarea
                    value={textMessage}
                    onChange={(e) => setTextMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message here..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={1}
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                    disabled={isDemoMode && demoTimeLeft !== undefined && demoTimeLeft <= 0}
                  />
                </div>
                <Button
                  onClick={handleSendText}
                  disabled={!textMessage.trim() || isProcessing || (isDemoMode && demoTimeLeft !== undefined && demoTimeLeft <= 0)}
                  className="h-12 w-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    );
  };

  const renderModulesPage = () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Learning Modules</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {curricula.slice(0, 6).map((curriculum) => (
          <Card key={curriculum.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-2">{curriculum.title}</h3>
              <p className="text-white/70 text-sm mb-4">{curriculum.description}</p>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-white/20 text-white text-xs">
                  {curriculum.gradeLevel}
                </Badge>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Start Learning
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderMonitoringPage = () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Learning Progress</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Study Time</h3>
            <div className="text-3xl font-bold text-blue-400 mb-1">24h 30m</div>
            <p className="text-white/60 text-sm">This week</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Problems Solved</h3>
            <div className="text-3xl font-bold text-green-400 mb-1">347</div>
            <p className="text-white/60 text-sm">Total completed</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Current Streak</h3>
            <div className="text-3xl font-bold text-yellow-400 mb-1">🔥 12</div>
            <p className="text-white/60 text-sm">Days in a row</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen">
      {/* Page Content */}
      <div className="flex-1 overflow-hidden">
        {currentPage === 'chat' && renderChatInterface()}
        {currentPage === 'monitoring' && renderMonitoringPage()}
        {currentPage === 'modules' && renderModulesPage()}
      </div>
    </div>
  );
};
