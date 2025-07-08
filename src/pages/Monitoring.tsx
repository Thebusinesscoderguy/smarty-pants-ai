import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3, Users, TrendingUp, Clock, Activity, Target, Book, Award, Brain, Shield, Zap, Calendar, FileText, Trophy, AlertCircle, Wifi, Database, Heart } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Monitoring = () => {
  const { user } = useAuth();
  const [activeStudents, setActiveStudents] = useState(124);
  const [totalSessions, setTotalSessions] = useState(1456);
  const [avgSessionTime, setAvgSessionTime] = useState(23);
  const [completionRate, setCompletionRate] = useState(87);
  const [engagementScore, setEngagementScore] = useState(94);
  const [assessmentAvg, setAssessmentAvg] = useState(78);
  const [achievementsEarned, setAchievementsEarned] = useState(156);
  const [systemHealth, setSystemHealth] = useState(99);
  const [parentReports, setParentReports] = useState(89);
  const [aiUsage, setAiUsage] = useState(2340);

  const recentActivity = [
    { id: 1, student: "Emma Wilson", subject: "Mathematics", progress: 85, time: "2 hours ago" },
    { id: 2, student: "James Miller", subject: "Science", progress: 92, time: "3 hours ago" },
    { id: 3, student: "Sarah Davis", subject: "English", progress: 78, time: "4 hours ago" },
    { id: 4, student: "Michael Brown", subject: "History", progress: 90, time: "5 hours ago" },
  ];

  const subjectProgress = [
    { subject: "Mathematics", progress: 85, students: 45 },
    { subject: "Science", progress: 78, students: 38 },
    { subject: "English", progress: 92, students: 52 },
    { subject: "History", progress: 73, students: 29 },
    { subject: "Geography", progress: 81, students: 34 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <Header />
      
      <main className="px-6 py-12 max-w-7xl mx-auto">
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
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30 backdrop-blur-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm font-medium">Active Students</p>
                  <p className="text-white text-3xl font-bold">{activeStudents}</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/30 backdrop-blur-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-200 text-sm font-medium">Total Sessions</p>
                  <p className="text-white text-3xl font-bold">{totalSessions.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <Activity className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30 backdrop-blur-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm font-medium">Avg Session Time</p>
                  <p className="text-white text-3xl font-bold">{avgSessionTime}m</p>
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
                  <p className="text-orange-200 text-sm font-medium">Completion Rate</p>
                  <p className="text-white text-3xl font-bold">{completionRate}%</p>
                </div>
                <div className="p-3 bg-orange-500/20 rounded-xl">
                  <Target className="h-6 w-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-500/10 to-pink-600/10 border-pink-500/30 backdrop-blur-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-200 text-sm font-medium">Engagement Score</p>
                  <p className="text-white text-3xl font-bold">{engagementScore}%</p>
                </div>
                <div className="p-3 bg-pink-500/20 rounded-xl">
                  <Heart className="h-6 w-6 text-pink-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/30 backdrop-blur-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-200 text-sm font-medium">Assessment Avg</p>
                  <p className="text-white text-3xl font-bold">{assessmentAvg}%</p>
                </div>
                <div className="p-3 bg-yellow-500/20 rounded-xl">
                  <FileText className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border-cyan-500/30 backdrop-blur-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-200 text-sm font-medium">Achievements</p>
                  <p className="text-white text-3xl font-bold">{achievementsEarned}</p>
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
                  <p className="text-emerald-200 text-sm font-medium">System Health</p>
                  <p className="text-white text-3xl font-bold">{systemHealth}%</p>
                </div>
                <div className="p-3 bg-emerald-500/20 rounded-xl">
                  <Shield className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-8 bg-white/10 backdrop-blur-sm rounded-xl p-2 mb-8 border border-white/20">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-200 flex items-center font-semibold"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="students" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-200 flex items-center font-semibold"
            >
              <Users className="h-4 w-4 mr-2" />
              Students
            </TabsTrigger>
            <TabsTrigger 
              value="subjects" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-200 flex items-center font-semibold"
            >
              <Book className="h-4 w-4 mr-2" />
              Subjects
            </TabsTrigger>
            <TabsTrigger 
              value="performance" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-200 flex items-center font-semibold"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger 
              value="assessments" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-200 flex items-center font-semibold"
            >
              <FileText className="h-4 w-4 mr-2" />
              Assessments
            </TabsTrigger>
            <TabsTrigger 
              value="engagement" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-200 flex items-center font-semibold"
            >
              <Heart className="h-4 w-4 mr-2" />
              Engagement
            </TabsTrigger>
            <TabsTrigger 
              value="achievements" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-200 flex items-center font-semibold"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Achievements
            </TabsTrigger>
            <TabsTrigger 
              value="system" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-200 flex items-center font-semibold"
            >
              <Database className="h-4 w-4 mr-2" />
              System
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
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-semibold">{activity.student}</h4>
                        <span className="text-white/60 text-sm">{activity.time}</span>
                      </div>
                      <p className="text-white/80 mb-2">{activity.subject}</p>
                      <div className="flex items-center space-x-3">
                        <Progress value={activity.progress} className="flex-1 h-2" />
                        <span className="text-white/90 text-sm font-medium">{activity.progress}%</span>
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
                  {subjectProgress.map((subject, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="text-white font-medium">{subject.subject}</h4>
                        <span className="text-white/70 text-sm">{subject.students} students</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Progress value={subject.progress} className="flex-1 h-3" />
                        <span className="text-white/90 text-sm font-medium w-12">{subject.progress}%</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-8">
            <Card className="bg-white/5 border-white/20 backdrop-blur-sm rounded-3xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center text-2xl">
                  <Users className="h-6 w-6 mr-3 text-blue-400" />
                  Student Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-white/40 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Student Analytics</h3>
                  <p className="text-white/60">Detailed student performance data will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-8">
            <Card className="bg-white/5 border-white/20 backdrop-blur-sm rounded-3xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center text-2xl">
                  <Book className="h-6 w-6 mr-3 text-green-400" />
                  Subject Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Book className="h-16 w-16 text-white/40 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Subject Performance</h3>
                  <p className="text-white/60">Detailed subject analytics will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white/5 border-white/20 backdrop-blur-sm rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-2xl">
                    <TrendingUp className="h-6 w-6 mr-3 text-green-400" />
                    Learning Progress Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <TrendingUp className="h-16 w-16 text-white/40 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Performance Analytics</h3>
                    <p className="text-white/60">Weekly and monthly performance trends</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/20 backdrop-blur-sm rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-2xl">
                    <Brain className="h-6 w-6 mr-3 text-purple-400" />
                    AI Learning Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Brain className="h-16 w-16 text-white/40 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Cognitive Analysis</h3>
                    <p className="text-white/60">AI-powered learning pattern insights</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="assessments" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white/5 border-white/20 backdrop-blur-sm rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-2xl">
                    <FileText className="h-6 w-6 mr-3 text-yellow-400" />
                    Quiz & Test Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-white/40 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Assessment Analytics</h3>
                    <p className="text-white/60">Comprehensive quiz and test performance data</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/20 backdrop-blur-sm rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-2xl">
                    <Target className="h-6 w-6 mr-3 text-orange-400" />
                    Learning Objectives
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Target className="h-16 w-16 text-white/40 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Goal Tracking</h3>
                    <p className="text-white/60">Progress towards learning objectives</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white/5 border-white/20 backdrop-blur-sm rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-2xl">
                    <Heart className="h-6 w-6 mr-3 text-pink-400" />
                    Student Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Heart className="h-16 w-16 text-white/40 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Engagement Metrics</h3>
                    <p className="text-white/60">Time spent, interaction rates, and motivation scores</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/20 backdrop-blur-sm rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-2xl">
                    <Calendar className="h-6 w-6 mr-3 text-blue-400" />
                    Learning Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-white/40 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Usage Patterns</h3>
                    <p className="text-white/60">Daily and weekly learning behavior analysis</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white/5 border-white/20 backdrop-blur-sm rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-2xl">
                    <Trophy className="h-6 w-6 mr-3 text-cyan-400" />
                    Badges & Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Trophy className="h-16 w-16 text-white/40 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Gamification Stats</h3>
                    <p className="text-white/60">Earned badges, achievements, and rewards</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/20 backdrop-blur-sm rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-2xl">
                    <Award className="h-6 w-6 mr-3 text-gold-400" />
                    Leaderboards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Award className="h-16 w-16 text-white/40 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Rankings</h3>
                    <p className="text-white/60">Class and school-wide performance rankings</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white/5 border-white/20 backdrop-blur-sm rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-2xl">
                    <Database className="h-6 w-6 mr-3 text-emerald-400" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Database className="h-16 w-16 text-white/40 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Platform Status</h3>
                    <p className="text-white/60">Server performance, uptime, and resource usage</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/20 backdrop-blur-sm rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-2xl">
                    <Zap className="h-6 w-6 mr-3 text-yellow-400" />
                    AI Usage Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Zap className="h-16 w-16 text-white/40 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">AI Metrics</h3>
                    <p className="text-white/60">Token usage, API calls, and AI performance</p>
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