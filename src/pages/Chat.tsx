
import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { MessageSquare, BarChart3 } from 'lucide-react';
import { EnhancedChatArea } from '@/components/chat/EnhancedChatArea';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const Chat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [currentPage, setCurrentPage] = useState<'chat' | 'monitoring'>('chat');
  const [selectedCurriculum, setSelectedCurriculum] = useState<any>(null);

  useEffect(() => {
    // Check if a curriculum was selected from modules page
    const storedCurriculum = localStorage.getItem('selectedCurriculum');
    if (storedCurriculum) {
      try {
        const curriculum = JSON.parse(storedCurriculum);
        setSelectedCurriculum(curriculum);
        // Clear it so it doesn't persist unnecessarily
        localStorage.removeItem('selectedCurriculum');
      } catch (error) {
        console.error('Error parsing stored curriculum:', error);
      }
    }
  }, []);

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
        onClick={() => {
          setCurrentPage('monitoring');
          navigate('/progress');
        }}
        className={currentPage === 'monitoring' ? 'bg-blue-600 hover:bg-blue-700' : 'text-white hover:bg-white/10'}
      >
        <BarChart3 className="h-4 w-4 mr-1" />
        Progress
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex flex-col">
      <Header />
      
      {/* Navigation Bar */}
      <div className="flex-shrink-0 p-4 border-b border-white/20 bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {renderNavigation()}
          </div>
        </div>
      </div>
      
      <main className="flex-1">
        <div className="h-full">
          <EnhancedChatArea selectedCurriculum={selectedCurriculum} />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Chat;
