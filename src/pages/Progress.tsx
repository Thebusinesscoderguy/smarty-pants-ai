import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { StudentDashboard } from '@/components/monitoring/StudentDashboard';
import { ParentDashboard } from '@/components/monitoring/ParentDashboard';
import { StudentQuestDisplay } from '@/components/student/StudentQuestDisplay';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { DemoParentDashboard } from '@/components/demo/DemoParentDashboard';
import { DemoQuestDisplay } from '@/components/demo/DemoQuestDisplay';
import { DemoAnalytics } from '@/components/demo/DemoAnalytics';
import { CurriculumSelector } from '@/components/CurriculumSelector';
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
        Chat
      </Button>
      <Button
        variant={currentPage === 'monitoring' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setCurrentPage('monitoring')}
        className={`${currentPage === 'monitoring' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'} transition-all duration-200`}
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
        className={`${currentPage === 'settings' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'} transition-all duration-200`}
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
            <h3 className="text-3xl font-bold text-foreground mb-2">
              Learning Curriculums
            </h3>
            <p className="text-muted-foreground text-lg">Discover and manage personalized learning paths</p>
          </div>
          <Button 
            onClick={() => setIsCurriculumSelectorOpen(true)}
            className="bg-primary hover:bg-primary/90 px-6 py-3 rounded-xl font-semibold shadow-lg"
          >
            <BookOpen className="h-5 w-5 mr-2" />
            Browse Curriculums
          </Button>
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
                    <h3 className="text-2xl font-bold text-foreground mb-2">Create AI Curriculum</h3>
                    <p className="text-muted-foreground text-lg">Let our AI create a personalized curriculum tailored to your learning goals</p>
                  </div>
                </div>
                <Button 
                  onClick={handleCreateCustomCurriculum}
                  className="bg-primary hover:bg-primary/90 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Now
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border backdrop-blur-sm rounded-2xl shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-foreground text-2xl flex items-center">
                <Calendar className="mr-3 h-6 w-6 text-primary" />
                Active Curriculums
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <div className="text-muted-foreground text-lg mb-4">
                  No active curriculums found
                </div>
                <p className="text-muted-foreground">
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
              Tests & Assessments
            </h3>
            <p className="text-muted-foreground text-lg">Track your test performance and take new assessments</p>
          </div>
          <Button 
            onClick={() => navigate('/quiz-generator')}
            className="bg-primary hover:bg-primary/90 px-6 py-3 rounded-xl font-semibold shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Test
          </Button>
        </div>

        {/* Test Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/30 rounded-2xl shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-400 text-sm font-medium">Completed Tests</p>
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
                  <p className="text-blue-400 text-sm font-medium">Average Score</p>
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
                  <p className="text-purple-400 text-sm font-medium">Available Tests</p>
                  <p className="text-3xl font-bold text-white">1</p>
                </div>
                <FileText className="h-10 w-10 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-600/20 to-red-600/20 border-orange-500/30 rounded-2xl shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-400 text-sm font-medium">In Progress</p>
                  <p className="text-3xl font-bold text-white">1</p>
                </div>
                <Play className="h-10 w-10 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tests List */}
        <Card className="bg-white/5 border-white/20 backdrop-blur-sm rounded-2xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-white text-2xl flex items-center">
              <FileText className="mr-3 h-6 w-6 text-blue-400" />
              Your Tests
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
                      <div className="text-white/60 text-sm">Questions</div>
                      <div className="text-white font-semibold">{test.totalQuestions}</div>
                    </div>

                    {test.status === 'completed' && (
                      <>
                        <div className="text-right">
                          <div className="text-white/60 text-sm">Score</div>
                          <div className={`font-semibold ${test.score >= 80 ? 'text-green-400' : test.score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {test.score}%
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white/60 text-sm">Time</div>
                          <div className="text-white font-semibold">{test.timeSpent}m</div>
                        </div>
                      </>
                    )}

                    {test.status === 'in_progress' && (
                      <div className="text-right">
                        <div className="text-white/60 text-sm">Time Spent</div>
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
                      {test.status === 'completed' ? 'Review' : test.status === 'in_progress' ? 'Continue' : 'Start Test'}
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
          <p className="text-muted-foreground">Loading your dashboard...</p>
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
              {user ? `Welcome back, ${user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}` : 'Demo Mode'}
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
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all duration-200 flex items-center font-semibold"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Curriculums
            </TabsTrigger>
            <TabsTrigger 
              value="quests" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all duration-200 flex items-center font-semibold"
            >
              <Target className="h-4 w-4 mr-2" />
              Quests
            </TabsTrigger>
            <TabsTrigger 
              value="tests" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all duration-200 flex items-center font-semibold"
            >
              <FileText className="h-4 w-4 mr-2" />
              Tests
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
