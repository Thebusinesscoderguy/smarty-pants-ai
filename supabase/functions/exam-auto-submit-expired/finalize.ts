// Shared exam-finalization logic used by both `exam-submit` (student-initiated)
// and `exam-auto-submit-expired` (cron-triggered). Kept byte-identical in both
// function dirs so exams grade the same whether submitted manually or auto-closed.
//
// Grading rule (uniform across exams and assignments):
//   - Free-text / open-ended answers  -> deferred to the teacher (is_correct=null,
//     needs_review=true). NEVER AI-graded.
//   - Objective (multiple_choice, true_false, matching) -> auto-scored instantly
//     against the teacher's answer key.

interface SubmittedAnswer { question_id: string; answer: string; }

// Matching grade: parse the student's JSON array of selected right-values and the
// canonical right[] from correct_answer; correct only if every pair matches.
function matchingIsCorrect(selected: string, correct: string): boolean {
  try {
    const got = JSON.parse(selected || '[]');
    const want = JSON.parse(correct || '[]');
    if (!Array.isArray(got) || !Array.isArray(want)) return false;
    if (got.length !== want.length || want.length === 0) return false;
    return want.every((w: unknown, i: number) => String(got[i] ?? '').trim() === String(w ?? '').trim());
  } catch {
    return false;
  }
}

export async function finalizeSession(opts: {
  admin: any;
  userId: string | null;
  sessionId: string;
  submitted: SubmittedAnswer[];
  auto: boolean;
  callerIsSystem: boolean;
  supabaseUrl: string;
  anonKey: string;
  authHeader: string | null;
}) {
  const { admin, userId, sessionId, submitted, auto, callerIsSystem } = opts;

  const { data: session } = await admin
    .from('exam_sessions')
    .select('id, user_id, quiz_id, status, start_time, time_limit, violation_count')
    .eq('id', sessionId)
    .maybeSingle();
  if (!session) return { status: 404, body: { error: 'Session not found' } };
  if (!callerIsSystem && session.user_id !== userId) return { status: 403, body: { error: 'Forbidden' } };
  if (session.status !== 'in_progress') return { status: 200, body: { already_submitted: true } };

  const { data: test } = await admin
    .from('tests')
    .select('violation_threshold')
    .eq('id', session.quiz_id)
    .maybeSingle();

  const { data: qs } = await admin
    .from('test_questions')
    .select('id, question, question_type, correct_answer, points')
    .eq('test_id', session.quiz_id);
  const questions = qs ?? [];

  const answerMap = new Map<string, string>();
  for (const a of submitted) {
    if (a && typeof a.question_id === 'string') answerMap.set(a.question_id, String(a.answer ?? ''));
  }

  let score = 0;
  let totalPoints = 0;
  const graded: any[] = [];

  const OPEN_ENDED = new Set(['short_answer', 'essay', 'open_ended', 'long_answer']);

  for (const q of questions) {
    const points = q.points ?? 1;
    totalPoints += points;
    const selected = answerMap.get(q.id) ?? '';
    let isCorrect: boolean | null = false;
    const isOpen = OPEN_ENDED.has(q.question_type);

    if (isOpen) {
      // Open-ended: defer to teacher review. Do not auto-grade.
      isCorrect = null;
    } else if (q.question_type === 'matching') {
      // Matching: correct_answer is the canonical right[] (JSON array); the student
      // answer is JSON.stringify(selectedRightValue[]) aligned to the left[] order.
      // All-or-nothing: every pair must match.
      isCorrect = matchingIsCorrect(selected, q.correct_answer);
    } else {
      isCorrect = String(selected).trim() === String(q.correct_answer).trim();
    }

    if (isCorrect === true) score += points;
    graded.push({
      id: q.id,
      question: q.question,
      selected,
      correct: q.correct_answer,
      is_correct: isCorrect,
      needs_review: isOpen,
      points,
      ai_feedback: '',
    });
  }

  const percentage = totalPoints > 0 ? Math.round((score * 100) / totalPoints) : 0;
  const elapsed = Math.max(0, Math.round((Date.now() - new Date(session.start_time).getTime()) / 1000));
  const flagged = (session.violation_count ?? 0) >= (test?.violation_threshold ?? 3);

  await admin.from('exam_sessions').update({
    end_time: new Date().toISOString(),
    submitted_at: new Date().toISOString(),
    status: auto ? 'auto_submitted' : 'submitted',
    score,
    total_points: totalPoints,
    percentage,
    answers: graded,
    time_taken_seconds: elapsed,
    flagged,
  }).eq('id', sessionId);

  await admin.from('test_attempts').insert({
    test_id: session.quiz_id,
    student_id: session.user_id,
    score,
    total_points: totalPoints,
    percentage,
    answers: graded,
    time_taken_minutes: Math.max(1, Math.round(elapsed / 60)),
  });

  await admin.from('exam_session_locks').delete().eq('session_id', sessionId);

  return {
    status: 200,
    body: { ok: true, score, total_points: totalPoints, percentage, flagged, auto, graded },
  };
}
