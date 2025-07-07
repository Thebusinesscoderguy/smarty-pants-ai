
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { EnhancedChatArea } from '@/components/chat/EnhancedChatArea';

const Chat = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col">
      <Header />
      
      {/* Main Chat Interface using EnhancedChatArea */}
      <main className="flex-1 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="h-full">
          <EnhancedChatArea />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Chat;
