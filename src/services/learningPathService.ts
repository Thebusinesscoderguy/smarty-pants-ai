
import { supabase } from '@/integrations/supabase/client';

export interface TopicMastery {
  topic_name: string;
  subject_area: string;
  mastery_level: number;
  confidence_score: number;
  last_practiced: string;
}

export interface LearningPathSuggestion {
  topic: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  reason: string;
  prerequisites: string[];
  estimatedTime: number;
  priority: number;
}

export interface LearningPath {
  id: string;
  name: string;
  topics: LearningPathSuggestion[];
  currentStep: number;
  totalSteps: number;
  completionPercentage: number;
}

export class LearningPathService {
  static async getStudentMastery(studentId: string): Promise<TopicMastery[]> {
    const { data, error } = await supabase
      .from('student_topic_mastery')
      .select('*')
      .eq('student_id', studentId)
      .order('last_practiced', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getTopicPrerequisites() {
    const { data, error } = await supabase
      .from('topic_prerequisites')
      .select('*');

    if (error) throw error;
    return data || [];
  }

  static async generateLearningPath(studentId: string): Promise<LearningPathSuggestion[]> {
    try {
      // Get student's current mastery levels
      const masteryData = await this.getStudentMastery(studentId);
      const prerequisites = await this.getTopicPrerequisites();

      // Get recent learning analytics
      const { data: analytics } = await supabase
        .from('learning_analytics')
        .select('*')
        .eq('user_id', studentId)
        .order('last_updated', { ascending: false })
        .limit(20);

      // Call AI to generate personalized learning path
      const response = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [
            {
              role: 'system',
              content: `You are an AI learning path advisor. Based on the student's mastery data and learning analytics, suggest the next 5-7 topics they should learn.

Student Mastery Data: ${JSON.stringify(masteryData)}
Prerequisites: ${JSON.stringify(prerequisites)}
Recent Analytics: ${JSON.stringify(analytics)}

Return a JSON array of learning suggestions:
[
  {
    "topic": "Topic name",
    "subject": "Subject area",
    "difficulty": "easy|medium|hard",
    "reason": "Why this topic is recommended",
    "prerequisites": ["prereq1", "prereq2"],
    "estimatedTime": 30,
    "priority": 1-10
  }
]

Focus on:
1. Building on strengths
2. Filling knowledge gaps
3. Following natural learning progression
4. Maintaining engagement with variety`
            },
            {
              role: 'user',
              content: 'What should I learn next based on my progress?'
            }
          ]
        }
      });

      if (response.error) throw response.error;
      
      const suggestions = JSON.parse(response.data.choices[0].message.content);
      return suggestions.sort((a: LearningPathSuggestion, b: LearningPathSuggestion) => b.priority - a.priority);

    } catch (error) {
      console.error('Error generating learning path:', error);
      return [];
    }
  }

  static async saveLearningPath(studentId: string, pathName: string, suggestions: LearningPathSuggestion[]) {
    const { data, error } = await supabase
      .from('student_learning_paths')
      .upsert({
        student_id: studentId,
        path_name: pathName,
        total_steps: suggestions.length,
        path_data: { suggestions },
        next_recommended_topics: suggestions.map(s => s.topic)
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateTopicMastery(
    studentId: string, 
    topicName: string, 
    subjectArea: string, 
    performance: number
  ) {
    const { data: existing } = await supabase
      .from('student_topic_mastery')
      .select('*')
      .eq('student_id', studentId)
      .eq('topic_name', topicName)
      .eq('subject_area', subjectArea)
      .single();

    const newMasteryLevel = existing 
      ? (existing.mastery_level * 0.7 + performance * 0.3)
      : performance;

    const newTotalInteractions = (existing?.total_interactions || 0) + 1;
    const newCorrectInteractions = (existing?.correct_interactions || 0) + (performance > 0.7 ? 1 : 0);

    await supabase
      .from('student_topic_mastery')
      .upsert({
        student_id: studentId,
        topic_name: topicName,
        subject_area: subjectArea,
        mastery_level: newMasteryLevel,
        confidence_score: newCorrectInteractions / newTotalInteractions,
        total_interactions: newTotalInteractions,
        correct_interactions: newCorrectInteractions,
        last_practiced: new Date().toISOString()
      });
  }
}
