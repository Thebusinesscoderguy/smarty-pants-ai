import { useState, useEffect } from 'react';
import { HomeworkList } from '@/components/student/HomeworkList';
import { NewsFeed } from '@/components/news/NewsFeed';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Trophy, 
  Target, 
  BookOpen, 
  Zap,
  Star,
  Clock,
  TrendingUp,
  Newspaper,
  FileQuestion
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

interface UpcomingQuiz {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  source: 'assignment' | 'homework';
}

export const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const isRTL = language === 'ar';
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    averageScore: 0,
    studyStreak: 3,
    weeklyGoal: 60,
    weeklyProgress: 45
  });
  
  const [activeQuests, setActiveQuests] = useState<any[]>([]);
  const [upcomingQuizzes, setUpcomingQuizzes] = useState<UpcomingQuiz[]>([]);

  useEffect(() => {
    if (user) {
      fetchStudentData();
      fetchUpcomingQuizzes();
    }
  }, [user]);

  const fetchStudentData = async () => {
    if (!user) return;
    try {
      const { data: quizAttempts } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user.id);

      const { data: questProgress } = await supabase
        .from('user_quest_progress')
        .select(`*, quests (title, description, target_value, rewards)`)
        .eq('user_id', user.id)
        .eq('completed', false)
        .limit(3);

      const totalQuizzes = quizAttempts?.length || 0;
      const averageScore = totalQuizzes > 0 
        ? Math.round((quizAttempts?.reduce((sum, quiz) => sum + (quiz.score / quiz.total_possible * 100), 0) || 0) / totalQuizzes)
        : 0;

      setStats({
        totalQuizzes,
        averageScore,
        studyStreak: 3,
        weeklyGoal: 60,
        weeklyProgress: 45
      });
      setActiveQuests(questProgress || []);
    } catch (error) {
      console.error('Error fetching student data:', error);
    }
  };

  const fetchUpcomingQuizzes = async () => {
    if (!user) return;
    try {
      const quizzes: UpcomingQuiz[] = [];

      // Get content assignments (quizzes assigned to student)
      const { data: contentAssignments } = await supabase
        .from('content_assignments')
        .select('*, quizzes:content_id(title, description)')
        .eq('content_type', 'quiz')
        .eq('is_active', true)
        .order('due_date', { ascending: true })
        .limit(5);

      if (contentAssignments) {
        for (const a of contentAssignments) {
          const quiz = a.quizzes as any;
          if (quiz) {
            quizzes.push({
              id: a.content_id,
              title: quiz.title || 'Quiz',
              description: quiz.description || null,
              due_date: a.due_date,
              source: 'assignment'
            });
          }
        }
      }

      // Get homework assignments of type quiz
      const { data: hwAssignments } = await supabase
        .from('homework_assignments')
        .select('*')
        .eq('assignment_type', 'quiz')
        .eq('is_active', true)
        .order('due_date', { ascending: true })
        .limit(5);

      if (hwAssignments) {
        for (const hw of hwAssignments) {
          quizzes.push({
            id: hw.id,
            title: hw.title,
            description: hw.description,
            due_date: hw.due_date,
            source: 'homework'
          });
        }
      }

      setUpcomingQuizzes(quizzes.slice(0, 5));
    } catch (error) {
      console.error('Error fetching upcoming quizzes:', error);
    }
  };

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return isRTL ? 'بدون موعد' : 'No due date';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return isRTL ? 'متأخر' : 'Overdue';
    if (days === 0) return isRTL ? 'اليوم' : 'Due today';
    if (days === 1) return isRTL ? 'غداً' : 'Due tomorrow';
    return isRTL ? `خلال ${days} أيام` : `Due in ${days} days`;
  };

  const quickActions = [
    {
      title: t('studentDashboard.startAIChat'),
      description: t('studentDashboard.startAIChatDesc'),
      icon: MessageSquare,
      color: "from-blue-500 to-cyan-500",
      action: () => navigate("/chat")
    },
    {
      title: t('studentDashboard.takeQuiz'),
      description: t('studentDashboard.takeQuizDesc'),
      icon: BookOpen,
      color: "from-purple-500 to-pink-500",
      action: () => navigate("/quiz-generator")
    },
    {
      title: t('studentDashboard.mathSolver'),
      description: t('studentDashboard.mathSolverDesc'),
      icon: Target,
      color: "from-green-500 to-emerald-500",
      action: () => navigate("/math-solver")
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('studentDashboard.welcome')}</h1>
          <p className="text-muted-foreground">{t('studentDashboard.subtitle')}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalQuizzes}</div>
              <div className="text-sm text-muted-foreground">{t('studentDashboard.quizzesCompleted')}</div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-500">{stats.averageScore}%</div>
              <div className="text-sm text-muted-foreground">{t('studentDashboard.averageScore')}</div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-500">{stats.studyStreak}</div>
              <div className="text-sm text-muted-foreground">{t('studentDashboard.dayStreak')}</div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-500">
                {Math.round((stats.weeklyProgress / stats.weeklyGoal) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">{t('studentDashboard.weeklyProgress')}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              {t('studentDashboard.quickActions')}
            </CardTitle>
            <CardDescription>{t('studentDashboard.quickActionsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.action}
                  className={`h-24 bg-gradient-to-r ${action.color} hover:opacity-90 text-white border-0 p-4`}
                >
                  <div className="text-center">
                    <action.icon className="h-6 w-6 mx-auto mb-2" />
                    <div className="font-semibold">{action.title}</div>
                    <div className="text-xs opacity-80">{action.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Homework */}
        <div className="mb-8">
          <HomeworkList />
        </div>

        {/* Upcoming Quizzes */}
        {upcomingQuizzes.length > 0 && (
          <Card className="mb-8 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileQuestion className="h-5 w-5 text-purple-500" />
                {isRTL ? 'الاختبارات القادمة' : 'Upcoming Quizzes'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingQuizzes.map((quiz) => (
                  <div key={quiz.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">{quiz.title}</h4>
                      {quiz.description && (
                        <p className="text-sm text-muted-foreground truncate">{quiz.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge variant={quiz.due_date && new Date(quiz.due_date) < new Date() ? 'destructive' : 'secondary'}>
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDueDate(quiz.due_date)}
                      </Badge>
                      <Button size="sm" onClick={() => navigate('/quiz-generator')}>
                        {isRTL ? 'ابدأ' : 'Take Quiz'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent News */}
        <Card className="mb-8 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-blue-500" />
              {isRTL ? 'آخر الأخبار' : 'Recent News'}
            </CardTitle>
            <CardDescription>
              {isRTL ? 'أحدث الأخبار والإعلانات من معلميك' : 'Latest news and announcements from your teachers'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NewsFeed />
          </CardContent>
        </Card>

        {/* Weekly Progress */}
        <Card className="mb-8 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              {t('studentDashboard.weeklyProgress')}
            </CardTitle>
            <CardDescription>
              {stats.weeklyProgress} / {stats.weeklyGoal} {t('studentDashboard.weeklyProgress')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={(stats.weeklyProgress / stats.weeklyGoal) * 100} className="mb-4" />
            <p className="text-sm text-muted-foreground">
              {t('studentDashboard.weeklyGoalProgress').replace('{percent}', Math.round((stats.weeklyProgress / stats.weeklyGoal) * 100).toString())}
            </p>
          </CardContent>
        </Card>

        {/* Active Quests */}
        {activeQuests.length > 0 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-500" />
                {t('studentDashboard.activeQuests')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeQuests.map((quest, index) => (
                  <div key={index} className="p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-foreground">{quest.quests?.title || t('studentDashboard.questDefault')}</h4>
                      <Badge variant="outline">
                        {quest.current_value || 0} / {quest.quests?.target_value || 1}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{quest.quests?.description || t('studentDashboard.questDefaultDesc')}</p>
                    <Progress 
                      value={((quest.current_value || 0) / (quest.quests?.target_value || 1)) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
};
