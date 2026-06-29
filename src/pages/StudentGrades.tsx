import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { RecentGradesCard } from '@/components/family/RecentGradesCard';
import { SemesterMarksCard } from '@/components/family/SemesterMarksCard';
import { ClipboardList } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { SEO } from '@/components/SEO';

/**
 * Student Grades — read-only, the student's OWN marks.
 *
 * Reuses the same cards the parent Family Hub uses, scoped to the logged-in
 * student (studentId = user.id). Both underlying tables (student_daily_grades,
 * student_semester_marks) are RLS-restricted to student_id = auth.uid(), so a
 * student can only ever see their own grades — never another student's.
 */
const StudentGrades = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  if (!user) return <Navigate to="/auth" replace />;

  const labels = {
    title: isRTL ? 'درجاتي' : 'My Grades',
    subtitle: isRTL ? 'درجاتك اليومية ودرجات الفصل' : 'Your daily and semester marks',
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <SEO
        title="My Grades — Teachly.AI"
        description="Read-only view of your own daily and semester marks."
        path="/grades"
      />
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <ClipboardList className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{labels.title}</h1>
            <p className="text-sm text-muted-foreground">{labels.subtitle}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentGradesCard studentId={user.id} />
          <SemesterMarksCard studentId={user.id} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StudentGrades;
