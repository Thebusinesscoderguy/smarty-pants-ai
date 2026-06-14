// PHASE 1 DEMO — isolated, throwaway page to prove the curriculum-grounded
// generation loop with one hand-entered book. Safe to delete entirely (just
// remove this file + its route in App.tsx). Not wired into nav.
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

interface BookRow {
  id: string;
  title: string;
  grade_level: string;
  subject_id: string;
  school_subjects: { name: string } | null;
}
interface LessonRow {
  id: string;
  title: string;
  content: string | null;
  summary: string | null;
  unit_id: string;
  order_index: number;
}
interface QuizQuestion {
  question: string;
  type: string;
  options?: string[];
  correct_answer?: string;
  explanation?: string;
}

export default function CurriculumQuizDemo() {
  const [books, setBooks] = useState<BookRow[]>([]);
  const [bookId, setBookId] = useState<string>('');
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [questionCount, setQuestionCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  // Load published books the current user can read (RLS-scoped per school).
  useEffect(() => {
    (async () => {
      // NOTE: curriculum_* tables aren't in the generated types.ts yet (they're
      // new). This demo casts to `any` to stay isolated; the proper fix when the
      // feature graduates out of demo is to regenerate types.ts from the live DB.
      const { data, error } = await (supabase as any)
        .from('curriculum_books')
        .select('id, title, grade_level, subject_id, school_subjects(name)')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      if (error) { setError(error.message); return; }
      const rows = (data || []) as unknown as BookRow[];
      setBooks(rows);
      if (rows.length) setBookId(rows[0].id);
    })();
  }, []);

  // Load lessons for the selected book (via its units).
  useEffect(() => {
    if (!bookId) { setLessons([]); return; }
    (async () => {
      setLoading(true);
      setError(null);
      setSelected({});
      setQuestions([]);
      const { data: units, error: uErr } = await (supabase as any)
        .from('curriculum_units')
        .select('id')
        .eq('book_id', bookId);
      if (uErr) { setError(uErr.message); setLoading(false); return; }
      const unitIds = ((units || []) as { id: string }[]).map((u) => u.id);
      if (!unitIds.length) { setLessons([]); setLoading(false); return; }
      const { data: les, error: lErr } = await (supabase as any)
        .from('curriculum_lessons')
        .select('id, title, content, summary, unit_id, order_index')
        .in('unit_id', unitIds)
        .order('order_index', { ascending: true });
      if (lErr) { setError(lErr.message); setLoading(false); return; }
      setLessons((les || []) as LessonRow[]);
      setLoading(false);
    })();
  }, [bookId]);

  const book = books.find(b => b.id === bookId) || null;
  const selectedLessons = lessons.filter(l => selected[l.id]);

  const generate = async () => {
    if (!book || selectedLessons.length === 0) return;
    setGenerating(true);
    setError(null);
    setQuestions([]);
    try {
      // Build grounding context from the selected lessons' content (fallback summary).
      const lessonContext = selectedLessons
        .map(l => `## ${l.title}\n${l.content || l.summary || ''}`)
        .join('\n\n');
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: {
          topic: book.title,
          subject: book.school_subjects?.name || undefined,
          gradeLevel: book.grade_level,
          questionCount,
          lessonContext,
        },
      });
      if (error) throw error;
      const qs = (data?.questions || data?.quiz?.questions || []) as QuizQuestion[];
      if (!qs.length) throw new Error('No questions returned');
      setQuestions(qs);
    } catch (e: any) {
      setError(e?.message || 'Failed to generate quiz');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Curriculum Quiz Demo</h1>
        <p className="text-sm text-muted-foreground">
          Phase 1 proof: pick lessons from a hand-entered book → AI generates a quiz grounded in that content.
        </p>
      </div>

      {error && <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <Card>
        <CardHeader><CardTitle>1. Book</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {books.length === 0 ? (
            <p className="text-sm text-muted-foreground">No published books found for your school.</p>
          ) : (
            <select
              className="w-full rounded border p-2 text-sm"
              value={bookId}
              onChange={e => setBookId(e.target.value)}
            >
              {books.map(b => (
                <option key={b.id} value={b.id}>
                  {b.title} — {b.school_subjects?.name || 'subject'} / {b.grade_level}
                </option>
              ))}
            </select>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>2. Lessons (select one or more)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : lessons.length === 0 ? (
            <p className="text-sm text-muted-foreground">No lessons in this book.</p>
          ) : (
            lessons.map(l => (
              <label key={l.id} className="flex items-start gap-2 text-sm">
                <Checkbox
                  checked={!!selected[l.id]}
                  onCheckedChange={(v) => setSelected(s => ({ ...s, [l.id]: !!v }))}
                />
                <span>
                  <span className="font-medium">{l.title}</span>
                  {l.summary && <span className="block text-muted-foreground">{l.summary}</span>}
                </span>
              </label>
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <label className="text-sm">Questions:</label>
        <input
          type="number" min={1} max={20} value={questionCount}
          onChange={e => setQuestionCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
          className="w-20 rounded border p-1 text-sm"
        />
        <Button onClick={generate} disabled={generating || selectedLessons.length === 0}>
          {generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</> : `Generate quiz (${selectedLessons.length} lesson${selectedLessons.length === 1 ? '' : 's'})`}
        </Button>
      </div>

      {questions.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Generated quiz ({questions.length})</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {questions.map((q, i) => (
              <div key={i} className="border-b pb-3 last:border-0">
                <div className="font-medium">{i + 1}. {q.question} <span className="text-xs text-muted-foreground">[{q.type}]</span></div>
                {q.options && (
                  <ul className="ml-5 list-disc text-sm">
                    {q.options.map((o, j) => <li key={j}>{o}</li>)}
                  </ul>
                )}
                {q.correct_answer && <div className="text-sm text-green-700">Answer: {q.correct_answer}</div>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
