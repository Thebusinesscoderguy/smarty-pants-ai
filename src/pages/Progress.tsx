
import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Users, BookOpen, Award, TestTube, Plus, FileText, Clock, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const Progress = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for charts
  const progressData = [
    { name: 'Week 1', math: 65, science: 70, english: 80 },
    { name: 'Week 2', math: 70, science: 75, english: 85 },
    { name: 'Week 3', math: 75, science: 80, english: 82 },
    { name: 'Week 4', math: 80, science: 85, english: 88 },
  ];

  const testData = [
    { name: 'Algebra Quiz', score: 85, date: '2024-01-15', status: 'completed' },
    { name: 'Chemistry Test', score: 92, date: '2024-01-18', status: 'completed' },
    { name: 'Literature Essay', score: 78, date: '2024-01-20', status: 'completed' },
    { name: 'Physics Quiz', score: 0, date: '2024-01-25', status: 'pending' },
  ];

  const createTest = () => {
    // This would open a test creation modal or navigate to test creator
    console.log('Creating new test...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <Header />
      
      <main className="px-6 py-12 max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center">
            <BarChart3 className="mr-6 h-16 w-16 text-blue-400" />
            Dashboard & Analytics
          </h1>
          <p className="text-white/70 text-2xl">
            Track learning progress, create tests, and monitor student performance
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-sm rounded-2xl p-2">
            <TabsTrigger value="overview" className="rounded-xl text-lg py-3">Overview</TabsTrigger>
            <TabsTrigger value="tests" className="rounded-xl text-lg py-3">Tests & Quizzes</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-xl text-lg py-3">Analytics</TabsTrigger>
            <TabsTrigger value="students" className="rounded-xl text-lg py-3">Students</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70">Total Students</p>
                      <p className="text-3xl font-bold text-white">248</p>
                    </div>
                    <Users className="h-12 w-12 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70">Tests Created</p>
                      <p className="text-3xl font-bold text-white">142</p>
                    </div>
                    <TestTube className="h-12 w-12 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70">Avg Score</p>
                      <p className="text-3xl font-bold text-white">85%</p>
                    </div>
                    <Award className="h-12 w-12 text-purple-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70">Active Courses</p>
                      <p className="text-3xl font-bold text-white">12</p>
                    </div>
                    <BookOpen className="h-12 w-12 text-orange-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress Chart */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Weekly Progress Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                    <Line type="monotone" dataKey="math" stroke="#3B82F6" strokeWidth={3} />
                    <Line type="monotone" dataKey="science" stroke="#10B981" strokeWidth={3} />
                    <Line type="monotone" dataKey="english" stroke="#8B5CF6" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tests" className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-white">Tests & Quizzes Management</h2>
              <Button 
                onClick={createTest}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-8 py-4 rounded-2xl text-lg font-semibold"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create New Test
              </Button>
            </div>

            {/* Test Creation Tools */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500/30 backdrop-blur-sm hover:bg-blue-500/30 transition-all cursor-pointer">
                <CardContent className="p-6 text-center">
                  <TestTube className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Quick Quiz</h3>
                  <p className="text-white/70">Create a quick quiz with multiple choice questions</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30 backdrop-blur-sm hover:bg-green-500/30 transition-all cursor-pointer">
                <CardContent className="p-6 text-center">
                  <FileText className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Comprehensive Test</h3>
                  <p className="text-white/70">Create detailed tests with various question types</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30 backdrop-blur-sm hover:bg-purple-500/30 transition-all cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Clock className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Timed Assessment</h3>
                  <p className="text-white/70">Create time-limited assessments and exams</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Tests */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Recent Tests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {testData.map((test, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-xl ${test.status === 'completed' ? 'bg-green-500/20' : 'bg-orange-500/20'}`}>
                          {test.status === 'completed' ? 
                            <CheckCircle className="h-6 w-6 text-green-400" /> : 
                            <Clock className="h-6 w-6 text-orange-400" />
                          }
                        </div>
                        <div>
                          <h4 className="text-white font-semibold text-lg">{test.name}</h4>
                          <p className="text-white/70">{test.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge 
                          className={test.status === 'completed' ? 'bg-green-600' : 'bg-orange-600'}
                        >
                          {test.status === 'completed' ? `${test.score}%` : 'Pending'}
                        </Badge>
                        <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-8">
            <h2 className="text-3xl font-bold text-white">Detailed Analytics</h2>
            
            {/* Performance by Subject */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Performance by Subject</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="math" fill="#3B82F6" />
                    <Bar dataKey="science" fill="#10B981" />
                    <Bar dataKey="english" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-8">
            <h2 className="text-3xl font-bold text-white">Student Management</h2>
            
            <Card className="bg-white/5 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Student List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'John Smith', grade: 'A+', subjects: 3, lastActive: '2 hours ago' },
                    { name: 'Sarah Johnson', grade: 'A', subjects: 4, lastActive: '1 day ago' },
                    { name: 'Mike Wilson', grade: 'B+', subjects: 2, lastActive: '3 hours ago' },
                    { name: 'Emma Davis', grade: 'A-', subjects: 5, lastActive: '30 min ago' },
                  ].map((student, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">{student.name.split(' ').map(n => n[0]).join('')}</span>
                        </div>
                        <div>
                          <h4 className="text-white font-semibold text-lg">{student.name}</h4>
                          <p className="text-white/70">{student.subjects} subjects • Last active {student.lastActive}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge className="bg-green-600">{student.grade}</Badge>
                        <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                          View Profile
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Progress;
