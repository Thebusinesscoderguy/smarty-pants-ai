
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Clock, BookOpen } from 'lucide-react';
import { useQuests } from '@/hooks/useQuests';
import { useGamification } from '@/hooks/useGamification';
import { useAuth } from '@/contexts/AuthContext';

export const ProgressDisplay = () => {
  const { user } = useAuth();
  const { dailyQuests, subjectAssignments, isLoading } = useQuests();
  const { userAchievements } = useGamification();

  if (!user) {
    return (
      <Card className="bg-white/10 border-white/20">
        <CardContent className="p-6 text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-300">Sign in to see your learning progress</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <div className="animate-pulse text-white">Loading progress...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Subject Progress */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BookOpen className="h-5 w-5 text-blue-500" />
            Subject Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subjectAssignments.length > 0 ? (
            <div className="space-y-4">
              {subjectAssignments.map((subject) => (
                <div key={subject.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-white">
                      {subject.subjects?.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-300">
                        {subject.completion_percentage}%
                      </span>
                    </div>
                  </div>
                  <Progress value={subject.completion_percentage} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{subject.lessons_completed}/{subject.total_lessons} topics mastered</span>
                    <span>Assigned by {subject.assigned_by}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No subjects assigned yet. Start learning to see your progress!</p>
          )}
        </CardContent>
      </Card>

      {/* Daily Quests */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
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
                    <span className="font-medium text-white">{quest.title}</span>
                    {quest.completed && (
                      <Badge variant="default" className="bg-green-500">
                        ✓ Completed
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-300">{quest.description}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-gray-300">{quest.current_value || 0}/{quest.target_value}</span>
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
            <p className="text-gray-400">No active quests today. Complete lessons to unlock new challenges!</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      {userAchievements.length > 0 && (
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Trophy className="h-5 w-5 text-purple-500" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {userAchievements.slice(0, 4).map((achievement) => (
                <div 
                  key={achievement.id}
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50/10 to-blue-50/10 rounded-lg border border-white/10"
                >
                  <div className="text-2xl">{achievement.icon || '🏆'}</div>
                  <div>
                    <div className="font-medium text-white">{achievement.name}</div>
                    <div className="text-xs text-gray-400">{achievement.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
