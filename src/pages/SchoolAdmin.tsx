
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
import { Users, BarChart3, BookOpen, CreditCard, Brain, ClipboardList, AlertTriangle, FileCheck, FolderTree, Library, GraduationCap, FileText, ListChecks } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SectionManagement } from '@/components/admin/SectionManagement';
import { useAuth } from '@/contexts/AuthContext';

const SchoolAdmin = () => {
  const { t } = useLanguage();
  const { isSchoolAdmin, isTeacher } = useAuth();

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
              <TabsList className="flex w-full overflow-x-auto bg-muted">
                <TabsTrigger value="gradebook" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                  <ClipboardList className="h-4 w-4 mr-2" />Grade Book
                </TabsTrigger>
                <TabsTrigger value="assessments" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                  <FileCheck className="h-4 w-4 mr-2" />Assessments
                </TabsTrigger>
                <TabsTrigger value="lesson-plans" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                  <FileText className="h-4 w-4 mr-2" />Lesson Plans
                </TabsTrigger>
                <TabsTrigger value="homework" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                  <ListChecks className="h-4 w-4 mr-2" />Homework
                </TabsTrigger>
              </TabsList>
              <div className="mt-6">
                <TabsContent value="gradebook" className="space-y-6">
                  <GradeBook />
                </TabsContent>
                <TabsContent value="assessments" className="space-y-6">
                  <AssessmentManagement />
                </TabsContent>
                <TabsContent value="lesson-plans" className="space-y-6">
                  <TeacherLessonPlanGenerator />
                </TabsContent>
                <TabsContent value="homework" className="space-y-6">
                  <HomeworkManagement />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      
      <main className="flex-1 px-4 py-8 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{t('schoolAdmin.title')}</h1>
            <p className="text-muted-foreground">
              {t('schoolAdmin.subtitle')}
            </p>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="flex w-full overflow-x-auto bg-muted">
              <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                <BarChart3 className="h-4 w-4 mr-2" />
                {t('schoolAdmin.tabs.overview')}
              </TabsTrigger>
              <TabsTrigger value="students" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                <Users className="h-4 w-4 mr-2" />
                {t('schoolAdmin.tabs.students')}
              </TabsTrigger>
              <TabsTrigger value="teachers" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                <GraduationCap className="h-4 w-4 mr-2" />
                Teachers
              </TabsTrigger>
              <TabsTrigger value="subjects" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                <Library className="h-4 w-4 mr-2" />
                Subjects
              </TabsTrigger>
              <TabsTrigger value="sections" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                <FolderTree className="h-4 w-4 mr-2" />
                Sections
              </TabsTrigger>
              <TabsTrigger value="assessments" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                <FileCheck className="h-4 w-4 mr-2" />
                Assessments
              </TabsTrigger>
              <TabsTrigger value="gradebook" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                <ClipboardList className="h-4 w-4 mr-2" />
                Grade Book
              </TabsTrigger>
              <TabsTrigger value="at-risk" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                <AlertTriangle className="h-4 w-4 mr-2" />
                At-Risk
              </TabsTrigger>
              <TabsTrigger value="curriculum" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                <BookOpen className="h-4 w-4 mr-2" />
                {t('schoolAdmin.tabs.curriculum')}
              </TabsTrigger>
              <TabsTrigger value="student-analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                <Brain className="h-4 w-4 mr-2" />
                {t('schoolAdmin.tabs.studentAnalysis')}
              </TabsTrigger>
              <TabsTrigger value="billing" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap">
                <CreditCard className="h-4 w-4 mr-2" />
                {t('schoolAdmin.tabs.billing')}
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="overview" className="space-y-6">
                <SchoolOverview />
              </TabsContent>

              <TabsContent value="students" className="space-y-6">
                <StudentManagement />
              </TabsContent>

              <TabsContent value="teachers" className="space-y-6">
                <TeacherManagement />
              </TabsContent>

              <TabsContent value="subjects" className="space-y-6">
                <SubjectManagement />
              </TabsContent>

              <TabsContent value="sections" className="space-y-6">
                <SectionManagement />
              </TabsContent>

              <TabsContent value="gradebook" className="space-y-6">
                <GradeBook />
              </TabsContent>

              <TabsContent value="at-risk" className="space-y-6">
                <AtRiskAlerts />
              </TabsContent>

              <TabsContent value="assessments" className="space-y-6">
                <AssessmentManagement />
              </TabsContent>

              <TabsContent value="curriculum" className="space-y-6">
                <CurriculumManagement />
              </TabsContent>

              <TabsContent value="student-analytics" className="space-y-6">
                <StudentAnalyticsView />
              </TabsContent>

              <TabsContent value="billing" className="space-y-6">
                <PaymentManagement />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SchoolAdmin;
