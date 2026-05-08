import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Upload, Download, FileSpreadsheet } from 'lucide-react';

const parseCSV = (text: string): string[][] => {
  const rows: string[][] = [];
  let cur = ''; let row: string[] = []; let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else cur += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(cur); cur = ''; }
      else if (c === '\n' || c === '\r') {
        if (cur || row.length) { row.push(cur); rows.push(row); row = []; cur = ''; }
        if (c === '\r' && text[i + 1] === '\n') i++;
      } else cur += c;
    }
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim()));
};

const downloadCsv = (filename: string, rows: (string | number)[][]) => {
  const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

export const ImportExportCenter = () => {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const getSchoolId = async () => {
    const { data } = await supabase.from('school_accounts').select('id').eq('admin_user_id', user!.id).maybeSingle();
    return data?.id as string | undefined;
  };

  const importTeachers = async (file: File) => {
    setBusy(true);
    try {
      const schoolId = await getSchoolId();
      if (!schoolId) { toast.error('No school'); return; }
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length < 2) { toast.error('Empty CSV'); return; }
      const header = rows[0].map(h => h.trim().toLowerCase());
      const emailIdx = header.indexOf('email');
      const firstIdx = header.indexOf('first_name');
      const lastIdx = header.indexOf('last_name');
      if (emailIdx < 0) { toast.error('Missing email column'); return; }
      const inserts = rows.slice(1).map(r => ({
        school_id: schoolId,
        email: r[emailIdx]?.trim(),
        first_name: firstIdx >= 0 ? r[firstIdx]?.trim() : null,
        last_name: lastIdx >= 0 ? r[lastIdx]?.trim() : null,
      })).filter(t => t.email);
      const { error } = await supabase.from('school_teachers').upsert(inserts, { onConflict: 'school_id,email' });
      if (error) toast.error(error.message); else toast.success(`Imported ${inserts.length} teachers`);
    } finally { setBusy(false); }
  };

  const exportEntity = async (entity: 'students' | 'teachers' | 'attendance' | 'report_cards') => {
    setBusy(true);
    try {
      const schoolId = await getSchoolId();
      if (!schoolId) { toast.error('No school'); return; }
      if (entity === 'teachers') {
        const { data } = await supabase.from('school_teachers').select('*').eq('school_id', schoolId);
        downloadCsv('teachers.csv', [['email', 'first_name', 'last_name', 'is_active'],
          ...(data || []).map(d => [d.email, d.first_name || '', d.last_name || '', String(d.is_active)])]);
      } else if (entity === 'students') {
        const { data: rels } = await supabase.from('school_student_relationships').select('student_id').eq('school_id', schoolId).eq('is_active', true);
        const ids = (rels || []).map(r => r.student_id);
        const { data } = await supabase.from('profiles').select('id, display_name').in('id', ids);
        downloadCsv('students.csv', [['student_id', 'display_name'], ...(data || []).map(d => [d.id, d.display_name || ''])]);
      } else if (entity === 'attendance') {
        const { data } = await supabase.from('attendance_records').select('*').eq('school_id', schoolId).limit(10000);
        downloadCsv('attendance.csv', [['date', 'student_id', 'section_id', 'status'],
          ...(data || []).map(d => [d.date, d.student_id, d.section_id || '', d.status])]);
      } else if (entity === 'report_cards') {
        const { data } = await supabase.from('report_cards').select('*').eq('school_id', schoolId);
        downloadCsv('report_cards.csv', [['student_id', 'term', 'academic_year', 'overall', 'attendance_rate', 'published'],
          ...(data || []).map(d => { const dd: any = d.data || {}; return [d.student_id, d.term, d.academic_year, dd.overall ?? '', dd.attendance_rate ?? '', String(d.published)]; })]);
      }
      toast.success('Exported');
    } finally { setBusy(false); }
  };

  const downloadTemplate = (kind: 'teachers' | 'grades') => {
    if (kind === 'teachers') downloadCsv('teachers-template.csv', [['email', 'first_name', 'last_name'], ['jane@school.edu', 'Jane', 'Doe']]);
    else downloadCsv('grades-template.csv', [['student_email', 'subject', 'assessment', 'score'], ['john@school.edu', 'Math', 'Midterm', '85']]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5" />Import / Export Center</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">CSV Templates</h3>
            <p className="text-sm text-muted-foreground mb-3">Download these, fill them in, and upload below. Migrating from EduCore? Map your export columns to ours.</p>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => downloadTemplate('teachers')}><Download className="h-4 w-4 mr-1" />Teachers Template</Button>
              <Button size="sm" variant="outline" onClick={() => downloadTemplate('grades')}><Download className="h-4 w-4 mr-1" />Grades Template</Button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Bulk Import</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <label className="border border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted">
                <Upload className="h-5 w-5" /><span className="font-medium">Upload Teachers CSV</span>
                <input type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && importTeachers(e.target.files[0])} disabled={busy} />
              </label>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Export Data</h3>
            <div className="flex gap-2 flex-wrap">
              {(['students', 'teachers', 'attendance', 'report_cards'] as const).map(k => (
                <Button key={k} size="sm" variant="outline" onClick={() => exportEntity(k)} disabled={busy}>
                  <Download className="h-4 w-4 mr-1" />{k.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
