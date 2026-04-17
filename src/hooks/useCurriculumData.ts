import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Framework { id: string; code: string; name_en: string; name_ar: string | null; region: string; is_custom: boolean; }
export interface Subject { id: string; name_en: string; name_ar: string | null; code: string | null; }
export interface GradeLevel { id: string; label_en: string; label_ar: string | null; sort_order: number; }
export interface CurriculumUnit { id: string; unit_number: number; title_en: string; title_ar: string | null; description: string | null; topics: { en: string; ar: string }[]; }
export interface CurriculumSelection {
  framework: Framework;
  subject: Subject;
  gradeLevel: GradeLevel;
  unit: CurriculumUnit;
  promptContext: string;
}

export function useCurriculumData() {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [units, setUnits] = useState<CurriculumUnit[]>([]);
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedGradeLevelId, setSelectedGradeLevelId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [loadingFrameworks, setLoadingFrameworks] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);

  useEffect(() => {
    setLoadingFrameworks(true);
    (supabase as any)
      .from("curriculum_frameworks")
      .select("id,code,name_en,name_ar,region,is_custom")
      .eq("is_active", true)
      .order("region")
      .order("name_en")
      .then(({ data }: any) => {
        if (data) setFrameworks(data);
        setLoadingFrameworks(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedFrameworkId) { setSubjects([]); return; }
    setLoadingSubjects(true);
    setSelectedSubjectId(null);
    setSelectedGradeLevelId(null);
    setSelectedUnitId(null);
    (supabase as any)
      .from("curriculum_subjects")
      .select("id,name_en,name_ar,code")
      .eq("framework_id", selectedFrameworkId)
      .order("name_en")
      .then(({ data }: any) => {
        if (data) setSubjects(data);
        setLoadingSubjects(false);
      });
  }, [selectedFrameworkId]);

  useEffect(() => {
    if (!selectedFrameworkId) { setGradeLevels([]); return; }
    setLoadingGrades(true);
    (supabase as any)
      .from("curriculum_grade_levels")
      .select("id,label_en,label_ar,sort_order")
      .eq("framework_id", selectedFrameworkId)
      .order("sort_order")
      .then(({ data }: any) => {
        if (data) setGradeLevels(data);
        setLoadingGrades(false);
      });
  }, [selectedFrameworkId]);

  useEffect(() => {
    if (!selectedSubjectId || !selectedGradeLevelId) { setUnits([]); return; }
    setLoadingUnits(true);
    setSelectedUnitId(null);
    (supabase as any)
      .from("curriculum_units")
      .select("id,unit_number,title_en,title_ar,description,topics")
      .eq("subject_id", selectedSubjectId)
      .eq("grade_level_id", selectedGradeLevelId)
      .order("unit_number")
      .then(({ data }: any) => {
        if (data) setUnits(data.map((u: any) => ({ ...u, topics: (u.topics as { en: string; ar: string }[]) ?? [] })));
        setLoadingUnits(false);
      });
  }, [selectedSubjectId, selectedGradeLevelId]);

  const selection: CurriculumSelection | null = (() => {
    if (!selectedFrameworkId || !selectedSubjectId || !selectedGradeLevelId || !selectedUnitId) return null;
    const framework = frameworks.find(f => f.id === selectedFrameworkId);
    const subject = subjects.find(s => s.id === selectedSubjectId);
    const grade = gradeLevels.find(g => g.id === selectedGradeLevelId);
    const unit = units.find(u => u.id === selectedUnitId);
    if (!framework || !subject || !grade || !unit) return null;
    return {
      framework,
      subject,
      gradeLevel: grade,
      unit,
      promptContext: `Curriculum: ${framework.name_en} | ${grade.label_en} | ${subject.name_en} | Unit ${unit.unit_number}: ${unit.title_en}. Topics: ${unit.topics.map(t => t.en).join(", ")}.`,
    };
  })();

  return {
    frameworks, subjects, gradeLevels, units,
    selectedFrameworkId, selectedSubjectId, selectedGradeLevelId, selectedUnitId,
    setSelectedFrameworkId, setSelectedSubjectId, setSelectedGradeLevelId, setSelectedUnitId,
    loadingFrameworks, loadingSubjects, loadingGrades, loadingUnits,
    selection,
  };
}

export async function tagContentWithCurriculum(
  contentId: string,
  contentType: "quiz" | "study_plan" | "homework" | "assessment" | "lesson_plan" | "presentation",
  curriculumUnitId: string,
  schoolId?: string,
) {
  return await (supabase as any).from("content_curriculum_tags").insert({
    content_id: contentId,
    content_type: contentType,
    curriculum_unit_id: curriculumUnitId,
    school_id: schoolId ?? null,
  });
}
