import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { NewsFeed } from '@/components/news/NewsFeed';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Newspaper } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const NewsPage = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Newspaper className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {isRTL ? 'الأخبار والإعلانات' : 'News & Announcements'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isRTL ? 'آخر الأخبار من معلميك' : 'Latest updates from your teachers'}
            </p>
          </div>
        </div>
        <NewsFeed />
      </main>
      <Footer />
    </div>
  );
};

export default NewsPage;
