import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { NewsFeed } from '@/components/news/NewsFeed';
import { ParentTeacherMessaging } from '@/components/admin/ParentTeacherMessaging';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Inbox as InboxIcon, Megaphone, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from '@/components/SEO';

const InboxPage = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [params, setParams] = useSearchParams();
  const isRTL = language === 'ar';
  const [unreadMessages, setUnreadMessages] = useState(0);

  const tab = params.get('tab') || 'all';

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { count } = await supabase
        .from('parent_teacher_messages')
        .select('id', { count: 'exact', head: true })
        .is('read_at', null)
        .neq('sender_id', user.id);
      if (!cancelled) setUnreadMessages(count || 0);
    })();
    return () => { cancelled = true; };
  }, [user, tab]);

  if (!user) return <Navigate to="/auth" replace />;

  const labels = {
    title: isRTL ? 'صندوق الوارد' : 'Inbox',
    subtitle: isRTL ? 'كل التحديثات والرسائل في مكان واحد' : 'All your updates and messages in one place',
    all: isRTL ? 'الكل' : 'All',
    announcements: isRTL ? 'الإعلانات' : 'Announcements',
    messages: isRTL ? 'الرسائل' : 'Messages',
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <SEO
        title="Inbox — Teachly.AI"
        description="Unified inbox: school announcements, teacher messages, and notifications."
        path="/inbox"
      />
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <InboxIcon className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{labels.title}</h1>
            <p className="text-sm text-muted-foreground">{labels.subtitle}</p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setParams({ tab: v })} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="all" className="gap-2">
              <InboxIcon className="h-4 w-4" />
              {labels.all}
            </TabsTrigger>
            <TabsTrigger value="announcements" className="gap-2">
              <Megaphone className="h-4 w-4" />
              {labels.announcements}
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-2 relative">
              <MessageCircle className="h-4 w-4" />
              {labels.messages}
              {unreadMessages > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">
                  {unreadMessages}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-8">
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" /> {labels.announcements}
              </h2>
              <NewsFeed />
            </section>
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" /> {labels.messages}
              </h2>
              <ParentTeacherMessaging />
            </section>
          </TabsContent>

          <TabsContent value="announcements">
            <NewsFeed />
          </TabsContent>

          <TabsContent value="messages">
            <ParentTeacherMessaging />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default InboxPage;
