import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  MessageCircle, Send, Search, Plus, Check, CheckCheck, Loader2, Users, ArrowLeft,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface Thread {
  thread_id: string;
  parent_id: string;
  teacher_id: string;
  student_id: string;
  school_id: string;
  teacher_name: string | null;
  parent_name: string | null;
  student_name: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  is_parent: boolean;
  is_teacher: boolean;
}

interface Msg {
  id: string;
  thread_id: string;
  sender_id: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

interface Contact {
  student_id: string;
  student_name: string;
  counterpart_id: string;
  counterpart_name: string;
  counterpart_kind: 'teacher' | 'parent';
  school_id: string;
}

const initials = (name: string) =>
  name.split(' ').map((w) => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || '?';

const relativeTime = (iso: string | null, locale?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h`;
  if (mins < 10080) return `${Math.floor(mins / 1440)}d`;
  return d.toLocaleDateString(locale);
};

export const ParentTeacherMessaging = () => {
  const { user, isTeacher, teacherInfo } = useAuth();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const locale = isRTL ? 'ar-SA' : undefined;

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');

  const [composeOpen, setComposeOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [composePick, setComposePick] = useState<string>(''); // "studentId::counterpartId"
  const [starting, setStarting] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const msgIds = useRef<Set<string>>(new Set());
  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedThread = useMemo(
    () => threads.find((t) => t.thread_id === selectedId) || null,
    [threads, selectedId],
  );

  /* ---------------- threads ---------------- */
  const fetchThreads = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_message_threads');
    if (!error && data) setThreads(data as Thread[]);
    setLoadingThreads(false);
  }, []);

  const scheduleRefetch = useCallback(() => {
    if (refetchTimer.current) clearTimeout(refetchTimer.current);
    refetchTimer.current = setTimeout(() => { fetchThreads(); }, 250);
  }, [fetchThreads]);

  useEffect(() => {
    if (!user) return;
    fetchThreads();
  }, [user, fetchThreads]);

  // Realtime: any new/updated message refreshes the thread list (previews, unread, order)
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel('pt-threads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parent_teacher_messages' }, scheduleRefetch)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, scheduleRefetch]);

  /* ---------------- messages for selected thread ---------------- */
  const markRead = useCallback(async (threadId: string) => {
    if (!user) return;
    await supabase
      .from('parent_teacher_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('thread_id', threadId)
      .neq('sender_id', user.id)
      .is('read_at', null);
  }, [user]);

  const openThread = useCallback(async (threadId: string) => {
    setSelectedId(threadId);
    setLoadingMsgs(true);
    msgIds.current = new Set();
    const { data } = await supabase
      .from('parent_teacher_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });
    const list = (data || []) as Msg[];
    list.forEach((m) => msgIds.current.add(m.id));
    setMessages(list);
    setLoadingMsgs(false);
    if (list.some((m) => m.sender_id !== user?.id && !m.read_at)) {
      await markRead(threadId);
      scheduleRefetch();
    }
  }, [user, markRead, scheduleRefetch]);

  // Realtime: live messages + read receipts for the open thread
  useEffect(() => {
    if (!selectedId || !user) return;
    const ch = supabase
      .channel(`pt-msg-${selectedId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'parent_teacher_messages', filter: `thread_id=eq.${selectedId}` },
        (payload) => {
          const m = payload.new as Msg;
          if (msgIds.current.has(m.id)) return;
          msgIds.current.add(m.id);
          setMessages((prev) => [...prev, m]);
          if (m.sender_id !== user.id) { markRead(selectedId); scheduleRefetch(); }
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'parent_teacher_messages', filter: `thread_id=eq.${selectedId}` },
        (payload) => {
          const m = payload.new as Msg;
          setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, read_at: m.read_at } : x)));
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [selectedId, user, markRead, scheduleRefetch]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ---------------- send ---------------- */
  const send = async () => {
    const text = draft.trim();
    if (!text || !selectedId || !user || sending) return;
    setSending(true);
    setDraft('');
    const { data, error } = await supabase
      .from('parent_teacher_messages')
      .insert({ thread_id: selectedId, sender_id: user.id, message: text })
      .select()
      .single();
    if (error) {
      toast.error('Could not send message');
      setDraft(text);
      setSending(false);
      return;
    }
    const m = data as Msg;
    if (!msgIds.current.has(m.id)) {
      msgIds.current.add(m.id);
      setMessages((prev) => [...prev, m]);
    }
    await supabase
      .from('parent_teacher_threads')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', selectedId);
    scheduleRefetch();
    setSending(false);
  };

  /* ---------------- compose ---------------- */
  const openCompose = async () => {
    setComposeOpen(true);
    setComposePick('');
    setLoadingContacts(true);
    const { data } = await supabase.rpc('get_messageable_contacts');
    setContacts((data || []) as Contact[]);
    setLoadingContacts(false);
  };

  const startThread = async () => {
    if (!composePick) return;
    const [studentId, counterpartId] = composePick.split('::');
    const contact = contacts.find((c) => c.student_id === studentId && c.counterpart_id === counterpartId);
    if (!contact) return;
    setStarting(true);
    // For a teacher caller the RPC needs the teacher's own id; for a parent it's
    // the chosen teacher (the counterpart).
    const teacherId = contact.counterpart_kind === 'teacher' ? counterpartId : teacherInfo?.teacher_id;
    if (!teacherId) { toast.error('Could not resolve teacher'); setStarting(false); return; }
    const { data, error } = await supabase.rpc('start_message_thread', {
      p_student_id: studentId,
      p_teacher_id: teacherId,
    });
    setStarting(false);
    if (error || !data) {
      toast.error('Could not start conversation');
      return;
    }
    setComposeOpen(false);
    await fetchThreads();
    openThread(data as string);
  };

  /* ---------------- derived ---------------- */
  const otherName = (t: Thread) => {
    if (t.is_parent) return t.teacher_name || 'Teacher';
    if (t.is_teacher) return t.parent_name || 'Parent';
    return `${t.parent_name || 'Parent'} ⇄ ${t.teacher_name || 'Teacher'}`; // admin observer
  };

  const filteredThreads = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) =>
      otherName(t).toLowerCase().includes(q) ||
      (t.student_name || '').toLowerCase().includes(q),
    );
  }, [threads, search]); // eslint-disable-line react-hooks/exhaustive-deps

  const canSend = selectedThread && (selectedThread.is_parent || selectedThread.is_teacher);

  /* ---------------- render ---------------- */
  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-primary" /> Messages
        </h2>
        <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCompose}>
              <Plus className="h-4 w-4 mr-1" /> New message
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <DialogHeader><DialogTitle>Start a conversation</DialogTitle></DialogHeader>
            {loadingContacts ? (
              <div className="py-8 text-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              </div>
            ) : contacts.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground text-center">
                No contacts available yet. Conversations become available once a
                student is linked to both a parent and a teacher's class.
              </p>
            ) : (
              <div className="space-y-3">
                <Select value={composePick} onValueChange={setComposePick}>
                  <SelectTrigger><SelectValue placeholder="Choose who to message" /></SelectTrigger>
                  <SelectContent className="bg-popover max-h-72">
                    {contacts.map((c) => (
                      <SelectItem key={`${c.student_id}::${c.counterpart_id}`} value={`${c.student_id}::${c.counterpart_id}`}>
                        {c.counterpart_name} · re: {c.student_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button onClick={startThread} disabled={!composePick || starting}>
                {starting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <MessageCircle className="h-4 w-4 mr-1" />}
                Open conversation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[540px]">
        {/* Thread list */}
        <Card className={`md:col-span-1 rounded-2xl overflow-hidden ${selectedId ? 'hidden md:block' : ''}`}>
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className={`absolute top-2.5 h-4 w-4 text-muted-foreground ${isRTL ? 'right-2.5' : 'left-2.5'}`} />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations"
                className={isRTL ? 'pr-8' : 'pl-8'}
              />
            </div>
          </div>
          <ScrollArea className="h-[470px]">
            {loadingThreads ? (
              <div className="p-4 space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-2 animate-pulse">
                    <div className="h-9 w-9 rounded-full bg-muted" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-24 bg-muted rounded" />
                      <div className="h-2.5 w-32 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                {search ? 'No matches.' : 'No conversations yet. Start one with “New message”.'}
              </div>
            ) : (
              filteredThreads.map((t) => {
                const active = t.thread_id === selectedId;
                return (
                  <button
                    key={t.thread_id}
                    onClick={() => openThread(t.thread_id)}
                    className={`w-full text-${isRTL ? 'right' : 'left'} p-3 flex items-center gap-3 border-b border-border/50 transition-colors ${
                      active ? 'bg-primary/10' : 'hover:bg-muted'
                    }`}
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {initials(otherName(t))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate">{otherName(t)}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {relativeTime(t.last_message_at, locale)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground truncate">
                          {t.last_message || `Re: ${t.student_name || 'student'}`}
                        </span>
                        {t.unread_count > 0 && (
                          <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[10px] shrink-0">
                            {t.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </ScrollArea>
        </Card>

        {/* Conversation */}
        <Card className={`md:col-span-2 rounded-2xl ${selectedId ? '' : 'hidden md:block'}`}>
          <CardContent className="p-0 flex flex-col h-full">
            {selectedThread ? (
              <>
                {/* header */}
                <div className="flex items-center gap-3 p-3 border-b border-border">
                  <Button
                    variant="ghost" size="icon"
                    className="md:hidden h-8 w-8"
                    onClick={() => setSelectedId(null)}
                  >
                    <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                  </Button>
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {initials(otherName(selectedThread))}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{otherName(selectedThread)}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      Re: {selectedThread.student_name || 'student'}
                    </div>
                  </div>
                </div>

                {/* messages */}
                <ScrollArea className="flex-1 p-4">
                  {loadingMsgs ? (
                    <p className="text-sm text-muted-foreground text-center py-6">Loading…</p>
                  ) : messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No messages yet. Say hello 👋
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {messages.map((m) => {
                        const mine = m.sender_id === user?.id;
                        return (
                          <div key={m.id} className={`flex ${mine ? (isRTL ? 'justify-start' : 'justify-end') : (isRTL ? 'justify-end' : 'justify-start')}`}>
                            <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                              mine ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            }`}>
                              <div className="whitespace-pre-wrap break-words">{m.message}</div>
                              <div className={`flex items-center gap-1 mt-0.5 text-[10px] ${mine ? 'opacity-70 justify-end' : 'opacity-60'}`}>
                                {new Date(m.created_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                                {mine && (m.read_at
                                  ? <CheckCheck className="h-3 w-3" />
                                  : <Check className="h-3 w-3" />)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={bottomRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* composer */}
                {canSend ? (
                  <div className="flex gap-2 p-3 border-t border-border">
                    <Input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                      placeholder="Type a message…"
                      dir={isRTL ? 'rtl' : 'ltr'}
                      disabled={sending}
                    />
                    <Button onClick={send} size="icon" disabled={sending || !draft.trim()}>
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />}
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 border-t border-border text-center text-xs text-muted-foreground">
                    Read-only — you are viewing this conversation as a school admin.
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground h-full">
                <MessageCircle className="h-10 w-10 mb-2 opacity-40" />
                <p className="text-sm">Select a conversation</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
