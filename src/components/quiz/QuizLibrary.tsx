
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Play, BookOpen, Sparkles } from 'lucide-react';
import { useQuizGenerator, type Quiz } from '@/hooks/useQuizGenerator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import QuizTaker from './QuizTaker';
import QuizResults from './QuizResults';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

export const QuizLibrary = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { quizzes, fetchQuizzes, deleteQuiz } = useQuizGenerator();
  const [open, setOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<Record<string, { score: number; total: number }>>({});
  const [mode, setMode] = useState<'take' | 'results'>('take');
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
    if (confirm(t('quizLibrary.deleteConfirm'))) {
      await deleteQuiz(quizId);
    }
  };

  if (quizzes.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center flex flex-col items-center">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <BookOpen className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{t('quizLibrary.noQuizzes')}</h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-sm">{t('quizLibrary.noQuizzesDesc')}</p>
          <Button
            onClick={() => navigate('/quiz-generator?tab=generate')}
            className="rounded-full bg-primary hover:bg-primary/90"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate your first quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t('quizLibrary.title')}</h2>
        <Badge variant="outline">{t('quizLibrary.quizzes').replace('{count}', quizzes.length.toString())}</Badge>
      </div>
      
      <div className="grid gap-4">
        {quizzes.map((quiz) => (
          <Card key={quiz.id} onClick={() => { if (attempts[quiz.id!]) { setSelectedQuiz(quiz); setMode('results'); setOpen(true); } }} className="cursor-pointer">
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
                    {t('quizLibrary.questionTypes')}: {[...new Set(quiz.questions.map(q => q.type.replace('_', ' ')))].join(', ')}
                  </div>
                  {attempts[quiz.id!] && (
                    <div>
                      {t('quizLibrary.lastScore')}: {attempts[quiz.id!].score}/{attempts[quiz.id!].total}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedQuiz(quiz); setMode('take'); setOpen(true); }}>
                    <Play className="h-4 w-4 mr-1" />
                    {t('quizLibrary.takeQuiz')}
                  </Button>
                  {attempts[quiz.id!] && (
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedQuiz(quiz); setMode('results'); setOpen(true); }}>
                      {t('quizLibrary.viewResults')}
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={(e) => { e.stopPropagation(); handleDelete(quiz.id!); }}
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
            <DialogTitle>
              {mode === 'take' ? (selectedQuiz?.title ?? t('quizLibrary.takeQuiz')) : (selectedQuiz?.title ? `${selectedQuiz.title} – ${t('quizLibrary.results')}` : t('quizLibrary.results'))}
            </DialogTitle>
          </DialogHeader>
          {selectedQuiz && (
            mode === 'take' ? (
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
            ) : (
              <QuizResults
                quiz={selectedQuiz}
                onStartQuiz={(nextQuiz) => {
                  setSelectedQuiz(nextQuiz);
                  setMode('take');
                }}
              />
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
