import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { isMockDataEnabled, mockSubjects } from '@/utils/mockData';

export const SubjectProgress = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (isMockDataEnabled()) {
      setIsLoading(true);
      setSubjects(mockSubjects);
      setIsLoading(false);
      return;
    }

    if (user) {
      fetchSubjects();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchSubjects = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Fetch user's subject assignments
      const { data: subjectData, error: subjectError } = await supabase
        .from('subject_assignments')
        .select(`
          *,
          subjects (
            name,
            description
          )
        `)
        .eq('user_id', user?.id)
        .eq('is_active', true);

      if (subjectError) throw subjectError;

      // Fetch learning analytics for each subject
      const subjectsWithProgress = await Promise.all(
        (subjectData || []).map(async (assignment) => {
          // Get learning analytics for this subject
          const { data: analyticsData } = await supabase
            .from('learning_analytics')
            .select('*')
            .eq('user_id', user?.id)
            .eq('subject_id', assignment.subject_id);

          // Calculate completion based on topics mastered (strength_score >= 0.7)
          const masteredTopics = analyticsData?.filter(a => a.strength_score >= 0.7).length || 0;
          const totalTopics = analyticsData?.length || 1;
          const completionPercentage = Math.round((masteredTopics / totalTopics) * 100);

          // Calculate total time spent in this subject
          const totalTimeSpent = analyticsData?.reduce((sum, a) => sum + (a.time_spent || 0), 0) || 0;

          // Get last activity
          const lastActivity = analyticsData
            ?.filter(a => a.last_updated)
            .sort((a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime())[0]?.last_updated || '';

          // Identify strengths and weak areas
          const strengths = analyticsData
            ?.filter(a => a.strength_score >= 0.8)
            .map(a => a.topic_name) || [];

          const needsWork = analyticsData
            ?.filter(a => a.strength_score < 0.6)
            .map(a => a.topic_name) || [];

          // Get recent topics
          const recentTopics = analyticsData
            ?.sort((a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime())
            .slice(0, 3)
            .map(a => a.topic_name) || [];

          return {
            id: assignment.id,
            name: assignment.subjects?.name || 'Unknown Subject',
            description: assignment.subjects?.description || '',
            completion_percentage: completionPercentage,
            lessons_completed: masteredTopics,
            total_lessons: totalTopics,
            time_spent: totalTimeSpent,
            current_grade: 'A', // Mock grade
            assigned_by: assignment.assigned_by,
            last_activity: lastActivity,
            strengths: strengths,
            needs_work: needsWork,
            recent_topics: recentTopics
          };
        })
      );

      setSubjects(subjectsWithProgress);
    } catch (error: any) {
      console.error('Error fetching subjects:', error);
      toast({
        title: "Error",
        description: "Failed to load subjects",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-400 bg-green-400/20';
    if (grade.startsWith('B')) return 'text-blue-400 bg-blue-400/20';
    if (grade.startsWith('C')) return 'text-yellow-400 bg-yellow-400/20';
    return 'text-gray-400 bg-gray-400/20';
  };

  const getAssignedByColor = (assignedBy: string) => {
    switch (assignedBy) {
      case 'school': return 'bg-blue-500/20 text-blue-300';
      case 'parent': return 'bg-purple-500/20 text-purple-300';
      case 'self': return 'bg-green-500/20 text-green-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading subjects...</div>;
  }

  return (
    <div className="space-y-6">
      {subjects.length === 0 ? (
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-6 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300">No subjects assigned yet.</p>
            <p className="text-gray-400 text-sm mt-2">
              Start learning to see your progress!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {subjects.map((subject) => (
            <Card key={subject.id} className="bg-white/10 border-white/20">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg">{subject.name}</CardTitle>
                    <p className="text-sm text-gray-400 mt-1">{subject.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={`text-xs ${getGradeColor(subject.current_grade)}`}>
                      {subject.current_grade}
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${getAssignedByColor(subject.assigned_by)}`}>
                      {subject.assigned_by}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white">
                      {subject.lessons_completed}/{subject.total_lessons} lessons ({subject.completion_percentage}%)
                    </span>
                  </div>
                  <Progress value={subject.completion_percentage} className="h-3" />
                </div>

                {/* Time Spent */}
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-400">Time spent:</span>
                  <span className="text-white">{subject.time_spent} minutes</span>
                </div>

                {/* Last Activity */}
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-400">Last activity:</span>
                  <span className="text-white">
                    {new Date(subject.last_activity).toLocaleDateString()}
                  </span>
                </div>

                {/* Strengths */}
                {subject.strengths && subject.strengths.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-green-400 mb-2">Strengths</h4>
                    <div className="flex flex-wrap gap-1">
                      {subject.strengths.map((strength, index) => (
                        <Badge key={index} variant="outline" className="text-xs text-green-300 border-green-500/30">
                          {strength}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Areas for Improvement */}
                {subject.needs_work && subject.needs_work.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-orange-400 mb-2">Areas for Improvement</h4>
                    <div className="flex flex-wrap gap-1">
                      {subject.needs_work.map((area, index) => (
                        <Badge key={index} variant="outline" className="text-xs text-orange-300 border-orange-500/30">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Topics */}
                {subject.recent_topics && subject.recent_topics.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-blue-400 mb-2">Recent Topics</h4>
                    <div className="space-y-1">
                      {subject.recent_topics.map((topic, index) => (
                        <div key={index} className="text-xs text-gray-300 bg-black/20 px-2 py-1 rounded">
                          {topic}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
