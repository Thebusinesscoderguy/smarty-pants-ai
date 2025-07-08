import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface AIStudentSummary {
  id: string;
  student_id: string;
  summary_text: string;
  strengths: string[];
  weaknesses: string[];
  improvement_metrics: Record<string, any>;
  generated_at: string;
  expires_at: string;
  student_name?: string;
}

export const useAISummaries = () => {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<AIStudentSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSummaries = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get school account
      const { data: schoolData } = await supabase
        .from('school_accounts')
        .select('id')
        .eq('admin_user_id', user.id)
        .single();

      if (!schoolData) {
        setSummaries([]);
        return;
      }

      // Get students in school
      const { data: relationships } = await supabase
        .from('school_student_relationships')
        .select('student_id')
        .eq('school_id', schoolData.id)
        .eq('is_active', true);

      if (!relationships) {
        setSummaries([]);
        return;
      }

      const { data: students } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', relationships.map(r => r.student_id));

      if (!students) {
        setSummaries([]);
        return;
      }

      const studentIds = students.map(s => s.student_id);

      // Get AI summaries for these students (non-expired only)
      const { data: summaryData } = await supabase
        .from('student_ai_summaries')
        .select('*')
        .in('student_id', studentIds)
        .gt('expires_at', new Date().toISOString());

      // Enrich with student names
      const enrichedSummaries = (summaryData || []).map(summary => ({
        ...summary,
        strengths: Array.isArray(summary.strengths) ? summary.strengths : [],
        weaknesses: Array.isArray(summary.weaknesses) ? summary.weaknesses : [],
        improvement_metrics: summary.improvement_metrics || {},
        student_name: students?.find(s => s.id === summary.student_id)?.display_name || 'Unknown Student'
      }));

      setSummaries(enrichedSummaries);

    } catch (error: any) {
      console.error('Error fetching AI summaries:', error);
      toast({
        title: "Error",
        description: "Failed to load AI summaries",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAISummary = async (studentId: string): Promise<AIStudentSummary | null> => {
    if (!user) return null;

    try {
      // Get comprehensive student data for AI analysis
      const [analytics, interactions, testAttempts, progress] = await Promise.all([
        supabase
          .from('learning_analytics')
          .select('*')
          .eq('user_id', studentId),
        supabase
          .from('student_interactions')
          .select('*')
          .eq('student_id', studentId)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('test_attempts')
          .select('*')
          .eq('student_id', studentId)
          .order('completed_at', { ascending: false })
          .limit(10),
        supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', studentId)
      ]);

      const studentData = {
        analytics: analytics.data || [],
        interactions: interactions.data || [],
        testAttempts: testAttempts.data || [],
        progress: progress.data || []
      };

      // Generate AI summary using edge function
      const { data: aiResponse, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [
            {
              role: 'system',
              content: `You are an educational AI analyst. Generate a comprehensive 2-paragraph summary for a student based on their learning data. 

First paragraph: Focus on current performance, key strengths, and notable achievements. Be specific about topics they excel in and learning patterns.

Second paragraph: Address areas for improvement, recommended focus areas, growth opportunities, and actionable next steps. Include specific suggestions for progress.

Also provide separate arrays for strengths and weaknesses (topic names only), and improvement metrics as a JSON object.

Respond in JSON format:
{
  "summary_text": "Two paragraph summary...",
  "strengths": ["topic1", "topic2", ...],
  "weaknesses": ["topic1", "topic2", ...],
  "improvement_metrics": {
    "overall_trend": "improving|stable|declining",
    "focus_areas": ["area1", "area2"],
    "recommended_actions": ["action1", "action2"]
  }
}`
            },
            {
              role: 'user',
              content: `Analyze this student's data:
              
Learning Analytics: ${JSON.stringify(studentData.analytics.slice(0, 10))}
Recent Interactions: ${JSON.stringify(studentData.interactions.slice(0, 5))}
Test Performance: ${JSON.stringify(studentData.testAttempts.slice(0, 5))}
Progress Data: ${JSON.stringify(studentData.progress.slice(0, 5))}

Generate comprehensive insights focusing on specific topics, learning patterns, and actionable recommendations.`
            }
          ]
        }
      });

      if (error) throw error;

      let aiAnalysis;
      try {
        aiAnalysis = JSON.parse(aiResponse.content);
      } catch (parseError) {
        // Fallback if JSON parsing fails
        aiAnalysis = {
          summary_text: aiResponse.content || "Student is making steady progress across multiple subjects.",
          strengths: [],
          weaknesses: [],
          improvement_metrics: {}
        };
      }

      // Store in database
      const { data: savedSummary, error: saveError } = await supabase
        .from('student_ai_summaries')
        .insert({
          student_id: studentId,
          summary_text: aiAnalysis.summary_text,
          strengths: aiAnalysis.strengths || [],
          weaknesses: aiAnalysis.weaknesses || [],
          improvement_metrics: aiAnalysis.improvement_metrics || {}
        })
        .select()
        .single();

      if (saveError) throw saveError;

      toast({
        title: "Success",
        description: "AI summary generated successfully",
      });

      await fetchSummaries();
      return savedSummary;

    } catch (error: any) {
      console.error('Error generating AI summary:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI summary: " + error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const generateBulkSummaries = async (studentIds: string[]) => {
    if (!user || studentIds.length === 0) return;

    setLoading(true);
    try {
      const results = await Promise.allSettled(
        studentIds.map(id => generateAISummary(id))
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      toast({
        title: "Bulk Generation Complete",
        description: `Generated ${successful} summaries successfully. ${failed} failed.`,
      });

    } catch (error: any) {
      console.error('Error generating bulk summaries:', error);
      toast({
        title: "Error",
        description: "Failed to generate bulk summaries",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSummaryForStudent = (studentId: string): AIStudentSummary | null => {
    return summaries.find(s => s.student_id === studentId) || null;
  };

  useEffect(() => {
    fetchSummaries();
  }, [user]);

  return {
    summaries,
    loading,
    generateAISummary,
    generateBulkSummaries,
    getSummaryForStudent,
    fetchSummaries
  };
};