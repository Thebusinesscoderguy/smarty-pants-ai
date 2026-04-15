import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, User, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const ParentTeacherMessaging = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchThreads();
  }, [user]);

  useEffect(() => {
    if (selectedThread) fetchMessages(selectedThread);
  }, [selectedThread]);

  const fetchThreads = async () => {
    const { data, error } = await supabase
      .from('parent_teacher_threads')
      .select('*')
      .order('last_message_at', { ascending: false });
    
    if (!error) setThreads(data || []);
    setLoading(false);
  };

  const fetchMessages = async (threadId: string) => {
    const { data } = await supabase
      .from('parent_teacher_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });
    
    setMessages(data || []);

    // Mark unread as read
    if (data?.length) {
      await supabase
        .from('parent_teacher_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('thread_id', threadId)
        .neq('sender_id', user!.id)
        .is('read_at', null);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedThread || !user) return;

    const { error } = await supabase.from('parent_teacher_messages').insert({
      thread_id: selectedThread,
      sender_id: user.id,
      message: newMessage.trim(),
    });

    if (error) {
      toast.error('Failed to send message');
      return;
    }

    await supabase
      .from('parent_teacher_threads')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', selectedThread);

    setNewMessage('');
    fetchMessages(selectedThread);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <MessageCircle className="h-6 w-6 text-primary" />
        Messages
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[500px]">
        {/* Thread list */}
        <Card className="md:col-span-1 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Conversations</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-[420px]">
              {threads.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 text-center">No conversations yet</p>
              ) : (
                threads.map(thread => (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThread(thread.id)}
                    className={`w-full text-left p-3 rounded-lg mb-1 transition-all duration-200 ${
                      selectedThread === thread.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium truncate">Thread</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(thread.last_message_at).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="md:col-span-2 rounded-2xl">
          <CardContent className="p-4 flex flex-col h-full">
            {selectedThread ? (
              <>
                <ScrollArea className="flex-1 mb-4">
                  <div className="space-y-3">
                    {messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${
                          msg.sender_id === user?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}>
                          {msg.message}
                          <div className="text-[10px] opacity-60 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  />
                  <Button onClick={sendMessage} size="sm">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a conversation to start messaging
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
