import { useState, useEffect } from 'react';
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
  TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    averageScore: 0,
    
    studyStreak: 3,
    weeklyGoal: 60,
    weeklyProgress: 45
  });
  
  const [activeQuests, setActiveQuests] = useState<any[]>([]);

  useEffect(() => {
    fetchStudentData();
  }, [user]);

  const fetchStudentData = async () => {
    if (!user) return;

    try {
      // Get quiz attempts
      const { data: quizAttempts } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user.id);

      // Get achievements - removed (achievements system disabled)
      const achievements: any[] = [];

      // Get active quests
      const { data: questProgress } = await supabase
        .from('user_quest_progress')
        .select(`
          *,
          quests (
            title,
            description,
            target_value,
            rewards
          )
        `)
        .eq('user_id', user.id)
        .eq('completed', false)
        .limit(3);

      // Calculate stats
      const totalQuizzes = quizAttempts?.length || 0;
      const averageScore = totalQuizzes > 0 
        ? Math.round((quizAttempts?.reduce((sum, quiz) => sum + (quiz.score / quiz.total_possible * 100), 0) || 0) / totalQuizzes)
        : 0;

      setStats({
        totalQuizzes,
        averageScore,
        
        studyStreak: 3, // Mock data
        weeklyGoal: 60,
        weeklyProgress: 45
      });

      
      setActiveQuests(questProgress || []);
    } catch (error) {
      console.error('Error fetching student data:', error);
    }
  };

  const quickActions = [
    {
      title: "Start AI Chat",
      description: "Get help with homework or learn something new",
      icon: MessageSquare,
      color: "from-blue-500 to-cyan-500",
      action: () => navigate("/chat")
    },
    {
      title: "Take a Quiz",
      description: "Test your knowledge and earn points",
      icon: BookOpen,
      color: "from-purple-500 to-pink-500",
      action: () => navigate("/quiz-generator")
    },
    {
      title: "Math Solver",
      description: "Upload and solve math problems",
      icon: Target,
      color: "from-green-500 to-emerald-500",
      action: () => navigate("/math-solver")
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, Student! 🚀</h1>
          <p className="text-white/70">Ready to continue your learning adventure?</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.totalQuizzes}</div>
              <div className="text-sm text-white/70">Quizzes Completed</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.averageScore}%</div>
              <div className="text-sm text-white/70">Average Score</div>
            </CardContent>
          </Card>
          
          
          <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-400">{stats.studyStreak}</div>
              <div className="text-sm text-white/70">Day Streak</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              Quick Actions
            </CardTitle>
            <CardDescription className="text-white/70">
              Jump into learning with these popular activities
            </CardDescription>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Weekly Progress */}
          <Card className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border-green-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                Weekly Progress
              </CardTitle>
              <CardDescription className="text-white/70">
                {stats.weeklyProgress} / {stats.weeklyGoal} minutes this week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress 
                value={(stats.weeklyProgress / stats.weeklyGoal) * 100} 
                className="mb-4"
              />
              <p className="text-sm text-white/70">
                Great job! You're {Math.round((stats.weeklyProgress / stats.weeklyGoal) * 100)}% towards your weekly goal.
              </p>
            </CardContent>
          </Card>

        </div>

        {/* Active Quests */}
        {activeQuests.length > 0 && (
          <Card className="mt-8 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border-orange-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-400" />
                Active Quests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeQuests.map((quest, index) => (
                  <div key={index} className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-white">{quest.quests?.title || 'Quest'}</h4>
                      <Badge variant="outline" className="border-orange-500/30 text-orange-400">
                        {quest.current_value || 0} / {quest.quests?.target_value || 1}
                      </Badge>
                    </div>
                    <p className="text-sm text-white/70 mb-3">{quest.quests?.description || 'Complete this quest to earn rewards!'}</p>
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