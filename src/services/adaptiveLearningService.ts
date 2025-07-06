
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
      // Get student's learning history and preferences from existing tables
      const [interactions, mastery] = await Promise.all([
        this.getStudentInteractions(studentId),
        this.getStudentMastery(studentId)
      ]);

      // Create a mock adaptive path for now - in production this would call an AI service
      const mockPath: AdaptivePath = {
        id: `${studentId}-${subject}-${Date.now()}`,
        studentId,
        subject,
        goal,
        currentNode: 'node-1',
        nodes: [
          {
            id: 'node-1',
            title: `Introduction to ${subject}`,
            type: 'concept',
            microSkills: [
              {
                id: 'skill-1',
                name: `Basic ${subject} concepts`,
                category: 'foundation',
                difficulty: 1,
                prerequisites: [],
                estimatedTime: 30,
                masteryThreshold: 0.8,
                currentLevel: 0,
                confidence: 0
              }
            ],
            content: {
              explanation: `Learn the fundamentals of ${subject}`,
              examples: [],
              exercises: [],
              resources: []
            },
            adaptiveFeatures: {
              difficultyRange: [1, 3],
              personalizedExamples: true,
              multiModalContent: true
            },
            connections: ['node-2'],
            status: 'available' as const
          },
          {
            id: 'node-2',
            title: `Advanced ${subject}`,
            type: 'practice',
            microSkills: [
              {
                id: 'skill-2',
                name: `Advanced ${subject} techniques`,
                category: 'advanced',
                difficulty: 3,
                prerequisites: ['skill-1'],
                estimatedTime: 45,
                masteryThreshold: 0.85,
                currentLevel: 0,
                confidence: 0
              }
            ],
            content: {
              explanation: `Advanced concepts in ${subject}`,
              examples: [],
              exercises: [],
              resources: []
            },
            adaptiveFeatures: {
              difficultyRange: [3, 5],
              personalizedExamples: true,
              multiModalContent: true
            },
            connections: [],
            status: 'locked' as const
          }
        ],
        progress: {
          overallCompletion: 0,
          skillsMastered: 0,
          totalSkills: 2,
          estimatedTimeRemaining: 75,
          momentum: 1.0
        },
        personalizations: {
          learningStyle: 'mixed',
          pace: 'normal',
          difficulty: 'adaptive',
          interests: [subject]
        },
        aiInsights: {
          strengths: ['Quick to understand new concepts'],
          challenges: ['Needs more practice with complex problems'],
          recommendations: ['Start with fundamentals', 'Use visual aids'],
          nextBestActions: ['Complete introduction module', 'Practice basic exercises']
        }
      };

      // Save the path to existing student_learning_paths table
      await this.saveLearningPath(mockPath);
      
      return mockPath;
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
      // Get current path and update progress
      const currentPath = await this.getLearningPath(pathId);
      
      // Update node status based on interaction
      const updatedNodes = currentPath.nodes.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            status: (interactionData.type === 'complete' ? 'completed' : 'in-progress') as LearningNode['status']
          };
        }
        return node;
      });

      // Calculate new progress
      const completedNodes = updatedNodes.filter(node => node.status === 'completed').length;
      const overallCompletion = (completedNodes / updatedNodes.length) * 100;

      const updatedPath: AdaptivePath = {
        ...currentPath,
        nodes: updatedNodes,
        progress: {
          ...currentPath.progress,
          overallCompletion,
          skillsMastered: completedNodes
        }
      };

      await this.saveLearningPath(updatedPath);
      return updatedPath;
    } catch (error) {
      console.error('Error updating path progress:', error);
      throw error;
    }
  }

  static async adaptPath(pathId: string, analysis: any): Promise<AdaptivePath> {
    // Get current path and apply adaptations
    const currentPath = await this.getLearningPath(pathId);
    
    // For now, return the current path with minor updates
    const updatedPath: AdaptivePath = {
      ...currentPath,
      aiInsights: {
        ...currentPath.aiInsights,
        recommendations: [...currentPath.aiInsights.recommendations, 'Path adapted based on performance']
      }
    };

    await this.saveLearningPath(updatedPath);
    return updatedPath;
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

  static async saveLearningPath(path: AdaptivePath) {
    // Convert AdaptivePath to a JSON-serializable format
    const pathData = JSON.parse(JSON.stringify(path));
    
    const { error } = await supabase
      .from('student_learning_paths')
      .upsert({
        id: path.id,
        student_id: path.studentId,
        path_name: `${path.subject} - ${path.goal}`,
        path_data: pathData,
        current_step: 0,
        total_steps: path.nodes.length,
        started_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        topics_completed: [],
        next_recommended_topics: path.nodes.slice(0, 3).map(node => node.title)
      });

    if (error) throw error;
  }

  static async getLearningPath(pathId: string): Promise<AdaptivePath> {
    const { data, error } = await supabase
      .from('student_learning_paths')
      .select('*')
      .eq('id', pathId)
      .single();

    if (error) throw error;
    
    // Return the path_data which contains our AdaptivePath structure
    // We need to properly type cast since we know the structure
    return data.path_data as unknown as AdaptivePath;
  }
}
