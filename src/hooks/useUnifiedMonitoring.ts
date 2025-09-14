import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getDemoStudentProgress, getDemoMonitoringOverviewStats } from '@/utils/demoData';

export interface UnifiedStudentProgress {
  student_id: string;
  student_name: string;
  email?: string;
  completion_percentage: number;
  total_time_spent: number; // in minutes
  completed_lessons: number;
  total_lessons: number;
  last_activity: string;
  subjects_active: number;
  avg_score: number;
  achievements_count: number;
  subjects: SubjectProgress[];
  strengths: string[];
  weak_areas: string[];
  test_scores: TestScore[];
  response_analytics: ResponseAnalytics;
  activity_trend: ActivityTrend[];
  performance_insights: string[];
}

export interface SubjectProgress {
  subject_name: string;
  completion_percentage: number;
  lessons_completed: number;
  total_lessons: number;
  time_spent: number;
  avg_score: number;
}

export interface TestScore {
  test_name: string;
  score: number;
  percentage: number;
  completed_at: string;
  subject: string;
}

export interface ResponseAnalytics {
  average_response_time: number;
  quiz_performance_trend: number[];
  fast_response_topics: string[];
  slow_response_topics: string[];
  accuracy_by_topic: { [topic: string]: number };
}

export interface ActivityTrend {
  date: string;
  time_spent: number;
  lessons_completed: number;
  score_average: number;
}

export interface OverviewStats {
  totalStudents: number;
  avgCompletion: number;
  totalStudyTime: number;
  totalLessonsCompleted: number;
  totalTests: number;
  totalCurricula: number;
  totalQuests: number;
  totalAchievements: number;
  activeToday: number;
  weeklyGrowth: number;
}

// Demo data helpers
const generateDemoActivityTrend = (): ActivityTrend[] => {
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    last7Days.push({
      date: date.toISOString().split('T')[0],
      time_spent: Math.floor(Math.random() * 60) + 15,
      lessons_completed: Math.floor(Math.random() * 5) + 1,
      score_average: Math.floor(Math.random() * 30) + 70
    });
  }
  return last7Days;
};

const generateDemoInsights = (student: any): string[] => {
  const insights = [];
  if (student.completion_percentage >= 80) {
    insights.push("Excellent progress across all subjects");
  }
  if (student.strengths.length > 0) {
    insights.push(`Strong performance in ${student.strengths[0]}`);
  }
  insights.push("Consistent daily engagement with learning materials");
  return insights;
};

const inferSubjectFromTestName = (testName: string): string => {
  const lowerName = testName.toLowerCase();
  
  if (lowerName.includes('math') || lowerName.includes('algebra') || lowerName.includes('geometry') || lowerName.includes('calculus')) {
    return 'Mathematics';
  } else if (lowerName.includes('science') || lowerName.includes('physics') || lowerName.includes('chemistry') || lowerName.includes('biology')) {
    return 'Science';
  } else if (lowerName.includes('english') || lowerName.includes('reading') || lowerName.includes('writing') || lowerName.includes('language')) {
    return 'English';
  } else if (lowerName.includes('history') || lowerName.includes('social') || lowerName.includes('geography')) {
    return 'Social Studies';
  } else {
    return 'General';
  }
};

