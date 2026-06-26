// PHASE 2 SPIKE — isolated, throwaway page. Two analyzers over ONE real textbook PDF:
//   1. "Detect TOC & map pages" (S2+S3, current focus): reads the table of contents,
//      title-matches each chapter to its true PDF page, and shows the detected
//      chapter -> PDF-page map (start page + first line found there + confidence).
//   2. "Whole-book split" (earlier spike, kept as the no-TOC fallback path).
// Draft only: nothing is written to the live curriculum tables. Safe to delete
// (remove this file + its route in App.tsx).
import { useRef, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { extractPdfAllText } from '@/utils/pdfExtractText';
import { useLanguage } from '@/contexts/LanguageContext';

interface SubjectRow { id: string; name: string }
interface Prepared { sig: string; documentId: string; text: string; pageCount: number; charCount: number }

const CONF_COLOR: Record<string, string> = {
  high: 'text-green-700 bg-green-50',
  medium: 'text-amber-700 bg-amber-50',
  low: 'text-orange-700 bg-orange-50',
  unresolved: 'text-red-700 bg-red-50',
};

export default function CurriculumParseDemo() {
  const { t } = useLanguage();
  const [schoolId, setSchoolId] = useState('');
  const [userId, setUserId] = useState('');
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Grade 9');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tocMap, setTocMap] = useState<any>(null);
  const [splitResult, setSplitResult] = useState<any>(null);

  const preparedRef = useRef<Prepared | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError(t('cpd.notSignedIn')); return; }
      setUserId(user.id);
      const { data: school } = await supabase
        .from('school_accounts').select('id').eq('admin_user_id', user.id).maybeSingle();
      if (!school) { setError(t('cpd.noSchoolAdmin')); return; }
      setSchoolId(school.id);
      const { data: subs } = await supabase
        .from('school_subjects').select('id, name').eq('school_id', school.id).order('name');
      const rows = (subs || []) as SubjectRow[];
      setSubjects(rows);
      if (rows.length) setSubjectId(rows[0].id);
    })();
  }, []);

  // Upload + extract ONCE per file; reuse for either analyzer.
  const prepare = async (): Promise<Prepared> => {
    const sig = file ? `${file.name}:${file.size}:${file.lastModified}` : '';
    if (preparedRef.current && preparedRef.current.sig === sig) return preparedRef.current;
    if (!schoolId || !subjectId || !file || !title.trim()) {
      throw new Error(t('cpd.pickSubjectTitlePdf'));
    }

    setStatus(t('cpd.creatingDoc'));
    const { data: doc, error: docErr } = await (supabase as any)
      .from('curriculum_documents')
      .insert({
        school_id: schoolId, subject_id: subjectId, grade_level: gradeLevel,
        title: title.trim(), storage_path: 'pending', mime_type: 'application/pdf',
        status: 'uploaded', created_by: userId,
      })
      .select('id').single();
    if (docErr) throw new Error(`${t('cpd.insertFailedPre')} ${docErr.message}`);
    const documentId = doc.id as string;

    setStatus(t('cpd.uploadingPdf'));
    const safeName = file.name.replace(/[^\w.\-]+/g, '_');
    const path = `${schoolId}/${documentId}/${safeName}`;
    const { error: upErr } = await supabase.storage
      .from('curriculum-docs').upload(path, file, { contentType: 'application/pdf', upsert: true });
    if (upErr) throw new Error(`${t('cpd.uploadFailedPre')} ${upErr.message}`);
    await (supabase as any).from('curriculum_documents').update({ storage_path: path }).eq('id', documentId);

    setStatus(t('cpd.extractingText'));
    const { text, pageCount, charCount } = await extractPdfAllText(file);
    const prepared: Prepared = { sig, documentId, text, pageCount, charCount };
    preparedRef.current = prepared;
    return prepared;
  };

  // Pull the JSON error body out of a FunctionsHttpError when present.
  const fnError = async (fnErr: any): Promise<string> => {
    try { const j = await fnErr?.context?.json?.(); if (j?.error) return j.error; } catch { /* ignore */ }
    return fnErr?.message || t('cpd.functionError');
  };

  const detectToc = async () => {
    setBusy(true); setError(null); setTocMap(null); setSplitResult(null);
    try {
      const { documentId, text, pageCount, charCount } = await prepare();
      setStatus(`${t('cpd.extractedPre')} ${charCount.toLocaleString()} ${t('cpd.charsWord')} / ${pageCount} ${t('cpd.pagesWord')}. ${t('cpd.detectingToc')}`);
      const { data, error: fnErr } = await supabase.functions.invoke('detect-curriculum-toc', {
        body: { documentId, text, pageCount },
      });
      if (fnErr) throw new Error(await fnError(fnErr));
      setTocMap(data?.toc_map ?? data);
      setStatus(t('cpd.done'));
    } catch (e: any) { setError(e?.message || t('cpd.failed')); setStatus(''); }
    finally { setBusy(false); }
  };

  const splitWholeBook = async () => {
    setBusy(true); setError(null); setTocMap(null); setSplitResult(null);
    try {
      const { documentId, text, pageCount } = await prepare();
      setStatus(t('cpd.splitting'));
      const { data, error: fnErr } = await supabase.functions.invoke('parse-curriculum-document', {
        body: { documentId, text, pageCount },
      });
      if (fnErr) throw new Error(await fnError(fnErr));
      setSplitResult(data);
      setStatus(t('cpd.done'));
    } catch (e: any) { setError(e?.message || t('cpd.failed')); setStatus(''); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t('cpd.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('cpd.subtitle')}
        </p>
      </div>

      {error && <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700 whitespace-pre-wrap">{error}</div>}

      <Card>
        <CardHeader><CardTitle>{t('cpd.input')}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">{t('cpd.subject')}</label>
            {subjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('cpd.noSubjects')}</p>
            ) : (
              <select className="w-full rounded border p-2 text-sm" value={subjectId} onChange={e => setSubjectId(e.target.value)}>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{t('cpd.gradeLevel')}</label>
            <input className="w-full rounded border p-2 text-sm" value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{t('cpd.bookTitle')}</label>
            <input className="w-full rounded border p-2 text-sm" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('cpd.bookTitlePlaceholder')} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{t('cpd.pdfFile')}</label>
            <input type="file" accept="application/pdf" className="w-full text-sm"
              onChange={e => { setFile(e.target.files?.[0] || null); preparedRef.current = null; }} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={detectToc} disabled={busy || !file}>
              {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('cpd.working')}</> : t('cpd.detectBtn')}
            </Button>
            <Button variant="outline" onClick={splitWholeBook} disabled={busy || !file}>
              {t('cpd.wholeSplitBtn')}
            </Button>
          </div>
          {status && <p className="text-sm text-muted-foreground">{status}</p>}
        </CardContent>
      </Card>

      {tocMap && (
        <Card>
          <CardHeader>
            <CardTitle>{t('cpd.detectedMap')}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {t('cpd.tocPages')} {Array.isArray(tocMap.toc_pages) ? tocMap.toc_pages.join(', ') : '—'} ·
              {' '}{t('cpd.offsetPrior')} {tocMap.prior_offset} ·
              {' '}{t('cpd.pagesLabel')} {tocMap.page_count} ·
              {' '}{t('cpd.confidenceLabel')} {tocMap.confidence_summary ? Object.entries(tocMap.confidence_summary).map(([k, v]) => `${k}:${v}`).join('  ') : '—'}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="p-1">{t('cpd.colLvl')}</th>
                    <th className="p-1">{t('cpd.colTitle')}</th>
                    <th className="p-1">{t('cpd.colTocP')}</th>
                    <th className="p-1">{t('cpd.colPdfP')}</th>
                    <th className="p-1">{t('cpd.colEnd')}</th>
                    <th className="p-1">{t('cpd.colConf')}</th>
                    <th className="p-1">{t('cpd.colFirstLine')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(tocMap.entries || []).map((e: any, i: number) => (
                    <tr key={i} className="border-b align-top">
                      <td className="p-1">{e.level}</td>
                      <td className="p-1 font-medium" style={{ paddingLeft: `${(e.level - 1) * 12 + 4}px` }}>{e.title}</td>
                      <td className="p-1">{e.stated_page ?? '—'}</td>
                      <td className="p-1 font-semibold">{e.detected_pdf_page}</td>
                      <td className="p-1">{e.end_pdf_page}</td>
                      <td className="p-1"><span className={`rounded px-1 ${CONF_COLOR[e.confidence] || ''}`}>{e.confidence}</span></td>
                      <td className="p-1 text-muted-foreground">
                        {e.first_line || <em>{t('cpd.empty')}</em>}
                        {e.note && <span className="block text-[10px] text-orange-600">⚠ {e.note}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <details>
              <summary className="cursor-pointer text-sm text-muted-foreground">{t('cpd.rawJson')}</summary>
              <pre className="mt-2 max-h-[400px] overflow-auto rounded bg-muted p-3 text-xs">{JSON.stringify(tocMap, null, 2)}</pre>
            </details>
          </CardContent>
        </Card>
      )}

      {splitResult && (
        <Card>
          <CardHeader><CardTitle>{t('cpd.wholeSplitRaw')}</CardTitle></CardHeader>
          <CardContent>
            <pre className="max-h-[500px] overflow-auto rounded bg-muted p-3 text-xs">
              {JSON.stringify(splitResult?.proposed_structure ?? splitResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
