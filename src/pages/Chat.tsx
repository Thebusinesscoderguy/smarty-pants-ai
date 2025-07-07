
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { EnhancedChatArea } from '@/components/chat/EnhancedChatArea';

const Chat = () => {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col">
      <Header />
      
      {/* Main Chat Interface - using the enhanced chat interface */}
      <main className="flex-1">
        <EnhancedChatArea isDemoMode={false} />
      </main>

      <Footer />
    </div>
  );
};

export default Chat;
