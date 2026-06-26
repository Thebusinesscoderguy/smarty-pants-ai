import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Download, FileText, Loader2, CheckCircle, AlertCircle, X, KeyRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const FIELD_OPTIONS = [
  { value: 'ignore', label: '— Ignore —' },
  { value: 'first_name', label: 'First name *' },
  { value: 'middle_name', label: 'Middle name' },
  { value: 'last_name', label: 'Last name *' },
  { value: 'email', label: 'Email *' },
  { value: 'grade_level', label: 'Grade level' },
  { value: 'section', label: 'Section' },
  { value: 'parent_email', label: 'Parent email' },
  { value: 'student_id', label: 'External student ID' },
];

const REQUIRED = ['first_name', 'last_name', 'email'];

const HEADER_GUESS: Record<string, string> = {
  'first name': 'first_name', 'firstname': 'first_name', 'first_name': 'first_name', 'fname': 'first_name', 'given name': 'first_name',
  'middle name': 'middle_name', 'middlename': 'middle_name', 'middle_name': 'middle_name', 'mname': 'middle_name',
  'last name': 'last_name', 'lastname': 'last_name', 'last_name': 'last_name', 'lname': 'last_name', 'surname': 'last_name', 'family name': 'last_name',
  'email': 'email', 'email address': 'email', 'student email': 'email', 'e-mail': 'email',
  'grade': 'grade_level', 'grade level': 'grade_level', 'grade_level': 'grade_level', 'year': 'grade_level',
  'section': 'section', 'class': 'section', 'class section': 'section', 'homeroom': 'section',
  'parent email': 'parent_email', 'parent_email': 'parent_email', 'guardian email': 'parent_email',
  'student id': 'student_id', 'student_id': 'student_id', 'id': 'student_id', 'sis id': 'student_id',
};

interface Row { [k: string]: string }

