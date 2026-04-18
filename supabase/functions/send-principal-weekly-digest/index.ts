// Weekly digest email to school admins/principals. Cron-invoked Mondays.
// Optional ?school_id=<uuid> for "send me a preview" calls.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend';
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

interface SchoolPulse {
  schoolName: string;
  totalStudents: number;
  weeklyActiveStudents: number;
  atRiskCount: number;
  avgGrade: number;
  gradeTrend: number;
  homeworkSubmissions: number;
  gradingPending: number;
  topSection?: { name: string; avg: number };
  bottomSection?: { name: string; avg: number };
}

function buildHtml(adminName: string, p: SchoolPulse): string {
  const trendArrow = p.gradeTrend > 0 ? '📈' : p.gradeTrend < 0 ? '📉' : '➡️';
  const trendText = p.gradeTrend === 0 ? 'no change' : `${p.gradeTrend > 0 ? '+' : ''}${p.gradeTrend.toFixed(1)} pts vs last week`;

  return `<!doctype html><html><body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;">
    <div style="max-width:640px;margin:0 auto;padding:32px 24px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#f97316;margin:0;font-size:28px;">Teachly</h1>
        <p style="color:#6b7280;margin:8px 0 0;">School Pulse · weekly digest</p>
      </div>
      <p style="color:#1f2937;font-size:16px;">Hi ${adminName},</p>
      <p style="color:#4b5563;">Here's how <strong>${p.schoolName}</strong> performed this week:</p>

      <div style="display:block;margin:24px 0;padding:20px;background:#fff7ed;border-radius:12px;border-left:4px solid #f97316;">
        <h2 style="margin:0 0 12px;color:#1f2937;font-size:18px;">📊 Headline numbers</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#6b7280;">Total students</td><td style="text-align:right;font-weight:600;">${p.totalStudents}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Active this week</td><td style="text-align:right;font-weight:600;">${p.weeklyActiveStudents} (${p.totalStudents > 0 ? Math.round((p.weeklyActiveStudents / p.totalStudents) * 100) : 0}%)</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">School average grade</td><td style="text-align:right;font-weight:600;">${p.avgGrade}% ${trendArrow}</td></tr>
          <tr><td style="padding:6px 0;color:#9ca3af;font-size:12px;">Trend</td><td style="text-align:right;font-size:12px;color:#9ca3af;">${trendText}</td></tr>
        </table>
      </div>

      <div style="display:block;margin:16px 0;padding:20px;background:#fef2f2;border-radius:12px;border-left:4px solid #ef4444;">
        <h2 style="margin:0 0 12px;color:#1f2937;font-size:18px;">⚠️ Needs attention</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#6b7280;">At-risk students</td><td style="text-align:right;font-weight:600;color:${p.atRiskCount > 0 ? '#dc2626' : '#16a34a'};">${p.atRiskCount}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Homework awaiting grading</td><td style="text-align:right;font-weight:600;">${p.gradingPending}</td></tr>
        </table>
      </div>

      <div style="display:block;margin:16px 0;padding:20px;background:#f0fdf4;border-radius:12px;border-left:4px solid #22c55e;">
        <h2 style="margin:0 0 12px;color:#1f2937;font-size:18px;">📚 Activity</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#6b7280;">Homework submissions</td><td style="text-align:right;font-weight:600;">${p.homeworkSubmissions}</td></tr>
          ${p.topSection ? `<tr><td style="padding:6px 0;color:#6b7280;">🏆 Top class</td><td style="text-align:right;font-weight:600;">${p.topSection.name} (${p.topSection.avg}%)</td></tr>` : ''}
          ${p.bottomSection ? `<tr><td style="padding:6px 0;color:#6b7280;">🎯 Needs support</td><td style="text-align:right;font-weight:600;">${p.bottomSection.name} (${p.bottomSection.avg}%)</td></tr>` : ''}
        </table>
      </div>

      <div style="text-align:center;margin:32px 0;">
        <a href="https://teachlyai.com/school-admin" style="background:#f97316;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Open School Pulse →</a>
      </div>
      <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:32px;">
        You receive this because weekly School Pulse is enabled. <a href="https://teachlyai.com/school-admin" style="color:#9ca3af;">Manage preferences</a>
      </p>
    </div></body></html>`;
}

