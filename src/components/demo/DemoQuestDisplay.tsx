
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, Trophy, Clock, CheckCircle, Calendar, Gift } from 'lucide-react';
import { getDemoQuestData, getDemoChildName } from '@/utils/demoData';

export const DemoQuestDisplay = () => {
  const questData = getDemoQuestData();
  const childName = getDemoChildName();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'basic': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'daily': return <Clock className="h-4 w-4" />;
      case 'weekly': return <Calendar className="h-4 w-4" />;
      case 'assignment': return <Target className="h-4 w-4" />;
      case 'project': return <Trophy className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days <= 0) return 'Expired';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">{childName}'s Learning Quests</h2>
        <p className="text-gray-400">Track quest progress and see completed achievements</p>
      </div>

      {/* Active Quests */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-400" />
          Active Quests ({questData.active.length})
        </h3>
        
        <div className="grid gap-4">
          {questData.active.map((quest) => (
            <Card key={quest.id} className="bg-white/10 border-white/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-white text-lg">{quest.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {getTypeIcon(quest.type)}
                        <span className="ml-1 capitalize">{quest.type}</span>
                      </Badge>
                      <div className={`w-3 h-3 rounded-full ${getDifficultyColor(quest.difficulty)}`} />
                      <span className="text-xs text-gray-400 capitalize">{quest.difficulty}</span>
                    </div>
                    <p className="text-sm text-gray-300 mb-3">{quest.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      {quest.subjects && (
                        <Badge variant="secondary" className="text-xs">
                          {quest.subjects.name}
                        </Badge>
                      )}
                      <div className="flex items-center gap-1 text-gray-400">
                        <Clock className="h-3 w-3" />
                        {formatTimeRemaining(quest.expires_at)}
                      </div>
                      <div className="flex items-center gap-1 text-purple-400">
                        <Gift className="h-3 w-3" />
                        {quest.reward}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white">
                      {quest.current_value}/{quest.target_value} ({quest.progress}%)
                    </span>
                  </div>
                  <Progress 
                    value={quest.progress} 
                    className="h-3"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Completed Quests */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-400" />
          Recently Completed ({questData.completed.length})
        </h3>
        
        <div className="grid gap-4">
          {questData.completed.map((quest) => (
            <Card key={quest.id} className="bg-white/10 border-white/20 opacity-90">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-400" />
                    <div>
                      <h4 className="font-medium text-white">{quest.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-gray-400">{quest.description}</p>
                        {quest.subjects && (
                          <Badge variant="secondary" className="text-xs">
                            {quest.subjects.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="default" className="bg-green-500/20 text-green-300 mb-1">
                      Completed
                    </Badge>
                    <p className="text-xs text-gray-400">
                      {new Date(quest.completed_at).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-purple-400 mt-1">
                      <Trophy className="h-3 w-3" />
                      {quest.reward}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quest Statistics */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Quest Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{questData.active.length}</div>
              <div className="text-sm text-gray-400">Active Quests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{questData.completed.length}</div>
              <div className="text-sm text-gray-400">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {Math.round(questData.active.reduce((sum, q) => sum + q.progress, 0) / questData.active.length)}%
              </div>
              <div className="text-sm text-gray-400">Avg Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {questData.active.filter(q => q.progress >= 75).length}
              </div>
              <div className="text-sm text-gray-400">Near Complete</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
