
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StudentManagement } from '@/components/admin/StudentManagement';
import { SchoolOverview } from '@/components/admin/SchoolOverview';
import { CurriculumManagement } from '@/components/admin/CurriculumManagement';
import { PaymentManagement } from '@/components/admin/PaymentManagement';
import { StudentAnalyticsView } from '@/components/admin/StudentAnalyticsView';
import { GradeBook } from '@/components/admin/GradeBook';
import { AtRiskAlerts } from '@/components/admin/AtRiskAlerts';
import { AssessmentManagement } from '@/components/admin/AssessmentManagement';
import { SubjectManagement } from '@/components/admin/SubjectManagement';
import { TeacherManagement } from '@/components/admin/TeacherManagement';
import { TeacherLessonPlanGenerator } from '@/components/admin/TeacherLessonPlanGenerator';
import { HomeworkManagement } from '@/components/admin/HomeworkManagement';
import { QuestionBankBrowser } from '@/components/admin/QuestionBankBrowser';
import { ParentTeacherMessaging } from '@/components/admin/ParentTeacherMessaging';
import { NewsManagement } from '@/components/admin/NewsManagement';
import { GradingInbox } from '@/components/admin/GradingInbox';
import { Users, BarChart3, BookOpen, CreditCard, Brain, ClipboardList, AlertTriangle, FileCheck, FolderTree, Library, GraduationCap, FileText, ListChecks, Database, MessageCircle, Newspaper, Globe, ChevronDown, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SectionManagement } from '@/components/admin/SectionManagement';
import { useAuth } from '@/contexts/AuthContext';
import { CurriculumAdminPanel } from '@/components/curriculum/CurriculumAdminPanel';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ResumeOnboardingBanner } from '@/components/school-onboarding/ResumeOnboardingBanner';

