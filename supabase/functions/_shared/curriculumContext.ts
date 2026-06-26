// Curriculum retrieval (keyword/section match — NO embeddings).
//
// Given a school + topic (and optional subject/grade), pull the most relevant
// slice of an uploaded curriculum document's extracted_text to ground AI
// generation. Returns null when there is no usable curriculum doc — callers MUST
// treat null as "generate generically" and never error.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { splitIntoSegments } from "./curriculumChunk.ts";

export interface CurriculumContextParams {
  schoolId: string;
  topic: string;
  subject?: string;     // free-text subject name (optional filter)
  gradeLevel?: string;  // e.g. "Grade 9" (optional, lenient)
  maxChars?: number;    // default 40000
}

export interface CurriculumContextResult {
  text: string;
  chars: number;
  documentId: string;
  documentTitle: string | null;
  topicMatched: boolean; // true if topic keywords were found in the doc
}

const STOPWORDS = new Set([
  "the", "and", "for", "with", "from", "that", "this", "into", "your", "you",
  "are", "was", "were", "what", "which", "how", "why", "when", "about", "of",
  "in", "on", "to", "a", "an", "is", "it", "or", "as", "by", "be", "explain",
  "describe", "introduction", "basics", "overview", "general",
]);

const keywords = (s: string): string[] => {
  const set = new Set<string>();
  for (const w of (s || "").toLowerCase().split(/[^a-z0-9]+/)) {
    if (w.length >= 3 && !STOPWORDS.has(w)) set.add(w);
  }
  return [...set];
};

const normalizeGrade = (s: string): string => {
  const digits = (s || "").match(/\d+/);
  return digits ? digits[0] : (s || "").toLowerCase().trim();
};

const looseMatch = (a: string, b: string): boolean => {
  const al = (a || "").toLowerCase().trim();
  const bl = (b || "").toLowerCase().trim();
  return !!al && !!bl && (al.includes(bl) || bl.includes(al));
};

const countOccurrences = (haystackLower: string, needleLower: string): number =>
  needleLower ? haystackLower.split(needleLower).length - 1 : 0;

export async function getCurriculumContext(
  admin: SupabaseClient,
  params: CurriculumContextParams,
): Promise<CurriculumContextResult | null> {
  const { schoolId, topic, subject, gradeLevel, maxChars = 40000 } = params;
  if (!schoolId) return null;

  try {
    // 1) Candidate metadata only (avoid pulling huge extracted_text blobs yet).
    const { data: metas, error } = await admin
      .from("curriculum_documents")
      .select("id, title, grade_level, subject_id, char_count")
      .eq("school_id", schoolId)
      .not("extracted_text", "is", null)
      .order("char_count", { ascending: false })
      .limit(25);
    if (error || !metas || metas.length === 0) return null;

    let candidates = metas.filter((d) => (d.char_count ?? 0) > 200);
    if (candidates.length === 0) return null;

    // 2) Lenient grade filter (only if it leaves something).
    if (gradeLevel) {
      const g = normalizeGrade(gradeLevel);
      const byGrade = candidates.filter((d) => normalizeGrade(d.grade_level ?? "") === g);
      if (byGrade.length) candidates = byGrade;
    }

    // 3) Optional subject filter via school_subjects name (only if it leaves something).
    if (subject) {
      const { data: subs } = await admin
        .from("school_subjects")
        .select("id, name")
        .eq("school_id", schoolId);
      const wanted = (subs ?? []).filter((s: { name: string }) => looseMatch(s.name, subject)).map((s: { id: string }) => s.id);
      if (wanted.length) {
        const bySubject = candidates.filter((d) => d.subject_id && wanted.includes(d.subject_id));
        if (bySubject.length) candidates = bySubject;
      }
    }

    // 4) Pick the single best doc (largest after filters) and fetch its text.
    const best = candidates[0];
    const { data: doc, error: docErr } = await admin
      .from("curriculum_documents")
      .select("id, title, extracted_text")
      .eq("id", best.id)
      .maybeSingle();
    if (docErr || !doc?.extracted_text) return null;

    // 5) Segment + score by topic keyword hits; select top segments up to maxChars.
    const kws = keywords(`${topic} ${subject ?? ""}`);
    const segments = splitIntoSegments(doc.extracted_text);
    const scored = segments.map((seg) => {
      const lc = seg.toLowerCase();
      let score = 0;
      for (const k of kws) score += countOccurrences(lc, k);
      return { seg, score };
    });
    const topicMatched = scored.some((s) => s.score > 0);
    // If topic matched, prioritize highest-scoring segments; else keep doc order
    // (leading segments) so we still ground on the subject's material.
    const ordered = topicMatched ? [...scored].sort((a, b) => b.score - a.score) : scored;

    let out = "";
    for (const { seg } of ordered) {
      if (!out) {
        out = seg.length > maxChars ? seg.slice(0, maxChars) : seg;
        if (out.length >= maxChars) break;
        continue;
      }
      if (out.length + seg.length + 2 > maxChars) break;
      out = `${out}\n\n${seg}`;
    }
    out = out.slice(0, maxChars).trim();
    if (out.length < 50) return null;

    return {
      text: out,
      chars: out.length,
      documentId: doc.id,
      documentTitle: doc.title ?? null,
      topicMatched,
    };
  } catch (_e) {
    // Bulletproof: any retrieval failure → no context → caller generates generically.
    return null;
  }
}
