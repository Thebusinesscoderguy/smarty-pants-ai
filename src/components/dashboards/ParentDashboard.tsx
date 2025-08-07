import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Trophy, Clock, BookOpen, Target, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface StudentProgress {
  id: string;
  name: string;
  email: string;
  totalStudyTime: number;
  averageScore: number;
  completedQuizzes: number;
  achievements: number;
  currentSubjects: string[];
  weakAreas: string[];
  strongAreas: string[];
  lastActivity: string;
}

export const ParentDashboard = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, [user]);

  const fetchStudentData = async () => {
    if (!user) return;
    
    try {
      // Fetch children relationships
      const { data: relationships, error: relError } = await supabase
        .from('parent_child_relationships')
        .select('child_id')
        .eq('parent_id', user.id);

      if (relError) throw relError;

      const studentData: StudentProgress[] = [];

      for (const rel of relationships || []) {
        const childId = rel.child_id;
        
        // Get profile separately (using available columns)
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', childId)
          .single();
        
        // Get student analytics
        const { data: analytics } = await supabase
          .from('learning_analytics')
          .select('*')
          .eq('user_id', childId);

        // Get quiz attempts
        const { data: quizAttempts } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('user_id', childId);

        // Get achievements
        const { data: achievements } = await supabase
          .from('user_achievements')
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

        studentData.push({
          id: childId,
          name: profile ? `Student ${childId.slice(0, 8)}` : 'Student',
          email: '', // We don't store child emails
          totalStudyTime: analytics?.reduce((sum, item) => sum + (item.total_attempts * 2), 0) || 0, // Estimated minutes
          averageScore,
          completedQuizzes: totalQuizzes,
          achievements: achievements?.length || 0,
          currentSubjects: Object.keys(subjectPerformance),
          weakAreas,
          strongAreas,
          lastActivity: recentActivity?.[0]?.created_at || 'No recent activity'
        });
      }

      setStudents(studentData);
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading student progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Parent Dashboard</h1>
          <p className="text-white/70">Monitor your children's learning progress and achievements</p>
        </div>

        {students.length === 0 ? (
          <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                No Students Connected
              </CardTitle>
              <CardDescription className="text-white/70">
                You don't have any students linked to your account yet. Contact support to connect your children's accounts.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-8">
            {students.map((student) => (
              <Card key={student.id} className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">{student.name}</CardTitle>
                  <CardDescription className="text-white/70">
                    Last activity: {new Date(student.lastActivity).toLocaleDateString() || 'No recent activity'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{student.averageScore}%</div>
                      <div className="text-sm text-white/70">Average Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{student.completedQuizzes}</div>
                      <div className="text-sm text-white/70">Quizzes Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">{student.achievements}</div>
                      <div className="text-sm text-white/70">Achievements</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-400">{student.totalStudyTime}</div>
                      <div className="text-sm text-white/70">Study Minutes</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-400" />
                        Strong Areas
                      </h4>
                      {student.strongAreas.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {student.strongAreas.map((area) => (
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
                        <Target className="h-4 w-4 text-orange-400" />
                        Areas for Improvement
                      </h4>
                      {student.weakAreas.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {student.weakAreas.map((area) => (
                            <Badge key={area} variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-white/50 text-sm">No weak areas identified</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/10">
                    <h4 className="text-white font-semibold mb-3">Current Subjects</h4>
                    {student.currentSubjects.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {student.currentSubjects.map((subject) => (
                          <Badge key={subject} variant="outline" className="border-blue-500/30 text-blue-400">
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white/50 text-sm">No subjects being studied yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};