export const RosterStep = ({
  schoolId, onImported,
}: { schoolId: string; onImported: (count: number) => void }) => {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState<number>(0);
  const [credentials, setCredentials] = useState<{ email: string; password: string }[]>([]);

  const downloadTemplate = () => {
    const csv = 'first_name,last_name,email,grade_level,section,parent_email,student_id\nJane,Doe,jane@example.com,9,A,parent@example.com,STU001\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'student-roster-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const hs = res.meta.fields || [];
        setHeaders(hs);
        setRows(res.data);
        // Auto-map by guess
        const map: Record<string, string> = {};
        hs.forEach(h => {
          const guess = HEADER_GUESS[h.trim().toLowerCase()];
          map[h] = guess || 'ignore';
        });
        setMapping(map);
      },
      error: () => toast({ title: 'Failed to parse CSV', variant: 'destructive' }),
    });
  };

  const reset = () => { setHeaders([]); setRows([]); setMapping({}); setImported(0); setCredentials([]); };

  const csvEscape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

  const downloadCredentials = () => {
    if (credentials.length === 0) return;
    const csv = 'email,password\n' + credentials.map(c => `${csvEscape(c.email)},${csvEscape(c.password)}`).join('\n') + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'student-credentials.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const mappedFields = Object.values(mapping).filter(v => v !== 'ignore');
  const missingRequired = REQUIRED.filter(r => !mappedFields.includes(r));

  type MappedRow = { first_name: string; middle_name?: string; last_name: string; email: string; grade_level?: string; section?: string; parent_email?: string; student_id?: string; _valid: boolean };
  const validRows: MappedRow[] = rows.map(r => {
    const obj: Record<string, string> = {};
    Object.entries(mapping).forEach(([h, f]) => {
      if (f !== 'ignore') obj[f] = (r[h] || '').toString().trim();
    });
    const valid = !!(obj.first_name && obj.last_name && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(obj.email || ''));
    return { first_name: obj.first_name || '', middle_name: obj.middle_name, last_name: obj.last_name || '', email: obj.email || '', grade_level: obj.grade_level, section: obj.section, parent_email: obj.parent_email, student_id: obj.student_id, _valid: valid };
  });

  const validCount = validRows.filter(r => r._valid).length;

  const doImport = async () => {
    if (!user || missingRequired.length > 0) return;
    setImporting(true);

    try {
      // Pre-create unique sections so students can be assigned on creation.
      const sectionKeys = new Set<string>();
      validRows.filter(r => r._valid && r.grade_level).forEach(r => {
        sectionKeys.add(`${r.grade_level}::${r.section || 'A'}`);
      });

      const sectionMap: Record<string, string> = {};
      for (const key of sectionKeys) {
        const [grade, section_name] = key.split('::');
        const { data: existing } = await supabase
          .from('school_sections').select('id')
          .eq('school_id', schoolId).eq('grade_level', grade).eq('section_name', section_name).maybeSingle();
        if (existing) {
          sectionMap[key] = existing.id;
        } else {
          const { data: created } = await supabase
            .from('school_sections')
            .insert({ school_id: schoolId, grade_level: grade, section_name })
            .select('id').single();
          if (created) sectionMap[key] = created.id;
        }
      }

      // Create accounts directly (server-side, pre-confirmed). Passwords are
      // auto-generated; the admin downloads them afterward.
      const payload = validRows.filter(r => r._valid).map(r => ({
        email: r.email,
        first_name: r.first_name,
        middle_name: r.middle_name,
        last_name: r.last_name,
        section_id: r.grade_level ? sectionMap[`${r.grade_level}::${r.section || 'A'}`] : undefined,
      }));

      const { data, error } = await supabase.functions.invoke('admin-bulk-create-students', {
        body: { students: payload },
      });
      const res = data as { ok?: boolean; created?: number; failed?: number; results?: { email: string; status: string; password?: string; error?: string }[]; error?: string } | null;
      if (error && !res?.results) throw error;
      if (!res?.ok) throw new Error(res?.error || 'Import failed');

      const created = res.results?.filter(r => r.status === 'created') || [];
      setCredentials(created.map(r => ({ email: r.email, password: r.password || '' })));
      setImported(res.created ?? created.length);
      onImported(res.created ?? created.length);
      toast({ title: 'Roster imported', description: `${res.created ?? 0} created${res.failed ? `, ${res.failed} failed` : ''}` });
    } catch (e: any) {
      toast({ title: 'Import failed', description: e.message, variant: 'destructive' });
    } finally { setImporting(false); }
  };

  return (
    <div className="space-y-4">
      {imported > 0 ? (
        <Card className="p-6 bg-primary/5 border-primary/30">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-primary" />
            <div className="flex-1">
              <p className="font-semibold">{imported} student accounts created</p>
              <p className="text-xs text-muted-foreground">
                Students can log in now. Download their credentials to distribute.
              </p>
            </div>
            {credentials.length > 0 && (
              <Button variant="outline" size="sm" onClick={downloadCredentials}>
                <KeyRound className="h-4 w-4 mr-2" />Download credentials
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={reset}>Import more</Button>
          </div>
        </Card>
      ) : headers.length === 0 ? (
        <Card className="p-8 border-dashed text-center">
          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium mb-1">Upload your student roster CSV</p>
          <p className="text-xs text-muted-foreground mb-4">
            Required columns: first name, last name, email. Optional: grade, section, parent email.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />Download template
            </Button>
            <Button size="sm" onClick={() => fileRef.current?.click()}>
              <FileText className="h-4 w-4 mr-2" />Choose CSV
            </Button>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={onFile} />
          </div>
        </Card>
      ) : (
        <>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Map your columns</p>
              <Button variant="ghost" size="sm" onClick={reset}><X className="h-4 w-4 mr-1" />Start over</Button>
            </div>
            <div className="grid gap-2">
              {headers.map(h => (
                <div key={h} className="flex items-center gap-3">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">{h}</code>
                  <span className="text-muted-foreground">→</span>
                  <Select value={mapping[h] || 'ignore'} onValueChange={(v) => setMapping(p => ({ ...p, [h]: v }))}>
                    <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FIELD_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            {missingRequired.length > 0 && (
              <div className="mt-3 text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Missing required mapping: {missingRequired.join(', ')}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Preview ({validCount} of {rows.length} valid)</p>
              <Badge variant="outline">{rows.length} total rows</Badge>
            </div>
            <div className="border rounded max-h-60 overflow-auto text-xs">
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Grade/Section</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {validRows.slice(0, 50).map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{r.first_name} {r.last_name}</td>
                      <td className="p-2 font-mono">{r.email}</td>
                      <td className="p-2">{r.grade_level ? `${r.grade_level} ${r.section || ''}` : '—'}</td>
                      <td className="p-2">
                        {r._valid
                          ? <Badge variant="outline" className="text-[10px]">Valid</Badge>
                          : <Badge variant="destructive" className="text-[10px]">Invalid</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 50 && <p className="text-[10px] text-muted-foreground mt-1">Showing first 50 rows.</p>}
          </Card>

          <Button
            className="w-full"
            disabled={importing || validCount === 0 || missingRequired.length > 0}
            onClick={doImport}
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
            Import {validCount} students
          </Button>
        </>
      )}
    </div>
  );
};
