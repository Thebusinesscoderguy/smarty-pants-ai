
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { QuestDisplay } from '@/components/quests/QuestDisplay';
import { AchievementsList } from '@/components/gamification/AchievementsList';
import { StudentDashboard } from '@/components/monitoring/StudentDashboard';
import { ParentDashboard } from '@/components/monitoring/ParentDashboard';
import { GameSettings } from '@/components/gamification/GameSettings';
import { SubjectProgress } from '@/components/subjects/SubjectProgress';
import { StrengthsWeaknesses } from '@/components/analytics/StrengthsWeaknesses';
import { StudentQuestDisplay } from '@/components/student/StudentQuestDisplay';
import { StudentAchievements } from '@/components/student/StudentAchievements';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { DemoParentDashboard } from '@/components/demo/DemoParentDashboard';
import { DemoQuestDisplay } from '@/components/demo/DemoQuestDisplay';
import { DemoAchievements } from '@/components/demo/DemoAchievements';
import { DemoSubjectProgress } from '@/components/demo/DemoSubjectProgress';
import { DemoAnalytics } from '@/components/demo/DemoAnalytics';
import { TestCreator } from '@/components/TestCreator';
import { QuizLibrary } from '@/components/quiz/QuizLibrary';
import { MessageSquare, BarChart3, BookOpen, FileText, Play } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const Progress = () => {
  const { user, isSchoolAdmin, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<'student' | 'parent' | 'teacher' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<'chat' | 'progress' | 'modules'>('progress');

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchUserRole();
      } else {
        setUserRole('parent'); // Default to parent for demo
        setIsLoading(false);
      }
    }
  }, [user, authLoading, isSchoolAdmin]);

  const fetchUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
      }
      
      const finalRole = isSchoolAdmin ? 'teacher' : data?.role || 'student';
      setUserRole(finalRole);
    } catch (error: any) {
      console.error('Exception fetching user role:', error);
      setUserRole('student');
    } finally {
      setIsLoading(false);
    }
  };

  const renderNavigation = () => (
    <div className="flex items-center space-x-1 bg-white/5 rounded-lg p-1">
      <Button
        variant={currentPage === 'chat' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => {
          setCurrentPage('chat');
          navigate('/chat');
        }}
        className={currentPage === 'chat' ? 'bg-blue-600 hover:bg-blue-700' : 'text-white hover:bg-white/10'}
      >
        <MessageSquare className="h-4 w-4 mr-1" />
        {t('chat.navigation.chat')}
      </Button>
      <Button
        variant={currentPage === 'progress' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setCurrentPage('progress')}
        className={currentPage === 'progress' ? 'bg-blue-600 hover:bg-blue-700' : 'text-white hover:bg-white/10'}
      >
        <BarChart3 className="h-4 w-4 mr-1" />
        {t('chat.navigation.progress')}
      </Button>
      <Button
        variant={currentPage === 'modules' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => {
          setCurrentPage('modules');
          navigate('/modules');
        }}
        className={currentPage === 'modules' ? 'bg-blue-600 hover:bg-blue-700' : 'text-white hover:bg-white/10'}
      >
        <BookOpen className="h-4 w-4 mr-1" />
        {t('chat.navigation.modules')}
      </Button>
    </div>
  );

  const renderMonitoringTab = () => {
    if (!user) {
      return <DemoParentDashboard />;
    }
    
    if (userRole === 'parent') {
      return <ParentDashboard />;
    } else if (userRole === 'teacher' || isSchoolAdmin) {
      return <StudentDashboard />;
    } else {
      return (
        <div className="text-center py-8">
          <p className="text-gray-400">{t('progress.notAvailable')}</p>
        </div>
      );
    }
  };

  const renderTestingTab = () => {
    return (
      <div className="space-y-6">
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              {t('testing.createTest')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TestCreator />
          </CardContent>
        </Card>
        
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Play className="mr-2 h-5 w-5" />
              {t('testing.quizLibrary')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QuizLibrary />
          </CardContent>
        </Card>
      </div>
    );
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      
      {/* Navigation Bar */}
      <div className="flex-shrink-0 p-4 border-b border-white/20 bg-gray-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {renderNavigation()}
          </div>
        </div>
      </div>
      
      <main className="flex-1 px-4 py-8 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {user ? t('progress.title') : t('progress.demoTitle')}
            </h1>
            <p className="text-gray-400">
              {user ? t('progress.description') : t('progress.demoDescription')}
            </p>
            {!user && (
              <div className="mt-4 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <p className="text-blue-200 text-sm">
                  📊 {t('progress.demoNotice')}
                </p>
              </div>
            )}
          </div>

          <Tabs defaultValue="monitoring" className="w-full">
            <TabsList className="grid w-full grid-cols-6 bg-white/10">
              <TabsTrigger value="monitoring" className="data-[state=active]:bg-white/20">
                {!user ? t('progress.tabs.monitoring') : (userRole === 'parent' ? t('progress.tabs.childProgress') : t('progress.tabs.monitoring'))}
              </TabsTrigger>
              <TabsTrigger value="quests" className="data-[state=active]:bg-white/20">
                {t('progress.tabs.quests')}
              </TabsTrigger>
              <TabsTrigger value="achievements" className="data-[state=active]:bg-white/20">
                {t('progress.tabs.achievements')}
              </TabsTrigger>
              <TabsTrigger value="subjects" className="data-[state=active]:bg-white/20">
                {t('progress.tabs.subjects')}
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-white/20">
                {t('progress.tabs.analytics')}
              </TabsTrigger>
              <TabsTrigger value="testing" className="data-[state=active]:bg-white/20">
                {t('testing.title')}
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="monitoring" className="space-y-6">
                {renderMonitoringTab()}
              </TabsContent>

              <TabsContent value="quests" className="space-y-6">
                {user ? <StudentQuestDisplay /> : <DemoQuestDisplay />}
              </TabsContent>

              <TabsContent value="achievements" className="space-y-6">
                {user ? <StudentAchievements /> : <DemoAchievements />}
              </TabsContent>

              <TabsContent value="subjects" className="space-y-6">
                {user ? <SubjectProgress /> : <DemoSubjectProgress />}
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                {user ? <StrengthsWeaknesses /> : <DemoAnalytics />}
              </TabsContent>

              <TabsContent value="testing" className="space-y-6">
                {renderTestingTab()}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Progress;
