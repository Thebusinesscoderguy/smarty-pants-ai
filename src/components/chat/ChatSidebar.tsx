
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MessageSquarePlus, MessageSquare, Trash2, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
    }
  }, [user]);

  const fetchChatSessions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('conversation_id, created_at, content')
        .eq('user_id', user.id)
        .not('conversation_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by conversation_id and create sessions
      const sessionMap = new Map();
      data?.forEach(msg => {
        if (!sessionMap.has(msg.conversation_id)) {
          sessionMap.set(msg.conversation_id, {
            id: msg.conversation_id,
            title: msg.content.slice(0, 30) + (msg.content.length > 30 ? '...' : ''),
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
    <div className="w-80 bg-white/10 border-r border-white/20 p-4 space-y-4">
      <div>
        <Button
          onClick={onNewChat}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <MessageSquarePlus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      <Separator className="bg-white/20" />

      {/* Curriculum Selection */}
      {curricula.length > 0 && (
        <Card className="bg-white/10 border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-white text-sm">
              <BookOpen className="h-4 w-4" />
              Learning Context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant={!activeCurriculum ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSelectCurriculum(null)}
              className="w-full justify-start text-xs"
            >
              General Chat
            </Button>
            {curricula.map((curriculum) => (
              <Button
                key={curriculum.id}
                variant={activeCurriculum?.id === curriculum.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => onSelectCurriculum(curriculum)}
                className="w-full justify-start text-xs"
              >
                {curriculum.title}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      <Separator className="bg-white/20" />

      {/* Previous Chats */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-3">Previous Chats</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {chatSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                activeSessionId === session.id
                  ? 'bg-blue-600/20 border border-blue-500/30'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <MessageSquare className="h-3 w-3 text-gray-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-white truncate">{session.title}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(session.created_at).toLocaleDateString()} • {session.message_count} messages
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => deleteSession(session.id, e)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
              >
                <Trash2 className="h-3 w-3 text-red-400" />
              </Button>
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
