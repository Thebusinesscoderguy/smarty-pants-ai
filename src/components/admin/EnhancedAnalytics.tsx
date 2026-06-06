
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, TrendingUp, Target, BookOpen, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface StudentAnalytics {
  student_id: string;
  student_name: string;
  total_minutes: number;
  subjects: {
    [key: string]: {
      name: string;
      minutes: number;
      strengths: string[];
      weaknesses: string[];
      completion_rate: number;
    };
  };
  quest_progress: {
    completed: number;
    total: number;
  };
  achievements: {
    earned: number;
    total: number;
  };
}

export const EnhancedAnalytics = () => {
  const [analytics, setAnalytics] = useState<StudentAnalytics[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('30');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Get school students
      const { data: schoolData, error: schoolError } = await supabase
        .from('school_accounts')
        .select('id')
        .eq('admin_user_id', user.id)
        .single();

      if (schoolError) throw schoolError;

      const { data: studentRelations, error: studentsError } = await supabase
        .from('school_student_relationships')
        .select('student_id')
        .eq('school_id', schoolData.id)
        .eq('is_active', true);

      if (studentsError) throw studentsError;

      const studentIds = studentRelations.map(r => r.student_id);
      
      if (studentIds.length === 0) {
        setAnalytics([]);
        setIsLoading(false);
        return;
      }

      // Fetch analytics for each student
      const analyticsData: StudentAnalytics[] = [];
      
      for (const studentId of studentIds) {
        // Get student profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', studentId)
          .single();

        // Get activity logs
        const { data: activities } = await supabase
          .from('student_activity_logs')
          .select(`
            *,
            subjects (name)
          `)
          .eq('student_id', studentId)
          .gte('created_at', new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString());

        // Get quest progress
        const { data: questProgress } = await supabase
          .from('user_quest_progress')
          .select('completed')
          .eq('user_id', studentId)
          .eq('school_id', schoolData.id);

        // Get achievements - removed (achievements system disabled)
        const achievements: any[] = [];

        // Get learning analytics
        const { data: learningData } = await supabase
          .from('learning_analytics')
          .select(`
            *,
            subjects (name)
          `)
          .eq('user_id', studentId);

        // Process data
        const totalMinutes = activities?.reduce((sum, a) => sum + (a.duration_minutes || 0), 0) || 0;
        
        const subjects: any = {};
        activities?.forEach(activity => {
          const subjectName = activity.subjects?.name || 'Unknown';
          if (!subjects[subjectName]) {
            subjects[subjectName] = {
              name: subjectName,
              minutes: 0,
              strengths: [],
              weaknesses: [],
              completion_rate: 0
            };
          }
          subjects[subjectName].minutes += activity.duration_minutes || 0;
        });

        // Add learning analytics data
        learningData?.forEach(data => {
          const subjectName = data.subjects?.name || 'Unknown';
          if (subjects[subjectName]) {
            if (data.strength_score && data.strength_score > 0.7) {
              subjects[subjectName].strengths.push(data.topic_name);
            } else if (data.strength_score && data.strength_score < 0.4) {
              subjects[subjectName].weaknesses.push(data.topic_name);
            }
            subjects[subjectName].completion_rate = data.correct_attempts / (data.total_attempts || 1) * 100;
          }
        });

        analyticsData.push({
          student_id: studentId,
          student_name: profile?.display_name || 'Unknown Student',
          total_minutes: totalMinutes,
          subjects,
          quest_progress: {
            completed: questProgress?.filter(q => q.completed).length || 0,
            total: questProgress?.length || 0
          },
          achievements: {
            earned: 0, // Achievements system removed
            total: 0
          }
        });
      }

      setAnalytics(analyticsData);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast({
        title: t('common.error'),
        description: t('adminAnalytics.loadingAnalytics'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAnalytics = selectedStudent === 'all' 
    ? analytics 
    : analytics.filter(a => a.student_id === selectedStudent);

  if (isLoading) {
    return <div className="animate-pulse">{t('adminAnalytics.loadingAnalytics')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t('adminAnalytics.title')}</h2>
          <p className="text-muted-foreground">{t('adminAnalytics.subtitle')}</p>
        </div>
        
        <div className="flex gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="bg-card border-border text-foreground w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{t('adminAnalytics.last7Days')}</SelectItem>
              <SelectItem value="30">{t('adminAnalytics.last30Days')}</SelectItem>
              <SelectItem value="90">{t('adminAnalytics.last90Days')}</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger className="bg-card border-border text-foreground w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('adminAnalytics.allStudents')}</SelectItem>
              {analytics.map((student) => (
                <SelectItem key={student.student_id} value={student.student_id}>
                  {student.student_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">{t('adminAnalytics.totalStudents')}</p>
                <p className="text-2xl font-bold text-foreground">{analytics.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">{t('adminAnalytics.totalMinutes')}</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredAnalytics.reduce((sum, a) => sum + a.total_minutes, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t('adminAnalytics.questsCompleted')}</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredAnalytics.reduce((sum, a) => sum + a.quest_progress.completed, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-violet-600" />
              <div>
                <p className="text-sm text-muted-foreground">{t('adminAnalytics.achievements')}</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredAnalytics.reduce((sum, a) => sum + a.achievements.earned, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Student Analytics */}
      <div className="grid gap-6">
        {filteredAnalytics.map((student) => (
          <Card key={student.student_id} className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <User className="h-5 w-5" />
                {student.student_name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Time Breakdown */}
                <div>
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Study Time: {student.total_minutes} minutes
                  </h4>
                  <div className="space-y-2">
                    {Object.values(student.subjects).map((subject: any, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-foreground">{subject.name}</span>
                        <Badge variant="outline">{subject.minutes} min</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strengths & Weaknesses */}
                <div>
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Performance Analysis
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-green-600 mb-1">Strengths</p>
                      <div className="flex flex-wrap gap-1">
                        {Object.values(student.subjects).flatMap((subject: any) => 
                          subject.strengths.map((strength: string, idx: number) => (
                            <Badge key={idx} variant="default" className="text-xs bg-green-100 text-green-700">
                              {strength}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-red-600 mb-1">Areas for Improvement</p>
                      <div className="flex flex-wrap gap-1">
                        {Object.values(student.subjects).flatMap((subject: any) => 
                          subject.weaknesses.map((weakness: string, idx: number) => (
                            <Badge key={idx} variant="default" className="text-xs bg-red-100 text-red-700">
                              {weakness}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Indicators */}
                <div>
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Progress Indicators
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground">Quests</span>
                      <Badge variant="outline">
                        {student.quest_progress.completed}/{student.quest_progress.total}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground">Achievements</span>
                      <Badge variant="outline">
                        {student.achievements.earned}/{student.achievements.total}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Overall completion rate: {
                        Object.values(student.subjects).length > 0 
                          ? Math.round(Object.values(student.subjects).reduce((avg: number, subject: any) => avg + subject.completion_rate, 0) / Object.values(student.subjects).length)
                          : 0
                      }%
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
