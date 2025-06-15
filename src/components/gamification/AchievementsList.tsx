
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGamification } from '@/hooks/useGamification';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Star, Award, Target } from 'lucide-react';

export const AchievementsList = () => {
  const { user } = useAuth();
  const { achievements, userAchievements, isLoading } = useGamification();

  if (!user) {
    return (
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Achievements</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-300">Sign in to track your achievements</p>
          <p className="text-gray-400 text-sm mt-2">
            Unlock badges and rewards by completing lessons and challenges!
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <div className="animate-pulse text-white">Loading achievements...</div>;
  }

  const isEarned = (achievementId: string) => {
    return userAchievements.some(ua => ua.id === achievementId);
  };

  const getEarnedDate = (achievementId: string) => {
    const earned = userAchievements.find(ua => ua.id === achievementId);
    return earned?.earned_at ? new Date(earned.earned_at).toLocaleDateString() : null;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'milestone': return <Target className="h-4 w-4" />;
      case 'streak': return <Star className="h-4 w-4" />;
      case 'completion': return <Award className="h-4 w-4" />;
      case 'mastery': return <Trophy className="h-4 w-4" />;
      default: return <Trophy className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'milestone': return 'text-blue-400';
      case 'streak': return 'text-yellow-400';
      case 'completion': return 'text-green-400';
      case 'mastery': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const earnedAchievements = achievements.filter(a => isEarned(a.id));
  const availableAchievements = achievements.filter(a => !isEarned(a.id));

  return (
    <Card className="bg-white/10 border-white/20">
      <CardHeader>
        <CardTitle className="text-white">All Achievements</CardTitle>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Unlock achievements by completing quests and reaching milestones
          </p>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{earnedAchievements.length}</div>
            <div className="text-sm text-gray-400">Earned</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {achievements.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300">No achievements available yet</p>
            <p className="text-gray-400 text-sm mt-2">
              Start learning to unlock your first achievements!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Earned Achievements */}
            {earnedAchievements.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Earned ({earnedAchievements.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {earnedAchievements.map((achievement) => {
                    const earnedDate = getEarnedDate(achievement.id);
                    
                    return (
                      <div
                        key={achievement.id}
                        className="p-4 border rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="text-3xl">{achievement.icon || '🏆'}</div>
                          <Badge variant="default" className="bg-yellow-500/20 text-yellow-300">
                            Earned
                          </Badge>
                        </div>
                        
                        <h4 className="font-semibold mb-1 text-white">{achievement.name}</h4>
                        <p className="text-sm text-gray-300 mb-2">{achievement.description}</p>
                        
                        <div className="flex items-center justify-between text-xs">
                          <div className={`flex items-center gap-1 ${getTypeColor(achievement.type)}`}>
                            {getTypeIcon(achievement.type)}
                            <span className="capitalize">{achievement.type}</span>
                          </div>
                          {earnedDate && (
                            <span className="text-green-400 font-medium">
                              {earnedDate}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Available Achievements */}
            {availableAchievements.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Available ({availableAchievements.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableAchievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="p-4 border rounded-lg bg-white/5 border-white/20 opacity-75"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-3xl grayscale">{achievement.icon || '🏆'}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-300">{achievement.name}</h4>
                            <div className="text-gray-500">
                              {getTypeIcon(achievement.type)}
                            </div>
                          </div>
                          <p className="text-sm text-gray-400 mb-2">{achievement.description}</p>
                          <Badge variant="outline" className="text-xs">
                            {achievement.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
