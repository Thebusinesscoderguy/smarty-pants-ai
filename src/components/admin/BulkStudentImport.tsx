import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface ParsedStudent {
  email: string;
  first_name: string;
  last_name: string;
  valid: boolean;
  error?: string;
}

export const BulkStudentImport = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [students, setStudents] = useState<ParsedStudent[]>([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null);

  const downloadTemplate = () => {
    const csv = 'email,first_name,last_name\nstudent@example.com,John,Doe\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): ParsedStudent[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const header = lines[0].toLowerCase().split(',').map(h => h.trim());
    const emailIdx = header.indexOf('email');
    const firstIdx = header.indexOf('first_name');
    const lastIdx = header.indexOf('last_name');

    if (emailIdx === -1) {
      toast({ title: 'Invalid CSV', description: 'CSV must have an "email" column', variant: 'destructive' });
      return [];
    }

    return lines.slice(1).filter(l => l.trim()).map(line => {
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      const email = cols[emailIdx] || '';
      const first_name = firstIdx >= 0 ? cols[firstIdx] || '' : '';
      const last_name = lastIdx >= 0 ? cols[lastIdx] || '' : '';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const valid = emailRegex.test(email);
      return { email, first_name, last_name, valid, error: valid ? undefined : 'Invalid email' };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResults(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      setStudents(parsed);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!user) return;
    const validStudents = students.filter(s => s.valid);
    if (validStudents.length === 0) {
      toast({ title: 'No valid students', description: 'Please fix errors and try again', variant: 'destructive' });
      return;
    }

    setImporting(true);
    let success = 0;
    let failed = 0;

    try {
      const { data: schoolData } = await supabase
        .from('school_accounts')
        .select('id, school_name')
        .eq('admin_user_id', user.id)
        .single();

      if (!schoolData) throw new Error('No school found');

      for (const student of validStudents) {
        try {
          // Create invitation
          const invitationCode = crypto.randomUUID().replace(/-/g, '').substring(0, 12);
          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

          const { error: invError } = await supabase.from('student_invitations').insert({
            email: student.email,
            first_name: student.first_name || null,
            last_name: student.last_name || null,
            school_id: schoolData.id,
            invited_by_id: user.id,
            invitation_code: invitationCode,
            expires_at: expiresAt,
          });

          if (invError) throw invError;

          // Send email
          await supabase.functions.invoke('send-invitation-email', {
            body: {
              email: student.email,
              firstName: student.first_name,
              lastName: student.last_name,
              schoolName: schoolData.school_name,
              invitationCode: invitationCode,
            },
          });

          success++;
        } catch {
          failed++;
        }
      }
    } catch (e: any) {
      toast({ title: 'Import error', description: e.message, variant: 'destructive' });
    } finally {
      setImporting(false);
      setResults({ success, failed });
      toast({
        title: 'Import complete',
        description: `${success} invited, ${failed} failed`,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Bulk Student Import
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate} size="sm">
            <Download className="h-4 w-4 mr-2" /> Download Template
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} size="sm">
            <FileText className="h-4 w-4 mr-2" /> Upload CSV
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
        </div>

        {students.length > 0 && (
          <>
            <div className="border rounded-lg max-h-60 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2 font-mono text-xs">{s.email}</td>
                      <td className="p-2">{s.first_name} {s.last_name}</td>
                      <td className="p-2">
                        {s.valid ? (
                          <Badge variant="secondary" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" /> Valid
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
                {students.filter(s => s.valid).length} valid / {students.length} total
              </p>
              <Button onClick={handleImport} disabled={importing || students.filter(s => s.valid).length === 0}>
                {importing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                {importing ? 'Importing...' : `Import ${students.filter(s => s.valid).length} Students`}
              </Button>
            </div>
          </>
        )}

        {results && (
          <div className="p-3 rounded-lg bg-muted/50 text-sm">
            <p className="text-green-600">✓ {results.success} students invited</p>
            {results.failed > 0 && <p className="text-destructive">✗ {results.failed} failed</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
