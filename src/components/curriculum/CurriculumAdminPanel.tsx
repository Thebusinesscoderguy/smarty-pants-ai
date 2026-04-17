import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Check, ChevronDown, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Framework { id: string; code: string; name_en: string; name_ar: string | null; region: string; is_custom: boolean; }
interface Subject { id: string; name_en: string; name_ar: string | null; code: string | null; }
interface GradeLevel { id: string; label_en: string; label_ar: string | null; sort_order: number; }
interface CoverageRow { subject_name: string; grade_label: string; sort_order: number; unit_number: number; unit_title: string; content_count: number; }

const REGION_LABELS: Record<string, string> = {
  gcc: "GCC / Arab World",
  global: "International",
  us: "United States",
  uk: "United Kingdom",
};

export function CurriculumAdminPanel({ schoolId }: { schoolId: string }) {
  const { language } = useLanguage();
  const ar = language === "ar";
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [schoolFrameworks, setSchoolFrameworks] = useState<Framework[]>([]);
  const [activeTab, setActiveTab] = useState("framework");
  const [loading, setLoading] = useState(true);
  const [coverage, setCoverage] = useState<CoverageRow[]>([]);
  const [coverageLoading, setCoverageLoading] = useState(false);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [addUnitForm, setAddUnitForm] = useState({ frameworkId: "", subjectId: "", gradeLevelId: "", titleEn: "", titleAr: "", topicsRaw: "", unitNumber: 1 });
  const [addUnitSubjects, setAddUnitSubjects] = useState<Subject[]>([]);
  const [addUnitGrades, setAddUnitGrades] = useState<GradeLevel[]>([]);
  const [addingUnit, setAddingUnit] = useState(false);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

  async function generateUnitsWithAI(opts: { framework_id?: string; force?: boolean }) {
    const key = opts.framework_id ?? "all";
    setGeneratingFor(key);
    toast.info(ar ? "جارٍ توليد الوحدات بالذكاء الاصطناعي..." : "Generating units with AI (this may take a few minutes)...");
    try {
      const { data, error } = await (supabase as any).functions.invoke("backfill-curriculum-units", {
        body: { framework_id: opts.framework_id, force: opts.force ?? false },
      });
      if (error) throw error;
      toast.success(ar
        ? `تم إدراج ${data?.inserted ?? 0} وحدة عبر ${data?.processed ?? 0} مادة`
        : `Inserted ${data?.inserted ?? 0} units across ${data?.processed ?? 0} (framework, grade, subject) combos`);
      if (data?.errors?.length) console.warn("backfill errors", data.errors);
      loadData();
    } catch (e: any) {
      toast.error(e.message ?? (ar ? "فشل التوليد" : "Generation failed"));
    } finally {
      setGeneratingFor(null);
    }
  }

  useEffect(() => { loadData(); }, [schoolId]);

  async function loadData() {
    setLoading(true);
    const [{ data: allFw }, { data: schoolSettings }] = await Promise.all([
      (supabase as any).from("curriculum_frameworks").select("id,code,name_en,name_ar,region,is_custom").eq("is_active", true).order("region").order("name_en"),
      (supabase as any).from("school_curriculum_settings").select("framework_id, curriculum_frameworks(id,code,name_en,name_ar,region,is_custom)").eq("school_id", schoolId),
    ]);
    if (allFw) setFrameworks(allFw);
    if (schoolSettings) setSchoolFrameworks(schoolSettings.map((s: any) => s.curriculum_frameworks as Framework).filter(Boolean));
    setLoading(false);
  }

  async function loadCoverage() {
    setCoverageLoading(true);
    const { data } = await (supabase as any).from("school_curriculum_coverage").select("*").eq("school_id", schoolId);
    if (data) setCoverage(data as CoverageRow[]);
    setCoverageLoading(false);
  }

  async function selectFramework(frameworkId: string) {
    if (schoolFrameworks.find(f => f.id === frameworkId)) {
      toast.info(ar ? "هذا المنهج محدد بالفعل" : "Already selected");
      return;
    }
    const { error } = await (supabase as any).from("school_curriculum_settings").insert({ school_id: schoolId, framework_id: frameworkId, is_primary: schoolFrameworks.length === 0 });
    if (error) { toast.error(ar ? "حدث خطأ" : "Error"); return; }
    toast.success(ar ? "تم تحديد المنهج" : "Framework selected");
    loadData();
  }

  async function removeFramework(frameworkId: string) {
    await (supabase as any).from("school_curriculum_settings").delete().eq("school_id", schoolId).eq("framework_id", frameworkId);
    toast.success(ar ? "تم إزالة المنهج" : "Framework removed");
    loadData();
  }

  useEffect(() => {
    if (!addUnitForm.frameworkId) return;
    Promise.all([
      (supabase as any).from("curriculum_subjects").select("id,name_en,name_ar,code").eq("framework_id", addUnitForm.frameworkId).order("name_en"),
      (supabase as any).from("curriculum_grade_levels").select("id,label_en,label_ar,sort_order").eq("framework_id", addUnitForm.frameworkId).order("sort_order"),
    ]).then(([{ data: subs }, { data: grades }]: any) => {
      if (subs) setAddUnitSubjects(subs);
      if (grades) setAddUnitGrades(grades);
    });
  }, [addUnitForm.frameworkId]);

  async function createCustomUnit() {
    if (!addUnitForm.titleEn || !addUnitForm.frameworkId || !addUnitForm.subjectId || !addUnitForm.gradeLevelId) {
      toast.error(ar ? "يرجى ملء جميع الحقول" : "Fill all fields");
      return;
    }
    setAddingUnit(true);
    const topics = addUnitForm.topicsRaw.split("\n").map(t => t.trim()).filter(Boolean).map(t => ({ en: t, ar: t }));
    const { error } = await (supabase as any).from("curriculum_units").insert({
      framework_id: addUnitForm.frameworkId,
      subject_id: addUnitForm.subjectId,
      grade_level_id: addUnitForm.gradeLevelId,
      unit_number: addUnitForm.unitNumber,
      title_en: addUnitForm.titleEn,
      title_ar: addUnitForm.titleAr || null,
      topics,
      is_custom: true,
      school_id: schoolId,
    });
    setAddingUnit(false);
    if (error) {
      toast.error(error.message.includes("unique") ? (ar ? "الوحدة موجودة بالفعل" : "Unit already exists") : (ar ? "حدث خطأ" : "Error"));
      return;
    }
    toast.success(ar ? "تم إنشاء الوحدة" : "Unit created");
    setShowAddUnit(false);
    setAddUnitForm({ frameworkId: "", subjectId: "", gradeLevelId: "", titleEn: "", titleAr: "", topicsRaw: "", unitNumber: 1 });
  }

  const coverageBySubject = coverage.reduce<Record<string, CoverageRow[]>>((acc, row) => {
    (acc[row.subject_name] = acc[row.subject_name] || []).push(row);
    return acc;
  }, {});
  const grouped = frameworks.reduce<Record<string, Framework[]>>((acc, f) => {
    (acc[f.region] = acc[f.region] || []).push(f);
    return acc;
  }, {});

  if (loading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{ar ? "إدارة المناهج الدراسية" : "Curriculum Management"}</h2>
        <Button onClick={() => setShowAddUnit(true)} size="sm" variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          {ar ? "إضافة وحدة مخصصة" : "Add custom unit"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v === "coverage") loadCoverage(); }}>
        <TabsList>
          <TabsTrigger value="framework">{ar ? "إعداد المنهج" : "Framework setup"}</TabsTrigger>
          <TabsTrigger value="coverage">{ar ? "تغطية المنهج" : "Coverage map"}</TabsTrigger>
        </TabsList>

        <TabsContent value="framework" className="space-y-6 mt-6">
          {schoolFrameworks.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">{ar ? "المناهج المحددة" : "Selected frameworks"}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {schoolFrameworks.map(fw => (
                  <div key={fw.id} className="flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5">
                    <div>
                      <div className="font-medium">{ar && fw.name_ar ? fw.name_ar : fw.name_en}</div>
                      <Badge variant="outline" className="text-xs mt-1">{REGION_LABELS[fw.region]}</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => generateUnitsWithAI({ framework_id: fw.id })} disabled={generatingFor !== null} title={ar ? "توليد الوحدات بالذكاء الاصطناعي" : "Generate units with AI"}>
                        {generatingFor === fw.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => removeFramework(fw.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-border">
                  <Button size="sm" variant="outline" className="w-full gap-2" onClick={() => generateUnitsWithAI({})} disabled={generatingFor !== null}>
                    {generatingFor === "all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {ar ? "توليد جميع الوحدات المفقودة بالذكاء الاصطناعي" : "Backfill all missing units with AI"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-lg">{ar ? "إضافة منهج" : "Add a framework"}</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(grouped).map(([region, fws]) => (
                <div key={region}>
                  <p className="text-sm font-medium text-muted-foreground mb-2">{REGION_LABELS[region]}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {fws.map(fw => {
                      const selected = schoolFrameworks.some(sf => sf.id === fw.id);
                      return (
                        <button
                          key={fw.id}
                          onClick={() => (selected ? removeFramework(fw.id) : selectFramework(fw.id))}
                          className={`flex items-center justify-between p-3 rounded-lg border text-start transition-colors ${selected ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/50"}`}
                        >
                          <div>
                            <div className="font-medium text-sm">{ar && fw.name_ar ? fw.name_ar : fw.name_en}</div>
                            <div className="text-xs text-muted-foreground">{fw.code}</div>
                          </div>
                          {selected && <Check className="h-4 w-4" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coverage" className="mt-6">
          {coverageLoading ? (
            <div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : coverage.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6 text-center">
              {ar ? "لا توجد بيانات بعد" : "No coverage data yet. Start creating curriculum-tagged content."}
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(coverageBySubject).map(([subject, rows]) => {
                const expanded = expandedSubjects.has(subject);
                const total = rows.length;
                const covered = rows.filter(r => r.content_count > 0).length;
                return (
                  <Card key={subject}>
                    <button
                      onClick={() => {
                        const next = new Set(expandedSubjects);
                        expanded ? next.delete(subject) : next.add(subject);
                        setExpandedSubjects(next);
                      }}
                      className="w-full text-start p-4"
                    >
                      <div className="flex items-center gap-2">
                        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <span className="font-medium flex-1">{subject}</span>
                        <Badge variant="outline">{covered}/{total} {ar ? "وحدات" : "units"}</Badge>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${total > 0 ? (covered / total) * 100 : 0}%` }} />
                      </div>
                    </button>
                    {expanded && (
                      <div className="border-t border-border p-2 space-y-1">
                        {rows.sort((a, b) => a.sort_order - b.sort_order || a.unit_number - b.unit_number).map((row, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                            <div className="text-sm">
                              <span className="text-muted-foreground">{row.grade_label}</span>
                              <span className="mx-2">·</span>
                              <span>Unit {row.unit_number}: {row.unit_title}</span>
                            </div>
                            <Badge variant={row.content_count > 0 ? "default" : "outline"} className="text-xs">
                              {row.content_count > 0 ? `${row.content_count} items` : (ar ? "لا يوجد محتوى" : "No content")}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showAddUnit} onOpenChange={setShowAddUnit}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{ar ? "إضافة وحدة مخصصة" : "Add custom unit"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium">{ar ? "المنهج" : "Framework"} *</label>
              <Select value={addUnitForm.frameworkId} onValueChange={(v) => setAddUnitForm(f => ({ ...f, frameworkId: v, subjectId: "", gradeLevelId: "" }))}>
                <SelectTrigger><SelectValue placeholder={ar ? "اختر" : "Choose"} /></SelectTrigger>
                <SelectContent>
                  {frameworks.map(fw => <SelectItem key={fw.id} value={fw.id}>{ar && fw.name_ar ? fw.name_ar : fw.name_en}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">{ar ? "الصف" : "Grade"} *</label>
                <Select value={addUnitForm.gradeLevelId} onValueChange={(v) => setAddUnitForm(f => ({ ...f, gradeLevelId: v }))} disabled={!addUnitForm.frameworkId}>
                  <SelectTrigger><SelectValue placeholder={ar ? "اختر" : "Choose"} /></SelectTrigger>
                  <SelectContent>
                    {addUnitGrades.map(g => <SelectItem key={g.id} value={g.id}>{ar && g.label_ar ? g.label_ar : g.label_en}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium">{ar ? "المادة" : "Subject"} *</label>
                <Select value={addUnitForm.subjectId} onValueChange={(v) => setAddUnitForm(f => ({ ...f, subjectId: v }))} disabled={!addUnitForm.frameworkId}>
                  <SelectTrigger><SelectValue placeholder={ar ? "اختر" : "Choose"} /></SelectTrigger>
                  <SelectContent>
                    {addUnitSubjects.map(s => <SelectItem key={s.id} value={s.id}>{ar && s.name_ar ? s.name_ar : s.name_en}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-[80px_1fr] gap-3">
              <div>
                <label className="text-xs font-medium">{ar ? "رقم الوحدة" : "Unit #"} *</label>
                <Input type="number" min={1} value={addUnitForm.unitNumber} onChange={(e) => setAddUnitForm(f => ({ ...f, unitNumber: parseInt(e.target.value) || 1 }))} />
              </div>
              <div>
                <label className="text-xs font-medium">{ar ? "عنوان الوحدة (إنجليزي)" : "Unit title (English)"} *</label>
                <Input value={addUnitForm.titleEn} onChange={(e) => setAddUnitForm(f => ({ ...f, titleEn: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium">{ar ? "عنوان الوحدة (عربي)" : "Unit title (Arabic)"}</label>
              <Input value={addUnitForm.titleAr} onChange={(e) => setAddUnitForm(f => ({ ...f, titleAr: e.target.value }))} dir="rtl" />
            </div>
            <div>
              <label className="text-xs font-medium">{ar ? "المحاور (سطر واحد لكل محور)" : "Topics (one per line)"}</label>
              <textarea
                className="w-full min-h-[100px] rounded-md border border-input bg-background p-2 text-sm"
                value={addUnitForm.topicsRaw}
                onChange={(e) => setAddUnitForm(f => ({ ...f, topicsRaw: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUnit(false)}>{ar ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={createCustomUnit} disabled={addingUnit}>
              {addingUnit && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
              {ar ? "إنشاء الوحدة" : "Create unit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
