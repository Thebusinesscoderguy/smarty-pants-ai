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
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': 
      case 'basic': return 'bg-green-100 text-green-800';
      case 'medium': 
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-border"></div>
        <span className="ml-2">Loading progress data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Progress */}
        <Card className="bg-card border-border backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Recent Tests & Quizzes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tests.length > 0 ? (
                tests.slice(0, 5).map((test) => (
                  <div key={test.id} className="p-4 bg-muted rounded-lg border border-border">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{test.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getDifficultyColor(test.difficulty)}>
                            {test.difficulty}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(test.completedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-bold ${getScoreColor(test.score)}`}>
                          {test.score}%
                        </div>
                        <div className="text-xs text-muted-foreground">{test.type}</div>
                      </div>
                    </div>
                    <Progress value={test.score} className="h-2 mt-3" />
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No tests completed yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Take some quizzes or tests to see your progress
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Study Plan Progress */}
        <Card className="bg-card border-border backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Study Plan Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {studyPlans.length > 0 ? (
                studyPlans.map((plan) => (
                  <div key={plan.id} className="p-4 bg-muted rounded-lg border border-border">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">{plan.title}</h4>
                      <Badge variant="outline" className="text-primary border-primary">
                        {plan.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mb-3">{plan.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {Math.round((plan.estimated_duration / 100) * 60)}%
                        </span>
                      </div>
                      <Progress value={Math.round((plan.estimated_duration / 100) * 60)} className="h-2" />
                      
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Grade Level: {plan.grade_level || 'General'}</span>
                        <span>{plan.estimated_duration} mins estimated</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No active study plans</p>
                  <p className="text-sm text-muted-foreground mt-1">
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
        <Card className="bg-card border-border backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">
                  {Math.round(tests.reduce((sum, test) => sum + test.score, 0) / tests.length)}%
                </div>
                <div className="text-muted-foreground">Average Score</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">
                  {tests.length}
                </div>
                <div className="text-muted-foreground">Tests Completed</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">
                  {tests.filter(test => test.score >= 80).length}
                </div>
                <div className="text-muted-foreground">High Scores (80%+)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Tests List */}
      {tests.length > 0 && (
        <Card className="bg-card border-border backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              All Test Results ({tests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {tests.map((test) => (
                <div key={test.id} className="p-3 bg-muted rounded-lg border border-border">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{test.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`${getDifficultyColor(test.difficulty)} text-xs`}>
                          {test.difficulty}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{test.type}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getScoreColor(test.score)}`}>
                        {test.score}%
                      </div>
                      <div className="text-xs text-muted-foreground">
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