import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AssignedExamsList } from '@/components/exam/AssignedExamsList';
import { ClipboardCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { SEO } from '@/components/SEO';

/**
 * Assessments — the student's assigned tests/exams.
 *
 * Thin wrapper over AssignedExamsList, which is already RLS-scoped: it reads
 * content_assignments (assignments visible to the student) and exam_sessions
 * (user_id = auth.uid()). A student only ever sees work assigned to them.
 */
const Assessments = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  if (!user) return <Navigate to="/auth" replace />;

  const labels = {
    title: isRTL ? 'التقييمات' : 'Assessments',
    subtitle: isRTL ? 'الاختبارات المسندة إليك من معلميك' : 'Tests assigned to you by your teachers',
  };

  // AssignedExamsList renders null both while loading and when empty, so it
  // provides its own implicit empty state; the heading above frames the page.

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <SEO
        title="Assessments — Teachly.AI"
        description="Your assigned tests and exams."
        path="/assessments"
      />
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <ClipboardCheck className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{labels.title}</h1>
            <p className="text-sm text-muted-foreground">{labels.subtitle}</p>
          </div>
        </div>

        <AssignedExamsList />
      </main>
      <Footer />
    </div>
  );
};

export default Assessments;
