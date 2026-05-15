import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CalendarCheck, Download } from 'lucide-react';

type Status = 'present' | 'absent' | 'late' | 'excused';
interface Section { id: string; grade_level: string; section_name: string; }
interface Student { student_id: string; display_name: string; }

export const AttendanceManagement = () => {
  const { user } = useAuth();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionId, setSectionId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<Student[]>([]);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{ total: number; present: number; rate: number }>({ total: 0, present: 0, rate: 0 });

  useEffect(() => {
    if (!user) return;
    supabase.from('school_accounts').select('id').eq('admin_user_id', user.id).maybeSingle()
      .then(async ({ data }) => {
        if (!data) return;
        setSchoolId(data.id);
        const { data: secs } = await supabase.from('school_sections').select('*')
          .eq('school_id', data.id).order('grade_level').order('section_name');
        setSections(secs || []);
      });
  }, [user]);

  useEffect(() => {
    if (!sectionId) { setStudents([]); return; }
    (async () => {
      const { data: assignments } = await supabase.from('section_students').select('student_id').eq('section_id', sectionId);
      const ids = (assignments || []).map(a => a.student_id);
      if (!ids.length) { setStudents([]); setStatuses({}); return; }
      const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', ids);
      const list = (profiles || []).map(p => ({ student_id: p.id, display_name: p.display_name || 'Unknown' }));
      setStudents(list);
      const { data: existing } = await supabase.from('attendance_records').select('student_id, status')
        .eq('section_id', sectionId).eq('date', date);
      const map: Record<string, Status> = {};
      (existing || []).forEach(r => { map[r.student_id] = r.status as Status; });
      list.forEach(s => { if (!map[s.student_id]) map[s.student_id] = 'present'; });
      setStatuses(map);
    })();
  }, [sectionId, date]);

  // load stats for current section/date range
  useEffect(() => {
    if (!schoolId) return;
    (async () => {
      const since = new Date(); since.setDate(since.getDate() - 30);
      const { data } = await supabase.from('attendance_records').select('status')
        .eq('school_id', schoolId).gte('date', since.toISOString().slice(0, 10));
      const total = (data || []).length;
      const present = (data || []).filter(r => r.status === 'present' || r.status === 'late').length;
      setStats({ total, present, rate: total ? Math.round((present / total) * 100) : 0 });
    })();
  }, [schoolId, loading]);

  const setStatus = (id: string, status: Status) => setStatuses(s => ({ ...s, [id]: status }));
  const markAll = (status: Status) => {
    const m: Record<string, Status> = {};
    students.forEach(s => { m[s.student_id] = status; });
    setStatuses(m);
  };

  const save = async () => {
    if (!schoolId || !sectionId) return;
    setLoading(true);
    const rows = students.map(s => ({
      school_id: schoolId, section_id: sectionId, student_id: s.student_id,
      date, status: statuses[s.student_id] || 'present', marked_by: user?.id,
    }));
    const { error } = await supabase.from('attendance_records').upsert(rows, { onConflict: 'student_id,date,period' });
    if (error) { setLoading(false); toast.error('Save failed: ' + error.message); return; }

    // Notify parents of absent students
    const absentIds = rows.filter(r => r.status === 'absent').map(r => r.student_id);
    if (absentIds.length > 0) {
      try {
        const { data: notifyRes, error: notifyErr } = await supabase.functions.invoke(
          'send-absence-notification',
          { body: { absentStudentIds: absentIds, date } }
        );
        if (notifyErr) {
          toast.warning('Saved, but parent notifications failed');
        } else if (notifyRes?.sent > 0) {
          toast.success(`Saved attendance · Notified ${notifyRes.sent} parent(s) of absences`);
        } else {
          toast.success(`Saved attendance for ${rows.length} students`);
        }
      } catch {
        toast.success(`Saved attendance for ${rows.length} students`);
      }
    } else {
      toast.success(`Saved attendance for ${rows.length} students`);
    }
    setLoading(false);
  };

  const exportCsv = async () => {
    if (!schoolId) return;
    const { data } = await supabase.from('attendance_records').select('date, status, student_id, section_id')
      .eq('school_id', schoolId).order('date', { ascending: false }).limit(5000);
    const rows = [['date', 'student_id', 'section_id', 'status']];
    (data || []).forEach(r => rows.push([r.date, r.student_id, r.section_id || '', r.status]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `attendance-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const statusColor = (s: Status) => ({
    present: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
    absent: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
    late: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
    excused: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  }[s]);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Last 30 days</div><div className="text-2xl font-bold">{stats.rate}%</div><div className="text-xs text-muted-foreground">Attendance rate</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Records</div><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Present + Late</div><div className="text-2xl font-bold">{stats.present}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2"><CalendarCheck className="h-5 w-5" />Mark Attendance</CardTitle>
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-1" />Export CSV</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <div><Label>Section</Label>
              <Select value={sectionId} onValueChange={setSectionId}>
                <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                <SelectContent className="bg-popover">
                  {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.grade_level} - {s.section_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Date</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
            <div className="flex items-end gap-2">
              <Button size="sm" variant="outline" onClick={() => markAll('present')}>All Present</Button>
              <Button size="sm" variant="outline" onClick={() => markAll('absent')}>All Absent</Button>
            </div>
          </div>

          {students.length > 0 && (
            <div className="border border-border rounded-lg divide-y divide-border">
              {students.map(s => {
                const st = statuses[s.student_id] || 'present';
                return (
                  <div key={s.student_id} className="flex items-center justify-between p-3 gap-2">
                    <div className="flex items-center gap-2"><span className="font-medium">{s.display_name}</span><Badge variant="outline" className={statusColor(st)}>{st}</Badge></div>
                    <div className="flex gap-1">
                      {(['present', 'absent', 'late', 'excused'] as Status[]).map(opt => (
                        <Button key={opt} size="sm" variant={st === opt ? 'default' : 'outline'} onClick={() => setStatus(s.student_id, opt)}>
                          {opt[0].toUpperCase()}
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {sectionId && students.length === 0 && <p className="text-sm text-muted-foreground">No students in this section.</p>}
          {students.length > 0 && <Button onClick={save} disabled={loading}>{loading ? 'Saving...' : 'Save Attendance'}</Button>}
        </CardContent>
      </Card>
    </div>
  );
};
