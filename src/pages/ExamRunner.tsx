import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { AlertTriangle, Clock, Loader2, Lock, ShieldAlert } from 'lucide-react';

interface TestQuestion {
  id: string;
  question: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[] | null;
  correct_answer: string;
  points: number;
  order_index: number;
}

interface TestRow {
  id: string;
  title: string;
  description: string | null;
  time_limit_minutes: number;
  assessment_mode: 'practice' | 'exam';
  question_randomization: boolean;
  question_order_locked: boolean;
  allow_backtracking: boolean;
  violation_threshold: number;
  violation_action: 'flag' | 'auto_submit';
  exam_instructions: string | null;
}

const seededShuffle = <T,>(arr: T[], seed: string): T[] => {
  const a = arr.slice();
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  for (let i = a.length - 1; i > 0; i--) {
    h = (h * 1664525 + 1013904223) >>> 0;
    const j = h % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const requestFullscreen = async () => {
  const el = document.documentElement as any;
  try {
    if (el.requestFullscreen) await el.requestFullscreen();
    else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
  } catch (e) {
    // ignore — user gesture may be required
  }
};

const exitFullscreen = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
  } catch {}
};

export default function ExamRunner() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [test, setTest] = useState<TestRow | null>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [phase, setPhase] = useState<'loading' | 'intro' | 'in_progress' | 'submitting' | 'submitted' | 'denied' | 'duplicate'>('loading');
  const [violations, setViolations] = useState(0);
  const [warning, setWarning] = useState<string | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const violationsRef = useRef(0);
  const submittedRef = useRef(false);
  const sessionRef = useRef<string | null>(null);
  const inactivityRef = useRef<number>(Date.now());
  const tabIdRef = useRef<string>(Math.random().toString(36).slice(2) + Date.now().toString(36));

  // Load test
  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/auth'); return; }
    if (!testId) return;

    const load = async () => {
      const { data: t, error } = await supabase
        .from('tests')
        .select('id, title, description, time_limit_minutes, assessment_mode, question_randomization, question_order_locked, allow_backtracking, violation_threshold, violation_action, exam_instructions')
        .eq('id', testId)
        .maybeSingle();
      if (error || !t) { setErrorMsg('Exam not found.'); setPhase('denied'); return; }
      if (t.assessment_mode !== 'exam') { setErrorMsg('This assessment is not in Exam Mode.'); setPhase('denied'); return; }

      const { data: qs, error: qErr } = await supabase
        .from('test_questions')
        .select('*')
        .eq('test_id', testId)
        .order('order_index', { ascending: true });
      if (qErr || !qs) { setErrorMsg('Could not load exam questions.'); setPhase('denied'); return; }

      const parsed: TestQuestion[] = qs.map((q: any) => ({
        id: q.id,
        question: q.question,
        question_type: q.question_type || 'multiple_choice',
        options: Array.isArray(q.options) ? q.options : (q.options ? Object.values(q.options) : null),
        correct_answer: q.correct_answer,
        points: q.points ?? 1,
        order_index: q.order_index ?? 0,
      }));

      setTest(t as TestRow);
      const ordered = t.question_randomization && !t.question_order_locked
        ? seededShuffle(parsed, `${t.id}-${user.id}`)
        : parsed;
      setQuestions(ordered);
      setPhase('intro');
    };
    load();
  }, [testId, user, loading, navigate]);

  const totalPoints = useMemo(() => questions.reduce((s, q) => s + (q.points ?? 1), 0), [questions]);

  const recordViolation = useCallback(async (type: string, details: Record<string, any> = {}) => {
    if (submittedRef.current || !sessionRef.current) return;
    violationsRef.current += 1;
    setViolations(violationsRef.current);
    setWarning(`Warning: ${type.replace(/_/g, ' ')}. Violations: ${violationsRef.current}/${test?.violation_threshold ?? 3}`);
    setTimeout(() => setWarning(null), 4000);
    try {
      await supabase.from('exam_violations').insert({
        session_id: sessionRef.current,
        type,
        details,
      });
      await supabase.from('exam_sessions').update({
        violation_count: violationsRef.current,
        flagged: violationsRef.current >= (test?.violation_threshold ?? 3),
      }).eq('id', sessionRef.current);
    } catch (e) {
      console.error('violation log failed', e);
    }

    if (test && violationsRef.current >= test.violation_threshold && test.violation_action === 'auto_submit') {
      handleSubmit(true);
    }
  }, [test]);

  // anti-cheat listeners
  useEffect(() => {
    if (phase !== 'in_progress') return;

    const onVisibility = () => {
      if (document.hidden) recordViolation('tab_switch');
    };
    const onBlur = () => recordViolation('window_blur');
    const onFsChange = () => {
      if (!document.fullscreenElement) {
        recordViolation('exit_fullscreen');
        // Try to re-enter
        requestFullscreen();
      }
    };
    const onContext = (e: MouseEvent) => { e.preventDefault(); recordViolation('right_click'); };
    const onCopy = (e: ClipboardEvent) => { e.preventDefault(); recordViolation('copy_paste', { kind: 'copy' }); };
    const onPaste = (e: ClipboardEvent) => { e.preventDefault(); recordViolation('copy_paste', { kind: 'paste' }); };
    const onCut = (e: ClipboardEvent) => { e.preventDefault(); recordViolation('copy_paste', { kind: 'cut' }); };
    const onKey = (e: KeyboardEvent) => {
      // Block common nav shortcuts
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'p', 's', 'u', 'a'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    const onActivity = () => { inactivityRef.current = Date.now(); };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('contextmenu', onContext);
    document.addEventListener('copy', onCopy);
    document.addEventListener('paste', onPaste);
    document.addEventListener('cut', onCut);
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousemove', onActivity);
    document.addEventListener('keypress', onActivity);

    const inactivityTimer = window.setInterval(() => {
      if (Date.now() - inactivityRef.current > 120000) {
        recordViolation('inactivity');
        inactivityRef.current = Date.now();
      }
    }, 30000);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('contextmenu', onContext);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('cut', onCut);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousemove', onActivity);
      document.removeEventListener('keypress', onActivity);
      window.clearInterval(inactivityTimer);
    };
  }, [phase, recordViolation]);

  // timer
  useEffect(() => {
    if (phase !== 'in_progress' || !startTime || !test) return;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = test.time_limit_minutes * 60 - elapsed;
      setSecondsLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        handleSubmit(true);
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [phase, startTime, test]);

  const handleStart = async () => {
    if (!test || !user) return;
    try {
      const { data, error } = await supabase.from('exam_sessions').insert({
        user_id: user.id,
        quiz_id: test.id,
        time_limit: test.time_limit_minutes,
        total_points: totalPoints,
        status: 'in_progress',
      }).select('id, start_time').single();
      if (error) throw error;
      setSessionId(data.id);
      sessionRef.current = data.id;
      setStartTime(new Date(data.start_time).getTime());
      setPhase('in_progress');
      await requestFullscreen();
    } catch (e: any) {
      toast({ title: 'Cannot start exam', description: e.message || 'You may not be assigned to this exam.', variant: 'destructive' });
      setErrorMsg(e.message || 'You may not be assigned to this exam.');
      setPhase('denied');
    }
  };

  const handleSubmit = async (auto = false) => {
    if (submittedRef.current || !test || !sessionRef.current) return;
    submittedRef.current = true;
    setPhase('submitting');

    let score = 0;
    const answerPayload = await Promise.all(questions.map(async (q) => {
      const selected = answers[q.id] ?? '';
      let isCorrect = false;
      let aiFeedback = '';
      if (q.question_type === 'short_answer' && selected.trim()) {
        try {
          const { data } = await supabase.functions.invoke('check-open-answer', {
            body: { userAnswer: selected, correctAnswer: q.correct_answer, question: q.question },
          });
          if (data?.success) {
            isCorrect = !!data.is_correct;
            aiFeedback = data.feedback || '';
          } else {
            isCorrect = selected.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
          }
        } catch {
          isCorrect = selected.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
        }
      } else {
        isCorrect = String(selected).trim() === String(q.correct_answer).trim();
      }
      if (isCorrect) score += q.points ?? 1;
      return {
        id: q.id,
        question: q.question,
        selected,
        correct: q.correct_answer,
        is_correct: isCorrect,
        points: q.points ?? 1,
        ai_feedback: aiFeedback,
      };
    }));

    const total = totalPoints;
    const percentage = total > 0 ? Math.round((score * 100) / total) : 0;
    const elapsed = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;

    try {
      await supabase.from('exam_sessions').update({
        end_time: new Date().toISOString(),
        submitted_at: new Date().toISOString(),
        status: auto ? 'auto_submitted' : 'submitted',
        score,
        total_points: total,
        percentage,
        answers: answerPayload,
        time_taken_seconds: elapsed,
        flagged: violationsRef.current >= (test?.violation_threshold ?? 3),
      }).eq('id', sessionRef.current);

      // Mirror to test_attempts so existing analytics/gradebook pick it up
      await supabase.from('test_attempts').insert({
        test_id: test.id,
        student_id: user!.id,
        score,
        total_points: total,
        percentage,
        answers: answerPayload as any,
        time_taken_minutes: Math.max(1, Math.round(elapsed / 60)),
      });
    } catch (e) {
      console.error('submit failed', e);
    }

    await exitFullscreen();
    setPhase('submitted');
  };

  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (phase === 'denied') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-destructive" /> Access denied</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{errorMsg || 'You are not allowed to take this exam.'}</p>
            <Button onClick={() => navigate('/dashboard')}>Back to dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === 'intro' && test) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-primary" /> {test.title} — Exam Mode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {test.description && <p className="text-sm text-muted-foreground">{test.description}</p>}
            {test.exam_instructions && (
              <div className="p-3 rounded border border-border bg-muted/50 text-sm whitespace-pre-line">{test.exam_instructions}</div>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><strong>Time limit:</strong> {test.time_limit_minutes} min</div>
              <div><strong>Questions:</strong> {questions.length}</div>
              <div><strong>Backtracking:</strong> {test.allow_backtracking ? 'Allowed' : 'Disabled'}</div>
              <div><strong>Randomized:</strong> {test.question_randomization && !test.question_order_locked ? 'Yes' : 'No'}</div>
            </div>
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
              <p className="font-semibold mb-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Anti-cheating rules</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Stay in fullscreen — leaving counts as a violation.</li>
                <li>Do not switch tabs or windows.</li>
                <li>Copy, paste, and right-click are disabled.</li>
                <li>{test.violation_threshold} violations will {test.violation_action === 'auto_submit' ? 'auto-submit your exam' : 'flag your submission'}.</li>
              </ul>
            </div>
            <Button onClick={handleStart} className="w-full">Start exam</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === 'submitting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Submitting your exam…</p>
        </div>
      </div>
    );
  }

  if (phase === 'submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Exam submitted</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Your responses have been recorded. Your teacher will review them.</p>
            {violations > 0 && (
              <p className="text-xs text-amber-600">Recorded violations: {violations}</p>
            )}
            <Button onClick={() => navigate('/dashboard')}>Back to dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // in_progress
  const q = questions[index];
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeColor = secondsLeft < 60 ? 'text-destructive' : secondsLeft < 300 ? 'text-amber-500' : 'text-foreground';

  return (
    <div className="fixed inset-0 z-[9999] bg-background text-foreground overflow-y-auto select-none" style={{ userSelect: 'none' }}>
      <div className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <Lock className="h-4 w-4 text-primary" />
          <span className="font-semibold truncate max-w-[40vw]">{test?.title}</span>
          <Badge variant="outline">Exam Mode</Badge>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={violations > 0 ? 'destructive' : 'secondary'} className="gap-1">
            <ShieldAlert className="h-3 w-3" /> {violations}/{test?.violation_threshold}
          </Badge>
          <div className={`flex items-center gap-1 font-mono text-lg font-bold ${timeColor}`}>
            <Clock className="h-4 w-4" /> {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Floating corner countdown — always visible while exam is in progress */}
      <div
        className={`fixed top-3 right-3 z-[10000] flex items-center gap-1.5 rounded-md border border-border bg-card/95 backdrop-blur px-2.5 py-1 font-mono text-sm font-semibold shadow-md ${timeColor}`}
        aria-live="polite"
        aria-label="Time remaining"
      >
        <Clock className="h-3.5 w-3.5" />
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>

      {warning && (
        <div className="bg-destructive text-destructive-foreground px-4 py-2 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> {warning}
        </div>
      )}

      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Question {index + 1} of {questions.length}</span>
            <span>{Object.keys(answers).length} answered</span>
          </div>
          <Progress value={((index + 1) / questions.length) * 100} />
        </div>

        {q && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium leading-relaxed">{q.question}</CardTitle>
            </CardHeader>
            <CardContent>
              {q.question_type === 'short_answer' ? (
                <div className="space-y-2">
                  <Label htmlFor="ans">Your answer</Label>
                  <Input
                    id="ans"
                    value={answers[q.id] ?? ''}
                    onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
                    onPaste={(e) => e.preventDefault()}
                    autoComplete="off"
                  />
                </div>
              ) : (
                <RadioGroup
                  value={answers[q.id] ?? ''}
                  onValueChange={(v) => setAnswers((p) => ({ ...p, [q.id]: v }))}
                  className="space-y-2"
                >
                  {(q.options ?? (q.question_type === 'true_false' ? ['true', 'false'] : [])).map((opt, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded border border-border hover:bg-muted/50">
                      <RadioGroupItem id={`o-${i}`} value={String(opt)} />
                      <Label htmlFor={`o-${i}`} className="cursor-pointer flex-1">{String(opt)}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between gap-2">
          <Button
            variant="outline"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0 || !test?.allow_backtracking}
          >
            Previous
          </Button>
          {index < questions.length - 1 ? (
            <Button onClick={() => setIndex((i) => i + 1)}>Next</Button>
          ) : (
            <Button onClick={() => setConfirmSubmit(true)}>Submit exam</Button>
          )}
        </div>
      </div>

      <AlertDialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit your exam?</AlertDialogTitle>
            <AlertDialogDescription>
              You answered {Object.keys(answers).length} of {questions.length} questions.
              Once submitted you cannot make changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep working</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleSubmit(false)}>Submit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
