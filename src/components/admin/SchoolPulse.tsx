import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, Users, AlertTriangle, Trophy, Target, FileCheck, ClipboardList, Mail, Loader2, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PulseData {
  totalStudents: number;
  weeklyActiveStudents: number;
  avgGrade: number;
  gradeTrend: number;
  atRiskCount: number;
  homeworkSubmissions: number;
  gradingPending: number;
  topSection?: { name: string; avg: number };
  bottomSection?: { name: string; avg: number };
}

export const SchoolPulse = () => {
  const { user } = useAuth();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [data, setData] = useState<PulseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [digestEnabled, setDigestEnabled] = useState(true);
  const [sendingPreview, setSendingPreview] = useState(false);
  const [lastSent, setLastSent] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: school } = await supabase.from('school_accounts').select('id').eq('admin_user_id', user.id).maybeSingle();
      if (school) {
        setSchoolId(school.id);
        await Promise.all([loadPulse(school.id), loadPrefs(school.id)]);
      }
      setLoading(false);
    })();
  }, [user]);

  const loadPrefs = async (sid: string) => {
    const { data } = await supabase.from('school_email_preferences').select('weekly_digest_enabled, last_digest_sent_at').eq('school_id', sid).maybeSingle();
    if (data) {
      setDigestEnabled(data.weekly_digest_enabled);
      setLastSent(data.last_digest_sent_at);
    }
  };

  const loadPulse = async (sid: string) => {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const sincePrev = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const { data: studentRels } = await supabase.from('school_student_relationships').select('student_id').eq('school_id', sid);
    const studentIds = (studentRels ?? []).map(r => r.student_id);
    const totalStudents = studentIds.length;

    if (totalStudents === 0) {
      setData({ totalStudents: 0, weeklyActiveStudents: 0, avgGrade: 0, gradeTrend: 0, atRiskCount: 0, homeworkSubmissions: 0, gradingPending: 0 });
      return;
    }

    const { data: progressRows } = await supabase.from('user_progress').select('user_id').in('user_id', studentIds).gte('updated_at', since);
    const weeklyActiveStudents = new Set((progressRows ?? []).map((r: any) => r.user_id)).size;

    const { data: schoolAssignments } = await supabase.from('homework_assignments').select('id').eq('school_id', sid);
    const assignmentIds = (schoolAssignments ?? []).map(a => a.id);
    let homeworkSubmissions = 0;
    let gradingPending = 0;
    if (assignmentIds.length > 0) {
      const { count: subCount } = await supabase.from('homework_submissions').select('id', { count: 'exact', head: true }).in('assignment_id', assignmentIds).gte('submitted_at', since);
      homeworkSubmissions = subCount ?? 0;
      const { count: pCount } = await supabase.from('homework_submissions').select('id', { count: 'exact', head: true }).in('assignment_id', assignmentIds).is('score', null).not('submitted_at', 'is', null);
      gradingPending = pCount ?? 0;
    }

    const { data: marks } = await supabase.from('student_semester_marks').select('total_marks').in('student_id', studentIds);
    const validMarks = (marks ?? []).filter((m: any) => typeof m.total_marks === 'number');
    const avgGrade = validMarks.length > 0 ? Math.round(validMarks.reduce((s: number, m: any) => s + Number(m.total_marks), 0) / validMarks.length) : 0;

    const { data: attempts } = await supabase.from('quiz_attempts').select('score, total_possible, completed_at').in('user_id', studentIds).gte('completed_at', sincePrev);
    const recent = (attempts ?? []).filter((a: any) => a.total_possible > 0 && a.completed_at >= since);
    const prev = (attempts ?? []).filter((a: any) => a.total_possible > 0 && a.completed_at < since);
    const recentAvg = recent.length > 0 ? recent.reduce((s: number, a: any) => s + (a.score / a.total_possible) * 100, 0) / recent.length : 0;
    const prevAvg = prev.length > 0 ? prev.reduce((s: number, a: any) => s + (a.score / a.total_possible) * 100, 0) / prev.length : 0;
    const gradeTrend = prevAvg > 0 ? recentAvg - prevAvg : 0;

    const { data: analytics } = await supabase.from('learning_analytics').select('user_id, strength_score').in('user_id', studentIds);
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

    const { data: sections } = await supabase.from('school_sections').select('id, grade_level, section_name').eq('school_id', sid);
    const stats: { name: string; avg: number }[] = [];
    for (const s of (sections ?? [])) {
      const { data: ss } = await supabase.from('section_students').select('student_id').eq('section_id', s.id);
      const ids = (ss ?? []).map(r => r.student_id);
      if (ids.length === 0) continue;
      const { data: secAttempts } = await supabase.from('quiz_attempts').select('score, total_possible').in('user_id', ids).gte('completed_at', since);
      const valid = (secAttempts ?? []).filter((a: any) => a.total_possible > 0);
      if (valid.length === 0) continue;
      const avg = Math.round(valid.reduce((sum: number, a: any) => sum + (a.score / a.total_possible) * 100, 0) / valid.length);
      stats.push({ name: `Grade ${s.grade_level}${s.section_name ? ' ' + s.section_name : ''}`, avg });
    }
    stats.sort((a, b) => b.avg - a.avg);

    setData({
      totalStudents, weeklyActiveStudents, avgGrade, gradeTrend, atRiskCount,
      homeworkSubmissions, gradingPending,
      topSection: stats[0],
      bottomSection: stats.length > 1 ? stats[stats.length - 1] : undefined,
    });
  };

  const toggleDigest = async (enabled: boolean) => {
    if (!schoolId) return;
    setDigestEnabled(enabled);
    await supabase.from('school_email_preferences').upsert({ school_id: schoolId, weekly_digest_enabled: enabled }, { onConflict: 'school_id' });
    toast.success(enabled ? 'Weekly digest enabled' : 'Weekly digest disabled');
  };

  const sendPreview = async () => {
    if (!schoolId) return;
    setSendingPreview(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-principal-weekly-digest', {
        body: {},
        method: 'POST',
      });
      // Use query param via direct fetch since we need ?school_id=
      const url = `https://twfzlbockonxopuindaw.supabase.co/functions/v1/send-principal-weekly-digest?school_id=${schoolId}`;
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (res.ok) {
        toast.success('Preview email sent — check your inbox');
        await loadPrefs(schoolId);
      } else {
        toast.error('Could not send preview');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed');
    } finally {
      setSendingPreview(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }

  const TrendIcon = data.gradeTrend > 0 ? TrendingUp : data.gradeTrend < 0 ? TrendingDown : Minus;
  const trendColor = data.gradeTrend > 0 ? 'text-green-600' : data.gradeTrend < 0 ? 'text-red-600' : 'text-muted-foreground';
  const activePct = data.totalStudents > 0 ? Math.round((data.weeklyActiveStudents / data.totalStudents) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Activity className="w-6 h-6 text-primary" />School Pulse</h2>
          <p className="text-sm text-muted-foreground">Weekly snapshot of school health · last 7 days</p>
        </div>
        <Button variant="outline" size="sm" onClick={sendPreview} disabled={sendingPreview}>
          {sendingPreview ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : <><Mail className="w-4 h-4 mr-2" />Send me a preview</>}
        </Button>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><Users className="w-4 h-4" />Active students</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.weeklyActiveStudents}<span className="text-base font-normal text-muted-foreground"> / {data.totalStudents}</span></div>
            <p className="text-xs text-muted-foreground mt-1">{activePct}% engaged this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><TrendIcon className={`w-4 h-4 ${trendColor}`} />Avg grade</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.avgGrade}%</div>
            <p className={`text-xs mt-1 ${trendColor}`}>
              {data.gradeTrend === 0 ? 'No change vs last week' : `${data.gradeTrend > 0 ? '+' : ''}${data.gradeTrend.toFixed(1)} pts vs last week`}
            </p>
          </CardContent>
        </Card>

        <Card className={data.atRiskCount > 0 ? 'border-destructive/50' : ''}>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><AlertTriangle className="w-4 h-4" />At-risk students</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${data.atRiskCount > 0 ? 'text-destructive' : 'text-green-600'}`}>{data.atRiskCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Avg mastery below 50%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><FileCheck className="w-4 h-4" />Homework submitted</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.homeworkSubmissions}</div>
            <p className="text-xs text-muted-foreground mt-1">This week</p>
          </CardContent>
        </Card>

        <Card className={data.gradingPending > 10 ? 'border-amber-500/50' : ''}>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><ClipboardList className="w-4 h-4" />Awaiting grading</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${data.gradingPending > 10 ? 'text-amber-600' : ''}`}>{data.gradingPending}</div>
            <p className="text-xs text-muted-foreground mt-1">Submissions need a grade</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-muted-foreground"><Trophy className="w-4 h-4" />Class leaderboard</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.topSection ? (
              <div className="flex justify-between text-sm"><span className="flex items-center gap-1">🏆 {data.topSection.name}</span><span className="font-semibold text-green-600">{data.topSection.avg}%</span></div>
            ) : <p className="text-xs text-muted-foreground">No quiz data yet</p>}
            {data.bottomSection && (
              <div className="flex justify-between text-sm"><span className="flex items-center gap-1"><Target className="w-3 h-3" /> {data.bottomSection.name}</span><span className="font-semibold text-amber-600">{data.bottomSection.avg}%</span></div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Digest settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail className="w-5 h-5" />Weekly email digest</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="digest-toggle" className="font-medium">Send me School Pulse every Monday</Label>
              <p className="text-sm text-muted-foreground">A 1-minute read with the same numbers above.</p>
            </div>
            <Switch id="digest-toggle" checked={digestEnabled} onCheckedChange={toggleDigest} />
          </div>
          {lastSent && (
            <p className="text-xs text-muted-foreground">Last sent: {new Date(lastSent).toLocaleString()}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
