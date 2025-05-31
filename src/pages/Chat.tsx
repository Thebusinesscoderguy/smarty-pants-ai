
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { EnhancedChatArea } from '@/components/chat/EnhancedChatArea';
import { useAuth } from '@/contexts/AuthContext';

const Chat = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      
      <main className="flex-1 px-4 py-8 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">AI Learning Assistant</h1>
            <p className="text-gray-400">
              {user ? 
                "Get personalized help with your studies based on your school's curriculum" :
                "Interactive AI tutor to help with your learning journey"
              }
            </p>
          </div>

          <EnhancedChatArea />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Chat;
