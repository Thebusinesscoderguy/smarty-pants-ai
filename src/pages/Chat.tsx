
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { EnhancedChatArea } from '@/components/chat/EnhancedChatArea';
import { useAuth } from '@/contexts/AuthContext';

const Chat = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      
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
