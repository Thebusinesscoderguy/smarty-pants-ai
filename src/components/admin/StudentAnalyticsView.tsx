
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

interface StudentData {
  student_id: string;
  student_name: string;
  completion_percentage: number;
  total_time_spent: number;
  strengths: string[];
  weak_areas: string[];
  last_activity: string;
  subject_performance: Array<{
    subject: string;
    strength_score: number;
    weakness_score: number;
    performance: number;
  }>;
}

export const StudentAnalyticsView = () => {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchStudentAnalytics();
  }, [user]);

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

      // Get student invitations
      const { data: invitations, error: invitationsError } = await supabase
        .from('student_invitations')
        .select('email, first_name, last_name')
        .eq('used', true);

      if (invitationsError) throw invitationsError;

      // Generate mock analytics data for demonstration
      const studentsData: StudentData[] = invitations?.map((invitation, index) => {
        const studentName = `${invitation.first_name || 'Student'} ${invitation.last_name || index + 1}`;
        const subjects = ['Mathematics', 'Science', 'English', 'History', 'Art'];
        
        return {
          student_id: `student_${index}`,
          student_name: studentName,
          completion_percentage: Math.floor(Math.random() * 40) + 60, // 60-100%
          total_time_spent: Math.floor(Math.random() * 500) + 100, // 100-600 minutes
          strengths: subjects.slice(0, Math.floor(Math.random() * 3) + 1),
          weak_areas: subjects.slice(-Math.floor(Math.random() * 2) - 1),
          last_activity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          subject_performance: subjects.map(subject => ({
            subject,
            strength_score: Math.random(),
            weakness_score: Math.random(),
            performance: Math.floor(Math.random() * 40) + 50 // 50-90%
          }))
        };
      }) || [];

      setStudents(studentsData);
      if (studentsData.length > 0) {
        setSelectedStudent(studentsData[0].student_id);
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

  const selectedStudentData = students.find(s => s.student_id === selectedStudent);

  if (isLoading) {
    return <div className="animate-pulse">Loading student analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Student Analytics</h2>
          <p className="text-gray-400">Detailed progress analysis with strengths and weaknesses</p>
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
                <SelectItem key={student.student_id} value={student.student_id}>
                  {student.student_name}
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
          {/* Progress Brief */}
          <ProgressBrief
            studentName={selectedStudentData.student_name}
            completionPercentage={selectedStudentData.completion_percentage}
            totalTimeSpent={selectedStudentData.total_time_spent}
            strengths={selectedStudentData.strengths}
            weakAreas={selectedStudentData.weak_areas}
            lastActivity={selectedStudentData.last_activity}
          />
          
          {/* Strengths & Weaknesses Chart */}
          <StrengthsWeaknessesChart
            studentId={selectedStudentData.student_id}
            studentName={selectedStudentData.student_name}
            data={selectedStudentData.subject_performance}
          />
        </div>
      ) : null}
    </div>
  );
};
