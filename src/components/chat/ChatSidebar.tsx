
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Plus, Settings } from 'lucide-react';

export const ChatSidebar = () => {
  const [conversations, setConversations] = useState([
    { id: 1, title: "Math Help", lastMessage: "quadratic equations", time: "2 min ago" },
    { id: 2, title: "Science Questions", lastMessage: "photosynthesis process", time: "1 hour ago" },
    { id: 3, title: "History Essay", lastMessage: "World War II timeline", time: "Yesterday" },
  ]);

  return (
    <div className="w-80 bg-white/5 border-r border-white/20 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Conversations</h2>
        <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-2">
        {conversations.map((conv) => (
          <Card key={conv.id} className="bg-white/10 border-white/20 cursor-pointer hover:bg-white/15 transition-colors">
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white text-sm truncate">{conv.title}</h3>
                  <p className="text-xs text-gray-400 truncate">{conv.lastMessage}</p>
                  <p className="text-xs text-gray-500 mt-1">{conv.time}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="mt-auto pt-4">
        <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/10">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>
    </div>
  );
};
