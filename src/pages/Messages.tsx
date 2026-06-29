import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ParentTeacherMessaging } from '@/components/admin/ParentTeacherMessaging';
import { Badge } from '@/components/ui/badge';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from '@/components/SEO';

const MessagesPage = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [unreadMessages, setUnreadMessages] = useState(0);

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
  }, [user]);

  if (!user) return <Navigate to="/auth" replace />;

  const labels = {
    title: isRTL ? 'الرسائل' : 'Messages',
    subtitle: isRTL ? 'تواصل مع معلمي أبنائك' : "Conversations with your children's teachers",
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <SEO
        title="Messages — Teachly.AI"
        description="Direct messages between parents and teachers."
        path="/messages"
      />
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <MessageCircle className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              {labels.title}
              {unreadMessages > 0 && (
                <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[10px]">
                  {unreadMessages}
                </Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">{labels.subtitle}</p>
          </div>
        </div>

        <ParentTeacherMessaging />
      </main>
      <Footer />
    </div>
  );
};

export default MessagesPage;
