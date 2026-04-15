import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Database, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export const QuestionBankBrowser = () => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const isRTL = language === 'ar';
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    const { data, error } = await supabase
      .from('question_bank')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) {
      console.error('Error fetching questions:', error);
    } else {
      setQuestions(data || []);
    }
    setLoading(false);
  };

  const generateQuestions = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: {
          topic: 'General knowledge for grade 5-8',
          questionCount: 10,
          difficulty: 'medium',
        }
      });

      if (error) throw error;

      const generatedQuestions = data?.questions || [];
      for (const q of generatedQuestions) {
        await supabase.from('question_bank').insert({
          subject: q.subject || 'General',
          question_text: q.question,
          answer: q.correct_answer || q.correctAnswer,
          options: q.options || [],
          difficulty: 'medium',
          question_type: 'multiple_choice',
          created_by: user.id,
        });
      }

      toast.success(t('questionBank.added').replace('{count}', String(generatedQuestions.length)));
      fetchQuestions();
    } catch (error: any) {
      toast.error('Failed to generate questions: ' + (error.message || 'Unknown error'));
    } finally {
      setGenerating(false);
    }
  };

  const filtered = questions.filter(q => {
    const matchesSearch = !search || 
      q.question_text.toLowerCase().includes(search.toLowerCase()) ||
      q.subject.toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'all' || q.difficulty === difficultyFilter;
    const matchesSubject = subjectFilter === 'all' || q.subject === subjectFilter;
    return matchesSearch && matchesDifficulty && matchesSubject;
  });

  const subjects = [...new Set(questions.map(q => q.subject))];

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            {t('questionBank.title')}
          </h2>
          <p className="text-muted-foreground">{questions.length} {t('questionBank.questionsAvailable')}</p>
        </div>
        <Button onClick={generateQuestions} disabled={generating}>
          {generating ? <Loader2 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} animate-spin`} /> : <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />}
          {generating ? t('questionBank.generating') : t('questionBank.generateQuestions')}
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
          <Input
            placeholder={t('questionBank.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={isRTL ? 'pr-10' : 'pl-10'}
          />
        </div>
        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t('questionBank.allLevels')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('questionBank.allLevels')}</SelectItem>
            <SelectItem value="easy">{t('quizGenerator.easy')}</SelectItem>
            <SelectItem value="medium">{t('quizGenerator.medium')}</SelectItem>
            <SelectItem value="hard">{t('quizGenerator.hard')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t('questionBank.allSubjects')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('questionBank.allSubjects')}</SelectItem>
            {subjects.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">{t('common.loading')}</div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('questionBank.noQuestions')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(q => (
            <Card key={q.id} className="rounded-2xl hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium">{q.question_text}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('questionBank.answer')}: <span className="text-foreground">{q.answer}</span>
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Badge variant="outline">{q.subject}</Badge>
                    <Badge variant={q.difficulty === 'hard' ? 'destructive' : q.difficulty === 'easy' ? 'secondary' : 'default'}>
                      {q.difficulty}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
