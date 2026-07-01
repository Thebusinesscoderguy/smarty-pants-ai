
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StudentManagement } from '@/components/admin/StudentManagement';
import { SchoolPulse } from '@/components/admin/SchoolPulse';
import { StudentAnalyticsView } from '@/components/admin/StudentAnalyticsView';
import { GradeBook } from '@/components/admin/GradeBook';
import { AtRiskAlerts } from '@/components/admin/AtRiskAlerts';
import { AssessmentManagement } from '@/components/admin/AssessmentManagement';
import { ExamMonitoring } from '@/components/admin/ExamMonitoring';
import { SubjectManagement } from '@/components/admin/SubjectManagement';
import { TeacherManagement } from '@/components/admin/TeacherManagement';
import { InviteManagement } from '@/components/admin/InviteManagement';
import { TeacherLessonPlanGenerator } from '@/components/admin/TeacherLessonPlanGenerator';
import { HomeworkManagement } from '@/components/admin/HomeworkManagement';
import { ParentTeacherMessaging } from '@/components/admin/ParentTeacherMessaging';
import { NewsManagement } from '@/components/admin/NewsManagement';
import { GradingInbox } from '@/components/admin/GradingInbox';
import { ReportCardManagement } from '@/components/admin/ReportCardManagement';
import { ImportExportCenter } from '@/components/admin/ImportExportCenter';
import { StaffManagement } from '@/components/admin/StaffManagement';
import { AssignmentManagement } from '@/components/admin/AssignmentManagement';
import { BehaviorManagement } from '@/components/admin/BehaviorManagement';
import { ClassroomObservation } from '@/components/admin/ClassroomObservation';
import { GrowthGoals } from '@/components/admin/GrowthGoals';
import {
  Users, BarChart3, BookOpen, ClipboardList, AlertTriangle,
  FileCheck, FolderTree, Library, GraduationCap, FileText, ListChecks, Database,
  MessageCircle, Newspaper, Globe, Sparkles, FileSpreadsheet, Shield,
  LayoutDashboard, Users2, BookMarked, Settings as SettingsIcon, ChevronDown,
  ClipboardCheck, Target, Mail,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SectionManagement } from '@/components/admin/SectionManagement';
import { useAuth } from '@/contexts/AuthContext';

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { OnboardingChecklistWidget } from '@/components/school-onboarding/OnboardingChecklistWidget';

type TabValue =
  | 'overview'
  // People
  | 'students' | 'sections' | 'teachers' | 'invites' | 'at-risk' | 'student-analytics'
  // Academics
  | 'gradebook' | 'assessments' | 'exam-monitoring' | 'grading' | 'subjects'
  | 'lesson-plans' | 'homework' | 'assignments'
  | 'attendance' | 'report-cards'
  // Communication
  | 'messages' | 'news'
  // Staff development & conduct
  | 'behavior' | 'observations' | 'growth-goals'
  // Settings
  | 'import-export' | 'staff';

