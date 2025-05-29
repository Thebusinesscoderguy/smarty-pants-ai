
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGamification } from '@/hooks/useGamification';

export const AchievementsList = () => {
  const { achievements, userAchievements, isLoading } = useGamification();

  if (isLoading) {
    return <div className="animate-pulse">Loading achievements...</div>;
  }

  const isEarned = (achievementId: string) => {
    return userAchievements.some(ua => ua.id === achievementId);
  };

  const getEarnedDate = (achievementId: string) => {
    const earned = userAchievements.find(ua => ua.id === achievementId);
    return earned?.earned_at ? new Date(earned.earned_at).toLocaleDateString() : null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Achievements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => {
            const earned = isEarned(achievement.id);
            const earnedDate = getEarnedDate(achievement.id);
            
            return (
              <div
                key={achievement.id}
                className={`p-4 border rounded-lg transition-all ${
                  earned 
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' 
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="text-2xl">{achievement.icon}</div>
                  {earned && (
                    <Badge variant="default" className="bg-yellow-500">
                      Earned
                    </Badge>
                  )}
                </div>
                
                <h3 className="font-semibold mb-1">{achievement.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                
                <div className="flex items-center justify-between text-xs">
                  <Badge variant="outline" className="capitalize">
                    {achievement.type}
                  </Badge>
                  {earnedDate && (
                    <span className="text-green-600 font-medium">
                      {earnedDate}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
