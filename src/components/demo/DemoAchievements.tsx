
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Award, Target } from 'lucide-react';
import { getDemoAchievementData, getDemoChildName } from '@/utils/demoData';

export const DemoAchievements = () => {
  const achievementData = getDemoAchievementData();
  const childName = getDemoChildName();

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

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-500/30 bg-gray-500/10';
      case 'uncommon': return 'border-green-500/30 bg-green-500/10';
      case 'rare': return 'border-blue-500/30 bg-blue-500/10';
      case 'epic': return 'border-purple-500/30 bg-purple-500/10';
      case 'legendary': return 'border-yellow-500/30 bg-yellow-500/10';
      default: return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  const getRarityTextColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-300';
      case 'uncommon': return 'text-green-300';
      case 'rare': return 'text-blue-300';
      case 'epic': return 'text-purple-300';
      case 'legendary': return 'text-yellow-300';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">{childName}'s Achievements</h2>
          <p className="text-gray-400">
            Celebrate learning milestones and unlock new achievements
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-white">{achievementData.earned.length}</div>
          <div className="text-sm text-gray-400">Achievements Earned</div>
        </div>
      </div>

      {/* Achievement Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{achievementData.earned.length}</div>
            <div className="text-sm text-gray-400">Total Earned</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {achievementData.earned.filter(a => a.rarity === 'rare' || a.rarity === 'epic').length}
            </div>
            <div className="text-sm text-gray-400">Rare+</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{achievementData.available.length}</div>
            <div className="text-sm text-gray-400">Available</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4 text-center">
            <Award className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {Math.round((achievementData.earned.length / (achievementData.earned.length + achievementData.available.length)) * 100)}%
            </div>
            <div className="text-sm text-gray-400">Completion</div>
          </CardContent>
        </Card>
      </div>

      {/* Earned Achievements */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          Earned Achievements ({achievementData.earned.length})
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievementData.earned.map((achievement) => (
            <Card key={achievement.id} className={`bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30 ${getRarityColor(achievement.rarity)}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-4xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-white">{achievement.name}</h4>
                      <div className={getTypeColor(achievement.type)}>
                        {getTypeIcon(achievement.type)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 mb-3">{achievement.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={`text-xs ${getRarityTextColor(achievement.rarity)} border-current`}>
                        {achievement.rarity}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(achievement.earned_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Available Achievements */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-gray-400" />
          Next Goals ({achievementData.available.length})
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievementData.available.map((achievement) => (
            <Card key={achievement.id} className={`bg-white/10 border-white/20 ${getRarityColor(achievement.rarity)}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-4xl grayscale">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-300">{achievement.name}</h4>
                      <div className="text-gray-500">
                        {getTypeIcon(achievement.type)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{achievement.description}</p>
                    
                    {achievement.progress !== undefined && (
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Progress</span>
                          <span className="text-white">
                            {achievement.progress}/{achievement.target}
                          </span>
                        </div>
                        <Progress 
                          value={(achievement.progress / achievement.target) * 100} 
                          className="h-2"
                        />
                      </div>
                    )}
                    
                    <Badge variant="outline" className={`text-xs ${getRarityTextColor(achievement.rarity)} border-current`}>
                      {achievement.rarity}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Achievement Categories */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Achievement Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['milestone', 'streak', 'completion', 'mastery'].map((type) => {
              const earned = achievementData.earned.filter(a => a.type === type).length;
              const total = [...achievementData.earned, ...achievementData.available].filter(a => a.type === type).length;
              
              return (
                <div key={type} className="text-center p-4 bg-black/20 rounded-lg">
                  <div className={`mb-2 ${getTypeColor(type)}`}>
                    {getTypeIcon(type)}
                  </div>
                  <h4 className="font-medium text-white capitalize mb-1">{type}</h4>
                  <p className="text-2xl font-bold text-white">{earned}/{total}</p>
                  <p className="text-xs text-gray-400">
                    {total > 0 ? Math.round((earned / total) * 100) : 0}% Complete
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