const SchoolAdmin = () => {
  const { t } = useLanguage();
  const { user, isSchoolAdmin, isTeacher } = useAuth();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>('overview');
  const [teacherTab, setTeacherTab] = useState<TabValue>('gradebook');

  useEffect(() => {
    if (!user || !isSchoolAdmin) return;
    supabase.from('school_accounts').select('id').eq('admin_user_id', user.id).maybeSingle()
      .then(({ data }) => { if (data) setSchoolId(data.id); });
  }, [user, isSchoolAdmin]);

  // Teachers get the same grouped navigation as the admin view (no flat scroll strip).
  if (isTeacher && !isSchoolAdmin) {
    type TNavItem = { value: TabValue; label: string; icon: any };
    const teacherGroups: { id: string; label: string; icon: any; items: TNavItem[] }[] = [
      {
        id: 'academics',
        label: 'Academics',
        icon: BookMarked,
        items: [
          { value: 'gradebook', label: 'Grade Book', icon: ClipboardList },
          { value: 'assessments', label: 'Assessments', icon: FileCheck },
          { value: 'assignments', label: 'Assignments', icon: ListChecks },
          { value: 'grading', label: 'Grading Inbox', icon: Sparkles },
          { value: 'lesson-plans', label: 'Lesson Plans', icon: FileText },
          { value: 'exam-monitoring', label: 'Exam Monitoring', icon: FileCheck },
        ],
      },
      {
        id: 'behavior',
        label: 'Behavior & Growth',
        icon: Target,
        items: [
          { value: 'behavior', label: 'Behavior', icon: Shield },
          { value: 'observations', label: 'Observations', icon: ClipboardCheck },
          { value: 'growth-goals', label: 'Growth Goals', icon: Target },
        ],
      },
      {
        id: 'communication',
        label: 'Communication',
        icon: MessageCircle,
        items: [
          { value: 'messages', label: 'Messages', icon: MessageCircle },
          { value: 'news', label: 'News', icon: Newspaper },
        ],
      },
    ];
    const activeTeacherGroup = teacherGroups.find((g) => g.items.some((i) => i.value === teacherTab));
    const activeTeacherItem = activeTeacherGroup?.items.find((i) => i.value === teacherTab);

    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 px-4 py-8 md:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">Teacher Dashboard</h1>
              <p className="text-muted-foreground">Manage grades and assessments for your assigned subjects and sections.</p>
            </div>

            <Tabs value={teacherTab} onValueChange={(v) => setTeacherTab(v as TabValue)} className="w-full">
              {/* Top group bar — same grouped pattern as the admin view */}
              <div className="flex items-center gap-2 flex-wrap border-b border-border pb-3 mb-4">
                {teacherGroups.map((group) => {
                  const isActive = activeTeacherGroup?.id === group.id;
                  const GroupIcon = group.icon;
                  return (
                    <DropdownMenu key={group.id}>
                      <DropdownMenuTrigger asChild>
                        <Button variant={isActive ? 'default' : 'ghost'} size="sm" className="whitespace-nowrap">
                          <GroupIcon className="h-4 w-4 mr-2" />
                          {isActive && activeTeacherItem ? `${group.label} · ${activeTeacherItem.label}` : group.label}
                          <ChevronDown className="h-3 w-3 ml-1.5 opacity-60" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="bg-popover w-56">
                        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                          {group.label}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {group.items.map((item) => {
                          const ItemIcon = item.icon;
                          const itemActive = teacherTab === item.value;
                          return (
                            <DropdownMenuItem
                              key={item.value}
                              onSelect={() => setTeacherTab(item.value)}
                              className={itemActive ? 'bg-muted font-medium' : ''}
                            >
                              <ItemIcon className="h-4 w-4 mr-2" />
                              {item.label}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                })}
              </div>

              {/* Hidden TabsList for accessibility / keyboard nav */}
              <TabsList className="sr-only">
                {teacherGroups.flatMap((g) => g.items.map((i) => (
                  <TabsTrigger key={i.value} value={i.value}>{i.label}</TabsTrigger>
                )))}
              </TabsList>

              <div className="mt-2">
                <TabsContent value="gradebook"><GradeBook /></TabsContent>
                <TabsContent value="assessments"><AssessmentManagement /></TabsContent>
                <TabsContent value="exam-monitoring"><ExamMonitoring /></TabsContent>
                <TabsContent value="grading"><GradingInbox /></TabsContent>
                <TabsContent value="lesson-plans"><TeacherLessonPlanGenerator /></TabsContent>
                <TabsContent value="assignments"><AssignmentManagement /></TabsContent>
                <TabsContent value="messages"><ParentTeacherMessaging /></TabsContent>
                <TabsContent value="news"><NewsManagement /></TabsContent>
                <TabsContent value="behavior"><BehaviorManagement /></TabsContent>
                <TabsContent value="observations"><ClassroomObservation /></TabsContent>
                <TabsContent value="growth-goals"><GrowthGoals /></TabsContent>
              </div>
            </Tabs>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ==================== Grouped navigation ====================
  type NavItem = { value: TabValue; label: string; icon: any };
  type NavGroup = { id: 'people' | 'academics' | 'communication' | 'settings'; label: string; icon: any; items: NavItem[] };

  const groups: NavGroup[] = [
    {
      id: 'people',
      label: 'People',
      icon: Users2,
      items: [
        { value: 'students', label: t('schoolAdmin.tabs.students'), icon: Users },
        { value: 'sections', label: 'Classes', icon: FolderTree },
        { value: 'teachers', label: 'Teachers', icon: GraduationCap },
        { value: 'invites', label: 'Parents & Invites', icon: Mail },
        { value: 'at-risk', label: 'At-Risk Students', icon: AlertTriangle },
        // student-analytics hidden from nav: learning_analytics pipeline is unpopulated (Option C). Route/component retained.
        { value: 'behavior', label: 'Behavior', icon: Shield },
        { value: 'observations', label: 'Observations', icon: ClipboardCheck },
        { value: 'growth-goals', label: 'Growth Goals', icon: Target },
      ],
    },
    {
      id: 'academics',
      label: 'Academics',
      icon: BookMarked,
      items: [
        { value: 'gradebook', label: 'Grade Book', icon: ClipboardList },
        { value: 'report-cards', label: 'Report Cards', icon: FileText },
        { value: 'assignments', label: 'Assignments', icon: ListChecks },
        { value: 'assessments', label: 'Assessments', icon: FileCheck },
        { value: 'exam-monitoring', label: 'Exam Monitoring', icon: FileCheck },
        { value: 'grading', label: 'Grading Inbox', icon: Sparkles },
        { value: 'subjects', label: 'Subjects', icon: Library },
        { value: 'lesson-plans', label: 'Lesson Plans', icon: FileText },
        { value: 'homework', label: 'Homework', icon: ListChecks },
      ],
    },
    {
      id: 'communication',
      label: 'Communication',
      icon: MessageCircle,
      items: [
        { value: 'news', label: 'News Feed', icon: Newspaper },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: SettingsIcon,
      items: [
        { value: 'staff', label: 'Staff & Roles', icon: Shield },
        { value: 'import-export', label: 'Import / Export', icon: FileSpreadsheet },
      ],
    },
  ];

  const activeGroup = groups.find((g) => g.items.some((i) => i.value === activeTab));
  const activeItem = activeGroup?.items.find((i) => i.value === activeTab);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 px-4 py-8 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <OnboardingChecklistWidget />

          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">{t('schoolAdmin.title')}</h1>
            <p className="text-muted-foreground">{t('schoolAdmin.subtitle')}</p>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="w-full">
            {/* Top group bar */}
            <div className="flex items-center gap-2 flex-wrap border-b border-border pb-3 mb-4">
              <Button
                variant={activeTab === 'overview' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('overview')}
                className="whitespace-nowrap"
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />School Pulse
              </Button>

              <div className="h-6 w-px bg-border mx-1" />

              {groups.map((group) => {
                const isActive = activeGroup?.id === group.id;
                const GroupIcon = group.icon;
                return (
                  <DropdownMenu key={group.id}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant={isActive ? 'default' : 'ghost'}
                        size="sm"
                        className="whitespace-nowrap"
                      >
                        <GroupIcon className="h-4 w-4 mr-2" />
                        {isActive && activeItem ? `${group.label} · ${activeItem.label}` : group.label}
                        <ChevronDown className="h-3 w-3 ml-1.5 opacity-60" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-popover w-56">
                      <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                        {group.label}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {group.items.map((item) => {
                        const ItemIcon = item.icon;
                        const itemActive = activeTab === item.value;
                        return (
                          <DropdownMenuItem
                            key={item.value}
                            onSelect={() => setActiveTab(item.value)}
                            className={itemActive ? 'bg-muted font-medium' : ''}
                          >
                            <ItemIcon className="h-4 w-4 mr-2" />
                            {item.label}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })}
            </div>

            {/* Hidden TabsList for accessibility / keyboard nav */}
            <TabsList className="sr-only">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              {groups.flatMap((g) => g.items.map((i) => (
                <TabsTrigger key={i.value} value={i.value}>{i.label}</TabsTrigger>
              )))}
            </TabsList>

            <div className="mt-2">
              <TabsContent value="overview"><SchoolPulse /></TabsContent>
              <TabsContent value="students"><StudentManagement /></TabsContent>
              <TabsContent value="teachers"><TeacherManagement /></TabsContent>
              <TabsContent value="invites"><InviteManagement /></TabsContent>
              <TabsContent value="subjects"><SubjectManagement /></TabsContent>
              <TabsContent value="sections"><SectionManagement /></TabsContent>
              <TabsContent value="gradebook"><GradeBook /></TabsContent>
              <TabsContent value="at-risk"><AtRiskAlerts /></TabsContent>
              <TabsContent value="assessments"><AssessmentManagement /></TabsContent>
              <TabsContent value="exam-monitoring"><ExamMonitoring /></TabsContent>
              <TabsContent value="grading"><GradingInbox /></TabsContent>
              <TabsContent value="student-analytics"><StudentAnalyticsView /></TabsContent>
              
              <TabsContent value="lesson-plans"><TeacherLessonPlanGenerator /></TabsContent>
              <TabsContent value="homework"><HomeworkManagement /></TabsContent>
              <TabsContent value="news"><NewsManagement /></TabsContent>
              <TabsContent value="report-cards"><ReportCardManagement /></TabsContent>
              <TabsContent value="import-export"><ImportExportCenter /></TabsContent>
              <TabsContent value="assignments"><AssignmentManagement /></TabsContent>
              <TabsContent value="staff"><StaffManagement /></TabsContent>
              <TabsContent value="behavior"><BehaviorManagement /></TabsContent>
              <TabsContent value="observations"><ClassroomObservation /></TabsContent>
              <TabsContent value="growth-goals"><GrowthGoals /></TabsContent>
            </div>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SchoolAdmin;
