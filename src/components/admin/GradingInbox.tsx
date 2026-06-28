import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle2, RefreshCw, Inbox, FileQuestion, AlertTriangle, ClipboardCheck } from 'lucide-react';
import { useGradingInbox } from '@/hooks/useGradingInbox';
import { useQuizReviewInbox, type QuizReviewItem } from '@/hooks/useQuizReviewInbox';
import { toast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export const GradingInbox = () => {
  const { t } = useLanguage();
  const { items, loading, error, grade, refresh } = useGradingInbox();
  const { items: quizItems, loading: quizLoading, grade: gradeQuiz, refresh: refreshQuiz } = useQuizReviewInbox();
  const [hwDrafts, setHwDrafts] = useState<Record<string, { score: string; feedback: string }>>({});
  const [quizDrafts, setQuizDrafts] = useState<Record<string, { score: string; feedback: string }>>({});

  const setHwDraft = (id: string, patch: Partial<{ score: string; feedback: string }>) =>
    setHwDrafts((prev) => ({ ...prev, [id]: { score: '', feedback: '', ...prev[id], ...patch } }));

  const quizKey = (q: QuizReviewItem) => `${q.attempt_id}-${q.question_index}`;
  const setDraft = (k: string, patch: Partial<{ score: string; feedback: string }>) =>
    setQuizDrafts((prev) => ({ ...prev, [k]: { score: '', feedback: '', ...prev[k], ...patch } }));

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              {t('grading.title')}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {t('grading.subtitle')}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('grading.refresh')}
          </Button>
        </CardHeader>
      </Card>

      {error ? (
        <Card className="border-destructive/40">
          <CardContent className="py-16 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">{t('grading.loadError')}</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('grading.tryAgain')}
            </Button>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">{t('grading.allCaughtUp')}</h3>
            <p className="text-muted-foreground">{t('grading.allCaughtUpDesc')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const draft = hwDrafts[item.id] ?? { score: '', feedback: '' };
            return (
              <Card key={item.id}>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold">{item.student_name}</h4>
                    <span className="text-sm text-muted-foreground">·</span>
                    <span className="text-sm text-muted-foreground">{item.assignment_title}</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">{t('grading.studentAnswer')}</div>
                    <p className="text-sm whitespace-pre-line bg-muted/40 rounded-md p-2">
                      {item.answer_text || <em className="text-muted-foreground">{t('grading.noAnswer')}</em>}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm">{t('grading.award')}</label>
                      <Input type="number" min={0} max={100} step={0.5}
                        value={draft.score}
                        onChange={(e) => setHwDraft(item.id, { score: e.target.value })}
                        placeholder="0-100" className="w-24" />
                      <span className="text-sm text-muted-foreground">/ 100</span>
                    </div>
                    <Textarea
                      value={draft.feedback}
                      onChange={(e) => setHwDraft(item.id, { feedback: e.target.value })}
                      rows={2} placeholder={t('grading.feedbackPlaceholder')} className="flex-1" />
                    <Button size="sm" onClick={() => {
                      const n = Number(draft.score);
                      if (Number.isNaN(n) || n < 0 || n > 100) {
                        toast({ title: `${t('grading.enterScorePre')} 100`, variant: 'destructive' });
                        return;
                      }
                      grade(item.id, n, draft.feedback);
                    }}>
                      <CheckCircle2 className="h-4 w-4 mr-1" /> {t('grading.saveGrade')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileQuestion className="h-5 w-5 text-primary" />
              {t('grading.quizReviewTitle')}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {t('grading.quizReviewSubtitle')}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={refreshQuiz} disabled={quizLoading}>
            {quizLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            {t('grading.refresh')}
          </Button>
        </CardHeader>
      </Card>

      {quizLoading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : quizItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t('grading.noOpenEnded')}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {quizItems.map((q) => {
            const k = quizKey(q);
            const draft = quizDrafts[k] ?? { score: '', feedback: '' };
            return (
              <Card key={k}>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold">{q.student_name}</h4>
                    <span className="text-sm text-muted-foreground">·</span>
                    <span className="text-sm text-muted-foreground">{q.quiz_title}</span>
                    <Badge variant="outline">{q.points} {t('grading.ptsSuffix')}</Badge>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">{t('grading.question')}</div>
                    <p className="text-sm text-muted-foreground">{q.question}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">{t('grading.studentAnswer')}</div>
                    <p className="text-sm whitespace-pre-line bg-muted/40 rounded-md p-2">{q.student_answer || <em className="text-muted-foreground">{t('grading.noAnswer')}</em>}</p>
                  </div>
                  {q.reference_answer && (
                    <div>
                      <div className="text-sm font-medium mb-1">{t('grading.referenceAnswer')}</div>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{q.reference_answer}</p>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm">{t('grading.award')}</label>
                      <Input type="number" min={0} max={q.points} step={0.5}
                        value={draft.score}
                        onChange={(e) => setDraft(k, { score: e.target.value })}
                        placeholder={`0-${q.points}`} className="w-24" />
                      <span className="text-sm text-muted-foreground">/ {q.points}</span>
                    </div>
                    <Textarea
                      value={draft.feedback}
                      onChange={(e) => setDraft(k, { feedback: e.target.value })}
                      rows={2} placeholder={t('grading.feedbackPlaceholder')} className="flex-1" />
                    <Button size="sm" onClick={() => {
                      const n = Number(draft.score);
                      if (Number.isNaN(n) || n < 0 || n > q.points) {
                        toast({ title: `${t('grading.enterScorePre')} ${q.points}`, variant: 'destructive' });
                        return;
                      }
                      gradeQuiz(q, n, draft.feedback);
                    }}>
                      <CheckCircle2 className="h-4 w-4 mr-1" /> {t('grading.saveGrade')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
