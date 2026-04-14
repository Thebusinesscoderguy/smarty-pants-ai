import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ClipboardCheck, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface HomeworkItem {
  id: string;
  title: string;
  description: string | null;
  assignment_type: string;
  due_date: string | null;
  submission?: {
    id: string;
    status: string;
    score: number | null;
    feedback: string | null;
  };
}

export const HomeworkList = () => {
  const { user } = useAuth();
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    fetchHomework();
  }, [user]);

  const fetchHomework = async () => {
    if (!user) return;

    const { data: assignments } = await supabase
      .from('homework_assignments')
      .select('*')
      .eq('is_active', true)
      .order('due_date', { ascending: true });

    if (!assignments) return;

    const { data: subs } = await supabase
      .from('homework_submissions')
      .select('*')
      .eq('student_id', user.id);

    const subMap = new Map(subs?.map(s => [s.assignment_id, s]) || []);

    setHomework(assignments.map(a => ({
      ...a,
      submission: subMap.get(a.id) ? {
        id: subMap.get(a.id)!.id,
        status: subMap.get(a.id)!.status,
        score: subMap.get(a.id)!.score,
        feedback: subMap.get(a.id)!.feedback,
      } : undefined,
    })));
  };

  const handleSubmit = async (assignmentId: string) => {
    if (!user) return;
    setSubmitting(assignmentId);
    try {
      const { error } = await supabase.from('homework_submissions').upsert({
        assignment_id: assignmentId,
        student_id: user.id,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        response_data: { text: responses[assignmentId] || '' },
      }, { onConflict: 'assignment_id,student_id' });
      if (error) throw error;
      toast({ title: 'Submitted!', description: 'Your homework has been submitted.' });
      fetchHomework();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(null);
    }
  };

  const isOverdue = (date: string | null) => date ? new Date(date) < new Date() : false;

  if (homework.length === 0) return null;

  return (
    <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-amber-400" />
          Pending Homework
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {homework.map(hw => (
          <div key={hw.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-white">{hw.title}</h4>
                {hw.description && <p className="text-sm text-white/60 mt-1">{hw.description}</p>}
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="border-amber-500/30 text-amber-400">{hw.assignment_type}</Badge>
                {hw.submission?.status === 'submitted' && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <CheckCircle className="h-3 w-3 mr-1" />Submitted
                  </Badge>
                )}
                {hw.submission?.status === 'graded' && (
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    Score: {hw.submission.score}
                  </Badge>
                )}
              </div>
            </div>
            {hw.due_date && (
              <p className={`text-xs flex items-center gap-1 mb-3 ${isOverdue(hw.due_date) ? 'text-red-400' : 'text-white/50'}`}>
                <Clock className="h-3 w-3" />
                Due: {new Date(hw.due_date).toLocaleDateString()} {isOverdue(hw.due_date) && '(Overdue)'}
              </p>
            )}
            {!hw.submission || hw.submission.status === 'pending' ? (
              <div className="space-y-2">
                <Textarea
                  placeholder="Type your answer here..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  value={responses[hw.id] || ''}
                  onChange={e => setResponses(prev => ({ ...prev, [hw.id]: e.target.value }))}
                />
                <Button
                  size="sm"
                  onClick={() => handleSubmit(hw.id)}
                  disabled={submitting === hw.id}
                >
                  {submitting === hw.id ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            ) : hw.submission.feedback ? (
              <p className="text-sm text-white/70 mt-2 p-2 bg-white/5 rounded">
                <strong>Feedback:</strong> {hw.submission.feedback}
              </p>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
