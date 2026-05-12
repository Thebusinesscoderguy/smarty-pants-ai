import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle2, Sparkles, RefreshCw, Inbox, FileQuestion } from 'lucide-react';
import { useGradingInbox, type GradingItem } from '@/hooks/useGradingInbox';
import { useQuizReviewInbox, type QuizReviewItem } from '@/hooks/useQuizReviewInbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export const GradingInbox = () => {
  const { items, loading, approve, bulkApproveHighConfidence, refresh } = useGradingInbox();
  const { items: quizItems, loading: quizLoading, grade: gradeQuiz, refresh: refreshQuiz } = useQuizReviewInbox();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editScore, setEditScore] = useState<string>('');
  const [editFeedback, setEditFeedback] = useState<string>('');
  const [running, setRunning] = useState(false);
  const [quizDrafts, setQuizDrafts] = useState<Record<string, { score: string; feedback: string }>>({});

  const quizKey = (q: QuizReviewItem) => `${q.attempt_id}-${q.question_index}`;
  const setDraft = (k: string, patch: Partial<{ score: string; feedback: string }>) =>
    setQuizDrafts((prev) => ({ ...prev, [k]: { score: '', feedback: '', ...prev[k], ...patch } }));

  const runNow = async () => {
    setRunning(true);
    try {
      const { error } = await supabase.functions.invoke('auto-grade-homework');
      if (error) throw error;
      toast({ title: 'AI grading run complete' });
      await refresh();
    } catch (e: any) {
      toast({ title: 'Failed to run', description: e.message, variant: 'destructive' });
    } finally {
      setRunning(false);
    }
  };

  const startEdit = (item: GradingItem) => {
    setEditingId(item.id);
    setEditScore(String(item.ai_score ?? 0));
    setEditFeedback(item.ai_feedback ?? '');
  };

  const saveEdit = async (id: string) => {
    await approve(id, Number(editScore), editFeedback);
    setEditingId(null);
  };

  const confidenceBadge = (c: number | null) => {
    const v = c ?? 0;
    if (v >= 0.8) return <Badge variant="outline" className="border-primary/30 text-primary">High confidence</Badge>;
    if (v >= 0.5) return <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">Medium</Badge>;
    return <Badge variant="destructive">Low — review carefully</Badge>;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Grading Inbox
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              AI grades homework overnight. Review and approve in minutes.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={runNow} disabled={running}>
              {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Run AI grading now
            </Button>
            {items.length > 0 && (
              <Button size="sm" onClick={bulkApproveHighConfidence}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve all high-confidence
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">All caught up</h3>
            <p className="text-muted-foreground">AI is grading new submissions overnight. Check back tomorrow.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h4 className="font-semibold">{item.student_name}</h4>
                      <span className="text-sm text-muted-foreground">·</span>
                      <span className="text-sm text-muted-foreground">{item.assignment_title}</span>
                      {confidenceBadge(item.ai_confidence)}
                    </div>
                    {editingId === item.id ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="text-sm">Score:</label>
                          <Input type="number" min={0} max={100} value={editScore}
                            onChange={(e) => setEditScore(e.target.value)} className="w-24" />
                        </div>
                        <Textarea value={editFeedback} onChange={(e) => setEditFeedback(e.target.value)} rows={3} />
                      </div>
                    ) : (
                      <>
                        <div className="text-2xl font-bold mb-1">{item.ai_score}/100</div>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{item.ai_feedback}</p>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {editingId === item.id ? (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                        <Button size="sm" onClick={() => saveEdit(item.id)}>Save & Approve</Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => startEdit(item)}>Override</Button>
                        <Button size="sm" onClick={() => approve(item.id)}>
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileQuestion className="h-5 w-5 text-primary" />
              Quiz & Exam Open-Ended Review
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              MCQs and matching questions auto-grade. Open-ended answers wait here for your review.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={refreshQuiz} disabled={quizLoading}>
            {quizLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
        </CardHeader>
      </Card>

      {quizLoading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : quizItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No open-ended responses awaiting review.
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
                    <Badge variant="outline">{q.points} pts</Badge>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Question</div>
                    <p className="text-sm text-muted-foreground">{q.question}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Student answer</div>
                    <p className="text-sm whitespace-pre-line bg-muted/40 rounded-md p-2">{q.student_answer || <em className="text-muted-foreground">No answer provided</em>}</p>
                  </div>
                  {q.reference_answer && (
                    <div>
                      <div className="text-sm font-medium mb-1">Reference answer</div>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{q.reference_answer}</p>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm">Award:</label>
                      <Input type="number" min={0} max={q.points} step={0.5}
                        value={draft.score}
                        onChange={(e) => setDraft(k, { score: e.target.value })}
                        placeholder={`0-${q.points}`} className="w-24" />
                      <span className="text-sm text-muted-foreground">/ {q.points}</span>
                    </div>
                    <Textarea
                      value={draft.feedback}
                      onChange={(e) => setDraft(k, { feedback: e.target.value })}
                      rows={2} placeholder="Optional feedback for the student" className="flex-1" />
                    <Button size="sm" onClick={() => {
                      const n = Number(draft.score);
                      if (Number.isNaN(n) || n < 0 || n > q.points) {
                        toast({ title: `Enter a score between 0 and ${q.points}`, variant: 'destructive' });
                        return;
                      }
                      gradeQuiz(q, n, draft.feedback);
                    }}>
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Save grade
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
