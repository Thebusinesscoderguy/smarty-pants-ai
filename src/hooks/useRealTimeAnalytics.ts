
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useRealTimeAnalytics = () => {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const trackInteraction = useCallback(async (
    interactionType: 'chat' | 'quiz' | 'voice',
    questionText: string,
    studentResponse: string,
    subject?: string,
    curriculumId?: string,
    responseTimeMs?: number
  ) => {
    if (!user) return;

    setIsAnalyzing(true);
    
    try {
      // Generate session ID
      const sessionId = `${user.id}_${Date.now()}`;
      
      // Get subject info if curriculum is provided
      let subjectId = null;
      if (curriculumId) {
        const { data: curriculum } = await supabase
          .from('curricula')
          .select('subject_id')
          .eq('id', curriculumId)
          .single();
        
        subjectId = curriculum?.subject_id;
      }

      // Analyze response with AI
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        'analyze-student-response',
        {
          body: {
            studentResponse,
            question: questionText,
            subject: subject || 'General',
            sessionId
          }
        }
      );

      if (analysisError) {
        console.error('Analysis error:', analysisError);
        return;
      }

      const analysis = analysisData.analysis;

      // Store interaction in database
      const { error: insertError } = await supabase
        .from('student_interactions')
        .insert({
          student_id: user.id,
          session_id: sessionId,
          interaction_type: interactionType,
          topic_identified: analysis.topic_identified,
          subject_id: subjectId,
          question_text: questionText,
          student_response: studentResponse,
          ai_analysis: analysis,
          understanding_score: analysis.understanding_score,
          response_time_ms: responseTimeMs
        });

      if (insertError) {
        console.error('Error storing interaction:', insertError);
        return;
      }

      // Update daily progress snapshot
      await updateProgressSnapshot(
        user.id,
        subjectId,
        analysis.topic_identified,
        analysis.understanding_score,
        responseTimeMs
      );

      console.log('Interaction tracked successfully:', {
        topic: analysis.topic_identified,
        score: analysis.understanding_score,
        type: interactionType
      });

    } catch (error) {
      console.error('Error tracking interaction:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [user]);

  const updateProgressSnapshot = async (
    studentId: string,
    subjectId: string | null,
    topicName: string,
    understandingScore: number,
    responseTimeMs?: number
  ) => {
    try {
      // Get today's snapshot or create new one
      const today = new Date().toISOString().split('T')[0];
      
      const { data: existingSnapshot } = await supabase
        .from('learning_progress_snapshots')
        .select('*')
        .eq('student_id', studentId)
        .eq('topic_name', topicName)
        .eq('snapshot_date', today)
        .single();

      if (existingSnapshot) {
        // Update existing snapshot
        const newTotalInteractions = existingSnapshot.total_interactions + 1;
        const newCorrectInteractions = existingSnapshot.correct_interactions + 
          (understandingScore >= 0.7 ? 1 : 0);
        const newPerformanceScore = newCorrectInteractions / newTotalInteractions;
        
        let newAvgResponseTime = existingSnapshot.average_response_time_ms;
        if (responseTimeMs && existingSnapshot.average_response_time_ms) {
          newAvgResponseTime = Math.round(
            (existingSnapshot.average_response_time_ms * existingSnapshot.total_interactions + responseTimeMs) 
            / newTotalInteractions
          );
        } else if (responseTimeMs) {
          newAvgResponseTime = responseTimeMs;
        }

        await supabase
          .from('learning_progress_snapshots')
          .update({
            performance_score: newPerformanceScore,
            total_interactions: newTotalInteractions,
            correct_interactions: newCorrectInteractions,
            average_response_time_ms: newAvgResponseTime
          })
          .eq('id', existingSnapshot.id);
      } else {
        // Create new snapshot
        await supabase
          .from('learning_progress_snapshots')
          .insert({
            student_id: studentId,
            subject_id: subjectId,
            topic_name: topicName,
            performance_score: understandingScore,
            total_interactions: 1,
            correct_interactions: understandingScore >= 0.7 ? 1 : 0,
            average_response_time_ms: responseTimeMs
          });
      }
    } catch (error) {
      console.error('Error updating progress snapshot:', error);
    }
  };

  const getStudentAnalytics = useCallback(async (studentId?: string) => {
    const targetStudentId = studentId || user?.id;
    if (!targetStudentId) return null;

    try {
      // Get learning analytics
      const { data: analytics } = await supabase
        .from('learning_analytics')
        .select(`
          *,
          subjects (name)
        `)
        .eq('user_id', targetStudentId);

      // Get recent interactions for context
      const { data: recentInteractions } = await supabase
        .from('student_interactions')
        .select('*')
        .eq('student_id', targetStudentId)
        .order('created_at', { ascending: false })
        .limit(50);

      // Get progress snapshots for trends
      const { data: progressSnapshots } = await supabase
        .from('learning_progress_snapshots')
        .select('*')
        .eq('student_id', targetStudentId)
        .order('snapshot_date', { ascending: false })
        .limit(30);

      return {
        analytics,
        recentInteractions,
        progressSnapshots
      };
    } catch (error) {
      console.error('Error fetching student analytics:', error);
      return null;
    }
  }, [user]);

  return {
    trackInteraction,
    getStudentAnalytics,
    isAnalyzing
  };
};
