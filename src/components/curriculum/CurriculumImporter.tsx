import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, UploadCloud, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useCurriculumImport } from '@/hooks/useCurriculumImport';
import { CurriculumReviewTree } from './CurriculumReviewTree';

interface SubjectRow { id: string; name: string }

interface Props {
  /** Called with the new book id once a curriculum is published (used to advance onboarding). */
  onComplete?: (bookId: string) => void;
}

const GRADES = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'];

export function CurriculumImporter({ onComplete }: Props) {
  const {
    schoolId, phase, status, error,
    tree, setTree, images, run, approve, reset, getContent,
  } = useCurriculumImport();

  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Grade 9');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!schoolId) return;
    (async () => {
      const { data } = await supabase
        .from('school_subjects').select('id, name').eq('school_id', schoolId).order('name');
      setSubjects((data || []) as SubjectRow[]);
    })();
  }, [schoolId]);

  const busy = ['extracting-text', 'extracting-images', 'uploading-images', 'detecting', 'publishing'].includes(phase);
  const canStart = !!file && !!subjectId && !!title.trim() && !busy;

  const handlePublish = async (publish: boolean) => {
    const bookId = await approve(publish);
    if (bookId && publish) onComplete?.(bookId);
  };

  if (phase === 'done') {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
        <p className="mt-2 text-lg font-semibold text-green-800">{status || 'Curriculum saved.'}</p>
        <Button variant="outline" className="mt-4" onClick={reset}>Import another book</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* form */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Subject</Label>
          <Select value={subjectId} onValueChange={setSubjectId} disabled={busy}>
            <SelectTrigger><SelectValue placeholder={subjects.length ? 'Select a subject' : 'No subjects yet — add one first'} /></SelectTrigger>
            <SelectContent>
              {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Grade level</Label>
          <Select value={gradeLevel} onValueChange={setGradeLevel} disabled={busy}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Book title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Biology — Grade 9" disabled={busy} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Textbook PDF</Label>
          <Input type="file" accept="application/pdf" disabled={busy}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <p className="text-xs text-muted-foreground">
            The PDF is processed entirely in your browser — only the extracted text, structure, and figures are stored. The file itself is never uploaded.
          </p>
        </div>
      </div>

      {phase !== 'ready' && (
        <Button onClick={() => run({ file: file!, subjectId, gradeLevel, title })} disabled={!canStart} className="w-full sm:w-auto">
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
          {busy ? 'Processing…' : 'Extract & detect structure'}
        </Button>
      )}

      {/* status / error */}
      {status && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>{status}</span>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* review + publish */}
      {phase === 'ready' && tree && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Review detected structure</h3>
            <span className="text-xs text-muted-foreground">{images.length} figures found</span>
          </div>
          <CurriculumReviewTree tree={tree} setTree={setTree} images={images} getContent={getContent} />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => handlePublish(true)}>Approve &amp; publish</Button>
            <Button variant="outline" onClick={() => handlePublish(false)}>Save as draft</Button>
            <Button variant="ghost" onClick={reset}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
