import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3, Users, TrendingUp, Clock, Activity, Target, Book, Award, Brain, Shield, Zap, Calendar, Trophy, AlertCircle, Wifi, Database, Heart, GraduationCap, Plus, MessageSquare, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserRole } from '@/hooks/useUserRole';
import { useUnifiedMonitoring } from '@/hooks/useUnifiedMonitoring';
import { ComprehensiveMonitoringDashboard } from '@/components/monitoring/ComprehensiveMonitoringDashboard';
import { useQuestManagement } from '@/hooks/useQuestManagement';
import { useAchievementManagement } from '@/hooks/useAchievementManagement';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { getDemoQuestCompletions, getDemoAchievementCompletions } from '@/utils/demoData';

const Monitoring = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState<'chat' | 'monitoring' | 'settings'>('monitoring');
  
  // Demo mode - no authentication restrictions for demonstration purposes
  const { studentProgress, overviewStats, loading: dataLoading } = useUnifiedMonitoring();
  const { quests, createQuest, deleteQuest } = useQuestManagement();
  const { achievements, createAchievement, deleteAchievement } = useAchievementManagement();

  // Get completion data for demo
  const questCompletions = getDemoQuestCompletions();
  const achievementCompletions = getDemoAchievementCompletions();

  // Dialog states
  const [showQuestDialog, setShowQuestDialog] = useState(false);
  const [showAchievementDialog, setShowAchievementDialog] = useState(false);

  // Form states

  const [questForm, setQuestForm] = useState({
    title: '',
    description: '',
    type: 'daily',
    difficulty: 'medium',
    target_value: 1,
    rewards: { points: 10 },
    requirements: {}
  });

  const [achievementForm, setAchievementForm] = useState({
    name: '',
    description: '',
    type: 'milestone' as 'milestone' | 'streak' | 'completion' | 'mastery' | 'challenge',
    points: 10,
    criteria: { requirement: '' }
  });


  const handleCreateQuest = async () => {
    if (!questForm.title) return;
    
    await createQuest(questForm);
    setShowQuestDialog(false);
    setQuestForm({ title: '', description: '', type: 'daily', difficulty: 'medium', target_value: 1, rewards: { points: 10 }, requirements: {} });
  };

  const handleCreateAchievement = async () => {
    if (!achievementForm.name) return;
    
    await createAchievement(achievementForm);
    setShowAchievementDialog(false);
    setAchievementForm({ name: '', description: '', type: 'milestone', points: 10, criteria: { requirement: '' } });
  };

  const renderNavigation = () => (
    <div className="flex items-center justify-center space-x-2 bg-white/5 rounded-2xl p-2 backdrop-blur-xl border border-white/10 mb-8">
      <Button
        variant={currentPage === 'monitoring' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setCurrentPage('monitoring')}
        className={`${currentPage === 'monitoring' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'text-white hover:bg-white/10'} transition-all duration-200 rounded-xl px-6 py-3`}
      >
        <BarChart3 className="h-4 w-4 mr-2" />
        Monitoring
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <Header />
      
      <main className="px-6 py-12 max-w-7xl mx-auto">
        {/* Navigation */}
        {renderNavigation()}
        
        <div className="mb-12">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center">
            <BarChart3 className="mr-6 h-16 w-16 text-blue-400" />
            Learning Analytics
          </h1>
          <p className="text-white/70 text-2xl">
            Monitor student progress and performance across all subjects
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">


          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30 backdrop-blur-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm font-medium">Study Time</p>
                  <p className="text-white text-3xl font-bold">{overviewStats.totalStudyTime}h</p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <Clock className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/30 backdrop-blur-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-200 text-sm font-medium">Avg Completion</p>
                  <p className="text-white text-3xl font-bold">{overviewStats.avgCompletion}%</p>
                </div>
                <div className="p-3 bg-orange-500/20 rounded-xl">
                  <Target className="h-6 w-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>


          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/30 backdrop-blur-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-200 text-sm font-medium">Quests</p>
                  <p className="text-white text-3xl font-bold">{overviewStats.totalQuests}</p>
                </div>
                <div className="p-3 bg-yellow-500/20 rounded-xl">
                  <Target className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border-cyan-500/30 backdrop-blur-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-200 text-sm font-medium">Achievements</p>
                  <p className="text-white text-3xl font-bold">{overviewStats.totalAchievements}</p>
                </div>
                <div className="p-3 bg-cyan-500/20 rounded-xl">
                  <Trophy className="h-6 w-6 text-cyan-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border-emerald-500/30 backdrop-blur-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-200 text-sm font-medium">Lessons Completed</p>
                  <p className="text-white text-3xl font-bold">{overviewStats.totalLessonsCompleted}</p>
                </div>
                <div className="p-3 bg-emerald-500/20 rounded-xl">
                  <Book className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-sm rounded-xl p-2 mb-8 border border-white/20">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-200 flex items-center font-semibold"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="quests" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-200 flex items-center font-semibold"
            >
              <Target className="h-4 w-4 mr-2" />
              Quests
            </TabsTrigger>
            <TabsTrigger 
              value="achievements" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-200 flex items-center font-semibold"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Achievements
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-200 flex items-center font-semibold"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Activity */}
              <Card className="bg-white/5 border-white/20 backdrop-blur-sm rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-2xl">
                    <Activity className="h-6 w-6 mr-3 text-blue-400" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {studentProgress.slice(0, 4).map((student) => (
                    <div key={student.student_id} className="p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-semibold">{student.student_name}</h4>
                        <span className="text-white/60 text-sm">{student.last_activity ? new Date(student.last_activity).toLocaleDateString() : 'No activity'}</span>
                      </div>
                      <p className="text-white/80 mb-2">Progress: {student.completion_percentage}%</p>
                      <div className="flex items-center space-x-3">
                        <Progress value={student.completion_percentage} className="flex-1 h-2" />
                        <span className="text-white/90 text-sm font-medium">{student.completion_percentage}%</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Subject Progress */}
              <Card className="bg-white/5 border-white/20 backdrop-blur-sm rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-2xl">
                    <TrendingUp className="h-6 w-6 mr-3 text-green-400" />
                    Subject Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-12">
                    <TrendingUp className="h-16 w-16 text-white/40 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Subject Analytics</h3>
                    <p className="text-white/60">Subject-specific performance data will appear here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>



          <TabsContent value="quests" className="space-y-8">
            <Card className="bg-white/5 border-white/20 backdrop-blur-sm rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white flex items-center text-2xl">
                  <Target className="h-6 w-6 mr-3 text-orange-400" />
                  Quest Management
                </CardTitle>
                <Dialog open={showQuestDialog} onOpenChange={setShowQuestDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-600 hover:bg-orange-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Quest
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-white/20">
                    <DialogHeader>
                      <DialogTitle className="text-white">Create New Quest</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-white">Title</Label>
                        <Input
                          value={questForm.title}
                          onChange={(e) => setQuestForm(prev => ({ ...prev, title: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="Quest title"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Description</Label>
                        <Textarea
                          value={questForm.description}
                          onChange={(e) => setQuestForm(prev => ({ ...prev, description: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="Quest description"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-white">Type</Label>
                          <Select value={questForm.type} onValueChange={(value) => setQuestForm(prev => ({ ...prev, type: value }))}>
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="milestone">Milestone</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-white">Difficulty</Label>
                          <Select value={questForm.difficulty} onValueChange={(value) => setQuestForm(prev => ({ ...prev, difficulty: value }))}>
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-white">Target Value</Label>
                        <Input
                          type="number"
                          value={questForm.target_value}
                          onChange={(e) => setQuestForm(prev => ({ ...prev, target_value: parseInt(e.target.value) || 1 }))}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      <Button onClick={handleCreateQuest} className="w-full bg-orange-600 hover:bg-orange-700">
                        Create Quest
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {quests.length === 0 ? (
                  <div className="text-center py-12">
                    <Target className="h-16 w-16 text-white/40 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Quests Yet</h3>
                    <p className="text-white/60">Create your first quest to gamify learning</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {quests.map((quest) => {
                      const completionData = questCompletions.find(q => q.quest_id === quest.id);
                      return (
                        <Card key={quest.id} className="bg-white/5 border-white/10">
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white">{quest.title}</h3>
                                <p className="text-white/60 text-sm">{quest.description}</p>
                                <div className="flex gap-2 mt-2">
                                  <Badge variant="outline">{quest.type}</Badge>
                                  <Badge variant="secondary">{quest.difficulty}</Badge>
                                  {quest.is_active && <Badge variant="default">Active</Badge>}
                                </div>
                              </div>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => deleteQuest(quest.id)}
                              >
                                Delete
                              </Button>
                            </div>
                            
                            {/* Student Completion Section */}
                            {completionData && (
                              <div className="mt-4 pt-4 border-t border-white/10">
                                <h4 className="text-white font-medium mb-3 flex items-center">
                                  <Users className="h-4 w-4 mr-2" />
                                  Student Progress ({completionData.completed_by.length} students)
                                </h4>
                                <div className="space-y-2">
                                  {completionData.completed_by.map((student) => (
                                    <div key={student.student_id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                      <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                          {student.student_name.charAt(0)}
                                        </div>
                                        <span className="text-white">{student.student_name}</span>
                                      </div>
                                      <div className="flex items-center space-x-4">
                                        <div className="text-right">
                                          <div className="text-white text-sm">{student.progress}/{quest.target_value}</div>
                                          <Progress value={(student.progress / quest.target_value) * 100} className="w-20 h-2" />
                                        </div>
                                        {student.completed_at ? (
                                          <Badge variant="default" className="bg-green-600">
                                            Completed
                                          </Badge>
                                        ) : (
                                          <Badge variant="secondary">
                                            In Progress
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div className="space-y-2 text-sm mt-4">
                              <div className="flex justify-between">
                                <span className="text-white/60">Target:</span>
                                <span className="text-white">{quest.target_value}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white/60">Created:</span>
                                <span className="text-white">{new Date(quest.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-8">
            <Card className="bg-white/5 border-white/20 backdrop-blur-sm rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white flex items-center text-2xl">
                  <Trophy className="h-6 w-6 mr-3 text-cyan-400" />
                  Achievement Management
                </CardTitle>
                <Dialog open={showAchievementDialog} onOpenChange={setShowAchievementDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-cyan-600 hover:bg-cyan-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Achievement
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-white/20">
                    <DialogHeader>
                      <DialogTitle className="text-white">Create New Achievement</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-white">Name</Label>
                        <Input
                          value={achievementForm.name}
                          onChange={(e) => setAchievementForm(prev => ({ ...prev, name: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="Achievement name"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Description</Label>
                        <Textarea
                          value={achievementForm.description}
                          onChange={(e) => setAchievementForm(prev => ({ ...prev, description: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="Achievement description"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-white">Type</Label>
                          <Select value={achievementForm.type} onValueChange={(value) => setAchievementForm(prev => ({ ...prev, type: value as 'milestone' | 'streak' | 'completion' | 'mastery' | 'challenge' }))}>
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="milestone">Milestone</SelectItem>
                              <SelectItem value="completion">Completion</SelectItem>
                              <SelectItem value="mastery">Mastery</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-white">Points</Label>
                          <Input
                            type="number"
                            value={achievementForm.points}
                            onChange={(e) => setAchievementForm(prev => ({ ...prev, points: parseInt(e.target.value) || 10 }))}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                      </div>
                      <Button onClick={handleCreateAchievement} className="w-full bg-cyan-600 hover:bg-cyan-700">
                        Create Achievement
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {achievements.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="h-16 w-16 text-white/40 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Achievements Yet</h3>
                    <p className="text-white/60">Create your first achievement to reward student progress</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {achievements.map((achievement) => {
                      const completionData = achievementCompletions.find(a => a.achievement_id === achievement.id);
                      return (
                        <Card key={achievement.id} className="bg-white/5 border-white/10">
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white">{achievement.name}</h3>
                                <p className="text-white/60 text-sm">{achievement.description}</p>
                                <div className="flex gap-2 mt-2">
                                  <Badge variant="outline">{achievement.type}</Badge>
                                  <Badge variant="secondary">{achievement.points} pts</Badge>
                                </div>
                              </div>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => deleteAchievement(achievement.id)}
                              >
                                Delete
                              </Button>
                            </div>
                            
                            {/* Student Completion Section */}
                            {completionData && (
                              <div className="mt-4 pt-4 border-t border-white/10">
                                <h4 className="text-white font-medium mb-3 flex items-center">
                                  <Award className="h-4 w-4 mr-2" />
                                  Earned by Students ({completionData.earned_by.length} students)
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {completionData.earned_by.map((student) => (
                                    <div key={student.student_id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                                      <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                        {student.student_name.charAt(0)}
                                      </div>
                                      <div className="flex-1">
                                        <div className="text-white font-medium">{student.student_name}</div>
                                        <div className="text-white/60 text-xs">
                                          Earned {new Date(student.earned_at).toLocaleDateString()}
                                        </div>
                                      </div>
                                      <Trophy className="h-4 w-4 text-yellow-400" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div className="flex justify-between text-sm mt-4">
                              <span className="text-white/60">Created: {new Date(achievement.created_at).toLocaleDateString()}</span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white/5 border-white/20 backdrop-blur-sm rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-2xl">
                    <TrendingUp className="h-6 w-6 mr-3 text-green-400" />
                    Performance Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <TrendingUp className="h-16 w-16 text-white/40 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Learning Trends</h3>
                    <p className="text-white/60">Comprehensive analytics and performance insights</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/20 backdrop-blur-sm rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-2xl">
                    <Brain className="h-6 w-6 mr-3 text-purple-400" />
                    AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Brain className="h-16 w-16 text-white/40 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">AI Analytics</h3>
                    <p className="text-white/60">Machine learning insights and predictive analytics</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Monitoring;
