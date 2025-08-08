
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Play, BookOpen } from 'lucide-react';
import { useQuizGenerator, type Quiz } from '@/hooks/useQuizGenerator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import QuizTaker from './QuizTaker';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
export const QuizLibrary = () => {
  const { quizzes, fetchQuizzes, deleteQuiz } = useQuizGenerator();
  const [open, setOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<Record<string, { score: number; total: number }>>({});

  useEffect(() => {
    fetchQuizzes();
  }, []);

  useEffect(() => {
    const loadAttempts = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user || quizzes.length === 0) return;
      const ids = quizzes.map((q) => q.id).filter(Boolean) as string[];
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('quiz_id, score, total_possible, completed_at')
        .in('quiz_id', ids)
        .order('completed_at', { ascending: false });
      if (error || !data) return;
      const map: Record<string, { score: number; total: number }> = {};
      (data as any[]).forEach((row) => {
        if (!map[row.quiz_id]) {
          map[row.quiz_id] = { score: row.score, total: row.total_possible };
        }
      });
      setAttempts(map);
    };
    loadAttempts();
  }, [quizzes]);
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDelete = async (quizId: string) => {
    if (confirm('Are you sure you want to delete this quiz?')) {
      await deleteQuiz(quizId);
    }
  };

  if (quizzes.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes yet</h3>
          <p className="text-gray-500">Generate your first quiz to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your Quiz Library</h2>
        <Badge variant="outline">{quizzes.length} quizzes</Badge>
      </div>
      
      <div className="grid gap-4">
        {quizzes.map((quiz) => (
          <Card key={quiz.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{quiz.title}</CardTitle>
                  {quiz.description && (
                    <CardDescription className="mt-1">{quiz.description}</CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getDifficultyColor(quiz.difficulty)}>
                    {quiz.difficulty}
                  </Badge>
                  <Badge variant="outline">
                    {quiz.questions.length} questions
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 space-y-1">
                  <div>
                    Question types: {[...new Set(quiz.questions.map(q => q.type.replace('_', ' ')))].join(', ')}
                  </div>
                  {attempts[quiz.id!] && (
                    <div>
                      Last score: {attempts[quiz.id!].score}/{attempts[quiz.id!].total}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setSelectedQuiz(quiz); setOpen(true); }}>
                    <Play className="h-4 w-4 mr-1" />
                    Take Quiz
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleDelete(quiz.id!)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedQuiz?.title ?? 'Take Quiz'}</DialogTitle>
          </DialogHeader>
          {selectedQuiz && (
            <QuizTaker
              quiz={selectedQuiz}
              onComplete={(res) => {
                setOpen(false);
                if (selectedQuiz?.id) {
                  setAttempts((prev) => ({
                    ...prev,
                    [selectedQuiz.id!]: { score: res.score, total: res.total },
                  }));
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
