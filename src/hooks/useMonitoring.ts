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
  test_results: TestResult[];
  response_analytics: ResponseAnalytics;
}

export interface SubjectProgress {
  subject_name: string;
  completion_percentage: number;
  time_spent: number;
  lessons_completed: number;
  total_lessons: number;
}

export interface TestResult {
  test_id: string;
  test_title: string;
  score: number;
  total_points: number;
  percentage: number;
  completed_at: string;
  time_taken_minutes: number;
  subject: string;
}

export interface ResponseAnalytics {
  average_response_time: number;
  quiz_performance_trend: number[];
  fast_response_topics: string[];
  slow_response_topics: string[];
  accuracy_by_topic: { [topic: string]: number };
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

        // Get test results
        const { data: testResults } = await supabase
          .from('test_attempts')
          .select(`
            *,
            tests (
              title,
              subject,
              total_points
            )
          `)
          .eq('student_id', studentId)
          .order('completed_at', { ascending: false });

        // Get response analytics
        const { data: interactionData } = await supabase
          .from('student_interactions')
          .select('*')
          .eq('student_id', studentId)
          .order('created_at', { ascending: false })
          .limit(100);

        // Process the data
        const processedData = processStudentData(
          studentId,
          profile?.display_name || 'Unknown Student',
          progressData || [],
          testResults || [],
          interactionData || []
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
    progressData: any[],
    testResults: any[],
    interactionData: any[]
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

    // Process test results
    const processedTestResults: TestResult[] = testResults.map(result => ({
      test_id: result.test_id,
      test_title: result.tests?.title || 'Unknown Test',
      score: result.score || 0,
      total_points: result.tests?.total_points || 0,
      percentage: result.tests?.total_points > 0 
        ? Math.round((result.score / result.tests.total_points) * 100) 
        : 0,
      completed_at: result.completed_at,
      time_taken_minutes: result.time_taken_minutes || 0,
      subject: result.tests?.subject || 'General'
    }));

    // Process response analytics
    const responseAnalytics = processResponseAnalytics(interactionData, processedTestResults);

    // Identify strengths and weak areas (including test performance)
    const strengths = subjects
      .filter(s => s.completion_percentage >= 80)
      .map(s => s.subject_name);

    // Add test-based strengths
    const testStrengths = processedTestResults
      .filter(t => t.percentage >= 80)
      .map(t => t.subject)
      .filter((subject, index, arr) => arr.indexOf(subject) === index);

    const allStrengths = [...new Set([...strengths, ...testStrengths])];

    const weakAreas = subjects
      .filter(s => s.completion_percentage < 50 && s.total_lessons > 0)
      .map(s => s.subject_name);

    // Add test-based weak areas
    const testWeakAreas = processedTestResults
      .filter(t => t.percentage < 60)
      .map(t => t.subject)
      .filter((subject, index, arr) => arr.indexOf(subject) === index);

    const allWeakAreas = [...new Set([...weakAreas, ...testWeakAreas])];

    return {
      student_id: studentId,
      student_name: studentName,
      total_lessons: totalLessons,
      completed_lessons: completedLessons.length,
      completion_percentage: totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0,
      total_time_spent: totalTimeSpent,
      last_activity: lastActivity,
      subjects,
      strengths: allStrengths,
      weak_areas: allWeakAreas,
      test_results: processedTestResults,
      response_analytics: responseAnalytics
    };
  };