async function buildSchoolPulse(supabase: any, schoolId: string, schoolName: string): Promise<SchoolPulse> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const sincePrev = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  // Students in this school
  const { data: studentRels } = await supabase
    .from('school_student_relationships')
    .select('student_id')
    .eq('school_id', schoolId);
  const studentIds = (studentRels ?? []).map((r: any) => r.student_id);
  const totalStudents = studentIds.length;

  if (totalStudents === 0) {
    return { schoolName, totalStudents: 0, weeklyActiveStudents: 0, atRiskCount: 0, avgGrade: 0, gradeTrend: 0, homeworkSubmissions: 0, gradingPending: 0 };
  }

  // Weekly active = students with progress updates in last 7 days
  const { data: progressRows } = await supabase
    .from('user_progress')
    .select('user_id')
    .in('user_id', studentIds)
    .gte('updated_at', since);
  const weeklyActiveStudents = new Set((progressRows ?? []).map((r: any) => r.user_id)).size;

  // Homework submissions this week (only for this school's assignments)
  const { data: schoolAssignments } = await supabase
    .from('homework_assignments')
    .select('id')
    .eq('school_id', schoolId);
  const assignmentIds = (schoolAssignments ?? []).map((a: any) => a.id);

  let homeworkSubmissions = 0;
  let gradingPending = 0;
  if (assignmentIds.length > 0) {
    const { count: subCount } = await supabase
      .from('homework_submissions')
      .select('id', { count: 'exact', head: true })
      .in('assignment_id', assignmentIds)
      .gte('submitted_at', since);
    homeworkSubmissions = subCount ?? 0;

    const { count: pendingCount } = await supabase
      .from('homework_submissions')
      .select('id', { count: 'exact', head: true })
      .in('assignment_id', assignmentIds)
      .is('score', null)
      .not('submitted_at', 'is', null);
    gradingPending = pendingCount ?? 0;
  }

  // Avg grade from student_semester_marks (school's students)
  const { data: marks } = await supabase
    .from('student_semester_marks')
    .select('student_id, total_marks')
    .in('student_id', studentIds);
  const validMarks = (marks ?? []).filter((m: any) => typeof m.total_marks === 'number');
  const avgGrade = validMarks.length > 0
    ? Math.round(validMarks.reduce((s: number, m: any) => s + Number(m.total_marks), 0) / validMarks.length)
    : 0;

  // Grade trend = avg of quiz_attempts last 7d vs prev 7d
  const { data: recentAttempts } = await supabase
    .from('quiz_attempts')
    .select('score, total_possible, completed_at')
    .in('user_id', studentIds)
    .gte('completed_at', sincePrev);

  const recentScores = (recentAttempts ?? []).filter((a: any) => a.total_possible > 0 && a.completed_at >= since);
  const prevScores = (recentAttempts ?? []).filter((a: any) => a.total_possible > 0 && a.completed_at < since);
  const recentAvg = recentScores.length > 0 ? recentScores.reduce((s: number, a: any) => s + (a.score / a.total_possible) * 100, 0) / recentScores.length : 0;
  const prevAvg = prevScores.length > 0 ? prevScores.reduce((s: number, a: any) => s + (a.score / a.total_possible) * 100, 0) / prevScores.length : 0;
  const gradeTrend = prevAvg > 0 ? recentAvg - prevAvg : 0;

  // At-risk: students with strength_score avg < 0.5 across analytics
  const { data: analytics } = await supabase
    .from('learning_analytics')
    .select('user_id, strength_score')
    .in('user_id', studentIds);
  const byStudent = new Map<string, number[]>();
  for (const a of (analytics ?? [])) {
    if (!byStudent.has(a.user_id)) byStudent.set(a.user_id, []);
    byStudent.get(a.user_id)!.push(Number(a.strength_score) || 0);
  }
  let atRiskCount = 0;
  for (const scores of byStudent.values()) {
    const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
    if (avg < 0.5) atRiskCount++;
  }

  // Top/bottom section (by average quiz score this week)
  const { data: sections } = await supabase
    .from('school_sections')
    .select('id, grade_level, section_name')
    .eq('school_id', schoolId);

  const sectionStats: { name: string; avg: number }[] = [];
  for (const s of (sections ?? [])) {
    const { data: secStudents } = await supabase
      .from('section_students')
      .select('student_id')
      .eq('section_id', s.id);
    const secIds = (secStudents ?? []).map((r: any) => r.student_id);
    if (secIds.length === 0) continue;
    const { data: secAttempts } = await supabase
      .from('quiz_attempts')
      .select('score, total_possible')
      .in('user_id', secIds)
      .gte('completed_at', since);
    const valid = (secAttempts ?? []).filter((a: any) => a.total_possible > 0);
    if (valid.length === 0) continue;
    const avg = Math.round(valid.reduce((sum: number, a: any) => sum + (a.score / a.total_possible) * 100, 0) / valid.length);
    sectionStats.push({ name: `Grade ${s.grade_level}${s.section_name ? ' ' + s.section_name : ''}`, avg });
  }
  sectionStats.sort((a, b) => b.avg - a.avg);
  const topSection = sectionStats[0];
  const bottomSection = sectionStats.length > 1 ? sectionStats[sectionStats.length - 1] : undefined;

  return {
    schoolName,
    totalStudents,
    weeklyActiveStudents,
    atRiskCount,
    avgGrade,
    gradeTrend,
    homeworkSubmissions,
    gradingPending,
    topSection,
    bottomSection,
  };
}

