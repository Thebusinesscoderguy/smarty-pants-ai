
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MessageSquarePlus, MessageSquare, Trash2, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getDemoChatSessions } from '@/utils/demoChatData';

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  message_count: number;
}

interface ChatSidebarProps {
  activeCurriculum: any;
  curricula: any[];
  onSelectCurriculum: (curriculum: any) => void;
  onNewChat: () => void;
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
}

export const ChatSidebar = ({
  activeCurriculum,
  curricula,
  onSelectCurriculum,
  onNewChat,
  activeSessionId,
  onSelectSession
}: ChatSidebarProps) => {
  const { user } = useAuth();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    if (user) {
      fetchChatSessions();
    } else {
      // Load demo sessions for non-authenticated users
      const demoSessions = getDemoChatSessions().map(session => ({
        id: session.id,
        title: session.title,
        created_at: session.created_at,
        message_count: session.messages.length
      }));
      setChatSessions(demoSessions);
    }
  }, [user]);

  const fetchChatSessions = async () => {
    if (!user) return;

    try {
      // Get messages data grouped by conversation_id
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('conversation_id, created_at, content')
        .eq('user_id', user.id)
        .not('conversation_id', 'is', null)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Group messages by conversation_id and create sessions
      const sessionMap = new Map();
      messagesData?.forEach(msg => {
        if (!sessionMap.has(msg.conversation_id)) {
          sessionMap.set(msg.conversation_id, {
            id: msg.conversation_id,
            title: generateTitleFromContent(msg.content),
            created_at: msg.created_at,
            message_count: 1
          });
        } else {
          sessionMap.get(msg.conversation_id).message_count++;
        }
      });

      setChatSessions(Array.from(sessionMap.values()));
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
    }
  };

  const generateTitleFromContent = (content: string): string => {
    // Improved title generation
    const cleanContent = content.replace(/[^\w\s]/g, '').trim();
    const words = cleanContent.split(' ').filter(word => word.length > 2);
    
    if (words.length === 0) return 'New Chat';
    
    // Take first 3-4 meaningful words
    const titleWords = words.slice(0, 4);
    let title = titleWords.join(' ');
    
    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
    
    // Add ellipsis if original content was longer
    if (words.length > 4) {
      title += '...';
    }
    
    return title || 'New Chat';
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    try {
      // Delete messages
      await supabase
        .from('messages')
        .delete()
        .eq('user_id', user.id)
        .eq('conversation_id', sessionId);

      setChatSessions(prev => prev.filter(s => s.id !== sessionId));
      
      if (activeSessionId === sessionId) {
        onNewChat();
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  return (
    <div className="w-full md:w-80 bg-gray-800 border-r border-gray-700 p-4 space-y-4 h-full flex flex-col">
      <div className="flex-shrink-0">
        <Button
          onClick={onNewChat}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 text-sm font-medium"
        >
          <MessageSquarePlus className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="truncate">New Chat</span>
        </Button>
      </div>

      <Separator className="bg-gray-700 flex-shrink-0" />

      {/* Curriculum Selection */}
      {curricula.length > 0 && (
        <Card className="bg-gray-700 border-gray-600 flex-shrink-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-white text-sm">
              <BookOpen className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Learning Context</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant={!activeCurriculum ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSelectCurriculum(null)}
              className="w-full justify-start text-xs bg-gray-600 text-white border-gray-500 hover:bg-gray-500 h-8"
            >
              <span className="truncate">General Chat</span>
            </Button>
            {curricula.map((curriculum) => (
              <Button
                key={curriculum.id}
                variant={activeCurriculum?.id === curriculum.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => onSelectCurriculum(curriculum)}
                className="w-full justify-start text-xs bg-gray-600 text-white border-gray-500 hover:bg-gray-500 h-8"
              >
                <span className="truncate">{curriculum.title}</span>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      <Separator className="bg-gray-700 flex-shrink-0" />

      {/* Previous Chats */}
      <div className="flex-1 min-h-0">
        <h3 className="text-sm font-medium text-gray-300 mb-3 px-1">Previous Chats</h3>
        <div className="space-y-2 h-full overflow-y-auto custom-scrollbar">
          {chatSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                activeSessionId === session.id
                  ? 'bg-blue-600/20 border border-blue-500/30'
                  : 'bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600'
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <MessageSquare className="h-3 w-3 text-gray-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate font-medium">{session.title}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(session.created_at).toLocaleDateString()} • {session.message_count} messages
                  </p>
                </div>
              </div>
              {user && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => deleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto hover:bg-gray-600 flex-shrink-0"
                >
                  <Trash2 className="h-3 w-3 text-red-400" />
                </Button>
              )}
            </div>
          ))}
          {chatSessions.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">
              {user ? 'No previous chats yet' : 'Try the demo conversations above!'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
