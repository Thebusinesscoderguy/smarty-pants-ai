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

  const totalMinutes = dailyLessons.reduce((sum, l) => sum + (l.estimatedTime || 0), 0);
  const focusAreas = [...new Set(dailyLessons.map(l => l.topic.split(':')[0].trim()))];

  return (
    <>
      <Dialog open={showSignInDialog} onOpenChange={setShowSignInDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign In Required</DialogTitle>
            <DialogDescription>
              Please sign in or create a free account to start Day {attemptedDay}. You can generate and view the plan without signing in.
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
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          {/* Header with action buttons at top */}
          <DialogHeader className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Book className="h-5 w-5" />
                  {studyPlan.title}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {studyPlan.description}
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleStartDay(1)}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Start Plan
                </Button>
                <Button 
                  variant="outline"
                  className="border-orange-500 text-orange-500 hover:bg-orange-50"
                  onClick={onClose}
                >
                  Save & Close
                </Button>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <Calendar className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <div className="text-2xl font-bold">{dailyLessons.length}</div>
                <div className="text-xs text-muted-foreground">Days</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <Target className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <div className="text-2xl font-bold">{focusAreas.length}</div>
                <div className="text-xs text-muted-foreground">Focus Areas</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <Book className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <div className="text-2xl font-bold">{dailyLessons.length}</div>
                <div className="text-xs text-muted-foreground">Lessons</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <div className="text-2xl font-bold">{totalMinutes}</div>
                <div className="text-xs text-muted-foreground">Total Minutes</div>
              </div>
            </div>

            {/* Focus areas badges */}
            {focusAreas.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Target className="h-4 w-4" />
                  Areas to Focus On
                </div>
                <div className="flex flex-wrap gap-2">
                  {focusAreas.map((area, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </DialogHeader>
        
          {/* Daily Lessons section */}
          <div className="space-y-3 mt-4">
            <h3 className="font-semibold text-lg">Daily Lessons</h3>
            
            {dailyLessons.map((lesson) => (
              <div 
                key={lesson.day} 
                className="border-l-4 border-orange-400 bg-muted/30 rounded-r-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-medium">
                        Day {lesson.day}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {lesson.estimatedTime} min
                      </span>
                    </div>
                    
                    <h4 className="font-medium">{lesson.topic}</h4>
                    <p className="text-sm text-muted-foreground">
                      {lesson.description}
                    </p>
                    
                    {lesson.activities && lesson.activities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {lesson.activities.slice(0, 3).map((activity, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs font-normal">
                            {activity}
                          </Badge>
                        ))}
                        {lesson.activities.length > 3 && (
                          <Badge variant="outline" className="text-xs font-normal">
                            +{lesson.activities.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      {lesson.practiceQuestions || 2} examples
                    </Badge>
                  </div>
                </div>
                
                {/* Full width buttons row */}
                <div className="flex gap-2 mt-3">
                  <Button 
                    onClick={() => handleStartDay(lesson.day)}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-full"
                  >
                    Begin Learning
                  </Button>
                  <Button 
                    onClick={() => handleCreateQuiz(lesson)}
                    variant="outline"
                    disabled={creatingQuiz === lesson.day || isGenerating}
                    className="flex-1 border-orange-400 text-orange-600 hover:bg-orange-50 rounded-full"
                  >
                    <Brain className="mr-2 h-4 w-4" />
                    {creatingQuiz === lesson.day ? 'Creating...' : 'Take Quiz'}
                  </Button>
                </div>
              </div>
            ))}
            
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