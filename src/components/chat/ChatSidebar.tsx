
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MessageSquarePlus, MessageSquare, Trash2, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';


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
  isDemoMode?: boolean;
}

export const ChatSidebar = ({
  activeCurriculum,
  curricula,
  onSelectCurriculum,
  onNewChat,
  activeSessionId,
  onSelectSession,
  isDemoMode = false
}: ChatSidebarProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    if (user && !isDemoMode) {
      fetchChatSessions();
    } else {
      // Clear sessions for unauthenticated users or demo mode
      setChatSessions([]);
    }
  }, [user, isDemoMode]);

  const fetchChatSessions = async () => {
    if (!user || isDemoMode) return;

    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('conversation_id, created_at, content')
        .eq('user_id', user.id)
        .not('conversation_id', 'is', null)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

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
    const cleanContent = content.replace(/[^\w\s]/g, '').trim();
    const words = cleanContent.split(' ').filter(word => word.length > 2);
    
    if (words.length === 0) return 'New Chat';
    
    const titleWords = words.slice(0, 4);
    let title = titleWords.join(' ');
    
    title = title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
    
    if (words.length > 4) {
      title += '...';
    }
    
    return title || 'New Chat';
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    try {
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
    <div className="w-full md:w-80 bg-card border-r border-border p-4 space-y-4 h-full flex flex-col">
      <div className="flex-shrink-0">
        <Button
          onClick={onNewChat}
          className="w-full bg-primary hover:bg-primary/90 h-11 text-sm font-medium"
        >
          <MessageSquarePlus className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="truncate">{t('chat.newChat')}</span>
        </Button>
      </div>

      <Separator className="bg-gray-700 flex-shrink-0" />

      {/* Previous Chats */}
      <div className="flex-1 min-h-0">
        <h3 className="text-sm font-medium text-gray-300 mb-3 px-1">{t('chat.previousChats')}</h3>
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
          {chatSessions.length === 0 && user && (
            <p className="text-xs text-gray-400 text-center py-4">
              No previous chats yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
