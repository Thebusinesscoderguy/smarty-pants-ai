import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Save, Eye, FileText } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { renderReportCardToPdf, defaultLayoutConfig, ReportCardLayout, SectionConfig } from '@/lib/reportCardPdf';
import { useLanguage } from '@/contexts/LanguageContext';

const SECTION_LABEL_KEY: Record<string, string> = {
  header: 'rcd.secHeader',
  student_info: 'rcd.secStudentInfo',
  subjects_table: 'rcd.secSubjectsTable',
  attendance: 'rcd.secAttendance',
  behavior: 'rcd.secBehavior',
  comments: 'rcd.secComments',
  signature: 'rcd.secSignature',
};

export const ReportCardDesigner = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [layout, setLayout] = useState<ReportCardLayout>(defaultLayoutConfig);
  const [settings, setSettings] = useState<any>({ school_name: '', principal_name: '', footer_text: '', accent_color: '#7C3AED', header_logo_url: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    const { data: sch } = await supabase.from('school_accounts').select('id, school_name').eq('admin_user_id', user!.id).maybeSingle();
    if (!sch) return;
    setSchoolId(sch.id);
    const { data: s } = await supabase.from('report_card_settings').select('*').eq('school_id', sch.id).maybeSingle();
    if (s) {
      setSettings({
        school_name: s.school_name || sch.school_name,
        principal_name: s.principal_name || '',
        footer_text: (s as any).footer_text || '',
        accent_color: (s as any).accent_color || '#7C3AED',
        header_logo_url: (s as any).header_logo_url || '',
      });
      const lc = (s as any).layout_config;
      if (lc && lc.sections && Array.isArray(lc.sections) && lc.sections.length) {
        setLayout(lc as ReportCardLayout);
      }
    } else {
      setSettings((p: any) => ({ ...p, school_name: sch.school_name }));
    }
  };

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...layout.sections];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setLayout({ ...layout, sections: next });
  };
  const toggle = (idx: number) => {
    const next = [...layout.sections];
    next[idx] = { ...next[idx], enabled: !next[idx].enabled };
    setLayout({ ...layout, sections: next });
  };
  const updateSection = (idx: number, patch: Partial<SectionConfig>) => {
    const next = [...layout.sections];
    next[idx] = { ...next[idx], ...patch };
    setLayout({ ...layout, sections: next });
  };

  const save = async () => {
    if (!schoolId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('report_card_settings').upsert({
        school_id: schoolId,
        school_name: settings.school_name,
        principal_name: settings.principal_name,
        footer_text: settings.footer_text,
        accent_color: settings.accent_color,
        header_logo_url: settings.header_logo_url || null,
        layout_config: layout as any,
      } as any, { onConflict: 'school_id' });
      if (error) throw error;
      toast.success(t('rcd.templateSaved'));
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const previewPdf = () => {
    const doc = new jsPDF();
    renderReportCardToPdf(doc, {
      name: 'Sample Student',
      term: 'Term 1',
      academic_year: String(new Date().getFullYear()),
      data: {
        overall: 87,
        attendance_rate: 95,
        subjects: [
          { subject: 'Mathematics', avg: 92 },
          { subject: 'English', avg: 85 },
          { subject: 'Science', avg: 88 },
          { subject: 'History', avg: 82 },
        ],
        comments: 'A diligent student who consistently demonstrates strong effort.',
        attendance_breakdown: { present: 88, absent: 3, late: 2, excused: 2 },
      },
    }, settings, layout);
    doc.save('report-card-preview.pdf');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />{t('rcd.brandingTitle')}</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-3">
          <div><Label>{t('rcd.schoolName')}</Label><Input value={settings.school_name} onChange={e => setSettings({ ...settings, school_name: e.target.value })} /></div>
          <div><Label>{t('rcd.principalName')}</Label><Input value={settings.principal_name} onChange={e => setSettings({ ...settings, principal_name: e.target.value })} /></div>
          <div><Label>{t('rcd.logoUrl')}</Label><Input placeholder="https://..." value={settings.header_logo_url} onChange={e => setSettings({ ...settings, header_logo_url: e.target.value })} /></div>
          <div><Label>{t('rcd.accentColor')}</Label>
            <div className="flex gap-2 items-center">
              <Input type="color" className="w-16 h-10 p-1" value={settings.accent_color} onChange={e => setSettings({ ...settings, accent_color: e.target.value })} />
              <Input value={settings.accent_color} onChange={e => setSettings({ ...settings, accent_color: e.target.value })} />
            </div>
          </div>
          <div className="md:col-span-2"><Label>{t('rcd.footerText')}</Label><Textarea rows={2} value={settings.footer_text} onChange={e => setSettings({ ...settings, footer_text: e.target.value })} placeholder={t('rcd.footerPlaceholder')} /></div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>{t('rcd.sections')}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {layout.sections.map((s, idx) => (
              <div key={`${s.type}-${idx}`} className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Switch checked={s.enabled} onCheckedChange={() => toggle(idx)} />
                    <span className="font-medium truncate">{SECTION_LABEL_KEY[s.type] ? t(SECTION_LABEL_KEY[s.type]) : s.type}</span>
                    {!s.enabled && <Badge variant="outline" className="text-xs">{t('rcd.hidden')}</Badge>}
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => move(idx, -1)} disabled={idx === 0}><ArrowUp className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => move(idx, 1)} disabled={idx === layout.sections.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                  </div>
                </div>
                {s.type === 'comments' && (
                  <Input className="text-sm" placeholder={t('rcd.sectionLabelPlaceholder')} value={s.label || ''} onChange={e => updateSection(idx, { label: e.target.value })} />
                )}
                {s.type === 'subjects_table' && (
                  <div className="flex items-center gap-2 text-sm"><Switch checked={!!s.show_letter} onCheckedChange={v => updateSection(idx, { show_letter: v })} /><Label className="text-xs">{t('rcd.showLetterGrades')}</Label></div>
                )}
                {s.type === 'attendance' && (
                  <div className="flex items-center gap-2 text-sm"><Switch checked={!!s.show_breakdown} onCheckedChange={v => updateSection(idx, { show_breakdown: v })} /><Label className="text-xs">{t('rcd.showBreakdown')}</Label></div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('rcd.livePreview')}</CardTitle></CardHeader>
          <CardContent>
            <div className="border border-border rounded-lg p-4 bg-card text-card-foreground text-sm space-y-3 max-h-[500px] overflow-y-auto">
              {layout.sections.filter(s => s.enabled).map((s, i) => <PreviewSection key={i} section={s} settings={settings} t={t} />)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={previewPdf}><Eye className="h-4 w-4 mr-1" />{t('rcd.pdfPreview')}</Button>
        <Button onClick={save} disabled={saving}><Save className="h-4 w-4 mr-1" />{saving ? t('rcd.saving') : t('rcd.saveTemplate')}</Button>
      </div>
    </div>
  );
};

const PreviewSection = ({ section, settings, t }: { section: SectionConfig; settings: any; t: (k: string) => string }) => {
  const accent = settings.accent_color || '#7C3AED';
  switch (section.type) {
    case 'header':
      return <div className="text-center border-b pb-2" style={{ borderColor: accent }}>
        {settings.header_logo_url && <img src={settings.header_logo_url} alt="logo" className="h-12 mx-auto mb-1" />}
        <div className="font-bold text-lg" style={{ color: accent }}>{settings.school_name || t('rcd.pvSchoolFallback')}</div>
        <div className="text-xs text-muted-foreground">{t('rcd.pvReportCard')} · Term 1 · {new Date().getFullYear()}</div>
      </div>;
    case 'student_info':
      return <div className="grid grid-cols-2 gap-x-4 text-xs"><div><strong>{t('rcd.pvStudent')}</strong> Sample Student</div><div><strong>{t('rcd.pvGrade')}</strong> 5A</div><div><strong>{t('rcd.pvId')}</strong> 00123</div><div><strong>{t('rcd.pvYear')}</strong> {new Date().getFullYear()}</div></div>;
    case 'subjects_table':
      return <table className="w-full text-xs"><thead><tr className="border-b"><th className="text-left py-1">{t('rcd.pvSubject')}</th><th className="text-right">{t('rcd.pvScore')}</th>{section.show_letter && <th className="text-right">{t('rcd.pvGradeCol')}</th>}</tr></thead><tbody><tr><td>Mathematics</td><td className="text-right">92%</td>{section.show_letter && <td className="text-right">A</td>}</tr><tr><td>English</td><td className="text-right">85%</td>{section.show_letter && <td className="text-right">B</td>}</tr></tbody></table>;
    case 'attendance':
      return <div className="text-xs"><div><strong>{t('rcd.pvAttendance')}</strong> 95%</div>{section.show_breakdown && <div className="text-muted-foreground">{t('rcd.pvBreakdownSample')}</div>}</div>;
    case 'behavior':
      return <div className="text-xs"><strong>{t('rcd.pvConduct')}</strong> {t('rcd.pvExcellent')}</div>;
    case 'comments':
      return <div className="text-xs"><strong>{section.label || t('rcd.pvRemarksFallback')}:</strong> {t('rcd.pvRemarksSample')}</div>;
    case 'signature':
      return <div className="flex justify-between text-xs pt-4 mt-2 border-t"><span>_________________<br/>{t('rcd.pvPrincipal')}</span><span>_________________<br/>{t('rcd.pvClassTeacher')}</span><span>_________________<br/>{t('rcd.pvParent')}</span></div>;
    default: return null;
  }
};
