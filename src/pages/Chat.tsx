
import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { MessageSquare, BarChart3, BookOpen } from 'lucide-react';
import { EnhancedChatArea } from '@/components/chat/EnhancedChatArea';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const Chat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [currentPage, setCurrentPage] = useState<'chat' | 'progress' | 'modules'>('chat');

  const renderNavigation = () => (
    <div className="flex items-center space-x-1 bg-white/5 rounded-lg p-1">
      <Button
        variant={currentPage === 'chat' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setCurrentPage('chat')}
        className={currentPage === 'chat' ? 'bg-blue-600 hover:bg-blue-700' : 'text-white hover:bg-white/10'}
      >
        <MessageSquare className="h-4 w-4 mr-1" />
        {t('chat.navigation.chat')}
      </Button>
      <Button
        variant={currentPage === 'progress' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => {
          setCurrentPage('progress');
          navigate('/progress');
        }}
        className={currentPage === 'progress' ? 'bg-blue-600 hover:bg-blue-700' : 'text-white hover:bg-white/10'}
      >
        <BarChart3 className="h-4 w-4 mr-1" />
        {t('chat.navigation.progress')}
      </Button>
      <Button
        variant={currentPage === 'modules' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => {
          setCurrentPage('modules');
          navigate('/modules');
        }}
        className={currentPage === 'modules' ? 'bg-blue-600 hover:bg-blue-700' : 'text-white hover:bg-white/10'}
      >
        <BookOpen className="h-4 w-4 mr-1" />
        {t('chat.navigation.modules')}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Header />
      
      {/* Navigation Bar */}
      <div className="flex-shrink-0 p-4 border-b border-white/20 bg-gray-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {renderNavigation()}
          </div>
        </div>
      </div>
      
      <main className="flex-1">
        <div className="h-full">
          <EnhancedChatArea />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Chat;
