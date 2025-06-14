
import { supabase } from '@/integrations/supabase/client';

export interface RealStudentAnalytics {
  studentId: string;
  studentName: string;
  completionPercentage: number;
  totalTimeSpent: number;
  strengths: string[];
  weakAreas: string[];
  lastActivity: string;
  topicPerformance: Array<{
    topic: string;
    past_score: number;
    current_score: number;
    improvement: number;
    totalInteractions: number;
  }>;
}

export class RealAnalyticsService {
  
  static async getStudentAnalytics(studentId: string): Promise<RealStudentAnalytics | null> {
    try {
      // Get student profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', studentId)
        .single();

      if (!profile) return null;

      // Get learning analytics
      const { data: analytics } = await supabase
        .from('learning_analytics')
        .select(`
          *,
          subjects (name)
        `)
        .eq('user_id', studentId);

      // Get recent interactions for activity tracking
      const { data: recentInteractions } = await supabase
        .from('student_interactions')
        .select('created_at, response_time_ms')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(100);

      // Get progress snapshots for trend analysis
      const { data: progressSnapshots } = await supabase
        .from('learning_progress_snapshots')
        .select('*')
        .eq('student_id', studentId)
        .order('snapshot_date', { ascending: false });

      // Calculate completion percentage based on curriculum coverage
      const completionPercentage = this.calculateCompletionPercentage(analytics || []);

      // Calculate total time spent
      const totalTimeSpent = this.calculateTotalTimeSpent(recentInteractions || []);

      // Identify strengths and weak areas
      const { strengths, weakAreas } = this.identifyStrengthsAndWeaknesses(analytics || []);

      // Get last activity
      const lastActivity = recentInteractions?.[0]?.created_at || new Date().toISOString();

      // Calculate topic performance with historical data
      const topicPerformance = this.calculateTopicPerformance(
        analytics || [],
        progressSnapshots || []
      );

      return {
        studentId,
        studentName: profile.display_name || `Student ${studentId.slice(0, 8)}`,
        completionPercentage,
        totalTimeSpent,
        strengths,
        weakAreas,
        lastActivity,
        topicPerformance
      };

    } catch (error) {
      console.error('Error fetching real student analytics:', error);
      return null;
    }
  }

  static async getAllStudentsAnalytics(schoolId: string): Promise<RealStudentAnalytics[]> {
    try {
      // Get all students in the school
      const { data: relationships } = await supabase
        .from('school_student_relationships')
        .select('student_id')
        .eq('school_id', schoolId)
        .eq('is_active', true);

      if (!relationships) return [];

      const analyticsPromises = relationships.map(rel => 
        this.getStudentAnalytics(rel.student_id)
      );

      const results = await Promise.all(analyticsPromises);
      return results.filter(result => result !== null) as RealStudentAnalytics[];

    } catch (error) {
      console.error('Error fetching all students analytics:', error);
      return [];
    }
  }

  private static calculateCompletionPercentage(analytics: any[]): number {
    if (analytics.length === 0) return 0;

    const totalTopics = analytics.length;
    const masteredTopics = analytics.filter(a => a.strength_score >= 0.8).length;
    
    return Math.round((masteredTopics / totalTopics) * 100);
  }

  private static calculateTotalTimeSpent(interactions: any[]): number {
    // Calculate based on response times and session durations
    const totalResponseTime = interactions.reduce((sum, interaction) => {
      return sum + (interaction.response_time_ms || 30000); // Default 30s if no response time
    }, 0);

    // Convert to minutes
    return Math.round(totalResponseTime / (1000 * 60));
  }

  private static identifyStrengthsAndWeaknesses(analytics: any[]): {
    strengths: string[];
    weakAreas: string[];
  } {
    const strengths = analytics
      .filter(a => a.strength_score >= 0.75)
      .map(a => a.topic_name)
      .slice(0, 5); // Top 5 strengths

    const weakAreas = analytics
      .filter(a => a.strength_score < 0.6)
      .map(a => a.topic_name)
      .slice(0, 5); // Top 5 weak areas

    return { strengths, weakAreas };
  }

  private static calculateTopicPerformance(
    analytics: any[],
    progressSnapshots: any[]
  ): Array<{
    topic: string;
    past_score: number;
    current_score: number;
    improvement: number;
    totalInteractions: number;
  }> {
    const topicMap = new Map();

    // Process current analytics
    analytics.forEach(analytic => {
      topicMap.set(analytic.topic_name, {
        topic: analytic.topic_name,
        current_score: Math.round(analytic.strength_score * 100),
        totalInteractions: analytic.total_attempts || 0
      });
    });

    // Add historical data from snapshots
    progressSnapshots.forEach(snapshot => {
      const existing = topicMap.get(snapshot.topic_name);
      if (existing) {
        // Use oldest snapshot as baseline (past score)
        if (!existing.past_score) {
          existing.past_score = Math.round(snapshot.performance_score * 100);
        }
      }
    });

    // Calculate improvements and fill missing past scores
    return Array.from(topicMap.values()).map(topic => {
      if (!topic.past_score) {
        // If no historical data, estimate based on current performance
        topic.past_score = Math.max(20, topic.current_score - 25);
      }
      
      topic.improvement = topic.current_score - topic.past_score;
      return topic;
    }).slice(0, 8); // Limit to top 8 topics
  }

  static async generatePersonalizedInsight(studentId: string): Promise<string> {
    try {
      const analytics = await this.getStudentAnalytics(studentId);
      if (!analytics) return "No data available for analysis.";

      // Get recent interactions for context
      const { data: recentInteractions } = await supabase
        .from('student_interactions')
        .select('ai_analysis, topic_identified, understanding_score')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(10);

      const insight = await this.generateAIInsight(analytics, recentInteractions || []);
      return insight;

    } catch (error) {
      console.error('Error generating personalized insight:', error);
      return "Unable to generate insight at this time.";
    }
  }

  private static async generateAIInsight(
    analytics: RealStudentAnalytics,
    recentInteractions: any[]
  ): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [
            {
              role: 'system',
              content: `You are an educational analyst. Generate a personalized learning insight paragraph for a student based on their analytics data. Be encouraging and specific about strengths and areas for improvement.`
            },
            {
              role: 'user',
              content: `
                Student: ${analytics.studentName}
                Completion: ${analytics.completionPercentage}%
                Time Spent: ${analytics.totalTimeSpent} minutes
                Strengths: ${analytics.strengths.join(', ')}
                Weak Areas: ${analytics.weakAreas.join(', ')}
                Recent Topics: ${analytics.topicPerformance.map(t => `${t.topic} (${t.current_score}%)`).join(', ')}
                
                Generate a 2-3 sentence personalized insight focusing on progress, strengths to leverage, and specific next steps.
              `
            }
          ]
        }
      });

      if (error) throw error;
      return data.content || "Keep up the great work on your learning journey!";

    } catch (error) {
      console.error('Error generating AI insight:', error);
      return `${analytics.studentName} is making steady progress with ${analytics.completionPercentage}% completion. Strong performance in ${analytics.strengths[0] || 'core areas'} shows great potential. Focus on ${analytics.weakAreas[0] || 'continued practice'} for continued growth.`;
    }
  }
}
