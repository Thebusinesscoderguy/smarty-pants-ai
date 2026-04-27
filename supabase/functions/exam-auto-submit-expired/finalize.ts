// Shared exam-finalization logic used by both `exam-submit` (student-initiated)
// and `exam-auto-submit-expired` (cron-triggered).

interface SubmittedAnswer { question_id: string; answer: string; }

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

  for (const q of questions) {
    const points = q.points ?? 1;
    totalPoints += points;
    const selected = answerMap.get(q.id) ?? '';
    let isCorrect = false;
    let aiFeedback = '';

    if (q.question_type === 'short_answer' && selected.trim()) {
      try {
        const resp = await fetch(`${opts.supabaseUrl}/functions/v1/check-open-answer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: opts.anonKey,
            Authorization: opts.authHeader ?? `Bearer ${opts.anonKey}`,
          },
          body: JSON.stringify({ userAnswer: selected, correctAnswer: q.correct_answer, question: q.question }),
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data?.success) {
            isCorrect = !!data.is_correct;
            aiFeedback = data.feedback || '';
          } else {
            isCorrect = selected.trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase();
          }
        } else {
          isCorrect = selected.trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase();
        }
      } catch {
        isCorrect = selected.trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase();
      }
    } else {
      isCorrect = String(selected).trim() === String(q.correct_answer).trim();
    }

    if (isCorrect) score += points;
    graded.push({
      id: q.id,
      question: q.question,
      selected,
      correct: q.correct_answer,
      is_correct: isCorrect,
      points,
      ai_feedback: aiFeedback,
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
