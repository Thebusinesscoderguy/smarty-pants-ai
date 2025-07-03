
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Send, Sparkles, Brain, BookOpen, Target, User, Bot, Settings, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Chat = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Array<{id: string, content: string, isUser: boolean, timestamp: Date}>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState<'chat' | 'monitoring' | 'settings'>('chat');

  useEffect(() => {
    // Handle initial message from navigation state
    if (location.state?.message) {
      setInputMessage(location.state.message);
    }
  }, [location.state]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const renderNavigation = () => (
    <div className="flex items-center space-x-2 bg-white/5 rounded-xl p-2 backdrop-blur-sm border border-white/10">
      <Button
        variant={currentPage === 'chat' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setCurrentPage('chat')}
        className={`${currentPage === 'chat' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'text-white hover:bg-white/10'} transition-all duration-200`}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Chat
      </Button>
      <Button
        variant={currentPage === 'monitoring' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => {
          setCurrentPage('monitoring');
          navigate('/progress');
        }}
        className={`${currentPage === 'monitoring' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'text-white hover:bg-white/10'} transition-all duration-200`}
      >
        <BarChart3 className="h-4 w-4 mr-2" />
        Dashboard
      </Button>
      <Button
        variant={currentPage === 'settings' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => {
          setCurrentPage('settings');
          navigate('/settings');
        }}
        className={`${currentPage === 'settings' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'text-white hover:bg-white/10'} transition-all duration-200`}
      >
        <Settings className="h-4 w-4 mr-2" />
        Settings
      </Button>
    </div>
  );

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        content: "I'm here to help you learn! What would you like to explore today?",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const quickActions = [
    { icon: Brain, label: 'Create Curriculum', action: () => setInputMessage('I want to create a custom AI curriculum. Please help me get started.') },
    { icon: BookOpen, label: 'Study Help', action: () => setInputMessage('I need help studying for my upcoming exam. Can you create a study plan?') },
    { icon: Target, label: 'Set Goals', action: () => setInputMessage('Help me set learning goals and track my progress.') },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex flex-col">
      <Header />
      
      {/* Modern Navigation Bar */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {renderNavigation()}
            </div>
            <div className="text-white/60 text-sm">
              {user ? `Welcome, ${user.email?.split('@')[0]}` : 'Demo Mode'}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-6 py-8">
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center">
            <MessageSquare className="mr-4 h-12 w-12 text-blue-400" />
            AI Learning Assistant
          </h1>
          <p className="text-white/70 text-xl">
            Your personal AI tutor is ready to help you learn anything
          </p>
        </div>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl">
          {/* Messages Area */}
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            {messages.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl inline-block mb-8">
                  <Sparkles className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">Ready to Learn?</h3>
                  <p className="text-white/70 text-lg">Start a conversation or try one of these quick actions:</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  {quickActions.map((action, index) => (
                    <Card key={index} className="bg-white/10 border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer group" onClick={action.action}>
                      <CardContent className="p-6 text-center">
                        <div className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl inline-block mb-4 group-hover:scale-110 transition-transform duration-300">
                          <action.icon className="h-8 w-8 text-blue-400" />
                        </div>
                        <h4 className="text-white font-semibold text-lg">{action.label}</h4>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start space-x-3 max-w-3xl ${message.isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`p-2 rounded-xl ${message.isUser ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-white/10'}`}>
                      {message.isUser ? <User className="h-5 w-5 text-white" /> : <Bot className="h-5 w-5 text-blue-400" />}
                    </div>
                    <div className={`p-4 rounded-2xl ${message.isUser ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'bg-white/10 text-white'} shadow-lg`}>
                      <p className="text-lg leading-relaxed">{message.content}</p>
                      <p className="text-xs mt-2 opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-3 max-w-3xl">
                  <div className="p-2 rounded-xl bg-white/10">
                    <Bot className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="p-4 rounded-2xl bg-white/10 text-white shadow-lg">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-white/20">
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything about learning..."
                  className="w-full px-6 py-4 bg-white/10 border border-white/30 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 text-lg"
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 rounded-2xl font-semibold shadow-lg disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Chat;
