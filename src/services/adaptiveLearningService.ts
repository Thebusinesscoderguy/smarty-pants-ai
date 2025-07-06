
import { supabase } from '@/integrations/supabase/client';

export interface MicroSkill {
  id: string;
  name: string;
  category: string;
  difficulty: number;
  prerequisites: string[];
  estimatedTime: number;
  masteryThreshold: number;
  currentLevel: number;
  confidence: number;
}

export interface LearningNode {
  id: string;
  title: string;
  type: 'concept' | 'practice' | 'assessment' | 'project';
  microSkills: MicroSkill[];
  content: {
    explanation?: string;
    examples: any[];
    exercises: any[];
    resources: string[];
  };
  adaptiveFeatures: {
    difficultyRange: [number, number];
    personalizedExamples: boolean;
    multiModalContent: boolean;
  };
  connections: string[];
  status: 'locked' | 'available' | 'in-progress' | 'completed' | 'mastered';
}

export interface AdaptivePath {
  id: string;
  studentId: string;
  subject: string;
  goal: string;
  currentNode: string;
  nodes: LearningNode[];
  progress: {
    overallCompletion: number;
    skillsMastered: number;
    totalSkills: number;
    estimatedTimeRemaining: number;
    momentum: number;
  };
  personalizations: {
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
    pace: 'slow' | 'normal' | 'fast';
    difficulty: 'adaptive' | 'challenging' | 'supportive';
    interests: string[];
  };
  aiInsights: {
    strengths: string[];
    challenges: string[];
    recommendations: string[];
    nextBestActions: string[];
  };
}

export class AdaptiveLearningService {
  static async generatePersonalizedPath(
    studentId: string, 
    subject: string, 
    goal: string,
    currentKnowledge?: any[]
  ): Promise<AdaptivePath> {
    try {
      // Get student's learning history and preferences
      const [interactions, mastery, preferences] = await Promise.all([
        this.getStudentInteractions(studentId),
        this.getStudentMastery(studentId),
        this.getStudentPreferences(studentId)
      ]);

      // Call AI service to generate adaptive path
      const { data, error } = await supabase.functions.invoke('generate-adaptive-path', {
        body: {
          studentId,
          subject,
          goal,
          interactions,
          mastery,
          preferences,
          currentKnowledge
        }
      });

      if (error) throw error;

      const adaptivePath: AdaptivePath = {
        id: data.pathId,
        studentId,
        subject,
        goal,
        currentNode: data.startingNode,
        nodes: data.learningNodes,
        progress: data.initialProgress,
        personalizations: data.personalizations,
        aiInsights: data.insights
      };

      // Save the path to database
      await this.saveLearningPath(adaptivePath);
      
      return adaptivePath;
    } catch (error) {
      console.error('Error generating adaptive path:', error);
      throw error;
    }
  }

  static async updatePathProgress(
    pathId: string,
    nodeId: string,
    interactionData: any
  ): Promise<AdaptivePath> {
    try {
      // Real-time analysis of student interaction
      const { data, error } = await supabase.functions.invoke('analyze-learning-interaction', {
        body: {
          pathId,
          nodeId,
          interactionData,
          timestamp: new Date().toISOString()
        }
      });

      if (error) throw error;

      // Update path based on AI analysis
      const updatedPath = await this.adaptPath(pathId, data.analysis);
      
      return updatedPath;
    } catch (error) {
      console.error('Error updating path progress:', error);
      throw error;
    }
  }

  static async adaptPath(pathId: string, analysis: any): Promise<AdaptivePath> {
    // Get current path
    const currentPath = await this.getLearningPath(pathId);
    
    // Apply AI-driven adaptations
    const adaptations = await this.generateAdaptations(currentPath, analysis);
    
    // Update path structure dynamically
    const updatedPath: AdaptivePath = {
      ...currentPath,
      nodes: adaptations.updatedNodes,
      currentNode: adaptations.nextNode,
      progress: adaptations.newProgress,
      aiInsights: adaptations.insights
    };

    await this.saveLearningPath(updatedPath);
    return updatedPath;
  }

  static async generateAdaptations(path: AdaptivePath, analysis: any) {
    const { data } = await supabase.functions.invoke('generate-path-adaptations', {
      body: {
        currentPath: path,
        analysisResults: analysis,
        adaptationRules: {
          difficultyAdjustment: true,
          contentPersonalization: true,
          paceOptimization: true,
          skillReinforcement: true
        }
      }
    });

    return data;
  }

  static async getStudentInteractions(studentId: string) {
    const { data } = await supabase
      .from('student_interactions')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(100);
    
    return data || [];
  }

  static async getStudentMastery(studentId: string) {
    const { data } = await supabase
      .from('student_topic_mastery')
      .select('*')
      .eq('student_id', studentId);
    
    return data || [];
  }

  static async getStudentPreferences(studentId: string) {
    const { data } = await supabase
      .from('student_learning_preferences')
      .select('*')
      .eq('student_id', studentId)
      .single();
    
    return data || {
      learningStyle: 'mixed',
      pace: 'normal',
      difficulty: 'adaptive',
      interests: []
    };
  }

  static async saveLearningPath(path: AdaptivePath) {
    const { error } = await supabase
      .from('adaptive_learning_paths')
      .upsert({
        id: path.id,
        student_id: path.studentId,
        subject: path.subject,
        goal: path.goal,
        current_node: path.currentNode,
        path_data: JSON.stringify(path),
        progress_data: JSON.stringify(path.progress),
        last_updated: new Date().toISOString()
      });

    if (error) throw error;
  }

  static async getLearningPath(pathId: string): Promise<AdaptivePath> {
    const { data, error } = await supabase
      .from('adaptive_learning_paths')
      .select('*')
      .eq('id', pathId)
      .single();

    if (error) throw error;
    
    return JSON.parse(data.path_data);
  }
}
