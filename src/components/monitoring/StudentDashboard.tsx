import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMonitoring } from '@/hooks/useMonitoring';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  BookOpen, 
  Download, 
  UserPlus,
  BarChart3,
  Brain
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export const StudentDashboard = () => {
  const { 
    studentProgress, 
    userRole, 
    isLoading, 
    generateReport, 
    addStudentRelationship 
  } = useMonitoring();
  
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  const handleAddStudent = async () => {
    if (!newStudentEmail.trim()) return;
    
    setIsAddingStudent(true);
    const success = await addStudentRelationship(newStudentEmail);
    if (success) {
      setNewStudentEmail('');
    }
    setIsAddingStudent(false);
  };

  const handleDownloadReport = async (studentId: string, format: 'pdf' | 'csv') => {
    try {
      const reportContent = await generateReport(studentId, format);
      if (reportContent) {
        const blob = new Blob([reportContent], { 
          type: format === 'csv' ? 'text/csv' : 'text/plain' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `student-report-${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Report Downloaded",
          description: `${format.toUpperCase()} report has been downloaded successfully.`,
        });
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    }
  };

  const generateImprovementParagraph = (student: any): string => {
    let paragraph = `${student.student_name} is making progress in their learning journey. `;

    if (student.completion_percentage >= 80) {
      paragraph += `They demonstrate excellent engagement with ${student.completion_percentage}% completion rate. `;
    } else if (student.completion_percentage >= 60) {
      paragraph += `They show good progress with ${student.completion_percentage}% completion rate. `;
    } else {
      paragraph += `They are building momentum with ${student.completion_percentage}% completion rate. `;
    }

    if (student.strengths.length > 0) {
      paragraph += `Strong performance in ${student.strengths.slice(0, 2).join(' and ')}. `;
    }

    if (student.weak_areas.length > 0) {
      paragraph += `Focus areas for improvement include ${student.weak_areas.slice(0, 2).join(' and ')}. `;
    } else {
      paragraph += `All areas showing balanced development. `;
    }

    const hoursSpent = Math.round(student.total_time_spent / 60);
    if (hoursSpent > 10) {
      paragraph += `Excellent dedication with ${hoursSpent} hours of study time.`;
    } else if (hoursSpent > 5) {
      paragraph += `Good commitment with ${hoursSpent} hours of study time.`;
    } else {
      paragraph += `Encourage more regular practice to build stronger foundations.`;
    }

    return paragraph;
  };

  // Only allow school admins (teachers) to access this dashboard
  if (userRole !== 'teacher') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">School Admin Access Only</h3>
            <p className="text-gray-600">
              This dashboard is only available for school administrators.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <div className="animate-pulse">Loading student data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">School Admin Dashboard</h1>
          <p className="text-gray-600">
            Monitor student progress and performance across your school
          </p>
        </div>
        
        {/* Add Student */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter student email"
            value={newStudentEmail}
            onChange={(e) => setNewStudentEmail(e.target.value)}
            className="w-64"
          />
          <Button 
            onClick={handleAddStudent}
            disabled={isAddingStudent || !newStudentEmail.trim()}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold">{studentProgress.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Avg Completion</p>
                <p className="text-2xl font-bold">
                  {studentProgress.length > 0 
                    ? Math.round(studentProgress.reduce((sum, s) => sum + s.completion_percentage, 0) / studentProgress.length)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Total Study Time</p>
                <p className="text-2xl font-bold">
                  {Math.round(studentProgress.reduce((sum, s) => sum + s.total_time_spent, 0) / 60)}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Lessons Completed</p>
                <p className="text-2xl font-bold">
                  {studentProgress.reduce((sum, s) => sum + s.completed_lessons, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Progress Details */}
      <Card>
        <CardHeader>
          <CardTitle>Student Progress Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {studentProgress.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Students Added</h3>
              <p className="text-gray-600">
                Add students using the form above to start monitoring their progress.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {studentProgress.map((student) => (
                <Card key={student.student_id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <Tabs defaultValue="overview" className="w-full">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold">{student.student_name}</h3>
                          <p className="text-sm text-gray-600">
                            Last activity: {student.last_activity ? 
                              new Date(student.last_activity).toLocaleDateString() : 
                              'No recent activity'
                            }
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadReport(student.student_id, 'csv')}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            CSV
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadReport(student.student_id, 'pdf')}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            PDF
                          </Button>
                        </div>
                      </div>

                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="subjects">Subjects</TabsTrigger>
                        <TabsTrigger value="insights">Insights</TabsTrigger>
                        <TabsTrigger value="improvement">Analysis</TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Overall Progress</p>
                            <Progress value={student.completion_percentage} className="h-2" />
                            <p className="text-xs text-gray-600">
                              {student.completed_lessons}/{student.total_lessons} lessons ({student.completion_percentage}%)
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Study Time</p>
                            <p className="text-2xl font-bold text-purple-600">
                              {Math.round(student.total_time_spent / 60)}h {student.total_time_spent % 60}m
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Performance</p>
                            <Badge 
                              variant={student.completion_percentage >= 80 ? "default" : 
                                       student.completion_percentage >= 60 ? "secondary" : "destructive"}
                            >
                              {student.completion_percentage >= 80 ? "Excellent" :
                               student.completion_percentage >= 60 ? "Good" : "Needs Improvement"}
                            </Badge>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="subjects" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {student.subjects.map((subject, index) => (
                            <Card key={index}>
                              <CardContent className="p-4">
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <h4 className="font-medium">{subject.subject_name}</h4>
                                    <span className="text-sm text-gray-600">
                                      {subject.completion_percentage}%
                                    </span>
                                  </div>
                                  <Progress value={subject.completion_percentage} className="h-2" />
                                  <div className="flex justify-between text-xs text-gray-500">
                                    <span>{subject.lessons_completed}/{subject.total_lessons} lessons</span>
                                    <span>{subject.time_spent} min</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="insights" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium text-green-600 mb-3 flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              Strengths
                            </h4>
                            {student.strengths.length > 0 ? (
                              <div className="space-y-2">
                                {student.strengths.map((strength, index) => (
                                  <Badge key={index} variant="secondary" className="mr-2">
                                    {strength}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 italic">Keep working to identify strengths!</p>
                            )}
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-orange-600 mb-3 flex items-center gap-2">
                              <BarChart3 className="h-4 w-4" />
                              Areas for Improvement
                            </h4>
                            {student.weak_areas.length > 0 ? (
                              <div className="space-y-2">
                                {student.weak_areas.map((area, index) => (
                                  <Badge key={index} variant="outline" className="mr-2">
                                    {area}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 italic">Great job! No major weak areas identified.</p>
                            )}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="improvement" className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Brain className="h-5 w-5" />
                              Student Progress Analysis
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-700 leading-relaxed">
                              {generateImprovementParagraph(student)}
                            </p>
                          </CardContent>
                        </Card>
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
