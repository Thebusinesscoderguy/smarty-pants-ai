import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Lock, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AssignedExam {
  id: string;
  title: string;
  description: string | null;
  time_limit_minutes: number;
  due_date: string | null;
  attempt_status: 'not_started' | 'in_progress' | 'submitted' | 'auto_submitted';
}

export const AssignedExamsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<AssignedExam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      // Get all assignments visible to the student (RLS filters automatically)
      const { data: assigns } = await supabase
        .from('content_assignments')
        .select('content_id, due_date')
        .eq('content_type', 'test')
        .eq('is_active', true);

      const ids = Array.from(new Set((assigns || []).map((a) => a.content_id)));
      if (!ids.length) { setExams([]); setLoading(false); return; }

      const { data: tests } = await supabase
        .from('tests')
        .select('id, title, description, time_limit_minutes, assessment_mode')
        .in('id', ids)
        .eq('assessment_mode', 'exam');

      const examIds = (tests || []).map((t) => t.id);
      const { data: sessions } = await supabase
        .from('exam_sessions')
        .select('quiz_id, status')
        .eq('user_id', user.id)
        .in('quiz_id', examIds.length ? examIds : ['00000000-0000-0000-0000-000000000000']);

      const statusMap: Record<string, AssignedExam['attempt_status']> = {};
      for (const s of sessions || []) {
        statusMap[s.quiz_id] = s.status as any;
      }

      const dueMap: Record<string, string | null> = {};
      for (const a of assigns || []) dueMap[a.content_id] = a.due_date;

      const list: AssignedExam[] = (tests || []).map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        time_limit_minutes: t.time_limit_minutes ?? 30,
        due_date: dueMap[t.id] ?? null,
        attempt_status: statusMap[t.id] || 'not_started',
      }));
      setExams(list);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) return null;
  if (!exams.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lock className="h-4 w-4 text-primary" /> Assigned Exams
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {exams.map((e) => {
          const done = e.attempt_status === 'submitted' || e.attempt_status === 'auto_submitted';
          return (
            <div key={e.id} className="flex items-center justify-between gap-3 p-3 rounded border border-border">
              <div className="min-w-0">
                <div className="font-medium truncate">{e.title}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                  <Clock className="h-3 w-3" /> {e.time_limit_minutes} min
                  {e.due_date && <span>• Due {new Date(e.due_date).toLocaleDateString()}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {done ? (
                  <Badge variant="secondary" className="gap-1"><ShieldCheck className="h-3 w-3" /> Submitted</Badge>
                ) : (
                  <Button size="sm" onClick={() => navigate(`/exam/${e.id}`)}>Start exam</Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
