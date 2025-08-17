import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen } from 'lucide-react';
import LessonViewer from '@/components/learning/LessonViewer';
import { supabase } from '@/integrations/supabase/client';

interface Lesson {
  id: string;
  title: string;
  content: string;
  duration: number;
  type: 'reading' | 'video' | 'interactive';
  completed?: boolean;
}

const LearningModule = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    const loadLesson = async () => {
      if (!moduleId) return;
      
      try {
        const { data: studyPlan, error } = await supabase
          .from('study_plans')
          .select('*')
          .eq('id', moduleId)
          .single();
          
        if (error) throw error;
        
        if (studyPlan) {
          // Create a lesson from the study plan
          const generatedLesson: Lesson = {
            id: studyPlan.id,
            title: studyPlan.title,
            content: `# ${studyPlan.title}

${studyPlan.description || 'Welcome to your personalized learning content.'}

## Introduction

This learning module has been specifically designed to help you master the essential concepts and skills in this subject area. The content is structured to provide a comprehensive understanding while being engaging and easy to follow.

## Key Learning Points

Understanding this topic requires focus on several fundamental areas:

• **Core Concepts**: Master the basic principles that form the foundation of this subject
• **Practical Applications**: Learn how to apply theoretical knowledge in real-world scenarios  
• **Problem-Solving**: Develop analytical skills to tackle complex challenges
• **Critical Thinking**: Build the ability to evaluate information and make informed decisions

## Detailed Content

The material covered in this lesson builds progressively from basic concepts to more advanced applications. Each section is designed to reinforce previous learning while introducing new ideas and techniques.

Take your time to fully absorb each concept before moving forward. The interactive elements and examples throughout will help solidify your understanding and provide opportunities for practical application.

## Key Takeaways

By completing this lesson, you will have developed a solid foundation in this subject area and be well-prepared to apply your knowledge in practical situations. Remember that learning is an ongoing process, and regular review will help reinforce these important concepts.`,
            duration: studyPlan.estimated_duration * 45 || 30,
            type: 'reading',
            completed: false
          };
          setLesson(generatedLesson);
        }
      } catch (error) {
        console.error('Error loading lesson:', error);
      }
    };
    
    loadLesson();
  }, [moduleId]);

  const handleLessonComplete = (lessonId: string) => {
    navigate('/quiz-generator');
  };

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-blue-400" />
          <h2 className="text-2xl font-bold mb-2">Lesson Not Found</h2>
          <p className="text-gray-400 mb-4">The requested lesson could not be found.</p>
          <Button onClick={() => navigate('/quiz-generator')} variant="outline" className="border-white/30 text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Study Plans
          </Button>
        </div>
      </div>
    );
  }

  return (
    <LessonViewer 
      lesson={lesson}
      onBack={() => navigate('/quiz-generator')}
      onComplete={handleLessonComplete}
    />
  );
};

export default LearningModule;