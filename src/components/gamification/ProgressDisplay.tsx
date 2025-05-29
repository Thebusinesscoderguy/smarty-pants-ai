
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Clock, BookOpen } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';

export const ProgressDisplay = () => {
  const { userProgress, userLevel, challenges, userAchievements, isLoading } = useGamification();

  if (isLoading) {
    return <div className="animate-pulse">Loading progress...</div>;
  }

  const nextLevelProgress = ((userLevel - 1) % 5) * 20;

  return (
    <div className="space-y-6">
      {/* Level Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Level {userLevel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to Level {userLevel + 1}</span>
              <span>{nextLevelProgress}%</span>
            </div>
            <Progress value={nextLevelProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Subject Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            Subject Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userProgress.map((subject, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{subject.subject}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Level {subject.level}</Badge>
                    <span className="text-sm text-gray-600">
                      {subject.completion_percentage}%
                    </span>
                  </div>
                </div>
                <Progress value={subject.completion_percentage} className="h-2" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{subject.completed_lessons}/{subject.total_lessons} lessons</span>
                  <span>{subject.time_spent} min</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Challenges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-500" />
            Today's Challenges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {challenges.map((challenge) => (
              <div key={challenge.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{challenge.title}</span>
                  {challenge.completed && (
                    <Badge variant="default" className="bg-green-500">
                      ✓ Completed
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">{challenge.description}</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Progress</span>
                    <span>{challenge.current_value || 0}/{challenge.target_value}</span>
                  </div>
                  <Progress 
                    value={((challenge.current_value || 0) / challenge.target_value) * 100} 
                    className="h-2" 
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      {userAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-purple-500" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {userAchievements.slice(0, 4).map((achievement) => (
                <div 
                  key={achievement.id}
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border"
                >
                  <div className="text-2xl">{achievement.icon}</div>
                  <div>
                    <div className="font-medium">{achievement.name}</div>
                    <div className="text-xs text-gray-600">{achievement.description}</div>
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
