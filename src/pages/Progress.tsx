import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { EnhancedStudentDashboard } from '@/components/monitoring/EnhancedStudentDashboard';
import { ParentDashboard } from '@/components/monitoring/ParentDashboard';
import { ComprehensiveMonitoringDashboard } from '@/components/monitoring/ComprehensiveMonitoringDashboard';
import { StudentQuestDisplay } from '@/components/student/StudentQuestDisplay';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Link } from 'react-router-dom';

import { BarChart3, BookOpen, Target, TrendingUp, MessageSquare, Settings, Plus, Sparkles, User, Calendar, Clock, FileText, CheckCircle, XCircle, Play } from 'lucide-react';
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
    <div className="flex items-center space-x-2 bg-muted/50 rounded-xl p-2 backdrop-blur-sm border border-border">
      <Button
        variant={currentPage === 'chat' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => {
          setCurrentPage('chat');
          navigate('/chat');
        }}
        className={`${currentPage === 'chat' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'} transition-all duration-200`}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        {t('progress.nav.chat')}
      </Button>
      <Button
        variant={currentPage === 'monitoring' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setCurrentPage('monitoring')}
        className={`${currentPage === 'monitoring' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'} transition-all duration-200`}
      >
        <BarChart3 className="h-4 w-4 mr-2" />
        {t('progress.nav.dashboard')}
      </Button>
      <Button
        variant={currentPage === 'settings' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => {
          setCurrentPage('settings');
          navigate('/settings');
        }}
        className={`${currentPage === 'settings' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'} transition-all duration-200`}
      >
        <Settings className="h-4 w-4 mr-2" />
        {t('progress.nav.settings')}
      </Button>
    </div>
  );

  const SignInPrompt = ({ message }: { message: string }) => (
    <Card>
      <CardContent className="p-10 text-center space-y-4">
        <p className="text-muted-foreground">{message}</p>
        <Button asChild>
          <Link to="/auth">Sign in to continue</Link>
        </Button>
      </CardContent>
    </Card>
  );

  const renderMonitoringTab = () => {
    if (!user) {
      return <SignInPrompt message="Sign in to view your learning progress dashboard." />;
    }

    if (userRole === 'parent') {
      return <ParentDashboard />;
    }
    if (userRole === 'teacher' || isSchoolAdmin) {
      return <ComprehensiveMonitoringDashboard />;
    }
    // Default: student
    return <EnhancedStudentDashboard />;
  };

  const handleCreateCustomCurriculum = () => {
    navigate('/chat', { state: { message: 'I want to create a custom AI curriculum. Please help me get started.' } });
  };

  const renderCurriculumsTab = () => {
    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-3xl font-bold text-foreground mb-2">
            {t('progress.curriculum.title')}
          </h3>
          <p className="text-muted-foreground text-lg">{t('progress.curriculum.subtitle')}</p>
        </div>

        
        <div className="grid gap-8">
          <Card className="bg-primary/10 border-primary/30 hover:bg-primary/20 transition-all duration-300 cursor-pointer group rounded-2xl shadow-xl">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="p-4 bg-primary rounded-2xl group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="h-10 w-10 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">{t('progress.curriculum.createAI')}</h3>
                    <p className="text-muted-foreground text-lg">{t('progress.curriculum.createAIDesc')}</p>
                  </div>
                </div>
                <Button 
                  onClick={handleCreateCustomCurriculum}
                  className="bg-primary hover:bg-primary/90 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  {t('progress.curriculum.createNow')}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border backdrop-blur-sm rounded-2xl shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-foreground text-2xl flex items-center">
                <Calendar className="mr-3 h-6 w-6 text-primary" />
                {t('progress.curriculum.activeCurriculums')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <div className="text-muted-foreground text-lg mb-4">
                  {t('progress.curriculum.noCurriculums')}
                </div>
                <p className="text-muted-foreground">
                  {t('progress.curriculum.getStarted')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    );
  };

  const renderTestsTab = () => {
    // Demo tests data
    const demoTests = [
      {
        id: '1',
        title: 'Mathematics Assessment',
        subject: 'Mathematics',
        status: 'completed',
        score: 85,
        totalQuestions: 20,
        completedAt: '2024-01-15',
        timeSpent: 45,
        difficulty: 'Medium'
      },
      {
        id: '2',
        title: 'Science Quiz',
        subject: 'Science',
        status: 'completed',
        score: 92,
        totalQuestions: 15,
        completedAt: '2024-01-12',
        timeSpent: 30,
        difficulty: 'Easy'
      },
      {
        id: '3',
        title: 'History Test',
        subject: 'History',
        status: 'available',
        score: null,
        totalQuestions: 25,
        completedAt: null,
        timeSpent: null,
        difficulty: 'Hard'
      },
      {
        id: '4',
        title: 'English Comprehension',
        subject: 'English',
        status: 'in_progress',
        score: null,
        totalQuestions: 18,
        completedAt: null,
        timeSpent: 15,
        difficulty: 'Medium'
      }
    ];

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'completed':
          return <CheckCircle className="h-5 w-5 text-green-400" />;
        case 'in_progress':
          return <Play className="h-5 w-5 text-blue-400" />;
        case 'available':
          return <FileText className="h-5 w-5 text-gray-400" />;
        default:
          return <XCircle className="h-5 w-5 text-red-400" />;
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'completed':
          return 'text-green-400 bg-green-400/20';
        case 'in_progress':
          return 'text-blue-400 bg-blue-400/20';
        case 'available':
          return 'text-gray-400 bg-gray-400/20';
        default:
          return 'text-red-400 bg-red-400/20';
      }
    };

    const getDifficultyColor = (difficulty: string) => {
      switch (difficulty) {
        case 'Easy':
          return 'text-green-400 bg-green-400/20';
        case 'Medium':
          return 'text-yellow-400 bg-yellow-400/20';
        case 'Hard':
          return 'text-red-400 bg-red-400/20';
        default:
          return 'text-gray-400 bg-gray-400/20';
      }
    };

    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-3xl font-bold text-foreground mb-2">
              {t('progress.tests.title')}
            </h3>
            <p className="text-muted-foreground text-lg">{t('progress.tests.subtitle')}</p>
          </div>
          <Button 
            onClick={() => navigate('/quiz-generator')}
            className="bg-primary hover:bg-primary/90 px-6 py-3 rounded-xl font-semibold shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            {t('progress.tests.createTest')}
          </Button>
        </div>

        {/* Test Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/30 rounded-2xl shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-400 text-sm font-medium">{t('progress.tests.completedTests')}</p>
                  <p className="text-3xl font-bold text-white">2</p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/30 rounded-2xl shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-400 text-sm font-medium">{t('progress.tests.averageScore')}</p>
                  <p className="text-3xl font-bold text-white">88.5%</p>
                </div>
                <TrendingUp className="h-10 w-10 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30 rounded-2xl shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-400 text-sm font-medium">{t('progress.tests.availableTests')}</p>
                  <p className="text-3xl font-bold text-white">1</p>
                </div>
                <FileText className="h-10 w-10 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-600/20 to-red-600/20 border-violet-500/30 rounded-2xl shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-violet-400 text-sm font-medium">{t('progress.tests.inProgress')}</p>
                  <p className="text-3xl font-bold text-white">1</p>
                </div>
                <Play className="h-10 w-10 text-violet-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tests List */}
        <Card className="bg-white/5 border-white/20 backdrop-blur-sm rounded-2xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-white text-2xl flex items-center">
              <FileText className="mr-3 h-6 w-6 text-blue-400" />
              {t('progress.tests.yourTests')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {demoTests.map((test) => (
                <div
                  key={test.id}
                  className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(test.status)}
                    <div>
                      <h4 className="text-white font-semibold text-lg">{test.title}</h4>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-white/60 text-sm">{test.subject}</span>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getDifficultyColor(test.difficulty)}`}>
                          {test.difficulty}
                        </span>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(test.status)}`}>
                          {test.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="text-white/60 text-sm">{t('progress.tests.questions')}</div>
                      <div className="text-white font-semibold">{test.totalQuestions}</div>
                    </div>

                    {test.status === 'completed' && (
                      <>
                        <div className="text-right">
                          <div className="text-white/60 text-sm">{t('progress.tests.score')}</div>
                          <div className={`font-semibold ${test.score >= 80 ? 'text-green-400' : test.score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {test.score}%
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white/60 text-sm">{t('progress.tests.time')}</div>
                          <div className="text-white font-semibold">{test.timeSpent}m</div>
                        </div>
                      </>
                    )}

                    {test.status === 'in_progress' && (
                      <div className="text-right">
                        <div className="text-white/60 text-sm">{t('progress.tests.timeSpent')}</div>
                        <div className="text-white font-semibold">{test.timeSpent}m</div>
                      </div>
                    )}

                    <Button
                      variant={test.status === 'completed' ? 'outline' : 'default'}
                      size="sm"
                      className={
                        test.status === 'completed'
                          ? 'border-white/20 text-white hover:bg-white/10'
                          : test.status === 'in_progress'
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                      }
                    >
                      {test.status === 'completed' ? t('progress.tests.review') : test.status === 'in_progress' ? t('progress.tests.continue') : t('progress.tests.startTest')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('progress.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      {/* Modern Navigation Bar */}
      <div className="border-b border-border bg-muted/30 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {renderNavigation()}
            </div>
            <div className="text-muted-foreground text-sm">
              {user ? `${t('progress.welcomeBack')}, ${user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}` : t('progress.demoMode')}
            </div>
          </div>
        </div>
      </div>
      
      <main className="px-6 py-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            {user ? t('progress.learningDashboard') : t('progress.demoDashboard')}
          </h1>
          <p className="text-white/70 text-xl max-w-2xl">
            {user ? t('progress.trackProgress') : t('progress.experiencePlatform')}
          </p>
          {!user && (
            <div className="mt-6 p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl backdrop-blur-sm">
              <p className="text-blue-200 flex items-center">
                <Sparkles className="h-5 w-5 mr-2" />
                {t('progress.demoSignup')}
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
              {!user ? t('progress.overview') : (userRole === 'parent' ? t('progress.childProgress') : t('progress.monitoring'))}
            </TabsTrigger>
            <TabsTrigger 
              value="curriculums" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all duration-200 flex items-center font-semibold"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              {t('progress.curriculums')}
            </TabsTrigger>
            <TabsTrigger 
              value="quests" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all duration-200 flex items-center font-semibold"
            >
              <Target className="h-4 w-4 mr-2" />
              {t('progress.quests')}
            </TabsTrigger>
            <TabsTrigger 
              value="tests" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all duration-200 flex items-center font-semibold"
            >
              <FileText className="h-4 w-4 mr-2" />
              {t('progress.tests')}
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
              {user ? <StudentQuestDisplay /> : <SignInPrompt message="Sign in to track your quests and achievements." />}
            </TabsContent>


            <TabsContent value="tests" className="space-y-8">
              {renderTestsTab()}
            </TabsContent>
          </div>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Progress;