async function sendDigestForSchool(supabase: any, schoolId: string): Promise<boolean> {
  const { data: school } = await supabase
    .from('school_accounts')
    .select('id, school_name, admin_user_id')
    .eq('id', schoolId)
    .maybeSingle();
  if (!school) return false;

  const { data: { user: adminUser } } = await supabase.auth.admin.getUserById(school.admin_user_id);
  if (!adminUser?.email) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', school.admin_user_id)
    .maybeSingle();
  const adminName = profile?.display_name || 'there';

  const pulse = await buildSchoolPulse(supabase, schoolId, school.school_name);
  const html = buildHtml(adminName, pulse);

  const res = await fetch(`${GATEWAY_URL}/emails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'X-Connection-Api-Key': RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: 'Teachly <noreply@teachlyai.com>',
      to: [adminUser.email],
      subject: `📊 ${school.school_name} · School Pulse this week`,
      html,
    }),
  });

  if (!res.ok) {
    console.error('resend error', await res.text());
    return false;
  }

  await supabase
    .from('school_email_preferences')
    .upsert({ school_id: schoolId, last_digest_sent_at: new Date().toISOString() }, { onConflict: 'school_id' });
  return true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const url = new URL(req.url);
  const previewSchoolId = url.searchParams.get('school_id');

  if (previewSchoolId) {
    const ok = await sendDigestForSchool(supabase, previewSchoolId);
    return new Response(JSON.stringify({ sent: ok }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: ok ? 200 : 500,
    });
  }

  // Cron mode: every active school with digest enabled (or no prefs row yet)
  const { data: schools } = await supabase
    .from('school_accounts')
    .select('id')
    .eq('is_active', true);
  const schoolIds = (schools ?? []).map((s: any) => s.id);

  const { data: optedOut } = await supabase
    .from('school_email_preferences')
    .select('school_id')
    .eq('weekly_digest_enabled', false);
  const optedOutSet = new Set((optedOut ?? []).map((p: any) => p.school_id));

  let sent = 0;
  for (const sid of schoolIds) {
    if (optedOutSet.has(sid)) continue;
    const ok = await sendDigestForSchool(supabase, sid);
    if (ok) sent++;
  }

  return new Response(JSON.stringify({ sent, total: schoolIds.length }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
