
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Chat } from '@/pages/Chat';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatSidebarProps {
  chats: Chat[];
  activeChat: Chat | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
}

const ChatSidebar = ({ chats, activeChat, onSelectChat, onNewChat }: ChatSidebarProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Group chats by topic
  const chatsByTopic: Record<string, Chat[]> = {};
  filteredChats.forEach(chat => {
    if (!chatsByTopic[chat.topic]) {
      chatsByTopic[chat.topic] = [];
    }
    chatsByTopic[chat.topic].push(chat);
  });
  
  return (
    <div className="w-64 bg-gray-900 border-r border-white/10 flex flex-col h-full">
      <div className="p-4">
        <Button 
          onClick={onNewChat}
          className="w-full bg-white text-black hover:bg-gray-200 mb-4 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          New Chat
        </Button>
        
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/50" />
          <Input 
            placeholder="Search chats..." 
            className="pl-9 bg-white/5 border-white/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="px-2 pb-4">
          {Object.entries(chatsByTopic).map(([topic, topicChats]) => (
            <div key={topic} className="mb-4">
              <h3 className="text-sm font-medium text-white/70 px-2 py-1">{topic}</h3>
              
              {topicChats.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={`w-full text-left px-3 py-2 rounded-md mb-1 transition-colors ${
                    activeChat?.id === chat.id
                      ? 'bg-white/20'
                      : 'hover:bg-white/10'
                  }`}
                >
                  <div className="font-medium truncate">{chat.title}</div>
                  <div className="text-xs text-white/50 truncate">{chat.lastMessage}</div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatSidebar;
