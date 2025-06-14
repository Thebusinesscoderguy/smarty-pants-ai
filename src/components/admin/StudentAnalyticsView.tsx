
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { StrengthsWeaknessesChart } from '@/components/analytics/StrengthsWeaknessesChart';
import { ProgressBrief } from '@/components/analytics/ProgressBrief';
import { RealAnalyticsService, RealStudentAnalytics } from '@/services/realAnalyticsService';

export const StudentAnalyticsView = () => {
  const [students, setStudents] = useState<RealStudentAnalytics[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [insight, setInsight] = useState<string>('');
  const { user } = useAuth();

  useEffect(() => {
    fetchStudentAnalytics();
  }, [user]);

  useEffect(() => {
    if (selectedStudent) {
      generateInsight(selectedStudent);
    }
  }, [selectedStudent]);

  const fetchStudentAnalytics = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Get school account
      const { data: schoolData, error: schoolError } = await supabase
        .from('school_accounts')
        .select('id')
        .eq('admin_user_id', user.id)
        .single();

      if (schoolError) throw schoolError;

      // Get real analytics data
      const realAnalytics = await RealAnalyticsService.getAllStudentsAnalytics(schoolData.id);
      
      setStudents(realAnalytics);
      if (realAnalytics.length > 0) {
        setSelectedStudent(realAnalytics[0].studentId);
      }

    } catch (error: any) {
      console.error('Error fetching student analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load student analytics",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateInsight = async (studentId: string) => {
    try {
      const personalizedInsight = await RealAnalyticsService.generatePersonalizedInsight(studentId);
      setInsight(personalizedInsight);
    } catch (error) {
      console.error('Error generating insight:', error);
      setInsight('Unable to generate personalized insight at this time.');
    }
  };

  const selectedStudentData = students.find(s => s.studentId === selectedStudent);

  if (isLoading) {
    return <div className="animate-pulse">Loading student analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Student Analytics</h2>
          <p className="text-gray-400">Real-time progress analysis with AI-powered insights</p>
        </div>
        
        <div className="flex gap-4">
          <Button onClick={fetchStudentAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white w-48">
              <SelectValue placeholder="Select student" />
            </SelectTrigger>
            <SelectContent>
              {students.map((student) => (
                <SelectItem key={student.studentId} value={student.studentId}>
                  {student.studentName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {students.length === 0 ? (
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300">No students found.</p>
            <p className="text-gray-400 text-sm mt-2">
              Invite students to start tracking their progress and analytics.
            </p>
          </CardContent>
        </Card>
      ) : selectedStudentData ? (
        <div className="grid gap-6">
          {/* AI-Generated Insight */}
          {insight && (
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">AI-Powered Insight</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm leading-relaxed">{insight}</p>
              </CardContent>
            </Card>
          )}

          {/* Progress Brief */}
          <ProgressBrief
            studentName={selectedStudentData.studentName}
            completionPercentage={selectedStudentData.completionPercentage}
            totalTimeSpent={selectedStudentData.totalTimeSpent}
            strengths={selectedStudentData.strengths}
            weakAreas={selectedStudentData.weakAreas}
            lastActivity={selectedStudentData.lastActivity}
          />
          
          {/* Strengths & Weaknesses Chart */}
          <StrengthsWeaknessesChart
            studentId={selectedStudentData.studentId}
            studentName={selectedStudentData.studentName}
            data={selectedStudentData.topicPerformance}
          />
        </div>
      ) : null}
    </div>
  );
};
