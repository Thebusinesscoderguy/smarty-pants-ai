import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getDemoStudentProgress, getDemoMonitoringOverviewStats } from '@/utils/demoData';

export interface StudentProgress {
  student_id: string;
  student_name: string;
  email: string;
  completion_percentage: number;
  total_time_spent: number;
  completed_lessons: number;
  total_lessons: number;
  last_activity: string;
  subjects: Array<{
    subject_name: string;
    completion_percentage: number;
    lessons_completed: number;
    total_lessons: number;
    time_spent: number;
  }>;
  strengths: string[];
  weak_areas: string[];
  test_scores: Array<{
    test_name: string;
    score: number;
    percentage: number;
    completed_at: string;
  }>;
  achievements: Array<{
    name: string;
    earned_at: string;
    points: number;
  }>;
}

export const useMonitoringData = () => {
  const { user } = useAuth();
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [overviewStats, setOverviewStats] = useState({
    totalStudents: 0,
    avgCompletion: 0,
    totalStudyTime: 0,
    totalLessonsCompleted: 0,
    totalTests: 0,
    totalCurricula: 0,
    totalQuests: 0,
    totalAchievements: 0
  });
  const [loading, setLoading] = useState(false);

  // Use demo data when not authenticated or in demo mode
  const useDemoData = !user || window.location.href.includes('demo');

  useEffect(() => {
    if (useDemoData) {
      setStudentProgress(getDemoStudentProgress());
      setOverviewStats(getDemoMonitoringOverviewStats());
      return;
    }
    fetchStudentProgress();
  }, [user, useDemoData]);

  const fetchStudentProgress = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Check if user is school admin
      const { data: schoolData } = await supabase
        .from('school_accounts')
        .select('id')
        .eq('admin_user_id', user.id)
        .single();

      let studentIds: string[] = [];

      if (schoolData) {
        // Get school students
        const { data: schoolStudents } = await supabase
          .from('school_student_relationships')
          .select('student_id')
          .eq('school_id', schoolData.id)
          .eq('is_active', true);

        studentIds = schoolStudents?.map(s => s.student_id) || [];
      } else {
        // Get children for parents
        const { data: parentChildren } = await supabase
          .from('parent_child_relationships')
          .select('child_id')
          .eq('parent_id', user.id);

        studentIds = parentChildren?.map(c => c.child_id) || [];
      }

      if (studentIds.length === 0) {
        // No relationships found; assume this user is a student and show their own data
        studentIds = [user.id];
      }

      // Fetch core datasets in parallel for speed
      const [profilesRes, progressRes, testAttemptsRes, userAchievementsRes] = await Promise.all([
        supabase.from('profiles').select('id, display_name').in('id', studentIds),
        supabase.from('user_progress').select('*').in('user_id', studentIds),
        supabase.from('test_attempts').select(`*, tests(title)`).in('student_id', studentIds),
        supabase.from('user_achievements').select(`*, achievements(name, points)`).in('user_id', studentIds),
      ]);

      const profiles = profilesRes?.data || [];
      const progressData = progressRes?.data || [];
      const testAttempts = testAttemptsRes?.data || [];
      const userAchievements = userAchievementsRes?.data || [];

      // Fallback if profiles table is empty or not accessible
      const safeProfiles = (profiles.length ? profiles : studentIds.map(id => ({ id, display_name: 'Student' }))) as Array<{ id: string; display_name: string | null }>;

      const studentProgressData: StudentProgress[] = (safeProfiles || []).map(profile => {
        const studentProgress = (progressData || []).filter(p => p.user_id === profile.id);
        const studentTests = (testAttempts || []).filter(t => t.student_id === profile.id);
        const studentAchievementsForUser = (userAchievements || []).filter(a => a.user_id === profile.id);

        const totalTime = studentProgress.reduce((sum, p) => sum + (p.time_spent || 0), 0);
        const completedLessons = studentProgress.filter(p => p.status === 'completed').length;
        const totalLessons = studentProgress.length;
        const completionPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        const lastActivity = studentProgress.length > 0 
          ? studentProgress.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0].updated_at
          : '';

        return {
          student_id: profile.id,
          student_name: profile.display_name || 'Student',
          email: '',
          completion_percentage: completionPercentage,
          total_time_spent: totalTime,
          completed_lessons: completedLessons,
          total_lessons: totalLessons,
          last_activity: lastActivity,
          subjects: [],
          strengths: [],
          weak_areas: [],  
          test_scores: studentTests.map(test => ({
            test_name: test.tests?.title || 'Unknown Test',
            score: test.score || 0,
            percentage: test.percentage || 0,
            completed_at: test.completed_at || ''
          })),
          achievements: studentAchievementsForUser.map(achievement => ({
            name: achievement.achievements?.name || 'Unknown Achievement',
            earned_at: achievement.earned_at || '',
            points: achievement.achievements?.points || 0
          }))
        };
      });

      setStudentProgress(studentProgressData);

      // Calculate overview stats
      const totalStudents = studentProgressData.length;
      const avgCompletion = totalStudents > 0 
        ? Math.round(studentProgressData.reduce((sum, s) => sum + s.completion_percentage, 0) / totalStudents)
        : 0;
      const totalStudyTime = Math.round(studentProgressData.reduce((sum, s) => sum + s.total_time_spent, 0) / 60);
      const totalLessonsCompleted = studentProgressData.reduce((sum, s) => sum + s.completed_lessons, 0);

      const [testsData, curriculaData, questsData, achievementsData] = await Promise.all([
        supabase.from('tests').select('id', { count: 'exact' }).eq('creator_id', user.id),
        supabase.from('curricula').select('id', { count: 'exact' }),
        supabase.from('quests').select('id', { count: 'exact' }).eq('created_by_id', user.id),
        supabase.from('achievements').select('id', { count: 'exact' }).eq('creator_id', user.id)
      ]);

      setOverviewStats({
        totalStudents,
        avgCompletion,
        totalStudyTime,
        totalLessonsCompleted,
        totalTests: testsData.count || 0,
        totalCurricula: curriculaData.count || 0,
        totalQuests: questsData.count || 0,
        totalAchievements: achievementsData.count || 0
      });

    } catch (error: any) {
      console.error('Error fetching student progress:', error);
      toast({
        title: "Error",
        description: "Failed to fetch student progress: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  return {
    studentProgress,
    overviewStats,
    loading,
    fetchStudentProgress
  };
};