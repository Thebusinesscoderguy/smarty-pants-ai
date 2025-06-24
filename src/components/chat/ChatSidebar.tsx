
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Plus, BookOpen, MessageSquare, Zap, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getDemoSessions } from '@/utils/demoChatData';

interface Curriculum {
  id: string;
  title: string;
  content: any;
  subjects: {
    name: string;
  };
}

interface ChatSidebarProps {
  activeCurriculum: Curriculum | null;
  curricula: Curriculum[];
  onSelectCurriculum: (curriculum: Curriculum | null) => void;
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const demoSessions = getDemoSessions();

  if (isCollapsed) {
    return (
      <div className="w-12 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(false)}
          className="text-gray-400 hover:text-white mb-4"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">AI Learning Assistant</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(true)}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <Button
          onClick={onNewChat}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Demo Sessions (for non-authenticated users) */}
          {!user && (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                <Zap className="h-4 w-4 mr-2" />
                Try Demo Conversations
              </h3>
              <div className="space-y-2">
                {demoSessions.map((session) => (
                  <Button
                    key={session.id}
                    variant={activeSessionId === session.id ? "secondary" : "ghost"}
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => onSelectSession(session.id)}
                  >
                    <div>
                      <div className="font-medium text-sm">{session.title}</div>
                      <div className="text-xs text-gray-400 mt-1">{session.description}</div>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {session.subject}
                      </Badge>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Curricula Section (for authenticated users) */}
          {user && curricula.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                <BookOpen className="h-4 w-4 mr-2" />
                Your Curricula
              </h3>
              <div className="space-y-2">
                {curricula.map((curriculum) => (
                  <Button
                    key={curriculum.id}
                    variant={activeCurriculum?.id === curriculum.id ? "secondary" : "ghost"}
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => onSelectCurriculum(curriculum)}
                  >
                    <div>
                      <div className="font-medium text-sm">{curriculum.title}</div>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {curriculum.subjects.name}
                      </Badge>
                    </div>
                  </Button>
                ))}
              </div>
              
              <Separator className="my-4 bg-gray-700" />
              
              <Button
                variant={!activeCurriculum ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => onSelectCurriculum(null)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                General Chat
              </Button>
            </div>
          )}

          {/* For authenticated users with no curricula */}
          {user && curricula.length === 0 && (
            <div className="text-center py-8">
              <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-400 mb-4">
                No curricula assigned yet. You can still chat with the AI assistant!
              </p>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => onSelectCurriculum(null)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Start General Chat
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
