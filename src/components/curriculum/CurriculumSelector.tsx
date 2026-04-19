import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Globe, Loader2, Clock, Target, Sparkles } from "lucide-react";
import { useCurriculumData, type CurriculumSelection } from "@/hooks/useCurriculumData";
import { useLanguage } from "@/contexts/LanguageContext";

const REGION_LABELS: Record<string, { en: string; ar: string }> = {
  gcc: { en: "GCC / Arab World", ar: "دول الخليج" },
  global: { en: "International", ar: "دولي" },
  us: { en: "United States", ar: "الولايات المتحدة" },
  uk: { en: "United Kingdom", ar: "المملكة المتحدة" },
};

const DIFFICULTY_LABEL: Record<string, { en: string; ar: string; cls: string }> = {
  beginner: { en: "Beginner", ar: "مبتدئ", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  intermediate: { en: "Intermediate", ar: "متوسط", cls: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  advanced: { en: "Advanced", ar: "متقدم", cls: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
};

interface Props {
  onSelectionChange: (s: CurriculumSelection | null) => void;
  className?: string;
}

export function CurriculumSelector({ onSelectionChange, className }: Props) {
  const { language } = useLanguage();
  const ar = language === "ar";
  const {
    frameworks, subjects, gradeLevels, units,
    selectedFrameworkId, selectedSubjectId, selectedGradeLevelId, selectedUnitId,
    setSelectedFrameworkId, setSelectedSubjectId, setSelectedGradeLevelId, setSelectedUnitId,
    loadingFrameworks, loadingSubjects, loadingGrades, loadingUnits,
    autoGenerating,
  } = useCurriculumData();

  const handleUnitChange = (unitId: string) => {
    setSelectedUnitId(unitId);
    const framework = frameworks.find(f => f.id === selectedFrameworkId);
    const subject = subjects.find(s => s.id === selectedSubjectId);
    const grade = gradeLevels.find(g => g.id === selectedGradeLevelId);
    const unit = units.find(u => u.id === unitId);
    if (framework && subject && grade && unit) {
      onSelectionChange({
        framework, subject, gradeLevel: grade, unit,
        promptContext: `Curriculum: ${framework.name_en} | ${grade.label_en} | ${subject.name_en} | Unit ${unit.unit_number}: ${unit.title_en}. Topics: ${(unit.topics as { en: string; ar: string }[]).map(t => t.en).join(", ")}.`,
      });
    }
  };

  const grouped = frameworks.reduce<Record<string, typeof frameworks>>((acc, f) => {
    (acc[f.region] = acc[f.region] || []).push(f);
    return acc;
  }, {});

  const selectedUnit = units.find(u => u.id === selectedUnitId);
  const diff = selectedUnit?.difficulty_level && DIFFICULTY_LABEL[selectedUnit.difficulty_level];

  return (
    <div className={`rounded-xl border border-border bg-card p-4 space-y-4 ${className ?? ""}`} dir={ar ? "rtl" : "ltr"}>
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">
          {ar ? "المنهج الدراسي (اختياري)" : "Curriculum alignment (optional)"}
        </span>
        <Badge variant="outline" className="text-xs">{ar ? "عالمي" : "Global"}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Select
          value={selectedFrameworkId ?? undefined}
          onValueChange={(v) => { setSelectedFrameworkId(v); onSelectionChange(null); }}
          disabled={loadingFrameworks}
        >
          <SelectTrigger>
            {loadingFrameworks
              ? <span className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />Loading...</span>
              : <SelectValue placeholder={ar ? "اختر منهجاً" : "Choose framework"} />}
          </SelectTrigger>
          <SelectContent>
            {Object.entries(grouped).map(([region, fws]) => (
              <SelectGroup key={region}>
                <SelectLabel>{ar ? REGION_LABELS[region]?.ar : REGION_LABELS[region]?.en}</SelectLabel>
                {fws.map(fw => (
                  <SelectItem key={fw.id} value={fw.id}>
                    {ar && fw.name_ar ? fw.name_ar : fw.name_en}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedGradeLevelId ?? undefined}
          onValueChange={(v) => { setSelectedGradeLevelId(v); onSelectionChange(null); }}
          disabled={!selectedFrameworkId || loadingGrades}
        >
          <SelectTrigger>
            {loadingGrades
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <SelectValue placeholder={ar ? "اختر الصف" : "Choose grade"} />}
          </SelectTrigger>
          <SelectContent>
            {gradeLevels.map(g => (
              <SelectItem key={g.id} value={g.id}>{ar && g.label_ar ? g.label_ar : g.label_en}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedSubjectId ?? undefined}
          onValueChange={(v) => { setSelectedSubjectId(v); onSelectionChange(null); }}
          disabled={!selectedFrameworkId || loadingSubjects}
        >
          <SelectTrigger>
            {loadingSubjects
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <SelectValue placeholder={ar ? "اختر المادة" : "Choose subject"} />}
          </SelectTrigger>
          <SelectContent>
            {subjects.map(s => (
              <SelectItem key={s.id} value={s.id}>
                {ar && s.name_ar ? s.name_ar : s.name_en}
                {s.code && <span className="text-xs text-muted-foreground ms-1">({s.code})</span>}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedUnitId ?? undefined}
          onValueChange={handleUnitChange}
          disabled={!selectedSubjectId || !selectedGradeLevelId || loadingUnits || autoGenerating}
        >
          <SelectTrigger>
            {loadingUnits || autoGenerating
              ? (
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {autoGenerating
                    ? (ar ? "إنشاء الوحدات بالذكاء الاصطناعي…" : "AI generating units…")
                    : (ar ? "جاري التحميل…" : "Loading…")}
                </span>
              )
              : <SelectValue placeholder={ar ? "اختر الوحدة" : "Choose unit"} />}
          </SelectTrigger>
          <SelectContent>
            {units.length === 0 && !loadingUnits && !autoGenerating && (
              <div className="px-2 py-3 text-xs text-muted-foreground">{ar ? "لا توجد وحدات" : "No units yet"}</div>
            )}
            {units.map(u => {
              const isAi = u.verification_status === "ai_generated" || u.verification_status === "ai_cross_verified";
              return (
                <SelectItem key={u.id} value={u.id}>
                  <span className="inline-flex items-center gap-2">
                    {ar && u.title_ar ? `الوحدة ${u.unit_number}: ${u.title_ar}` : `Unit ${u.unit_number}: ${u.title_en}`}
                    {isAi && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{ar ? "مولّد بالذكاء" : "AI"}</span>}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {selectedUnit && (
        <div className="rounded-lg bg-muted/50 p-3 space-y-3">
          {selectedUnit.short_description && (
            <p className="text-sm text-foreground/90 leading-relaxed">{selectedUnit.short_description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {diff && (
              <Badge variant="outline" className={`text-xs ${diff.cls}`}>
                <Target className="h-3 w-3 me-1" />
                {ar ? diff.ar : diff.en}
              </Badge>
            )}
            {selectedUnit.estimated_minutes != null && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 me-1" />
                {Math.round(selectedUnit.estimated_minutes / 60 * 10) / 10}{ar ? " ساعة" : " h"}
              </Badge>
            )}
          </div>

          {selectedUnit.topics?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">{ar ? "المحاور المغطاة:" : "Topics covered:"}</p>
              <div className="flex flex-wrap gap-1.5">
                {(selectedUnit.topics as { en: string; ar: string }[]).map((t, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{ar ? t.ar : t.en}</Badge>
                ))}
              </div>
            </div>
          )}

          {selectedUnit.exam_topics && selectedUnit.exam_topics.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {ar ? "موضوعات شائعة في الامتحانات:" : "Commonly tested in exams:"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedUnit.exam_topics.map((t, i) => (
                  <Badge key={i} variant="outline" className="text-xs border-primary/30 text-primary">{t}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedFrameworkId && (
        <button
          type="button"
          onClick={() => {
            setSelectedFrameworkId(null);
            setSelectedSubjectId(null);
            setSelectedGradeLevelId(null);
            setSelectedUnitId(null);
            onSelectionChange(null);
          }}
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          {ar ? "مسح التحديد" : "Clear selection"}
        </button>
      )}
    </div>
  );
}