  const processResponseAnalytics = (interactionData: any[], testResults: TestResult[]): ResponseAnalytics => {
    // Calculate average response time
    const responseTimes = interactionData
      .filter(i => i.response_time_ms)
      .map(i => i.response_time_ms);
    
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    // Quiz performance trend (last 10 test scores)
    const recentTests = testResults.slice(0, 10).reverse();
    const quizPerformanceTrend = recentTests.map(t => t.percentage);

    // Fast/slow response topics
    const topicResponseTimes = new Map();
    interactionData.forEach(interaction => {
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
      
      if (avgTime < 5000 && times.length >= 3) { // Less than 5 seconds, with enough data
        fastResponseTopics.push(topic);
      } else if (avgTime > 15000 && times.length >= 3) { // More than 15 seconds
        slowResponseTopics.push(topic);
      }

      // Calculate accuracy for this topic
      const topicInteractions = interactionData.filter(i => i.topic_identified === topic);
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

  const generateReport = async (studentId: string, format: 'pdf' | 'csv' = 'pdf') => {
    const student = studentProgress.find(s => s.student_id === studentId);
    if (!student) return null;

    // Generate comprehensive report data including test results
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
      last_activity: student.last_activity,
      test_results: student.test_results,
      response_analytics: student.response_analytics,
      summary: generateStudentSummary(student)
    };

    if (format === 'csv') {
      return generateCSVReport(reportData);
    } else {
      return generatePDFReport(reportData);
    }
  };

  const generateStudentSummary = (student: StudentProgress): string => {
    const testAverage = student.test_results.length > 0 
      ? student.test_results.reduce((sum, test) => sum + test.percentage, 0) / student.test_results.length 
      : 0;

    const responseTime = student.response_analytics.average_response_time;
    const responseSpeed = responseTime < 5000 ? 'quick' : responseTime > 15000 ? 'deliberate' : 'moderate';

    let summary = `${student.student_name} shows ${student.completion_percentage}% completion across learning modules`;
    
    if (student.test_results.length > 0) {
      summary += ` with an average test score of ${Math.round(testAverage)}%`;
    }

    summary += `. Response patterns indicate ${responseSpeed} thinking with an average response time of ${Math.round(responseTime/1000)} seconds.`;

    if (student.strengths.length > 0) {
      summary += ` Strong performance noted in: ${student.strengths.join(', ')}.`;
    }

    if (student.weak_areas.length > 0) {
      summary += ` Areas needing attention include: ${student.weak_areas.join(', ')}.`;
    }

    if (student.response_analytics.fast_response_topics.length > 0) {
      summary += ` Quick mastery demonstrated in: ${student.response_analytics.fast_response_topics.join(', ')}.`;
    }

    return summary;
  };

  const generateCSVReport = (data: any) => {
    const csvContent = [
      ['Student Report'],
      ['Student Name', data.student_name],
      ['Generated At', new Date(data.generated_at).toLocaleDateString()],
      [''],
      ['Summary'],
      [data.summary],
      [''],
      ['Overall Progress'],
      ['Completion Percentage', `${data.overall_progress.completion_percentage}%`],
      ['Total Time Spent', `${data.overall_progress.total_time_spent} minutes`],
      ['Lessons Completed', `${data.overall_progress.lessons_completed}/${data.overall_progress.total_lessons}`],
      [''],
      ['Test Results'],
      ['Test', 'Score', 'Percentage', 'Time Taken'],
      ...data.test_results.map((test: any) => [
        test.test_title,
        `${test.score}/${test.total_points}`,
        `${test.percentage}%`,
        `${test.time_taken_minutes} min`
      ]),
      [''],
      ['Response Analytics'],
      ['Average Response Time', `${Math.round(data.response_analytics.average_response_time/1000)} seconds`],
      ['Fast Response Topics', data.response_analytics.fast_response_topics.join(', ')],
      ['Slow Response Topics', data.response_analytics.slow_response_topics.join(', ')],
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
    return `
STUDENT PROGRESS REPORT
======================

Student: ${data.student_name}
Generated: ${new Date(data.generated_at).toLocaleDateString()}

SUMMARY
${data.summary}

OVERALL PROGRESS
- Completion: ${data.overall_progress.completion_percentage}%
- Time Spent: ${data.overall_progress.total_time_spent} minutes
- Lessons: ${data.overall_progress.lessons_completed}/${data.overall_progress.total_lessons}

TEST RESULTS
${data.test_results.map((test: any) => `
- ${test.test_title}: ${test.score}/${test.total_points} (${test.percentage}%) - ${test.time_taken_minutes} min`).join('')}

RESPONSE ANALYTICS
- Average Response Time: ${Math.round(data.response_analytics.average_response_time/1000)} seconds
- Quick Response Topics: ${data.response_analytics.fast_response_topics.join(', ')}
- Slower Response Topics: ${data.response_analytics.slow_response_topics.join(', ')}

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
