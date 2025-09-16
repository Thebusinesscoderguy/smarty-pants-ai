import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMonitoringData } from '@/hooks/useMonitoringData';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  BookOpen, 
  Download, 
  UserPlus,
  BarChart3,
  Brain,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Activity
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const EnhancedStudentDashboard = () => {
  const { 
    studentProgress, 
    overviewStats, 
    loading, 
    fetchStudentProgress 
  } = useMonitoringData();
  
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const filteredStudents = studentProgress
    .filter(student => 
      student.student_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'progress':
          return b.completion_percentage - a.completion_percentage;
        case 'time':
          return b.total_time_spent - a.total_time_spent;
        case 'activity':
          return new Date(b.last_activity || 0).getTime() - new Date(a.last_activity || 0).getTime();
        default:
          return a.student_name.localeCompare(b.student_name);
      }
    });

  const handleExportData = () => {
    const csvContent = studentProgress.map(student => ({
      Name: student.student_name,
      Progress: `${student.completion_percentage}%`,
      CompletedLessons: student.completed_lessons,
      TotalLessons: student.total_lessons,
      StudyTime: `${Math.round(student.total_time_spent / 60)}h`,
      LastActivity: student.last_activity || 'No recent activity',
      Strengths: student.strengths.join('; '),
      WeakAreas: student.weak_areas.join('; ')
    }));

    const headers = Object.keys(csvContent[0]).join(',') + '\n';
    const csv = headers + csvContent.map(row => Object.values(row).join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-dashboard-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Student dashboard data has been exported to CSV.",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading dashboard data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Student Monitoring</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for student performance
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleExportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button onClick={fetchStudentProgress}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Enhanced Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{overviewStats?.totalStudents || 0}</p>
                <p className="text-xs text-green-600">+2 this week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Progress</p>
                <p className="text-2xl font-bold">{overviewStats?.avgCompletion || 0}%</p>
                <p className="text-xs text-green-600">+5% from last month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Clock className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Study Hours</p>
                <p className="text-2xl font-bold">{overviewStats?.totalStudyTime || 0}h</p>
                <p className="text-xs text-blue-600">This month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <Target className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quests</p>
                <p className="text-2xl font-bold">{overviewStats?.totalQuests || 0}</p>
                <p className="text-xs text-orange-600">Active quests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="name">Sort by Name</option>
                <option value="progress">Sort by Progress</option>
                <option value="time">Sort by Study Time</option>
                <option value="activity">Sort by Last Activity</option>
              </select>
              
              <select
                value={selectedTimeFrame}
                onChange={(e) => setSelectedTimeFrame(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Student Progress Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Students Found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search criteria.' : 'Add students to start monitoring their progress.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredStudents.map((student) => (
                <Card key={student.student_id} className="border-l-4 border-l-primary">
                  <CardContent className="p-6">
                    <Tabs defaultValue="overview" className="w-full">
                      <div className="flex flex-col md:flex-row justify-between items-start mb-4">
                        <div className="mb-4 md:mb-0">
                          <h3 className="text-xl font-semibold">{student.student_name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Last active: {student.last_activity ? 
                                new Date(student.last_activity).toLocaleDateString() : 
                                'No recent activity'
                              }
                            </span>
                            <Badge 
                              variant={student.completion_percentage >= 80 ? "default" : 
                                       student.completion_percentage >= 60 ? "secondary" : "destructive"}
                            >
                              {student.completion_percentage >= 80 ? "Excellent" :
                               student.completion_percentage >= 60 ? "Good" : "Needs Attention"}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="performance">Performance</TabsTrigger>
                        <TabsTrigger value="insights">Insights</TabsTrigger>
                        <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span>Overall Progress</span>
                              <span>{student.completion_percentage}%</span>
                            </div>
                            <Progress value={student.completion_percentage} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              {student.completed_lessons} of {student.total_lessons} lessons completed
                            </p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Study Time</p>
                            <p className="text-3xl font-bold text-primary">
                              {Math.round(student.total_time_spent / 60)}h
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {student.total_time_spent % 60}m additional
                            </p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Subjects</p>
                            <p className="text-3xl font-bold text-secondary">
                              {student.subjects.length}
                            </p>
                            <p className="text-xs text-muted-foreground">Active subjects</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {student.subjects.map((subject, index) => (
                            <Card key={index} className="p-4">
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <h4 className="font-medium">{subject.subject_name}</h4>
                                  <span className="text-sm text-muted-foreground">
                                    {subject.completion_percentage}%
                                  </span>
                                </div>
                                <Progress value={subject.completion_percentage} className="h-2" />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>{subject.lessons_completed}/{subject.total_lessons} lessons</span>
                                  <span>{Math.round(subject.time_spent / 60)}h {subject.time_spent % 60}m</span>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="performance" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Card className="p-4">
                            <h4 className="font-medium text-green-600 mb-3 flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              Top Strengths
                            </h4>
                            <div className="space-y-2">
                              {student.strengths.slice(0, 5).map((strength, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                                  <span className="text-sm">{strength}</span>
                                  <Badge variant="outline" className="bg-green-100">Strong</Badge>
                                </div>
                              ))}
                            </div>
                          </Card>
                          
                          <Card className="p-4">
                            <h4 className="font-medium text-orange-600 mb-3 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" />
                              Improvement Areas
                            </h4>
                            <div className="space-y-2">
                              {student.weak_areas.slice(0, 5).map((area, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-orange-50 rounded">
                                  <span className="text-sm">{area}</span>
                                  <Badge variant="outline" className="bg-orange-100">Focus</Badge>
                                </div>
                              ))}
                            </div>
                          </Card>
                        </div>
                      </TabsContent>

                      <TabsContent value="insights" className="space-y-6">
                        <Card className="p-6">
                          <h4 className="font-medium mb-4 flex items-center gap-2">
                            <Brain className="h-5 w-5" />
                            AI-Generated Insights
                          </h4>
                          <div className="prose prose-sm max-w-none">
                            <p className="text-muted-foreground leading-relaxed">
                              {student.student_name} shows {student.completion_percentage >= 80 ? 'excellent' : 
                               student.completion_percentage >= 60 ? 'good' : 'developing'} engagement across subjects. 
                              {student.strengths.length > 0 && ` Strong performance in ${student.strengths.slice(0, 2).join(' and ')}.`}
                              {student.weak_areas.length > 0 && ` Recommended focus areas include ${student.weak_areas.slice(0, 2).join(' and ')}.`}
                              Study time of {Math.round(student.total_time_spent / 60)} hours indicates 
                              {student.total_time_spent > 600 ? ' excellent' : student.total_time_spent > 300 ? ' good' : ' developing'} commitment to learning.
                            </p>
                          </div>
                        </Card>
                      </TabsContent>

                      <TabsContent value="recommendations" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card className="p-4">
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <Target className="h-4 w-4 text-blue-500" />
                              Learning Recommendations
                            </h4>
                            <ul className="space-y-2 text-sm">
                              {student.weak_areas.length > 0 ? (
                                student.weak_areas.slice(0, 3).map((area, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <Zap className="h-3 w-3 text-orange-500 mt-1" />
                                    Focus on {area} with additional practice exercises
                                  </li>
                                ))
                              ) : (
                                <li className="flex items-start gap-2">
                                  <CheckCircle className="h-3 w-3 text-green-500 mt-1" />
                                  Continue current learning path - showing excellent progress
                                </li>
                              )}
                            </ul>
                          </Card>
                          
                          <Card className="p-4">
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <Activity className="h-4 w-4 text-purple-500" />
                              Engagement Tips
                            </h4>
                            <ul className="space-y-2 text-sm">
                              <li className="flex items-start gap-2">
                                <Zap className="h-3 w-3 text-blue-500 mt-1" />
                                {student.total_time_spent < 300 ? 
                                  'Encourage 15-20 minutes daily study sessions' :
                                  'Maintain current study schedule for optimal learning'
                                }
                              </li>
                              <li className="flex items-start gap-2">
                                <Zap className="h-3 w-3 text-green-500 mt-1" />
                                {student.strengths.length > 0 ?
                                  `Leverage strengths in ${student.strengths[0]} for confidence building` :
                                  'Focus on building foundational skills across subjects'
                                }
                              </li>
                            </ul>
                          </Card>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
