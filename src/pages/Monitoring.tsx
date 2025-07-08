
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Clock, TrendingUp, Users, BookOpen, Target } from 'lucide-react';

export default function Monitoring() {
  const { user } = useAuth();
  const [studentData, setStudentData] = useState({
    totalStudents: 25,
    activeToday: 18,
    averageProgress: 78,
    completedLessons: 142,
    totalLessons: 200
  });

  const subjects = [
    { name: 'Mathematics', progress: 85, students: 8, color: 'bg-blue-500' },
    { name: 'Science', progress: 72, students: 6, color: 'bg-green-500' },
    { name: 'English', progress: 90, students: 7, color: 'bg-purple-500' },
    { name: 'History', progress: 65, students: 4, color: 'bg-orange-500' },
  ];

  const recentActivity = [
    { student: 'Alice Johnson', action: 'Completed Math Quiz', time: '2 hours ago', score: 95 },
    { student: 'Bob Smith', action: 'Started Science Module', time: '3 hours ago', score: null },
    { student: 'Carol Davis', action: 'Finished English Essay', time: '5 hours ago', score: 88 },
    { student: 'David Wilson', action: 'Submitted History Report', time: '1 day ago', score: 92 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Student Monitoring Dashboard</h1>
          <p className="text-slate-300">Track student progress and performance</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Students</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{studentData.totalStudents}</div>
              <p className="text-xs text-slate-300">+2 from last week</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Active Today</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{studentData.activeToday}</div>
              <p className="text-xs text-slate-300">72% of total students</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Average Progress</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{studentData.averageProgress}%</div>
              <p className="text-xs text-slate-300">+5% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Lessons Completed</CardTitle>
              <BookOpen className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{studentData.completedLessons}</div>
              <p className="text-xs text-slate-300">of {studentData.totalLessons} total</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="subjects" className="space-y-6">
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger value="subjects" className="data-[state=active]:bg-white/20">Subject Progress</TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-white/20">Recent Activity</TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-white/20">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="subjects" className="space-y-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Subject Progress Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {subjects.map((subject) => (
                  <div key={subject.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">{subject.name}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="border-white/20 text-white">
                          {subject.students} students
                        </Badge>
                        <span className="text-sm text-slate-300">{subject.progress}%</span>
                      </div>
                    </div>
                    <Progress value={subject.progress} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Recent Student Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium text-white">{activity.student}</p>
                        <p className="text-sm text-slate-300">{activity.action}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-sm text-slate-400">{activity.time}</p>
                        {activity.score && (
                          <Badge className="bg-green-600 text-white">
                            {activity.score}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Top Performers</h3>
                    <div className="space-y-3">
                      {['Alice Johnson - 95%', 'David Wilson - 92%', 'Carol Davis - 88%'].map((performer, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <span className="text-white">{performer}</span>
                          <Badge className="bg-green-600 text-white">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            High
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Areas for Improvement</h3>
                    <div className="space-y-3">
                      {['History - 65% avg', 'Science Lab - 68% avg', 'Advanced Math - 72% avg'].map((area, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <span className="text-white">{area}</span>
                          <Badge variant="outline" className="border-orange-400 text-orange-400">
                            <Target className="h-3 w-3 mr-1" />
                            Focus
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
