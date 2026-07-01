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
import { FileText, Download, CheckCircle2, Pencil, Mail } from 'lucide-react';
import { generateReportCardPdf, generateReportCardsPdf } from '@/lib/reportCardPdf';
import { buildStudentReportData, termDisplayLabel, RubricRowInput, ReportCardData } from '@/lib/reportCardData';
import { academicContext } from './gradebook/types';
import { useActiveSemester } from '@/hooks/useActiveSemester';
import { ReportCardEditDialog } from './ReportCardEditDialog';
import { useLanguage } from '@/contexts/LanguageContext';

// report_cards.term stores the semester key ('Semester 1'/'Semester 2'), matching
// rubric_grades; the UI shows it as "Term 1"/"Term 2" like the reference card.
const SEMESTER_TERMS = ['Semester 1', 'Semester 2'] as const;

interface Section { id: string; grade_level: string; section_name: string; }
interface ReportCard { id: string; student_id: string; term: string; academic_year: string; data: any; published: boolean; }

export const ReportCardManagement = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const termLabel = (v: string) => termDisplayLabel(v);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const { activeSemester } = useActiveSemester(schoolId || '');
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionId, setSectionId] = useState('');
  const [term, setTerm] = useState<string>('Semester 1');
  const [year, setYear] = useState(academicContext(undefined).academicYear);
  const [cards, setCards] = useState<(ReportCard & { name: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [settings, setSettings] = useState<any>({ school_name: '', principal_name: '' });
  const [editing, setEditing] = useState<(ReportCard & { name: string }) | null>(null);
  const [notifying, setNotifying] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Upload the school's report-card logo to the public school-branding bucket and persist
  // its URL on report_card_settings so the PDF header renders it for everyone.
  const uploadLogo = async (file: File) => {
    if (!schoolId) return;
    setUploadingLogo(true);
    try {
      const ext = (file.name.split('.').pop() || 'png').toLowerCase();
      const path = `${schoolId}/logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('school-branding')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) { toast.error(upErr.message); return; }
      const { data: pub } = supabase.storage.from('school-branding').getPublicUrl(path);
      const url = pub.publicUrl;
      const next = { ...settings, header_logo_url: url };
      setSettings(next);
      const { error } = await supabase.from('report_card_settings').upsert({ school_id: schoolId, ...next });
      if (error) { toast.error(error.message); return; }
      toast.success(t('rc.logoUpdated'));
    } finally { setUploadingLogo(false); }
  };

  // Default the term to the school's open semester once it loads.
  useEffect(() => { if (activeSemester) setTerm(academicContext(activeSemester).term); }, [activeSemester]);

  useEffect(() => {
    if (!user) return;
    supabase.from('school_accounts').select('id, school_name').eq('admin_user_id', user.id).maybeSingle()
      .then(async ({ data }) => {
        if (!data) return;
        setSchoolId(data.id);
        const { data: secs } = await supabase.from('school_sections').select('*').eq('school_id', data.id);
        setSections(secs || []);
        const { data: s } = await supabase.from('report_card_settings').select('*').eq('school_id', data.id).maybeSingle();
        setSettings(s || { school_name: data.school_name, principal_name: '' });
      });
  }, [user]);

  const loadCards = async () => {
    if (!schoolId) return;
    const { data } = await supabase.from('report_cards').select('*')
      .eq('school_id', schoolId).eq('term', term).eq('academic_year', year);
    const ids = (data || []).map(c => c.student_id);
    if (!ids.length) { setCards([]); return; }
    const { data: profs } = await supabase.from('profiles').select('id, display_name').in('id', ids);
    const nameMap = new Map((profs || []).map(p => [p.id, p.display_name || t('rc.unknown')]));
    setCards((data || []).map(c => ({ ...c, name: nameMap.get(c.student_id) || t('rc.unknown') })));
  };

  useEffect(() => { loadCards(); }, [schoolId, term, year]);

  // Core: build + upsert report cards for a set of students, reading the real per-subject
  // grid from rubric_grades (BOTH semesters, so End Year can be computed) + school_subjects
  // for names. Returns how many cards were written. `studentGrade` maps student -> "G9-A".
  const generateForStudents = async (
    studentIds: string[],
    studentGrade: Map<string, string>,
    sectionByStudent: Map<string, string | null>,
  ): Promise<number> => {
    if (!schoolId || !studentIds.length) return 0;

    const [{ data: profs }, { data: subjectsData }, { data: rubric }, { data: existing }] = await Promise.all([
      supabase.from('profiles').select('id, display_name').in('id', studentIds),
      supabase.from('school_subjects').select('id, name').eq('school_id', schoolId),
      // Both terms of the academic year → End Year = (S1 + S2)/2 per subject.
      supabase.from('rubric_grades')
        .select('student_id, subject_id, term, total, exam_score, quiz_score, hw_score, cw_score, project_score, attendance_score, literacy_score, effort, comment')
        .eq('school_id', schoolId).eq('academic_year', year).in('student_id', studentIds),
      // Preserve any existing overall term comment across regeneration.
      supabase.from('report_cards').select('student_id, data').eq('school_id', schoolId).eq('term', term).eq('academic_year', year).in('student_id', studentIds),
    ]);

    const nameMap = new Map((profs || []).map(p => [p.id, p.display_name || t('rc.unknown')]));
    const subjectName = new Map((subjectsData || []).map(s => [s.id as string, s.name as string]));
    const existingComment = new Map((existing || []).map(e => [e.student_id, (e.data as any)?.termComment ?? (e.data as any)?.comments ?? '']));

    const rubricByStudent = new Map<string, RubricRowInput[]>();
    for (const r of (rubric || []) as any[]) {
      const arr = rubricByStudent.get(r.student_id) || [];
      arr.push(r as RubricRowInput);
      rubricByStudent.set(r.student_id, arr);
    }

    const rows = studentIds
      .map(sid => {
        const rubricRows = rubricByStudent.get(sid) || [];
        const data = buildStudentReportData({
          displayName: nameMap.get(sid) || t('rc.unknown'),
          gradeLabel: studentGrade.get(sid) || '',
          selectedTerm: term,
          rows: rubricRows,
          subjectName: (id) => subjectName.get(id) || id,
          termComment: existingComment.get(sid) || '',
        });
        return { data, sid };
      })
      // Only write a card when the student actually has grades this term.
      .filter(({ data }) => data.subjects.length > 0)
      .map(({ data, sid }) => ({
        school_id: schoolId, student_id: sid, section_id: sectionByStudent.get(sid) ?? null,
        term, academic_year: year, generated_by: user?.id, data: data as any, published: false,
      }));

    if (!rows.length) return 0;
    const { error } = await supabase.from('report_cards').upsert(rows, { onConflict: 'student_id,term,academic_year' });
    if (error) { toast.error(`${t('rc.generateFailed')}: ` + error.message); return 0; }
    return rows.length;
  };

  // Resolve section -> "G{grade}-{section}" labels, and each student's section id + label.
  const buildSectionMaps = async (studentIds: string[]) => {
    const gradeByStudent = new Map<string, string>();
    const sectionByStudent = new Map<string, string | null>();
    if (!studentIds.length) return { gradeByStudent, sectionByStudent };
    const [{ data: secStud }, { data: secs }] = await Promise.all([
      supabase.from('section_students').select('section_id, student_id').in('student_id', studentIds),
      supabase.from('school_sections').select('id, grade_level, section_name').eq('school_id', schoolId!),
    ]);
    const secMap = new Map((secs || []).map(s => [s.id, s]));
    for (const ss of secStud || []) {
      const sec = secMap.get(ss.section_id);
      sectionByStudent.set(ss.student_id, ss.section_id);
      if (sec) gradeByStudent.set(ss.student_id, `${sec.grade_level}-${sec.section_name}`);
    }
    return { gradeByStudent, sectionByStudent };
  };

  const generate = async () => {
    if (!schoolId || !sectionId) { toast.error(t('rc.pickSection')); return; }
    setLoading(true);
    try {
      const { data: assigns } = await supabase.from('section_students').select('student_id').eq('section_id', sectionId);
      const studentIds = (assigns || []).map(a => a.student_id);
      if (!studentIds.length) { toast.error(t('rc.noStudentsInSection')); return; }
      const { gradeByStudent, sectionByStudent } = await buildSectionMaps(studentIds);
      const n = await generateForStudents(studentIds, gradeByStudent, sectionByStudent);
      if (n > 0) toast.success(`${t('rc.generatedPre')} ${n} ${t('rc.reportCardsWord')}`);
      else toast.error(t('rc.noGradesFound'));
      await loadCards();
    } finally { setLoading(false); }
  };

  // One-click: generate for every active student in the school, then publish them all.
  const exportAll = async () => {
    if (!schoolId) return;
    setExporting(true);
    try {
      const { data: rels } = await supabase.from('school_student_relationships')
        .select('student_id').eq('school_id', schoolId).eq('is_active', true);
      const studentIds = Array.from(new Set((rels || []).map(r => r.student_id)));
      if (!studentIds.length) { toast.error(t('rc.noStudentsInSection')); return; }
      const { gradeByStudent, sectionByStudent } = await buildSectionMaps(studentIds);
      const n = await generateForStudents(studentIds, gradeByStudent, sectionByStudent);
      if (!n) { toast.error(t('rc.noGradesFound')); return; }
      const { error } = await supabase.from('report_cards')
        .update({ published: true, published_at: new Date().toISOString() })
        .eq('school_id', schoolId).eq('term', term).eq('academic_year', year).eq('published', false);
      if (error) { toast.error(error.message); return; }
      toast.success(`${t('rc.exportedPre')} ${n} ${t('rc.reportCardsWord')}`);
      await loadCards();
    } finally { setExporting(false); }
  };

  const publishAll = async () => {
    const ids = cards.filter(c => !c.published).map(c => c.id);
    if (!ids.length) return;
    const { error } = await supabase.from('report_cards').update({ published: true, published_at: new Date().toISOString() }).in('id', ids);
    if (error) { toast.error(error.message); return; }
    toast.success(`${t('rc.publishedPre')} ${ids.length} ${t('rc.cardsWord')}`);
    loadCards();
  };

  const notifyParents = async () => {
    if (!schoolId) return;
    setNotifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-report-card-published', {
        body: { school_id: schoolId, term, academic_year: year },
      });
      if (error) throw error;
      toast.success(`${t('rc.notifiedPre')} (${data?.sent ?? 0} ${t('rc.emailsSent')})`);
    } catch (e: any) { toast.error(e.message || t('rc.failed')); } finally { setNotifying(false); }
  };

  const toInput = (card: ReportCard & { name: string }) => ({
    name: card.name, term: card.term, academic_year: card.academic_year, data: (card.data || {}) as ReportCardData,
  });

  const downloadPdf = async (card: ReportCard & { name: string }) => {
    const doc = await generateReportCardPdf(toInput(card), settings);
    doc.save(`report-${card.name}-${card.term}.pdf`);
  };

  const downloadAllPdf = async () => {
    if (!cards.length) return;
    const doc = await generateReportCardsPdf(cards.map(toInput), settings);
    doc.save(`report-cards-${term}-${year}.pdf`);
    toast.success(`${t('rc.downloadedPre')} ${cards.length} ${t('rc.reportCardsWord')}`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />{t('rc.settings')}</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-3">
          <div><Label>{t('rc.schoolName')}</Label><Input value={settings.school_name || ''} onChange={e => setSettings({ ...settings, school_name: e.target.value })} /></div>
          <div><Label>{t('rc.principalName')}</Label><Input value={settings.principal_name || ''} onChange={e => setSettings({ ...settings, principal_name: e.target.value })} /></div>
          <div className="md:col-span-2">
            <Label>{t('rc.schoolLogo')}</Label>
            <div className="flex items-center gap-3 mt-1">
              {settings.header_logo_url && (
                <img src={settings.header_logo_url} alt="logo" className="h-12 w-auto object-contain rounded border border-border bg-white p-1" />
              )}
              <Input type="file" accept="image/png,image/jpeg,image/svg+xml" className="max-w-xs" disabled={uploadingLogo}
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f); e.target.value = ''; }} />
              {uploadingLogo && <span className="text-sm text-muted-foreground">{t('rc.uploading')}</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('rc.schoolLogoHint')}</p>
          </div>
          <div className="md:col-span-2">
            <Button size="sm" variant="outline" onClick={async () => {
              if (!schoolId) return;
              const { error } = await supabase.from('report_card_settings').upsert({ school_id: schoolId, ...settings });
              if (error) toast.error(error.message); else toast.success(t('rc.saved'));
            }}>{t('rc.saveSettings')}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t('rc.generateTitle')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-4 gap-3">
            <div><Label>{t('rc.section')}</Label>
              <Select value={sectionId} onValueChange={setSectionId}>
                <SelectTrigger><SelectValue placeholder={t('rc.section')} /></SelectTrigger>
                <SelectContent className="bg-popover">{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.grade_level} - {s.section_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>{t('rc.term')}</Label>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover">
                  {SEMESTER_TERMS.map(tv => <SelectItem key={tv} value={tv}>{termLabel(tv)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>{t('rc.academicYear')}</Label><Input value={year} onChange={e => setYear(e.target.value)} placeholder="2025-2026" /></div>
            <div className="flex items-end"><Button variant="outline" onClick={generate} disabled={loading || exporting} className="w-full">{loading ? t('rc.generating') : t('rc.generateSection')}</Button></div>
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">{t('rc.exportAllHint')}</p>
            <Button onClick={exportAll} disabled={exporting || loading}>
              <FileText className="h-4 w-4 mr-1" />{exporting ? t('rc.exporting') : t('rc.exportAll')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center gap-2 flex-wrap">
            <CardTitle>{t('rc.reportCardsTitle')} ({termLabel(term)}, {year})</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={downloadAllPdf} disabled={!cards.length}><Download className="h-4 w-4 mr-1" />{t('rc.downloadAll')}</Button>
              <Button size="sm" variant="outline" onClick={notifyParents} disabled={notifying || !cards.some(c => c.published)}>
                <Mail className="h-4 w-4 mr-1" />{notifying ? t('rc.sending') : t('rc.notifyParents')}
              </Button>
              <Button size="sm" onClick={publishAll} disabled={!cards.some(c => !c.published)}><CheckCircle2 className="h-4 w-4 mr-1" />{t('rc.publishAll')}</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {cards.length === 0 ? <p className="text-sm text-muted-foreground">{t('rc.empty')}</p> : (
            <div className="divide-y divide-border border border-border rounded-lg">
              {cards.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 gap-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{t('rc.overall')} {c.data?.overall ?? '-'}% · {t('rc.attendance')} {c.data?.attendance_rate ?? '-'}%</div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {c.published ? <Badge>{t('rc.published')}</Badge> : <Badge variant="outline">{t('rc.draft')}</Badge>}
                    <Button size="sm" variant="ghost" onClick={() => setEditing(c)} title={t('rc.edit')}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="outline" onClick={() => downloadPdf(c)}><Download className="h-4 w-4 mr-1" />{t('rc.pdf')}</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ReportCardEditDialog
        card={editing ? { ...editing, student_name: editing.name } : null}
        open={!!editing}
        onOpenChange={(v) => { if (!v) setEditing(null); }}
        onSaved={loadCards}
      />
    </div>
  );
};