const SchoolAdmin = () => {
  const { t } = useLanguage();
  const { user, isSchoolAdmin, isTeacher } = useAuth();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!user || !isSchoolAdmin) return;
    supabase.from('school_accounts').select('id').eq('admin_user_id', user.id).maybeSingle()
      .then(({ data }) => { if (data) setSchoolId(data.id); });
  }, [user, isSchoolAdmin]);

  // Teachers only see Grade Book and Assessments
  if (isTeacher && !isSchoolAdmin) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 px-4 py-8 md:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Teacher Dashboard</h1>
              <p className="text-muted-foreground">Manage grades and assessments for your assigned subjects and sections.</p>
            </div>
            <Tabs defaultValue="gradebook" className="w-full">
              <TabsList className="flex w-full overflow-x-auto bg-muted scrollbar-none">
                <TabsTrigger value="gradebook" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                  <ClipboardList className="h-4 w-4 mr-2" />Grade Book
                </TabsTrigger>
                <TabsTrigger value="assessments" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                  <FileCheck className="h-4 w-4 mr-2" />Assessments
                </TabsTrigger>
                <TabsTrigger value="grading" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                  <Sparkles className="h-4 w-4 mr-2" />Grading Inbox
                </TabsTrigger>
                <TabsTrigger value="lesson-plans" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                  <FileText className="h-4 w-4 mr-2" />Lesson Plans
                </TabsTrigger>
                <TabsTrigger value="homework" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                  <ListChecks className="h-4 w-4 mr-2" />Homework
                </TabsTrigger>
                <TabsTrigger value="question-bank" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                  <Database className="h-4 w-4 mr-2" />Question Bank
                </TabsTrigger>
                <TabsTrigger value="messages" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                  <MessageCircle className="h-4 w-4 mr-2" />Messages
                </TabsTrigger>
                <TabsTrigger value="news" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                  <Newspaper className="h-4 w-4 mr-2" />News
                </TabsTrigger>
              </TabsList>
              <div className="mt-6">
                <TabsContent value="gradebook"><GradeBook /></TabsContent>
                <TabsContent value="assessments"><AssessmentManagement /></TabsContent>
                <TabsContent value="lesson-plans"><TeacherLessonPlanGenerator /></TabsContent>
                <TabsContent value="homework"><HomeworkManagement /></TabsContent>
                <TabsContent value="question-bank"><QuestionBankBrowser /></TabsContent>
                <TabsContent value="messages"><ParentTeacherMessaging /></TabsContent>
                <TabsContent value="news"><NewsManagement /></TabsContent>
              </div>
            </Tabs>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const moreItems = [
    { value: 'subjects', label: 'Subjects', icon: Library },
    { value: 'at-risk', label: 'At-Risk', icon: AlertTriangle },
    { value: 'curriculum', label: t('schoolAdmin.tabs.curriculum'), icon: BookOpen },
    { value: 'student-analytics', label: t('schoolAdmin.tabs.studentAnalysis'), icon: Brain },
    { value: 'curriculum-align', label: 'Curriculum Alignment', icon: Globe },
    { value: 'lesson-plans', label: 'Lesson Plans', icon: FileText },
    { value: 'homework', label: 'Homework', icon: ListChecks },
    { value: 'question-bank', label: 'Question Bank', icon: Database },
    { value: 'messages', label: 'Messages', icon: MessageCircle },
    { value: 'billing', label: t('schoolAdmin.tabs.billing'), icon: CreditCard },
  ];

  const isMoreActive = moreItems.some(i => i.value === activeTab);
  const activeMoreItem = moreItems.find(i => i.value === activeTab);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      
      <main className="flex-1 px-4 py-8 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <ResumeOnboardingBanner />
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{t('schoolAdmin.title')}</h1>
            <p className="text-muted-foreground">
              {t('schoolAdmin.subtitle')}
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center gap-2 w-full overflow-x-auto scrollbar-none">
              <TabsList className="flex bg-muted">
                <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                  <BarChart3 className="h-4 w-4 mr-2" />{t('schoolAdmin.tabs.overview')}
                </TabsTrigger>
                <TabsTrigger value="students" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                  <Users className="h-4 w-4 mr-2" />{t('schoolAdmin.tabs.students')}
                </TabsTrigger>
                <TabsTrigger value="sections" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                  <FolderTree className="h-4 w-4 mr-2" />Classes
                </TabsTrigger>
                <TabsTrigger value="gradebook" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                  <ClipboardList className="h-4 w-4 mr-2" />Grades
                </TabsTrigger>
                <TabsTrigger value="assessments" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                  <FileCheck className="h-4 w-4 mr-2" />Assessments
                </TabsTrigger>
                <TabsTrigger value="teachers" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                  <GraduationCap className="h-4 w-4 mr-2" />Teachers
                </TabsTrigger>
                <TabsTrigger value="news" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                  <Newspaper className="h-4 w-4 mr-2" />News
                </TabsTrigger>
              </TabsList>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={isMoreActive ? 'default' : 'ghost'}
                    size="sm"
                    className={`whitespace-nowrap ${isMoreActive ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
                  >
                    {isMoreActive && activeMoreItem ? (
                      <>
                        <activeMoreItem.icon className="h-4 w-4 mr-2" />
                        {activeMoreItem.label}
                      </>
                    ) : (
                      'More'
                    )}
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  {moreItems.map((item) => (
                    <DropdownMenuItem key={item.value} onSelect={() => setActiveTab(item.value)}>
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mt-6">
              <TabsContent value="overview"><SchoolOverview /></TabsContent>
              <TabsContent value="students"><StudentManagement /></TabsContent>
              <TabsContent value="teachers"><TeacherManagement /></TabsContent>
              <TabsContent value="subjects"><SubjectManagement /></TabsContent>
              <TabsContent value="sections"><SectionManagement /></TabsContent>
              <TabsContent value="gradebook"><GradeBook /></TabsContent>
              <TabsContent value="at-risk"><AtRiskAlerts /></TabsContent>
              <TabsContent value="assessments"><AssessmentManagement /></TabsContent>
              <TabsContent value="curriculum"><CurriculumManagement /></TabsContent>
              <TabsContent value="student-analytics"><StudentAnalyticsView /></TabsContent>
              <TabsContent value="curriculum-align">{schoolId && <CurriculumAdminPanel schoolId={schoolId} />}</TabsContent>
              <TabsContent value="lesson-plans"><TeacherLessonPlanGenerator /></TabsContent>
              <TabsContent value="homework"><HomeworkManagement /></TabsContent>
              <TabsContent value="question-bank"><QuestionBankBrowser /></TabsContent>
              <TabsContent value="messages"><ParentTeacherMessaging /></TabsContent>
              <TabsContent value="news"><NewsManagement /></TabsContent>
              <TabsContent value="billing"><PaymentManagement /></TabsContent>
            </div>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SchoolAdmin;
