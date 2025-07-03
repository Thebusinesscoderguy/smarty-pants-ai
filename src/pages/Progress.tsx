
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { StudentDashboard } from '@/components/monitoring/StudentDashboard';
import { ParentDashboard } from '@/components/monitoring/ParentDashboard';
import { StudentQuestDisplay } from '@/components/student/StudentQuestDisplay';
import { StudentAchievements } from '@/components/student/StudentAchievements';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { DemoParentDashboard } from '@/components/demo/DemoParentDashboard';
import { DemoQuestDisplay } from '@/components/demo/DemoQuestDisplay';
import { DemoAchievements } from '@/components/demo/DemoAchievements';
import { DemoAnalytics } from '@/components/demo/DemoAnalytics';
import { CurriculumSelector } from '@/components/CurriculumSelector';
import { BarChart3, BookOpen, Target, Award, TrendingUp, MessageSquare, Settings, Plus, Sparkles, User, Calendar, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const Progress = () => {
  const { user, isSchoolAdmin, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<'student' | 'parent' | 'teacher' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<'chat' | 'monitoring' | 'settings'>('monitoring');
  const [isCurriculumSelectorOpen, setIsCurriculumSelectorOpen] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchUserRole();
      } else {
        setUserRole('parent');
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
    <div className="flex items-center space-x-2 bg-white/5 rounded-xl p-2 backdrop-blur-sm border border-white/10">
      <Button
        variant={currentPage === 'chat' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => {
          setCurrentPage('chat');
          navigate('/chat');
        }}
        className={`${currentPage === 'chat' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'text-white hover:bg-white/10'} transition-all duration-200`}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Chat
      </Button>
      <Button
        variant={currentPage === 'monitoring' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setCurrentPage('monitoring')}
        className={`${currentPage === 'monitoring' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'text-white hover:bg-white/10'} transition-all duration-200`}
      >
        <BarChart3 className="h-4 w-4 mr-2" />
        Dashboard
      </Button>
      <Button
        variant={currentPage === 'settings' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => {
          setCurrentPage('settings');
          navigate('/settings');
        }}
        className={`${currentPage === 'settings' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'text-white hover:bg-white/10'} transition-all duration-200`}
      >
        <Settings className="h-4 w-4 mr-2" />
        Settings
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
        <div className="text-center py-12">
          <User className="h-16 w-16 text-white/40 mx-auto mb-4" />
          <p className="text-white/60 text-lg">Monitoring features are not available for your role.</p>
        </div>
      );
    }
  };

  const handleCreateCustomCurriculum = () => {
    navigate('/chat', { state: { message: 'I want to create a custom AI curriculum. Please help me get started.' } });
    setIsCurriculumSelectorOpen(false);
  };

  const renderCurriculumsTab = () => {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Learning Curriculums
            </h3>
            <p className="text-white/70 text-lg">Discover and manage personalized learning paths</p>
          </div>
          <Button 
            onClick={() => setIsCurriculumSelectorOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-3 rounded-xl font-semibold shadow-lg"
          >
            <BookOpen className="h-5 w-5 mr-2" />
            Browse Curriculums
          </Button>
        </div>
        
        <div className="grid gap-8">
          <Card className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-500/30 hover:from-blue-600/30 hover:to-purple-600/30 transition-all duration-300 cursor-pointer group rounded-2xl shadow-xl">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Create AI Curriculum</h3>
                    <p className="text-white/80 text-lg">Let our AI create a personalized curriculum tailored to your learning goals</p>
                  </div>
                </div>
                <Button 
                  onClick={handleCreateCustomCurriculum}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Now
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/20 backdrop-blur-sm rounded-2xl shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-2xl flex items-center">
                <Calendar className="mr-3 h-6 w-6 text-blue-400" />
                Active Curriculums
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Clock className="h-16 w-16 text-white/40 mx-auto mb-4" />
                <div className="text-white/70 text-lg mb-4">
                  No active curriculums found
                </div>
                <p className="text-white/50">
                  Click "Browse Curriculums" or "Create Now" to get started with your learning journey
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <CurriculumSelector
          isOpen={isCurriculumSelectorOpen}
          onClose={() => setIsCurriculumSelectorOpen(false)}
          onSelect={(curriculum) => {
            if (curriculum) {
              console.log('Selected curriculum:', curriculum);
            } else {
              handleCreateCustomCurriculum();
            }
            setIsCurriculumSelectorOpen(false);
          }}
        />
      </div>
    );
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white/70">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      <Header />
      
      {/* Modern Navigation Bar */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {renderNavigation()}
            </div>
            <div className="text-white/60 text-sm">
              {user ? `Welcome back, ${user.email?.split('@')[0]}` : 'Demo Mode'}
            </div>
          </div>
        </div>
      </div>
      
      <main className="px-6 py-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            {user ? 'Learning Dashboard' : 'Demo Dashboard'}
          </h1>
          <p className="text-white/70 text-xl max-w-2xl">
            {user ? 'Track your progress, explore curriculums, and achieve your learning goals' : 'Experience our comprehensive learning platform'}
          </p>
          {!user && (
            <div className="mt-6 p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl backdrop-blur-sm">
              <p className="text-blue-200 flex items-center">
                <Sparkles className="h-5 w-5 mr-2" />
                This is a demo of our learning platform. Sign up to access your personal dashboard!
              </p>
            </div>
          )}
        </div>

        <Tabs defaultValue="monitoring" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-sm rounded-xl p-2 mb-8 border border-white/20">
            <TabsTrigger 
              value="monitoring" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-200 flex items-center font-semibold"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {!user ? 'Overview' : (userRole === 'parent' ? 'Child Progress' : 'Monitoring')}
            </TabsTrigger>
            <TabsTrigger 
              value="curriculums" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-200 flex items-center font-semibold"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Curriculums
            </TabsTrigger>
            <TabsTrigger 
              value="quests" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-200 flex items-center font-semibold"
            >
              <Target className="h-4 w-4 mr-2" />
              Quests
            </TabsTrigger>
            <TabsTrigger 
              value="achievements" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-200 flex items-center font-semibold"
            >
              <Award className="h-4 w-4 mr-2" />
              Achievements
            </TabsTrigger>
          </TabsList>

          <div className="space-y-8">
            <TabsContent value="monitoring" className="space-y-8">
              {renderMonitoringTab()}
            </TabsContent>

            <TabsContent value="curriculums" className="space-y-8">
              {renderCurriculumsTab()}
            </TabsContent>

            <TabsContent value="quests" className="space-y-8">
              {user ? <StudentQuestDisplay /> : <DemoQuestDisplay />}
            </TabsContent>

            <TabsContent value="achievements" className="space-y-8">
              {user ? <StudentAchievements /> : <DemoAchievements />}
            </TabsContent>
          </div>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Progress;
