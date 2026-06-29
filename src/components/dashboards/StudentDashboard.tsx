import { ClipboardList, Newspaper, FileText, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { NewsFeed } from '@/components/news/NewsFeed';
import { SchoolCalendarView } from '@/components/calendar/SchoolCalendarView';
import { AttendanceSummaryCard } from '@/components/attendance/AttendanceSummaryCard';
import { AssignedExamsList } from '@/components/exam/AssignedExamsList';
import { AssignmentList } from '@/components/student/AssignmentList';
import { HomeworkList } from '@/components/student/HomeworkList';
import { RecentGradesCard } from '@/components/family/RecentGradesCard';
import { SemesterMarksCard } from '@/components/family/SemesterMarksCard';

/**
 * School-student dashboard — the page an enrolled student lands on (/dashboard).
 *
 * Organized as clean school sections (matching the parent FamilyHub / staff
 * dashboards), NOT the self-study gamified look. Self-study Study Tools live
 * separately at /quiz-generator and are untouched.
 *
 * Every section reads only the signed-in student's own data — enforced by RLS
 * (student_id / user_id = auth.uid()), not just the UI.
 */
export const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const isRTL = language === 'ar';

  return (
    <div className="min-h-screen bg-background text-foreground" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Heading */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">{t('studentDashboard.welcome')}</h1>
            <p className="text-muted-foreground">{t('studentDashboard.subtitle')}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full shrink-0"
            onClick={() => navigate('/report-cards')}
          >
            <FileText className="h-4 w-4 mr-2" />{t('nav.reportCards')}
          </Button>
        </div>

        <div className="space-y-8">
          {/* Attendance + Grades — compact, self-titled cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {user?.id && <AttendanceSummaryCard studentId={user.id} />}
            {user?.id && <RecentGradesCard studentId={user.id} />}
            {user?.id && <SemesterMarksCard studentId={user.id} />}
          </div>

          {/* Assessments — assigned tests/exams from teachers */}
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" /> {t('nav.assessments')}
            </h2>
            <AssignedExamsList />
          </section>

          {/* Assignments + homework */}
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> {t('studentDashboard.assignments')}
            </h2>
            <div className="space-y-4">
              <AssignmentList />
              <HomeworkList />
            </div>
          </section>

          {/* School news */}
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-primary" /> {t('fh.schoolNews')}
            </h2>
            <NewsFeed />
          </section>

          {/* School calendar — read-only */}
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" /> {t('fh.schoolCalendar')}
            </h2>
            <SchoolCalendarView />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};
