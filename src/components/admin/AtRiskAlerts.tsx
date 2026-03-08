import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingDown, Clock, RefreshCw, UserX, Activity, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface AtRiskStudent {
  student_id: string;
  student_name: string;
  risk_level: 'high' | 'medium' | 'low';
  reasons: string[];
  average_score: number;
  days_since_active: number;
  total_assessments: number;
  recent_trend: 'declining' | 'stable' | 'improving';
}

export const AtRiskAlerts = () => {
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    analyzeStudents();
  }, [user]);

  const analyzeStudents = async () => {
    if (!user) return;
    try {
      setIsLoading(true);

      const { data: school } = await supabase
        .from('school_accounts')
        .select('id')
        .eq('admin_user_id', user.id)
        .single();

      if (!school) { setAtRiskStudents([]); return; }

      const { data: relationships } = await supabase
        .from('school_student_relationships')
        .select('student_id')
        .eq('school_id', school.id)
        .eq('is_active', true);

      if (!relationships?.length) { setAtRiskStudents([]); return; }

      const studentIds = relationships.map(r => r.student_id);

      // Fetch all data in parallel
      const [profilesRes, quizRes, testRes, activityRes] = await Promise.all([
        supabase.from('profiles').select('id, display_name').in('id', studentIds),
        supabase.from('quiz_attempts').select('user_id, score, total_possible, completed_at').in('user_id', studentIds).order('completed_at', { ascending: false }),
        supabase.from('test_attempts').select('student_id, percentage, completed_at').in('student_id', studentIds).order('completed_at', { ascending: false }),
        supabase.from('student_activity_logs').select('student_id, created_at').in('student_id', studentIds).order('created_at', { ascending: false }),
      ]);

      const profiles = profilesRes.data || [];
      const quizAttempts = quizRes.data || [];
      const testAttempts = testRes.data || [];
      const activityLogs = activityRes.data || [];

      const now = new Date();
      const results: AtRiskStudent[] = [];

      for (const profile of profiles) {
        const reasons: string[] = [];
        const sid = profile.id;

        // Calculate average score
        const scores: number[] = [];
        const studentQuizzes = quizAttempts.filter(q => q.user_id === sid);
        const studentTests = testAttempts.filter(t => t.student_id === sid);

        for (const q of studentQuizzes) {
          if (q.total_possible > 0) scores.push((q.score / q.total_possible) * 100);
        }
        for (const t of studentTests) {
          if (t.percentage) scores.push(t.percentage);
        }

        const avgScore = scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;

        // Check inactivity
        const lastActivity = activityLogs.find(a => a.student_id === sid);
        const lastQuiz = studentQuizzes[0]?.completed_at;
        const lastTest = studentTests[0]?.completed_at;

        const lastDates = [lastActivity?.created_at, lastQuiz, lastTest].filter(Boolean).map(d => new Date(d!));
        const mostRecent = lastDates.length > 0 ? Math.max(...lastDates.map(d => d.getTime())) : 0;
        const daysSinceActive = mostRecent > 0
          ? Math.floor((now.getTime() - mostRecent) / (1000 * 60 * 60 * 24))
          : 999;

        // Detect trend from recent scores
        let trend: 'declining' | 'stable' | 'improving' = 'stable';
        if (scores.length >= 3) {
          const recent = scores.slice(0, 3);
          const older = scores.slice(3, 6);
          if (older.length > 0) {
            const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
            const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
            if (recentAvg < olderAvg - 10) trend = 'declining';
            else if (recentAvg > olderAvg + 10) trend = 'improving';
          }
        }

        // Determine risks
        if (avgScore < 50 && scores.length > 0) reasons.push('Very low average score (<50%)');
        else if (avgScore < 60 && scores.length > 0) reasons.push('Below passing average (<60%)');
        if (daysSinceActive > 14) reasons.push(`Inactive for ${daysSinceActive} days`);
        else if (daysSinceActive > 7) reasons.push(`Low activity (${daysSinceActive} days since last activity)`);
        if (trend === 'declining') reasons.push('Declining performance trend');
        if (scores.length === 0 && daysSinceActive > 3) reasons.push('No assessments completed');

        if (reasons.length === 0) continue;

        const riskLevel: 'high' | 'medium' | 'low' =
          reasons.length >= 3 || (avgScore < 50 && daysSinceActive > 14) ? 'high'
          : reasons.length >= 2 || avgScore < 60 ? 'medium'
          : 'low';

        results.push({
          student_id: sid,
          student_name: profile.display_name || 'Unknown Student',
          risk_level: riskLevel,
          reasons,
          average_score: avgScore,
          days_since_active: daysSinceActive,
          total_assessments: scores.length,
          recent_trend: trend,
        });
      }

      results.sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.risk_level] - order[b.risk_level];
      });

      setAtRiskStudents(results);
    } catch (error) {
      console.error('Error analyzing students:', error);
      toast({ title: 'Error', description: 'Failed to analyze student data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    if (level === 'high') return 'bg-red-100 text-red-800 border-red-200';
    if (level === 'medium') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'declining') return <TrendingDown className="h-4 w-4 text-destructive" />;
    if (trend === 'improving') return <TrendingDown className="h-4 w-4 text-green-600 rotate-180" />;
    return <Activity className="h-4 w-4 text-muted-foreground" />;
  };

  if (isLoading) {
    return <div className="animate-pulse text-muted-foreground">Analyzing student data...</div>;
  }

  const highRisk = atRiskStudents.filter(s => s.risk_level === 'high');
  const mediumRisk = atRiskStudents.filter(s => s.risk_level === 'medium');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">At-Risk Student Alerts</h2>
          <p className="text-muted-foreground">Students flagged for declining performance or low engagement</p>
        </div>
        <Button variant="outline" onClick={analyzeStudents}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">High Risk</p>
              <p className="text-2xl font-bold text-foreground">{highRisk.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Medium Risk</p>
              <p className="text-2xl font-bold text-foreground">{mediumRisk.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <UserX className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Flagged</p>
              <p className="text-2xl font-bold text-foreground">{atRiskStudents.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Alerts */}
      {atRiskStudents.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <div className="p-3 rounded-full bg-green-100 w-fit mx-auto mb-4">
              <Trophy className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">All Students On Track</h3>
            <p className="text-muted-foreground">No students are currently flagged as at-risk. Great work!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {atRiskStudents.map(student => (
            <Card key={student.student_id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-foreground">{student.student_name}</h3>
                      <Badge className={getRiskColor(student.risk_level)}>
                        {student.risk_level.toUpperCase()} RISK
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        {getTrendIcon(student.recent_trend)}
                        <span className="capitalize">{student.recent_trend}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {student.reasons.map((reason, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {reason}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Avg: <strong className="text-foreground">{student.average_score}%</strong></span>
                      <span>Assessments: <strong className="text-foreground">{student.total_assessments}</strong></span>
                      <span>Last active: <strong className="text-foreground">
                        {student.days_since_active >= 999 ? 'Never' : `${student.days_since_active}d ago`}
                      </strong></span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

