
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Users, Clock, BookOpen, Star, Trophy } from 'lucide-react';
import { getDemoOverallStats, getDemoSubjectData, getDemoAchievementData, getDemoAnalyticsData } from '@/utils/demoData';

interface DemoMonitoringPanelProps {
  role: string;
}

export const DemoMonitoringPanel: React.FC<DemoMonitoringPanelProps> = ({ role }) => {
  const overallStats = getDemoOverallStats();
  const subjects = getDemoSubjectData();
  const achievements = getDemoAchievementData();
  const analytics = getDemoAnalyticsData();

  const title = role === 'parent' ? 'Emma\'s Progress' : 'Student Overview';

  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-slate-400">Real-time monitoring dashboard</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Overall Progress Card */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Overall Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-300">Completion</span>
                  <span className="text-white font-medium">{overallStats.completionPercentage}%</span>
                </div>
                <Progress value={overallStats.completionPercentage} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Study Time</p>
                  <p className="text-white font-medium">{Math.round(overallStats.totalTimeSpent / 60)}h</p>
                </div>
                <div>
                  <p className="text-slate-400">Lessons</p>
                  <p className="text-white font-medium">{overallStats.lessonsCompleted}/{overallStats.totalLessons}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm">Current Streak:</span>
                <Badge variant="secondary" className="bg-orange-500/20 text-orange-300">
                  {overallStats.currentStreak} days
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <div>
                    <p className="text-xs text-slate-400">Avg Session</p>
                    <p className="text-sm font-medium text-white">{overallStats.averageSessionTime}m</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                  <div>
                    <p className="text-xs text-slate-400">Achievements</p>
                    <p className="text-sm font-medium text-white">{achievements.earned.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          {subjects.map((subject, index) => (
            <Card key={index} className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-white">{subject.name}</h4>
                      <p className="text-xs text-slate-400">{subject.description}</p>
                    </div>
                    <Badge 
                      variant={subject.completion_percentage >= 80 ? "default" : 
                               subject.completion_percentage >= 60 ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      {subject.current_grade}
                    </Badge>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Progress</span>
                      <span className="text-white">{subject.completion_percentage}%</span>
                    </div>
                    <Progress value={subject.completion_percentage} className="h-1.5" />
                  </div>
                  
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">
                      {subject.lessons_completed}/{subject.total_lessons} lessons
                    </span>
                    <span className="text-slate-400">
                      {Math.round(subject.time_spent / 60)}h spent
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div>
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <Star className="h-4 w-4" />
              Recent Achievements
            </h4>
            <div className="space-y-2">
              {achievements.earned.slice(0, 5).map((achievement, index) => (
                <Card key={index} className="bg-white/5 border-white/10">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-white">{achievement.name}</h5>
                        <p className="text-xs text-slate-400">{achievement.description}</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          achievement.rarity === 'rare' ? 'border-purple-400 text-purple-300' :
                          achievement.rarity === 'uncommon' ? 'border-blue-400 text-blue-300' :
                          'border-gray-400 text-gray-300'
                        }`}
                      >
                        {achievement.rarity}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-3">Progress Towards Next</h4>
            <div className="space-y-2">
              {achievements.available.slice(0, 3).map((achievement, index) => (
                <Card key={index} className="bg-white/5 border-white/10">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl opacity-50">{achievement.icon}</div>
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-white">{achievement.name}</h5>
                        <p className="text-xs text-slate-400 mb-2">{achievement.description}</p>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">Progress</span>
                          <span className="text-white">{achievement.progress}/{achievement.target}</span>
                        </div>
                        <Progress value={(achievement.progress / achievement.target) * 100} className="h-1.5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
