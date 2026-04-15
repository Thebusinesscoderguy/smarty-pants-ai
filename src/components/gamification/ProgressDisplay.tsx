import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, BookOpen } from 'lucide-react';
import { useQuests } from '@/hooks/useQuests';
import { useAuth } from '@/contexts/AuthContext';

export const ProgressDisplay = () => {
  const { user } = useAuth();
  const { dailyQuests, subjectAssignments, isLoading } = useQuests();

  if (!user) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-6 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Sign in to see your learning progress</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <div className="animate-pulse text-muted-foreground">Loading progress...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Subject Progress */}
      <Card className="rounded-2xl hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <BookOpen className="h-5 w-5 text-primary" />
            Subject Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subjectAssignments.length > 0 ? (
            <div className="space-y-4">
              {subjectAssignments.map((subject) => (
                <div key={subject.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-foreground">
                      {subject.subjects?.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {subject.completion_percentage}%
                      </span>
                    </div>
                  </div>
                  <Progress value={subject.completion_percentage} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{subject.lessons_completed}/{subject.total_lessons} topics mastered</span>
                    <span>Assigned by {subject.assigned_by}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No subjects assigned yet. Start learning to see your progress!</p>
          )}
        </CardContent>
      </Card>

      {/* Daily Quests */}
      <Card className="rounded-2xl hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Target className="h-5 w-5 text-green-500" />
            Today's Quests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dailyQuests.length > 0 ? (
            <div className="space-y-3">
              {dailyQuests.slice(0, 3).map((quest) => (
                <div key={quest.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-foreground">{quest.title}</span>
                    {quest.completed && (
                      <Badge variant="default" className="bg-green-500">
                        ✓ Completed
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{quest.description}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-muted-foreground">{quest.current_value || 0}/{quest.target_value}</span>
                    </div>
                    <Progress 
                      value={((quest.current_value || 0) / quest.target_value) * 100} 
                      className="h-2" 
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No active quests today. Complete lessons to unlock new challenges!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
