import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Download, KeyRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface ParsedStudent {
  email: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  password?: string;
  valid: boolean;
  error?: string;
}

interface ImportResultRow {
  email: string;
  status: 'created' | 'failed';
  password?: string;
  error?: string;
}

// Bulk-creates pre-confirmed student accounts directly (admin-provisioned model).
// Passwords are auto-generated unless an optional `password` column is supplied;
// after import the admin can download a credentials CSV to distribute.
export const BulkStudentImport = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [students, setStudents] = useState<ParsedStudent[]>([]);
  const [importing, setImporting] = useState(false);
  const [resultRows, setResultRows] = useState<ImportResultRow[] | null>(null);

  const downloadTemplate = () => {
    const csv = 'email,first_name,middle_name,last_name,password\nstudent@example.com,John,,Doe,\n';
    triggerDownload(csv, 'student-import-template.csv');
  };

  const triggerDownload = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const csvEscape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

  const parseCSV = (text: string): ParsedStudent[] => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const header = lines[0].toLowerCase().split(',').map((h) => h.trim());
    const emailIdx = header.indexOf('email');
    const firstIdx = header.indexOf('first_name');
    const middleIdx = header.indexOf('middle_name');
    const lastIdx = header.indexOf('last_name');
    const pwIdx = header.indexOf('password');

    if (emailIdx === -1) {
      toast({ title: t('bsi.invalidCsv'), description: t('bsi.invalidCsvDesc'), variant: 'destructive' });
      return [];
    }

    return lines.slice(1).filter((l) => l.trim()).map((line) => {
      const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      const email = cols[emailIdx] || '';
      const first_name = firstIdx >= 0 ? cols[firstIdx] || '' : '';
      const middle_name = middleIdx >= 0 ? cols[middleIdx] || '' : '';
      const last_name = lastIdx >= 0 ? cols[lastIdx] || '' : '';
      const password = pwIdx >= 0 ? cols[pwIdx] || '' : '';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      let valid = emailRegex.test(email);
      let error: string | undefined = valid ? undefined : t('bsi.errInvalidEmail');
      if (valid && !last_name) {
        valid = false;
        error = t('bsi.errLastNameRequired');
      }
      if (valid && password && password.length < 8) {
        valid = false;
        error = t('bsi.errPasswordShort');
      }
      return { email, first_name, middle_name, last_name, password: password || undefined, valid, error };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResultRows(null);
    const reader = new FileReader();
    reader.onload = (ev) => setStudents(parseCSV(ev.target?.result as string));
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImport = async () => {
    if (!user) return;
    const validStudents = students.filter((s) => s.valid);
    if (validStudents.length === 0) {
      toast({ title: t('bsi.noValid'), description: t('bsi.noValidDesc'), variant: 'destructive' });
      return;
    }

    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-bulk-create-students', {
        body: {
          students: validStudents.map((s) => ({
            email: s.email,
            first_name: s.first_name,
            middle_name: s.middle_name,
            last_name: s.last_name,
            password: s.password,
          })),
        },
      });
      const res = data as { ok?: boolean; created?: number; failed?: number; results?: ImportResultRow[]; error?: string } | null;
      if (error && !res?.results) throw error;
      if (!res?.ok) {
        toast({ title: t('bsi.importFailed'), description: res?.error || t('bsi.tryAgain'), variant: 'destructive' });
        return;
      }
      setResultRows(res.results || []);
      toast({ title: t('bsi.importComplete'), description: `${res.created ?? 0} ${t('bsi.createdWord')}, ${res.failed ?? 0} ${t('bsi.failedWord')}` });
    } catch (e: any) {
      toast({ title: t('bsi.importError'), description: e.message || t('bsi.tryAgain'), variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  const downloadCredentials = () => {
    if (!resultRows) return;
    const created = resultRows.filter((r) => r.status === 'created' && r.password);
    if (created.length === 0) return;
    const csv =
      'email,password\n' +
      created.map((r) => `${csvEscape(r.email)},${csvEscape(r.password || '')}`).join('\n') +
      '\n';
    triggerDownload(csv, 'student-credentials.csv');
  };

  const createdCount = resultRows?.filter((r) => r.status === 'created').length ?? 0;
  const failedRows = resultRows?.filter((r) => r.status === 'failed') ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {t('bsi.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t('bsi.introPre')}<code>password</code>{t('bsi.introPost')}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate} size="sm">
            <Download className="h-4 w-4 mr-2" /> {t('bsi.downloadTemplate')}
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} size="sm">
            <FileText className="h-4 w-4 mr-2" /> {t('bsi.uploadCsv')}
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
        </div>

        {students.length > 0 && !resultRows && (
          <>
            <div className="border rounded-lg max-h-60 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2">{t('bsi.colEmail')}</th>
                    <th className="text-left p-2">{t('bsi.colName')}</th>
                    <th className="text-left p-2">{t('bsi.colPassword')}</th>
                    <th className="text-left p-2">{t('bsi.colStatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2 font-mono text-xs">{s.email}</td>
                      <td className="p-2">{[s.first_name, s.middle_name, s.last_name].filter(Boolean).join(' ')}</td>
                      <td className="p-2 text-xs text-muted-foreground">{s.password ? t('bsi.provided') : t('bsi.auto')}</td>
                      <td className="p-2">
                        {s.valid ? (
                          <Badge variant="secondary" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" /> {t('bsi.valid')}
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" /> {s.error}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {students.filter((s) => s.valid).length} {t('bsi.validWord')} / {students.length} {t('bsi.totalWord')}
              </p>
              <Button onClick={handleImport} disabled={importing || students.filter((s) => s.valid).length === 0}>
                {importing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                {importing ? t('bsi.creatingAccounts') : `${t('bsi.createPre')} ${students.filter((s) => s.valid).length} ${t('bsi.studentsWord')}`}
              </Button>
            </div>
          </>
        )}

        {resultRows && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p className="text-green-600">✓ {createdCount} {t('bsi.accountsCreatedSuffix')}</p>
              {failedRows.length > 0 && <p className="text-destructive">✗ {failedRows.length} {t('bsi.failedSuffix')}</p>}
            </div>
            {createdCount > 0 && (
              <Button onClick={downloadCredentials} variant="outline" size="sm">
                <KeyRound className="h-4 w-4 mr-2" /> {t('bsi.downloadCredentials')}
              </Button>
            )}
            {failedRows.length > 0 && (
              <div className="border rounded-lg max-h-48 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left p-2">{t('bsi.colEmail')}</th>
                      <th className="text-left p-2">{t('bsi.colReason')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failedRows.map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2 font-mono text-xs">{r.email}</td>
                        <td className="p-2 text-destructive">{r.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={() => { setResultRows(null); setStudents([]); }}>
              {t('bsi.importAnother')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