export const useUnifiedMonitoring = () => {
  const { user } = useAuth();
  const [studentProgress, setStudentProgress] = useState<UnifiedStudentProgress[]>([]);
  const [overviewStats, setOverviewStats] = useState<OverviewStats>({
    totalStudents: 0,
    avgCompletion: 0,
    totalStudyTime: 0,
    totalLessonsCompleted: 0,
    totalTests: 0,
    totalCurricula: 0,
    totalQuests: 0,
    totalAchievements: 0,
    activeToday: 0,
    weeklyGrowth: 0
  });
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) {
      // Not authenticated — return empty real-data state
      setStudentProgress([]);
      setOverviewStats({
        totalStudents: 0,
        avgCompletion: 0,
        totalStudyTime: 0,
        totalLessonsCompleted: 0,
        totalTests: 0,
        totalCurricula: 0,
        totalQuests: 0,
        totalAchievements: 0,
        activeToday: 0,
        weeklyGrowth: 0
      });
      setLastRefresh(new Date());
      return;
    }

    await fetchUnifiedMonitoringData();
  };

  // Real-time subscription for monitoring updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('monitoring-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_progress'
        },
        () => {
          console.log('Real-time monitoring update received');
          fetchUnifiedMonitoringData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchUnifiedMonitoringData = async () => {
    if (!user) return await fetchData();

    setLoading(true);
    try {
      console.log('Fetching unified monitoring data...');
      
      // Get user's accessible students
      const studentIds = await getAccessibleStudents();
      
      if (studentIds.length === 0) {
        console.log('No accessible students found');
        setStudentProgress([]);
        setOverviewStats({
          totalStudents: 0,
          avgCompletion: 0,
          totalStudyTime: 0,
          totalLessonsCompleted: 0,
          totalTests: 0,
          totalCurricula: 0,
          totalQuests: 0,
          totalAchievements: 0,
          activeToday: 0,
          weeklyGrowth: 0
        });
        setLastRefresh(new Date());
        setLoading(false);
        return;
      }

      // Fetch core data in parallel
      const [
        profilesResult,
        progressResult,
        testAttemptsResult,
        interactionsResult,
        achievementsResult,
        overviewResult
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', studentIds),
        
        supabase
          .from('user_progress')
          .select(`
            user_id,
            lesson_id,
            completion_percentage,
            time_spent,
            status,
            updated_at,
            lessons (
              id,
              name,
              modules (
                id,
                name,
                subjects (id, name)
              )
            )
          `)
          .in('user_id', studentIds),
        
        supabase
          .from('test_attempts')
          .select(`
            student_id,
            score,
            percentage,
            completed_at,
            tests (title, subject)
          `)
          .in('student_id', studentIds)
          .order('completed_at', { ascending: false }),
        
        supabase
          .from('student_interactions')
          .select('*')
          .in('student_id', studentIds)
          .order('created_at', { ascending: false })
          .limit(1000),
        
        supabase
          .from('user_achievements')
          .select(`
            user_id,
            earned_at,
            achievements (name, points)
          `)
          .in('user_id', studentIds),
        
        fetchOverviewStats(studentIds)
      ]);

      console.log('Data fetched:', {
        profiles: profilesResult.data?.length || 0,
        progress: progressResult.data?.length || 0,
        tests: testAttemptsResult.data?.length || 0,
        interactions: interactionsResult.data?.length || 0,
        achievements: achievementsResult.data?.length || 0
      });

      const profiles = profilesResult.data || [];
      const progressData = progressResult.data || [];
      const testAttempts = testAttemptsResult.data || [];
      const interactions = interactionsResult.data || [];
      const achievements = achievementsResult.data || [];

      // Process unified student data
      const unifiedStudentData = await processUnifiedStudentData(
        studentIds,
        profiles,
        progressData,
        testAttempts,
        interactions,
        achievements
      );

      // If no real data, keep empty state
      if (unifiedStudentData.length === 0) {
        console.log('No real data found');
        setStudentProgress([]);
        setOverviewStats(overviewResult);
      } else {
        setStudentProgress(unifiedStudentData);
        setOverviewStats(overviewResult);
      }
      setLastRefresh(new Date());

    } catch (error: any) {
      console.error('Error fetching unified monitoring data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch monitoring data: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getAccessibleStudents = async (): Promise<string[]> => {
    if (!user) return [];

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
        // Check for parent relationships
        const { data: parentChildren } = await supabase
          .from('parent_child_relationships')
          .select('child_id')
          .eq('parent_id', user.id);

        if (parentChildren?.length) {
          studentIds = parentChildren.map(c => c.child_id);
        } else {
          // Check for teacher relationships
          const { data: teacherStudents } = await supabase
            .from('teacher_student_relationships')
            .select('student_id')
            .eq('teacher_id', user.id);

          if (teacherStudents?.length) {
            studentIds = teacherStudents.map(t => t.student_id);
          } else {
            // Assume this user is a student and show their own data
            studentIds = [user.id];
          }
        }
      }

      return studentIds;
    } catch (error) {
      console.error('Error getting accessible students:', error);
      return [];
    }
  };

  const processUnifiedStudentData = async (
    studentIds: string[],
    profiles: any[],
    progressData: any[],
    testAttempts: any[],
    interactions: any[],
    achievements: any[]
  ): Promise<UnifiedStudentProgress[]> => {
    
    return studentIds.map(studentId => {
      const profile = profiles.find(p => p.id === studentId);
      const studentProgress = progressData.filter(p => p.user_id === studentId);
      const studentTests = testAttempts.filter(t => t.student_id === studentId);
      const studentInteractions = interactions.filter(i => i.student_id === studentId);
      const studentAchievements = achievements.filter(a => a.user_id === studentId);

      // Calculate basic stats
      const completedLessons = studentProgress.filter(p => p.status === 'completed');
      const totalLessons = studentProgress.length;
      const totalTimeSpent = studentProgress.reduce((sum, p) => sum + (p.time_spent || 0), 0);
      const completionPercentage = totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0;
      
      const lastActivity = studentProgress
        .filter(p => p.updated_at)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]?.updated_at || '';

      const avgScore = studentTests.length > 0 
        ? Math.round(studentTests.reduce((sum, t) => sum + (t.percentage || 0), 0) / studentTests.length)
        : 0;

      // Process subjects
      const subjectMap = new Map();
      studentProgress.forEach(progress => {
        const subject = progress.lessons?.modules?.subjects;
        if (!subject) return;

        if (!subjectMap.has(subject.id)) {
          subjectMap.set(subject.id, {
            subject_name: subject.name,
            completed_lessons: 0,
            total_lessons: 0,
            time_spent: 0,
            completion_percentage: 0,
            avg_score: 0
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

      // Process test scores
      const testScores: TestScore[] = studentTests.map(test => ({
        test_name: test.tests?.title || 'Unknown Test',
        score: test.score || 0,
        percentage: test.percentage || 0,
        completed_at: test.completed_at || '',
        subject: test.tests?.subject || 'General'
      }));

      // Process response analytics
      const responseAnalytics = processResponseAnalytics(studentInteractions, testScores);

      // Generate activity trend (last 7 days)
      const activityTrend = generateActivityTrend(studentProgress, studentTests);

      // Calculate strengths and weaknesses
      const strengths = subjects
        .filter(s => s.completion_percentage >= 80)
        .map(s => s.subject_name);

      const testStrengths = testScores
        .filter(t => t.percentage >= 80)
        .map(t => t.subject)
        .filter((subject, index, arr) => arr.indexOf(subject) === index);

      const allStrengths = [...new Set([...strengths, ...testStrengths])];

      const weakAreas = subjects
        .filter(s => s.completion_percentage < 50 && s.total_lessons > 0)
        .map(s => s.subject_name);

      const testWeakAreas = testScores
        .filter(t => t.percentage < 60)
        .map(t => t.subject)
        .filter((subject, index, arr) => arr.indexOf(subject) === index);

      const allWeakAreas = [...new Set([...weakAreas, ...testWeakAreas])];

      // Generate performance insights
      const performanceInsights = generatePerformanceInsights(
        { completion_percentage: completionPercentage, avg_score: avgScore },
        subjects,
        testScores,
        responseAnalytics
      );

      return {
        student_id: studentId,
        student_name: profile?.display_name || 'Student',
        email: '', // Not exposed for privacy
        completion_percentage: completionPercentage,
        total_time_spent: totalTimeSpent,
        completed_lessons: completedLessons.length,
        total_lessons: totalLessons,
        last_activity: lastActivity,
        subjects_active: subjects.length,
        avg_score: avgScore,
        achievements_count: studentAchievements.length,
        subjects,
        strengths: allStrengths,
        weak_areas: allWeakAreas,
        test_scores: testScores,
        response_analytics: responseAnalytics,
        activity_trend: activityTrend,
        performance_insights: performanceInsights
      };
    });
  };

  const processResponseAnalytics = (interactions: any[], testScores: TestScore[]): ResponseAnalytics => {
    const responseTimes = interactions
      .filter(i => i.response_time_ms)
      .map(i => i.response_time_ms);
    
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    const quizPerformanceTrend = testScores.slice(0, 10).reverse().map(t => t.percentage);

    const topicResponseTimes = new Map();
    interactions.forEach(interaction => {
      const topic = interaction.topic_identified || 'General';
      const responseTime = interaction.response_time_ms || 0;
      
      if (!topicResponseTimes.has(topic)) {
        topicResponseTimes.set(topic, []);
      }
      topicResponseTimes.get(topic).push(responseTime);
    });

    const fastResponseTopics: string[] = [];
    const slowResponseTopics: string[] = [];
    const accuracyByTopic: { [topic: string]: number } = {};

    topicResponseTimes.forEach((times, topic) => {
      const avgTime = times.reduce((sum: number, time: number) => sum + time, 0) / times.length;
      
      if (avgTime < 5000 && times.length >= 3) {
        fastResponseTopics.push(topic);
      } else if (avgTime > 15000 && times.length >= 3) {
        slowResponseTopics.push(topic);
      }

      const topicInteractions = interactions.filter(i => i.topic_identified === topic);
      const correctInteractions = topicInteractions.filter(i => i.understanding_score >= 0.7);
      accuracyByTopic[topic] = topicInteractions.length > 0 
        ? (correctInteractions.length / topicInteractions.length) * 100 
        : 0;
    });

    return {
      average_response_time: Math.round(averageResponseTime),
      quiz_performance_trend: quizPerformanceTrend,
      fast_response_topics: fastResponseTopics,
      slow_response_topics: slowResponseTopics,
      accuracy_by_topic: accuracyByTopic
    };
  };

  const generateActivityTrend = (progress: any[], tests: any[]): ActivityTrend[] => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last7Days.push(date.toISOString().split('T')[0]);
    }

    return last7Days.map(date => {
      const dayProgress = progress.filter(p => 
        p.updated_at && p.updated_at.startsWith(date)
      );
      const dayTests = tests.filter(t => 
        t.completed_at && t.completed_at.startsWith(date)
      );

      return {
        date,
        time_spent: dayProgress.reduce((sum, p) => sum + (p.time_spent || 0), 0),
        lessons_completed: dayProgress.filter(p => p.status === 'completed').length,
        score_average: dayTests.length > 0 
          ? dayTests.reduce((sum, t) => sum + (t.percentage || 0), 0) / dayTests.length
          : 0
      };
    });
  };

  const generatePerformanceInsights = (
    basicStats: { completion_percentage: number; avg_score: number },
    subjects: SubjectProgress[],
    testScores: TestScore[],
    analytics: ResponseAnalytics
  ): string[] => {
    const insights: string[] = [];

    if (basicStats.completion_percentage >= 80) {
      insights.push("Excellent overall progress - consistently meeting learning goals");
    } else if (basicStats.completion_percentage >= 60) {
      insights.push("Good progress with room for improvement in consistency");
    } else {
      insights.push("Needs focused attention to improve learning momentum");
    }

    if (analytics.fast_response_topics.length > 2) {
      insights.push(`Quick mastery demonstrated in ${analytics.fast_response_topics.length} topics`);
    }

    if (testScores.length > 0) {
      const avgTestScore = testScores.reduce((sum, t) => sum + t.percentage, 0) / testScores.length;
      if (avgTestScore >= 85) {
        insights.push("Strong assessment performance across subjects");
      } else if (avgTestScore < 60) {
        insights.push("Assessment scores indicate need for additional support");
      }
    }

    if (subjects.length > 0) {
      const strongSubjects = subjects.filter(s => s.completion_percentage >= 80);
      if (strongSubjects.length > 0) {
        insights.push(`Excelling in: ${strongSubjects.map(s => s.subject_name).join(', ')}`);
      }
    }

    return insights;
  };

  const fetchOverviewStats = async (studentIds: string[]): Promise<OverviewStats> => {
    try {
      const [testsData, curriculaData, questsData, achievementsData] = await Promise.all([
        supabase.from('tests').select('id', { count: 'exact' }),
        supabase.from('curricula').select('id', { count: 'exact' }),
        supabase.from('quests').select('id', { count: 'exact' }),
        supabase.from('achievements').select('id', { count: 'exact' })
      ]);

      // Calculate stats from student progress
      const totalStudents = studentIds.length;
      
      // Today's active students based on recent updates in progress or activity logs
      const today = new Date().toISOString().split('T')[0];
      const [{ data: todayProgress }, { data: todayActivityLogs }] = await Promise.all([
        supabase
          .from('user_progress')
          .select('user_id, updated_at')
          .in('user_id', studentIds)
          .gte('updated_at', today),
        supabase
          .from('student_activity_logs')
          .select('student_id, created_at')
          .in('student_id', studentIds)
          .gte('created_at', today),
      ]);

      const activeToday = new Set([
        ...(todayProgress?.map(a => a.user_id) || []),
        ...(todayActivityLogs?.map(a => a.student_id) || []),
      ]).size;

      // Aggregated stats
      const [{ data: allProgress }, { data: allActivityLogs }] = await Promise.all([
        supabase
          .from('user_progress')
          .select('user_id, time_spent, status')
          .in('user_id', studentIds),
        supabase
          .from('student_activity_logs')
          .select('student_id, duration_minutes')
          .in('student_id', studentIds),
      ]);

      const totalStudyMinutes =
        (allProgress?.reduce((sum, p) => sum + (p.time_spent || 0), 0) || 0) +
        (allActivityLogs?.reduce((sum, a) => sum + (a.duration_minutes || 0), 0) || 0);

      const totalStudyTime = Math.round(totalStudyMinutes / 60);

      const totalLessonsCompleted = allProgress?.filter(p => p.status === 'completed').length || 0;
      const totalLessons = allProgress?.length || 0;
      const avgCompletion = totalLessons > 0 ? Math.round((totalLessonsCompleted / totalLessons) * 100) : 0;

      return {
        totalStudents,
        avgCompletion,
        totalStudyTime,
        totalLessonsCompleted,
        totalTests: testsData.count || 0,
        totalCurricula: curriculaData.count || 0,
        totalQuests: questsData.count || 0,
        totalAchievements: achievementsData.count || 0,
        activeToday,
        weeklyGrowth: 5 // Placeholder - requires historical comparisons
      };
    } catch (error) {
      console.error('Error fetching overview stats:', error);
      return {
        totalStudents: 0,
        avgCompletion: 0,
        totalStudyTime: 0,
        totalLessonsCompleted: 0,
        totalTests: 0,
        totalCurricula: 0,
        totalQuests: 0,
        totalAchievements: 0,
        activeToday: 0,
        weeklyGrowth: 0
      };
    }
  };

  const generateReport = async (studentId: string, format: 'pdf' | 'csv' = 'pdf') => {
    const student = studentProgress.find(s => s.student_id === studentId);
    if (!student) return null;

    const reportData = {
      student_name: student.student_name,
      generated_at: new Date().toISOString(),
      overall_progress: {
        completion_percentage: student.completion_percentage,
        total_time_spent: student.total_time_spent,
        lessons_completed: student.completed_lessons,
        total_lessons: student.total_lessons,
        avg_score: student.avg_score
      },
      subjects: student.subjects,
      strengths: student.strengths,
      weak_areas: student.weak_areas,
      test_scores: student.test_scores,
      response_analytics: student.response_analytics,
      performance_insights: student.performance_insights,
      activity_trend: student.activity_trend
    };

    if (format === 'csv') {
      return generateCSVReport(reportData);
    } else {
      return generatePDFReport(reportData);
    }
  };

  const generateCSVReport = (data: any): string => {
    const csvContent = [
      ['Student Comprehensive Report'],
      ['Student Name', data.student_name],
      ['Generated At', new Date(data.generated_at).toLocaleDateString()],
      [''],
      ['Overall Progress'],
      ['Completion Percentage', `${data.overall_progress.completion_percentage}%`],
      ['Total Time Spent', `${data.overall_progress.total_time_spent} minutes`],
      ['Lessons Completed', `${data.overall_progress.lessons_completed}/${data.overall_progress.total_lessons}`],
      ['Average Score', `${data.overall_progress.avg_score}%`],
      [''],
      ['Performance Insights'],
      ...data.performance_insights.map((insight: string) => [insight]),
      [''],
      ['Test Results'],
      ['Test', 'Score', 'Percentage', 'Subject', 'Date'],
      ...data.test_scores.map((test: any) => [
        test.test_name,
        test.score,
        `${test.percentage}%`,
        test.subject,
        new Date(test.completed_at).toLocaleDateString()
      ]),
      [''],
      ['Subject Progress'],
      ['Subject', 'Completion %', 'Time Spent', 'Lessons Completed'],
      ...data.subjects.map((s: any) => [
        s.subject_name,
        `${s.completion_percentage}%`,
        `${s.time_spent} min`,
        `${s.lessons_completed}/${s.total_lessons}`
      ]),
      [''],
      ['Strengths', data.strengths.join(', ')],
      ['Areas for Improvement', data.weak_areas.join(', ')]
    ].map(row => row.join(',')).join('\n');

    return csvContent;
  };

  const generatePDFReport = (data: any): string => {
    return `
COMPREHENSIVE STUDENT PROGRESS REPORT
===================================

Student: ${data.student_name}
Generated: ${new Date(data.generated_at).toLocaleDateString()}

PERFORMANCE INSIGHTS
${data.performance_insights.map((insight: string) => `• ${insight}`).join('\n')}

OVERALL PROGRESS
• Completion: ${data.overall_progress.completion_percentage}%
• Time Spent: ${data.overall_progress.total_time_spent} minutes
• Lessons: ${data.overall_progress.lessons_completed}/${data.overall_progress.total_lessons}
• Average Score: ${data.overall_progress.avg_score}%

TEST RESULTS
${data.test_scores.map((test: any) => `• ${test.test_name}: ${test.percentage}% (${test.subject}) - ${new Date(test.completed_at).toLocaleDateString()}`).join('\n')}

RESPONSE ANALYTICS
• Average Response Time: ${Math.round(data.response_analytics.average_response_time/1000)} seconds
• Quick Response Topics: ${data.response_analytics.fast_response_topics.join(', ')}
• Slower Response Topics: ${data.response_analytics.slow_response_topics.join(', ')}

SUBJECT BREAKDOWN
${data.subjects.map((s: any) => `• ${s.subject_name}: ${s.completion_percentage}% (${s.lessons_completed}/${s.total_lessons} lessons, ${s.time_spent} min)`).join('\n')}

STRENGTHS
${data.strengths.map((s: string) => `• ${s}`).join('\n')}

AREAS FOR IMPROVEMENT
${data.weak_areas.map((s: string) => `• ${s}`).join('\n')}

ACTIVITY TREND (Last 7 Days)
${data.activity_trend.map((day: any) => `• ${day.date}: ${day.time_spent}min study, ${day.lessons_completed} lessons, ${Math.round(day.score_average)}% avg score`).join('\n')}
    `;
  };

  const refreshData = () => {
    fetchUnifiedMonitoringData();
  };

  return {
    studentProgress,
    overviewStats,
    loading,
    lastRefresh,
    fetchUnifiedMonitoringData: refreshData,
    generateReport,
    refreshData
  };
};