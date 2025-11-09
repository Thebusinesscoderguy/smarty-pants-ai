import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Target, Book, Brain, FileQuestion } from 'lucide-react';
import { useQuizGenerator } from '@/hooks/useQuizGenerator';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface DailyLesson {
  day: number;
  topic: string;
  description: string;
  activities: string[];
  estimatedTime: number;
  practiceQuestions: number;
}

interface StudyPlan {
  id: string;
  title: string;
  description: string;
  daily_lessons: DailyLesson[];
  estimated_duration: number;
  difficulty_level?: string;
}

interface StudyPlanDaySelectorProps {
  studyPlan: StudyPlan | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectDay: (day: number) => void;
}

const StudyPlanDaySelector: React.FC<StudyPlanDaySelectorProps> = ({
  studyPlan,
  isOpen,
  onClose,
  onSelectDay
}) => {
  const [creatingQuiz, setCreatingQuiz] = useState<number | null>(null);
  const [showSignInDialog, setShowSignInDialog] = useState(false);
  const [attemptedDay, setAttemptedDay] = useState<number | null>(null);
  const { generateQuiz, isGenerating } = useQuizGenerator();
  const navigate = useNavigate();

  if (!studyPlan) return null;

  const dailyLessons = Array.isArray(studyPlan.daily_lessons) 
    ? studyPlan.daily_lessons 
    : [];

  const handleStartDay = async (day: number) => {
    // Require auth for starting any day; viewing the plan is allowed without auth
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      setAttemptedDay(day);
      setShowSignInDialog(true);
      return;
    }
    onSelectDay(day);
    onClose();
  };

  const handleCreateQuiz = async (lesson: DailyLesson) => {
    setCreatingQuiz(lesson.day);
    
    try {
      const quizPrompt = `Create a quiz for: ${lesson.topic}
      
      Description: ${lesson.description}
      
      Activities covered: ${lesson.activities?.join(', ') || 'General topic coverage'}
      
      Please generate ${lesson.practiceQuestions || 5} questions that test understanding of this topic.`;

      const quiz = await generateQuiz(
        quizPrompt,
        'medium',
        lesson.practiceQuestions || 5
      );

      if (quiz) {
        toast({
          title: "Quiz created successfully!",
          description: `Generated quiz for Day ${lesson.day}: ${lesson.topic}`
        });
        onClose();
        navigate('/quiz-generator');
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast({
        title: "Failed to create quiz",
        description: "Please try again or check your connection",
        variant: "destructive"
      });
    } finally {
      setCreatingQuiz(null);
    }
  };

  return (
    <>
      <Dialog open={showSignInDialog} onOpenChange={setShowSignInDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign In Required</DialogTitle>
            <DialogDescription>
              Please sign in or create a free account to start Day {attemptedDay}. You can browse the study plan without signing in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSignInDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              {studyPlan.title} - Learning Index
            </DialogTitle>
          </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dailyLessons.map((lesson) => (
              <Card key={lesson.day} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="font-medium">
                        Day {lesson.day}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {lesson.estimatedTime}min
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-sm mb-1">{lesson.topic}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {lesson.description}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Target className="h-3 w-3" />
                        <span>{lesson.activities?.length || 0} activities</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <FileQuestion className="h-3 w-3" />
                        <span>{lesson.practiceQuestions || 0} practice questions</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Button 
                        onClick={() => handleStartDay(lesson.day)}
                        className="w-full"
                        size="sm"
                      >
                        Start Day {lesson.day}
                      </Button>
                      
                      <Button 
                        onClick={() => handleCreateQuiz(lesson)}
                        variant="outline"
                        className="w-full"
                        size="sm"
                        disabled={creatingQuiz === lesson.day || isGenerating}
                      >
                        <Brain className="mr-2 h-3 w-3" />
                        {creatingQuiz === lesson.day ? 'Creating...' : 'Create Quiz'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {dailyLessons.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Book className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No lessons found in this study plan</p>
            </div>
          )}
        </div>
      </DialogContent>
      </Dialog>
    </>
  );
};

export default StudyPlanDaySelector;