
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
import { CurriculumSelector } from '@/components/CurriculumSelector';
import { MessageSquare, BarChart3, FileText, Play, TrendingUp, Award, Target, TestTube } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const Progress = () => {
  const { user, isSchoolAdmin, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<'student' | 'parent' | 'teacher' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<'chat' | 'monitoring'>('monitoring');
  const [showCurriculumSelector, setShowCurriculumSelector] = useState(false);

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

  const handleCurriculumSelect = (curriculum: any) => {
    if (curriculum) {
      localStorage.setItem('selectedCurriculum', JSON.stringify(curriculum));
    }
    setShowCurriculumSelector(false);
    navigate('/chat');
  };

  const renderNavigation = () => (
    <div className="flex items-center space-x-1 bg-white/5 rounded-lg p-1 backdrop-blur-sm">
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
        Chat
      </Button>
      <Button
        variant={currentPage === 'monitoring' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setCurrentPage('monitoring')}
        className={currentPage === 'monitoring' ? 'bg-blue-600 hover:bg-blue-700' : 'text-white hover:bg-white/10'}
      >
        <BarChart3 className="h-4 w-4 mr-1" />
        Monitoring
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
          <p className="text-gray-400">Monitoring features are not available for your role.</p>
        </div>
      );
    }
  };

  const renderTestingTab = () => {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Create Custom Test
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TestCreator />
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Play className="mr-2 h-5 w-5" />
                Quiz Library
              </CardTitle>
            </CardHeader>
            <CardContent>
              <QuizLibrary />
            </CardContent>
          </Card>
        </div>
        
        {/* Test Analytics */}
        <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <TestTube className="mr-2 h-5 w-5" />
              Test Performance Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-green-400 mb-1">87%</div>
                <p className="text-sm text-white/70">Average Score</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-blue-400 mb-1">23</div>
                <p className="text-sm text-white/70">Tests Completed</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-purple-400 mb-1">12m</div>
                <p className="text-sm text-white/70">Avg. Duration</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex flex-col">
      <Header />
      
      {/* Navigation Bar */}
      <div className="flex-shrink-0 p-4 border-b border-white/20 bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {renderNavigation()}
          </div>
          <Button
            onClick={() => setShowCurriculumSelector(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Select Curriculum
          </Button>
        </div>
      </div>
      
      <main className="flex-1 px-4 py-8 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {user ? 'Learning Monitoring Dashboard' : 'Demo Monitoring Dashboard'}
            </h1>
            <p className="text-gray-300 text-lg">
              {user ? 'Track progress, view analytics, and manage learning activities' : 'Experience our comprehensive monitoring and analytics features'}
            </p>
            {!user && (
              <div className="mt-4 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg backdrop-blur-sm">
                <p className="text-blue-200 text-sm">
                  📊 This is a demo of our monitoring features. Sign up to access your personal dashboard!
                </p>
              </div>
            )}
          </div>

          <Tabs defaultValue="monitoring" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-white/10 backdrop-blur-sm">
              <TabsTrigger value="monitoring" className="data-[state=active]:bg-white/20 flex items-center">
                <BarChart3 className="h-4 w-4 mr-1" />
                {!user ? 'Overview' : (userRole === 'parent' ? 'Child Progress' : 'Monitoring')}
              </TabsTrigger>
              <TabsTrigger value="quests" className="data-[state=active]:bg-white/20 flex items-center">
                <Target className="h-4 w-4 mr-1" />
                Quests
              </TabsTrigger>
              <TabsTrigger value="achievements" className="data-[state=active]:bg-white/20 flex items-center">
                <Award className="h-4 w-4 mr-1" />
                Achievements
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-white/20 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="testing" className="data-[state=active]:bg-white/20 flex items-center">
                <TestTube className="h-4 w-4 mr-1" />
                Tests
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

      {/* Curriculum Selector Modal */}
      <CurriculumSelector
        isOpen={showCurriculumSelector}
        onClose={() => setShowCurriculumSelector(false)}
        onSelect={handleCurriculumSelect}
      />
    </div>
  );
};

export default Progress;
