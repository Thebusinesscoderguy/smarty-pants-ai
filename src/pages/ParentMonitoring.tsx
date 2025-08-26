import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Trophy, Clock, BookOpen, Target, AlertCircle, Users, BarChart3, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface ChildProgress {
  id: string;
  name: string;
  totalStudyTime: number;
  averageScore: number;
  completedQuizzes: number;
  achievements: number;
  currentSubjects: string[];
  weakAreas: string[];
  strongAreas: string[];
  lastActivity: string;
  studyPlans: Array<{
    title: string;
    progress: number;
    status: string;
  }>;
  recentQuizzes: Array<{
    title: string;
    score: number;
    total: number;
    date: string;
  }>;
}

export default function ParentMonitoring() {
  const { user } = useAuth();
  const [children, setChildren] = useState<ChildProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChild, setActiveChild] = useState<string>('');

  useEffect(() => {
    fetchChildrenData();
  }, [user]);

  const fetchChildrenData = async () => {
    if (!user) return;
    
    try {
      // Fetch children relationships
      const { data: relationships, error: relError } = await supabase
        .from('parent_child_relationships')
        .select('child_id')
        .eq('parent_id', user.id);

      if (relError) throw relError;

      const childrenData: ChildProgress[] = [];

      for (const rel of relationships || []) {
        const childId = rel.child_id;
        
        // Get profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', childId)
          .single();
        
        // Get analytics
        const { data: analytics } = await supabase
          .from('learning_analytics')
          .select('*')
          .eq('user_id', childId);

        // Get quiz attempts
        const { data: quizAttempts } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('user_id', childId)
          .order('completed_at', { ascending: false });

        // Get achievements
        const { data: achievements } = await supabase
          .from('user_achievements')
          .select('*')
          .eq('user_id', childId);

        // Get study plans
        const { data: studyPlans } = await supabase
          .from('study_plans')
          .select('*')
          .eq('user_id', childId);

        // Get recent activity
        const { data: recentActivity } = await supabase
          .from('student_interactions')
          .select('created_at')
          .eq('student_id', childId)
          .order('created_at', { ascending: false })
          .limit(1);

        // Calculate metrics
        const totalQuizzes = quizAttempts?.length || 0;
        const averageScore = totalQuizzes > 0 
          ? Math.round((quizAttempts?.reduce((sum, quiz) => sum + (quiz.score / quiz.total_possible * 100), 0) || 0) / totalQuizzes)
          : 0;

        // Process study plans
        const processedStudyPlans = (studyPlans || []).map(plan => ({
          title: plan.title,
          progress: plan.status === 'completed' ? 100 : plan.status === 'active' ? 60 : 0,
          status: plan.status
        }));

        // Process recent quizzes (top 5)
        const recentQuizzes = (quizAttempts || []).slice(0, 5).map(quiz => ({
          title: `Quiz ${quiz.id.slice(0, 8)}`,
          score: quiz.score,
          total: quiz.total_possible,
          date: new Date(quiz.completed_at).toLocaleDateString()
        }));

        // Analyze strengths and weaknesses
        const subjectPerformance = analytics?.reduce((acc, item) => {
          const subject = item.topic_name;
          if (!acc[subject]) acc[subject] = [];
          acc[subject].push(item.strength_score || 0);
          return acc;
        }, {} as Record<string, number[]>) || {};

        const strongAreas: string[] = [];
        const weakAreas: string[] = [];
        
        Object.entries(subjectPerformance).forEach(([subject, scores]) => {
          const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
          if (avgScore > 0.7) strongAreas.push(subject);
          if (avgScore < 0.5) weakAreas.push(subject);
        });

        const childName = profile?.display_name || `Child ${childId.slice(0, 8)}`;

        childrenData.push({
          id: childId,
          name: childName,
          totalStudyTime: analytics?.reduce((sum, item) => sum + (item.total_attempts * 2), 0) || 0,
          averageScore,
          completedQuizzes: totalQuizzes,
          achievements: achievements?.length || 0,
          currentSubjects: Object.keys(subjectPerformance),
          weakAreas,
          strongAreas,
          lastActivity: recentActivity?.[0]?.created_at || 'No recent activity',
          studyPlans: processedStudyPlans,
          recentQuizzes
        });
      }

      setChildren(childrenData);
      if (childrenData.length > 0 && !activeChild) {
        setActiveChild(childrenData[0].id);
      }
    } catch (error) {
      console.error('Error fetching children data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading children progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <Header />
      
      <main className="px-6 py-12 max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center">
            <Users className="mr-6 h-16 w-16 text-blue-400" />
            Parent Dashboard
          </h1>
          <p className="text-white/70 text-2xl">
            Monitor your children's learning progress and achievements
          </p>
        </div>

        {children.length === 0 ? (
          <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30 backdrop-blur-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                No Children Connected
              </CardTitle>
              <CardDescription className="text-white/70">
                You don't have any children linked to your account yet. Contact support to connect your children's accounts.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Tabs value={activeChild} onValueChange={setActiveChild} className="w-full">
            {/* Child Selection Tabs */}
            <TabsList className="grid w-full bg-white/10 backdrop-blur-sm rounded-xl p-2 mb-8 border border-white/20" style={{ gridTemplateColumns: `repeat(${children.length}, minmax(0, 1fr))` }}>
              {children.map((child) => (
                <TabsTrigger 
                  key={child.id}
                  value={child.id}
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-200 flex items-center font-semibold"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  {child.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Child Content */}
            {children.map((child) => (
              <TabsContent key={child.id} value={child.id} className="space-y-8">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30 backdrop-blur-sm rounded-2xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-200 text-sm font-medium">Average Score</p>
                          <p className="text-white text-3xl font-bold">{child.averageScore}%</p>
                        </div>
                        <div className="p-3 bg-blue-500/20 rounded-xl">
                          <BarChart3 className="h-6 w-6 text-blue-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/30 backdrop-blur-sm rounded-2xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-200 text-sm font-medium">Quizzes Completed</p>
                          <p className="text-white text-3xl font-bold">{child.completedQuizzes}</p>
                        </div>
                        <div className="p-3 bg-green-500/20 rounded-xl">
                          <Target className="h-6 w-6 text-green-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30 backdrop-blur-sm rounded-2xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-200 text-sm font-medium">Achievements</p>
                          <p className="text-white text-3xl font-bold">{child.achievements}</p>
                        </div>
                        <div className="p-3 bg-purple-500/20 rounded-xl">
                          <Trophy className="h-6 w-6 text-purple-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/30 backdrop-blur-sm rounded-2xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-200 text-sm font-medium">Study Minutes</p>
                          <p className="text-white text-3xl font-bold">{child.totalStudyTime}</p>
                        </div>
                        <div className="p-3 bg-orange-500/20 rounded-xl">
                          <Clock className="h-6 w-6 text-orange-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Study Plans */}
                  <Card className="bg-white/5 border-white/20 backdrop-blur-sm rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <BookOpen className="h-5 w-5 mr-2" />
                        Study Plans
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {child.studyPlans.length === 0 ? (
                        <p className="text-white/50 text-sm">No study plans yet</p>
                      ) : (
                        <div className="space-y-4">
                          {child.studyPlans.slice(0, 5).map((plan, index) => (
                            <div key={index} className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-white text-sm font-medium">{plan.title}</span>
                                <span className="text-white/70 text-sm">{plan.progress}%</span>
                              </div>
                              <Progress value={plan.progress} className="h-2" />
                              <Badge variant={plan.status === 'completed' ? 'default' : plan.status === 'active' ? 'secondary' : 'outline'} className="text-xs">
                                {plan.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recent Quizzes */}
                  <Card className="bg-white/5 border-white/20 backdrop-blur-sm rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Target className="h-5 w-5 mr-2" />
                        Recent Quizzes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {child.recentQuizzes.length === 0 ? (
                        <p className="text-white/50 text-sm">No quizzes completed yet</p>
                      ) : (
                        <div className="space-y-3">
                          {child.recentQuizzes.map((quiz, index) => (
                            <div key={index} className="flex justify-between p-3 bg-white/5 rounded-lg">
                              <div>
                                <p className="text-white text-sm font-medium">{quiz.title}</p>
                                <p className="text-white/60 text-xs">{quiz.date}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-white font-bold">{quiz.score}/{quiz.total}</p>
                                <p className="text-white/60 text-xs">{Math.round((quiz.score / quiz.total) * 100)}%</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Strengths & Weaknesses */}
                  <Card className="bg-white/5 border-white/20 backdrop-blur-sm rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2" />
                        Performance Areas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          Strong Areas
                        </h4>
                        {child.strongAreas.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {child.strongAreas.map((area) => (
                              <Badge key={area} variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-white/50 text-sm">No strong areas identified yet</p>
                        )}
                      </div>

                      <div>
                        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                          Areas for Improvement
                        </h4>
                        {child.weakAreas.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {child.weakAreas.map((area) => (
                              <Badge key={area} variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-white/50 text-sm">No weak areas identified</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Current Subjects */}
                <Card className="bg-white/5 border-white/20 backdrop-blur-sm rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-white">Current Subjects</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {child.currentSubjects.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {child.currentSubjects.map((subject) => (
                          <Badge key={subject} variant="outline" className="border-blue-500/30 text-blue-400">
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white/50 text-sm">No subjects being studied yet</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>

      <Footer />
    </div>
  );
}