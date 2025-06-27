import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, FileText, Users, BarChart3, BookOpen, Settings, Menu, X, Info, Send, Plus } from 'lucide-react';
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
      // Real mode - use actual AI
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
      
      // Pass curriculum context to AI only if it exists
      await getAIResponse(userMessage, 'alloy', activeCurriculum);
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

  const displayMessages = isDemoMode ? demoMessages : messages;
  
  return (
    <div className="flex h-full bg-gray-900">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'block' : 'hidden'} md:block flex-shrink-0 w-64 bg-gray-900 border-r border-gray-700`}>
        <div className="flex flex-col h-full">
          {/* New Chat Button */}
          <div className="p-3 border-b border-gray-700">
            <Button
              onClick={handleNewChat}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 flex items-center justify-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Chat</span>
            </Button>
          </div>

          {/* Chat Sessions */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-2">
              <div className="text-gray-400 text-sm font-medium mb-2">Recent Chats</div>
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left text-gray-300 hover:bg-gray-800 h-auto p-2"
                  onClick={() => handleSelectSession('demo-1')}
                >
                  <div className="truncate">Math Help Session</div>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left text-gray-300 hover:bg-gray-800 h-auto p-2"
                  onClick={() => handleSelectSession('demo-2')}
                >
                  <div className="truncate">Science Questions</div>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left text-gray-300 hover:bg-gray-800 h-auto p-2"
                  onClick={() => handleSelectSession('demo-3')}
                >
                  <div className="truncate">History Discussion</div>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-800">
        {/* Chat Header */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden text-gray-400 hover:bg-gray-700"
              >
                {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">AI</span>
                </div>
                <h2 className="text-lg font-semibold text-white">
                  {activeCurriculum ? activeCurriculum.title : 'AI Tutor'}
                </h2>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {!isDemoMode && (
                <Badge variant="outline" className="border-gray-600 text-gray-300 bg-gray-700 text-xs">
                  {totalTokensUsed.toLocaleString()} tokens used
                </Badge>
              )}
              {isQuizMode && (
                <Badge className="bg-green-600 text-white text-xs">
                  Quiz Mode
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-gray-800">
          <div className="max-w-3xl mx-auto px-4">
            <MessageList
              messages={displayMessages}
              onPlayAudio={handlePlayAudio}
              onPauseAudio={handlePauseAudio}
            />
            {isProcessing && (
              <div className="flex justify-center py-4">
                <div className="flex items-center space-x-2 text-gray-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  <span>AI is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 p-4 border-t border-gray-700 bg-gray-800">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <textarea
                value={textMessage}
                onChange={(e) => setTextMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                className="w-full px-4 py-3 pr-12 bg-gray-700 border border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                rows={1}
                style={{ minHeight: '52px', maxHeight: '120px' }}
                disabled={isDemoMode && demoTimeLeft !== undefined && demoTimeLeft <= 0}
              />
              <Button
                onClick={handleSendText}
                disabled={!textMessage.trim() || isProcessing || (isDemoMode && demoTimeLeft !== undefined && demoTimeLeft <= 0)}
                className="absolute right-2 bottom-2 h-8 w-8 rounded-md bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center p-0"
              >
                <Send className="h-4 w-4" />
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
