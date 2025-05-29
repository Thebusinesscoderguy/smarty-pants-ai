
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

export interface StudentProgress {
  student_id: string;
  student_name: string;
  total_lessons: number;
  completed_lessons: number;
  completion_percentage: number;
  total_time_spent: number;
  last_activity: string;
  subjects: SubjectProgress[];
  strengths: string[];
  weak_areas: string[];
}

export interface SubjectProgress {
  subject_name: string;
  completion_percentage: number;
  time_spent: number;
  lessons_completed: number;
  total_lessons: number;
}

export const useMonitoring = () => {
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [userRole, setUserRole] = useState<'student' | 'parent' | 'teacher'>('student');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserRole();
    }
  }, [user]);

  useEffect(() => {
    if (user && (userRole === 'parent' || userRole === 'teacher')) {
      fetchStudentProgress();
    }
  }, [user, userRole]);

  const fetchUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setUserRole(data.role);
    } catch (error: any) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchStudentProgress = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      let studentIds: string[] = [];

      // Get student IDs based on user role
      if (userRole === 'parent') {
        const { data: relationships, error } = await supabase
          .from('parent_child_relationships')
          .select('child_id')
          .eq('parent_id', user.id);

        if (error) throw error;
        studentIds = relationships?.map(r => r.child_id) || [];
      } else if (userRole === 'teacher') {
        const { data: relationships, error } = await supabase
          .from('teacher_student_relationships')
          .select('student_id')
          .eq('teacher_id', user.id);

        if (error) throw error;
        studentIds = relationships?.map(r => r.student_id) || [];
      }

      if (studentIds.length === 0) {
        setStudentProgress([]);
        setIsLoading(false);
        return;
      }

      // Fetch progress for each student
      const studentsData: StudentProgress[] = [];

      for (const studentId of studentIds) {
        // Get student profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', studentId)
          .single();

        // Get student's progress
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select(`
            *,
            lessons (
              *,
              modules (
                *,
                subjects (*)
              )
            )
          `)
          .eq('user_id', studentId);

        if (progressError) {
          console.error('Error fetching progress for student:', studentId, progressError);
          continue;
        }

        // Process the data
        const processedData = processStudentData(
          studentId,
          profile?.display_name || 'Unknown Student',
          progressData || []
        );

        studentsData.push(processedData);
      }

      setStudentProgress(studentsData);
    } catch (error: any) {
      console.error('Error fetching student progress:', error);
      toast({
        title: "Error",
        description: "Failed to load student progress",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processStudentData = (
    studentId: string,
    studentName: string,
    progressData: any[]
  ): StudentProgress => {
    const completedLessons = progressData.filter(p => p.status === 'completed');
    const totalLessons = progressData.length;
    const totalTimeSpent = progressData.reduce((sum, p) => sum + (p.time_spent || 0), 0);
    
    // Get last activity
    const lastActivity = progressData
      .filter(p => p.updated_at)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]?.updated_at || '';

    // Process subjects
    const subjectMap = new Map();
    progressData.forEach(progress => {
      const subject = progress.lessons?.modules?.subjects;
      if (!subject) return;

      if (!subjectMap.has(subject.id)) {
        subjectMap.set(subject.id, {
          subject_name: subject.name,
          completed_lessons: 0,
          total_lessons: 0,
          time_spent: 0,
          completion_percentage: 0
        });
      }

      const subjectData = subjectMap.get(subject.id);
      subjectData.total_lessons += 1;
      subjectData.time_spent += progress.time_spent || 0;

      if (progress.status === 'completed') {
        subjectData.completed_lessons += 1;
      }
    });

    const subjects = Array.from(subjectMap.values()).map(subject => ({
      ...subject,
      completion_percentage: subject.total_lessons > 0 
        ? Math.round((subject.completed_lessons / subject.total_lessons) * 100)
        : 0
    }));

    // Identify strengths and weak areas
    const strengths = subjects
      .filter(s => s.completion_percentage >= 80)
      .map(s => s.subject_name);

    const weakAreas = subjects
      .filter(s => s.completion_percentage < 50 && s.total_lessons > 0)
      .map(s => s.subject_name);

    return {
      student_id: studentId,
      student_name: studentName,
      total_lessons: totalLessons,
      completed_lessons: completedLessons.length,
      completion_percentage: totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0,
      total_time_spent: totalTimeSpent,
      last_activity: lastActivity,
      subjects,
      strengths,
      weak_areas: weakAreas
    };
  };

  const generateReport = async (studentId: string, format: 'pdf' | 'csv' = 'pdf') => {
    const student = studentProgress.find(s => s.student_id === studentId);
    if (!student) return null;

    // Generate report data
    const reportData = {
      student_name: student.student_name,
      generated_at: new Date().toISOString(),
      overall_progress: {
        completion_percentage: student.completion_percentage,
        total_time_spent: student.total_time_spent,
        lessons_completed: student.completed_lessons,
        total_lessons: student.total_lessons
      },
      subjects: student.subjects,
      strengths: student.strengths,
      weak_areas: student.weak_areas,
      last_activity: student.last_activity
    };

    if (format === 'csv') {
      return generateCSVReport(reportData);
    } else {
      return generatePDFReport(reportData);
    }
  };

  const generateCSVReport = (data: any) => {
    const csvContent = [
      ['Student Report'],
      ['Student Name', data.student_name],
      ['Generated At', new Date(data.generated_at).toLocaleDateString()],
      [''],
      ['Overall Progress'],
      ['Completion Percentage', `${data.overall_progress.completion_percentage}%`],
      ['Total Time Spent', `${data.overall_progress.total_time_spent} minutes`],
      ['Lessons Completed', `${data.overall_progress.lessons_completed}/${data.overall_progress.total_lessons}`],
      [''],
      ['Subject Progress'],
      ['Subject', 'Completion %', 'Time Spent', 'Lessons Completed'],
      ...data.subjects.map((s: any) => [
        s.subject_name,
        `${s.completion_percentage}%`,
        `${s.time_spent} min`,
        `${s.completed_lessons}/${s.total_lessons}`
      ]),
      [''],
      ['Strengths', data.strengths.join(', ')],
      ['Areas for Improvement', data.weak_areas.join(', ')]
    ].map(row => row.join(',')).join('\n');

    return csvContent;
  };

  const generatePDFReport = (data: any) => {
    // This would typically use a PDF generation library
    // For now, return formatted text that could be converted to PDF
    return `
STUDENT PROGRESS REPORT
======================

Student: ${data.student_name}
Generated: ${new Date(data.generated_at).toLocaleDateString()}

OVERALL PROGRESS
- Completion: ${data.overall_progress.completion_percentage}%
- Time Spent: ${data.overall_progress.total_time_spent} minutes
- Lessons: ${data.overall_progress.lessons_completed}/${data.overall_progress.total_lessons}

SUBJECT BREAKDOWN
${data.subjects.map((s: any) => `
- ${s.subject_name}: ${s.completion_percentage}% (${s.completed_lessons}/${s.total_lessons} lessons, ${s.time_spent} min)`).join('')}

STRENGTHS
${data.strengths.map((s: string) => `- ${s}`).join('\n')}

AREAS FOR IMPROVEMENT
${data.weak_areas.map((s: string) => `- ${s}`).join('\n')}

Last Activity: ${data.last_activity ? new Date(data.last_activity).toLocaleDateString() : 'No recent activity'}
    `;
  };

  const addStudentRelationship = async (studentEmail: string) => {
    if (!user) return false;

    try {
      // Find student by email (this would need to be implemented based on your auth setup)
      // For now, we'll assume you have the student ID
      const relationshipTable = userRole === 'parent' 
        ? 'parent_child_relationships' 
        : 'teacher_student_relationships';
      
      const relationshipData = userRole === 'parent'
        ? { parent_id: user.id, child_id: studentEmail } // This should be student ID
        : { teacher_id: user.id, student_id: studentEmail }; // This should be student ID

      const { error } = await supabase
        .from(relationshipTable)
        .insert(relationshipData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Student relationship added successfully",
      });

      await fetchStudentProgress();
      return true;
    } catch (error: any) {
      console.error('Error adding student relationship:', error);
      toast({
        title: "Error",
        description: "Failed to add student relationship",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    studentProgress,
    userRole,
    isLoading,
    fetchStudentProgress,
    generateReport,
    addStudentRelationship
  };
};
