import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LayoutDashboard, ClipboardCheck, ListChecks, ClipboardList,
  CalendarCheck, Newspaper, FileText,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { NewsFeed } from '@/components/news/NewsFeed';
import { AttendanceSummaryCard } from '@/components/attendance/AttendanceSummaryCard';
import { AssignedExamsList } from '@/components/exam/AssignedExamsList';
import { AssignmentList } from '@/components/student/AssignmentList';
import { HomeworkList } from '@/components/student/HomeworkList';
import { PublishedGradesFeed } from '@/components/family/PublishedGradesFeed';
import { ReportCardsCard } from '@/components/family/ReportCardsCard';

/**
 * School-student dashboard — the page an enrolled student lands on (/dashboard).
 *
 * Structurally identical to the parent FamilyHub: a single tabbed dashboard
 * (one nav link → tabs that swap content inline), NOT separate routes and NOT a
 * long stacked page. The only difference from FamilyHub is there's no child
 * picker — a student views only their own data (studentId = user.id).
 *
 * Every tab is RLS-scoped to the signed-in student (student_id / user_id =
 * auth.uid()); News is the same school-scoped surface other roles see.
 * Self-study Study Tools (/quiz-generator) is a separate mode, reached from
 * its own nav link — not part of this dashboard.
 */

type StudentTab =
  | 'overview' | 'assessments' | 'assignments' | 'grades'
  | 'attendance' | 'news' | 'report-cards';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const [activeTab, setActiveTab] = useState<StudentTab>('overview');

  const studentId = user?.id ?? '';

  const tabs: { value: StudentTab; label: string; icon: React.ElementType }[] = [
    { value: 'overview', label: isRTL ? 'نظرة عامة' : 'Overview', icon: LayoutDashboard },
    { value: 'assessments', label: t('nav.assessments'), icon: ClipboardCheck },
    { value: 'assignments', label: t('studentDashboard.assignments'), icon: ListChecks },
    { value: 'grades', label: t('nav.grades'), icon: ClipboardList },
    { value: 'attendance', label: isRTL ? 'الحضور' : 'Attendance', icon: CalendarCheck },
    { value: 'news', label: t('nav.news'), icon: Newspaper },
    { value: 'report-cards', label: t('nav.reportCards'), icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1">{t('studentDashboard.welcome')}</h1>
          <p className="text-muted-foreground">{t('studentDashboard.subtitle')}</p>
        </div>

        {/* Tabbed sections — same dashboard pattern as the parent FamilyHub. */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as StudentTab)} className="w-full">
          {/* Tab bar */}
          <div className="flex items-center gap-2 flex-wrap border-b border-border pb-3 mb-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.value;
              return (
                <Button
                  key={tab.value}
                  variant={active ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab(tab.value)}
                  className="whitespace-nowrap"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </Button>
              );
            })}
          </div>

          {/* Hidden TabsList for accessibility / keyboard nav */}
          <TabsList className="sr-only">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-2">
            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {studentId && <AttendanceSummaryCard studentId={studentId} />}
                {studentId && <ReportCardsCard studentId={studentId} onOpen={() => setActiveTab('report-cards')} />}
              </div>
              <div className="mt-6">
                <AssignedExamsList />
              </div>
            </TabsContent>

            <TabsContent value="assessments">
              <AssignedExamsList />
            </TabsContent>

            <TabsContent value="assignments">
              <div className="space-y-4">
                <AssignmentList />
                <HomeworkList />
              </div>
            </TabsContent>

            <TabsContent value="grades">
              {studentId && <PublishedGradesFeed studentId={studentId} />}
            </TabsContent>

            <TabsContent value="attendance">
              {studentId && <AttendanceSummaryCard studentId={studentId} />}
            </TabsContent>

            <TabsContent value="news"><NewsFeed /></TabsContent>

            <TabsContent value="report-cards">
              {studentId && <ReportCardsCard studentId={studentId} onOpen={() => navigate('/report-cards')} />}
            </TabsContent>
          </div>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};
