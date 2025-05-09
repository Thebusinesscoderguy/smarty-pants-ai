
import { useState } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatArea from '@/components/chat/ChatArea';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface Chat {
  id: string;
  title: string;
  topic: string;
  lastMessage: string;
  updatedAt: Date;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  content: string;
  isFromUser: boolean;
  timestamp: Date;
}

const Chat = () => {
  const [chats, setChats] = useState<Chat[]>([
    {
      id: '1',
      title: 'Math Help',
      topic: 'Mathematics',
      lastMessage: 'How do I solve this equation?',
      updatedAt: new Date(2025, 4, 5),
      messages: [
        {
          id: '1-1',
          content: 'Hello, I need help with a math problem.',
          isFromUser: true,
          timestamp: new Date(2025, 4, 5, 10, 0)
        },
        {
          id: '1-2',
          content: 'Of course! What type of math problem are you working on?',
          isFromUser: false,
          timestamp: new Date(2025, 4, 5, 10, 1)
        },
        {
          id: '1-3',
          content: 'How do I solve this equation?',
          isFromUser: true,
          timestamp: new Date(2025, 4, 5, 10, 2)
        }
      ]
    },
    {
      id: '2',
      title: 'History Discussion',
      topic: 'History',
      lastMessage: 'Can you explain the causes of World War I?',
      updatedAt: new Date(2025, 4, 4),
      messages: [
        {
          id: '2-1',
          content: 'I need to learn about World War I.',
          isFromUser: true,
          timestamp: new Date(2025, 4, 4, 15, 0)
        },
        {
          id: '2-2',
          content: 'Can you explain the causes of World War I?',
          isFromUser: true,
          timestamp: new Date(2025, 4, 4, 15, 1)
        }
      ]
    },
    {
      id: '3',
      title: 'Programming Help',
      topic: 'Computer Science',
      lastMessage: 'How do I use React hooks?',
      updatedAt: new Date(2025, 4, 3),
      messages: [
        {
          id: '3-1',
          content: 'I\'m learning React and I\'m confused about hooks.',
          isFromUser: true,
          timestamp: new Date(2025, 4, 3, 9, 0)
        },
        {
          id: '3-2',
          content: 'How do I use React hooks?',
          isFromUser: true,
          timestamp: new Date(2025, 4, 3, 9, 1)
        }
      ]
    }
  ]);
  
  const [activeChat, setActiveChat] = useState<Chat | null>(chats[0] || null);
  const [inputMessage, setInputMessage] = useState('');

  const handleSelectChat = (chatId: string) => {
    const selected = chats.find(chat => chat.id === chatId);
    if (selected) {
      setActiveChat(selected);
    }
  };

  const handleNewChat = () => {
    const newChat: Chat = {
      id: `new-${Date.now()}`,
      title: 'New Chat',
      topic: 'General',
      lastMessage: '',
      updatedAt: new Date(),
      messages: []
    };
    
    setChats(prev => [newChat, ...prev]);
    setActiveChat(newChat);
    setInputMessage('');
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !activeChat) return;
    
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      content: inputMessage,
      isFromUser: true,
      timestamp: new Date()
    };
    
    // Update chat with new message
    const updatedChat = {
      ...activeChat,
      lastMessage: inputMessage,
      updatedAt: new Date(),
      messages: [...activeChat.messages, newMessage]
    };
    
    // Add simulated AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        content: `This is a simulated response to: ${inputMessage}`,
        isFromUser: false,
        timestamp: new Date()
      };
      
      const updatedWithAiChat = {
        ...updatedChat,
        messages: [...updatedChat.messages, aiResponse]
      };
      
      setChats(prev => prev.map(chat => 
        chat.id === activeChat.id ? updatedWithAiChat : chat
      ));
      
      setActiveChat(updatedWithAiChat);
    }, 1000);
    
    // Update chats state
    setChats(prev => prev.map(chat => 
      chat.id === activeChat.id ? updatedChat : chat
    ));
    
    setActiveChat(updatedChat);
    setInputMessage('');
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden">
      <div className="w-64 flex-shrink-0 border-r border-white/10">
        <AppSidebar />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <ChatSidebar 
          chats={chats}
          activeChat={activeChat}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
        />
        
        {activeChat ? (
          <ChatArea 
            chat={activeChat}
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            onSendMessage={handleSendMessage}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Start a new chat</h2>
              <Button onClick={handleNewChat} className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                New Chat
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
