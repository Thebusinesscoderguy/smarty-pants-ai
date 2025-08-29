import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export const QuizPerformanceAnalytics = ({ studentProgress }: { studentProgress?: any[] }) => {
  const { user } = useAuth();
  const [tests, setTests] = useState<any[]>([]);
  const [studyPlans, setStudyPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Fetch quiz attempts and test attempts
        const [quizResponse, testResponse, studyPlansResponse] = await Promise.all([
          supabase
            .from('quiz_attempts')
            .select(`
              *,
              quizzes (id, title, subject_id, difficulty)
            `)
            .eq('user_id', user.id)
            .order('completed_at', { ascending: false }),
            
          supabase
            .from('test_attempts')
            .select(`
              *,
              tests (id, title, subject)
            `)
            .eq('student_id', user.id)
            .order('completed_at', { ascending: false }),
            
          supabase
            .from('study_plans')
            .select('*')
            .eq('user_id', user.id)
        ]);

        // Combine quiz and test data
        const allTests = [
          ...(quizResponse.data || []).map(attempt => ({
            id: attempt.id,
            title: attempt.quizzes?.title || 'Quiz',
            type: 'quiz',
            score: Math.round((attempt.score / attempt.total_possible) * 100),
            completedAt: attempt.completed_at,
            difficulty: attempt.quizzes?.difficulty || 'medium'
          })),
          ...(testResponse.data || []).map(attempt => ({
            id: attempt.id,
            title: attempt.tests?.title || 'Test',
            type: 'test',
            score: attempt.percentage || 0,
            completedAt: attempt.completed_at,
            difficulty: 'medium'
          }))
        ].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

        setTests(allTests);
        setStudyPlans(studyPlansResponse.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': 
      case 'basic': return 'bg-green-500/20 text-green-400';
      case 'medium': 
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-400';
      case 'hard': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/20"></div>
        <span className="ml-2 text-white">Loading progress data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Progress */}
        <Card className="bg-white/5 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <FileText className="h-5 w-5 text-blue-400" />
              Recent Tests & Quizzes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tests.length > 0 ? (
                tests.slice(0, 5).map((test) => (
                  <div key={test.id} className="p-4 bg-white/10 rounded-lg border border-white/10">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{test.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getDifficultyColor(test.difficulty)}>
                            {test.difficulty}
                          </Badge>
                          <span className="text-xs text-white/60">
                            {new Date(test.completedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-bold ${getScoreColor(test.score)}`}>
                          {test.score}%
                        </div>
                        <div className="text-xs text-white/60">{test.type}</div>
                      </div>
                    </div>
                    <Progress value={test.score} className="h-2 mt-3" />
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white/60">No tests completed yet</p>
                  <p className="text-sm text-white/40 mt-1">
                    Take some quizzes or tests to see your progress
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Study Plan Progress */}
        <Card className="bg-white/5 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Calendar className="h-5 w-5 text-purple-400" />
              Study Plan Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {studyPlans.length > 0 ? (
                studyPlans.map((plan) => (
                  <div key={plan.id} className="p-4 bg-white/10 rounded-lg border border-white/10">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-white">{plan.title}</h4>
                      <Badge variant="outline" className="text-purple-400 border-purple-400">
                        {plan.status}
                      </Badge>
                    </div>
                    <p className="text-white/60 text-sm mb-3">{plan.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/70">Progress</span>
                        <span className="text-white font-medium">
                          {Math.round((plan.estimated_duration / 100) * 60)}%
                        </span>
                      </div>
                      <Progress value={Math.round((plan.estimated_duration / 100) * 60)} className="h-2" />
                      
                      <div className="flex justify-between text-xs text-white/60">
                        <span>Grade Level: {plan.grade_level || 'General'}</span>
                        <span>{plan.estimated_duration} mins estimated</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white/60">No active study plans</p>
                  <p className="text-sm text-white/40 mt-1">
                    Create a study plan from the Quiz Generator
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      {tests.length > 0 && (
        <Card className="bg-white/5 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="h-5 w-5 text-green-400" />
              Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {Math.round(tests.reduce((sum, test) => sum + test.score, 0) / tests.length)}%
                </div>
                <div className="text-white/60">Average Score</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {tests.length}
                </div>
                <div className="text-white/60">Tests Completed</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {tests.filter(test => test.score >= 80).length}
                </div>
                <div className="text-white/60">High Scores (80%+)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Tests List */}
      {tests.length > 0 && (
        <Card className="bg-white/5 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Target className="h-5 w-5 text-blue-400" />
              All Test Results ({tests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {tests.map((test) => (
                <div key={test.id} className="p-3 bg-white/10 rounded-lg border border-white/10">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-white text-sm">{test.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`${getDifficultyColor(test.difficulty)} text-xs`}>
                          {test.difficulty}
                        </Badge>
                        <span className="text-xs text-white/60">{test.type}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getScoreColor(test.score)}`}>
                        {test.score}%
                      </div>
                      <div className="text-xs text-white/60">
                        {new Date(test.completedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Progress value={test.score} className="h-1" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};