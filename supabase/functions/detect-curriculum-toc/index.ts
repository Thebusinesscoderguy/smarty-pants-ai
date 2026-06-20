// Phase 2 (S2+S3) — detect-curriculum-toc
//
// The TOC-based approach (replaces whole-book chunking). Two stages:
//   S2  TOC PARSING (narrow LLM step, OpenAI): locate the contents pages in the
//       already-extracted PDF text and turn them into a structured list of
//       { title, stated_page, level }.
//   S3  OFFSET SOLVER (deterministic code, NO LLM): printed page != PDF page, so
//       we anchor on the TITLE. For each TOC entry we find where its heading
//       actually appears in the body text and use THAT page as the true start,
//       disambiguating with: heading position, an offset prior, and a monotonic
//       (increasing) start-page constraint.
//
// Output is a detected chapter -> PDF-page map (with the first line found at each
// start page + a confidence flag) stored in curriculum_parse_jobs.proposed_structure.
// DRAFT ONLY: never writes curriculum_books/units/lessons. Admin-only via RLS.

import { buildCorsHeaders } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

let corsHeaders = buildCorsHeaders();

const TOC_SCAN_PAGES = 30;     // only look this deep for the contents section
const TOC_LINE_THRESHOLD = 4;  // min TOC-like lines on a page to count it as TOC
const MIN_TITLE_CHARS = 4;     // ignore ultra-short titles when title-matching
const MODEL = "gpt-4o-mini";

// ---- text helpers ----------------------------------------------------------

function parsePages(text: string): Record<number, string> {
  const re = /===== PAGE (\d+) =====\n?([\s\S]*?)(?=\n*===== PAGE \d+ =====|$)/g;
  const pages: Record<number, string> = {};
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) pages[Number(m[1])] = (m[2] ?? "").trim();
  return pages;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

// Strip leading numbering / "chapter|unit|lesson" so the distinctive part of the
// title is what we match on (body headers rarely repeat the TOC's exact prefix).
function distinctive(title: string): string {
  const stripped = title
    .replace(/^\s*(chapter|unit|lesson|section|part)\s+\d+[:.\-)]?\s*/i, "")
    .replace(/^\s*\d+(\.\d+)*[:.\-)]?\s*/, "");
  return normalize(stripped);
}

function firstLine(pageText: string): string {
  const line = (pageText || "").split(/\n/).map((l) => l.trim()).find((l) => l.length > 0) || "";
  return line.slice(0, 160);
}

// A TOC line typically ends in a page number, often with dot leaders.
function looksLikeTocLine(line: string): boolean {
  const t = line.trim();
  if (!t || t.length > 140) return false;
  if (/\.{2,}\s*\d{1,4}$/.test(t)) return true;               // "Photosynthesis ...... 87"
  if (/[A-Za-z].*\s+\d{1,4}$/.test(t) && /[A-Za-z]/.test(t)) return true; // "Photosynthesis   87"
  return false;
}

// Find the contiguous run of front-matter pages that make up the TOC.
function locateTocPages(pages: Record<number, string>, pageCount: number): number[] {
  const limit = Math.min(pageCount, TOC_SCAN_PAGES);
  const scored: { p: number; score: number; hasKeyword: boolean }[] = [];
  for (let p = 1; p <= limit; p++) {
    const txt = pages[p] || "";
    const lines = txt.split(/\n/);
    const score = lines.filter(looksLikeTocLine).length;
    const hasKeyword = /\b(table of contents|contents)\b/i.test(txt.slice(0, 200));
    scored.push({ p, score, hasKeyword });
  }
  const tocish = scored.filter((s) => s.score >= TOC_LINE_THRESHOLD || s.hasKeyword).map((s) => s.p);
  if (tocish.length === 0) return [];
  // Fill the span from first to last TOC-ish page (handles a multi-page TOC).
  const lo = Math.min(...tocish), hi = Math.max(...tocish);
  const span: number[] = [];
  for (let p = lo; p <= hi && p - lo < 12; p++) span.push(p); // cap span at 12 pages
  return span;
}

// ---- S3: deterministic offset solver --------------------------------------

interface TocEntry { title: string; stated_page: number | null; level: number }
interface Candidate { page: number; idx: number; atTop: boolean }

function findCandidates(entry: TocEntry, pages: Record<number, string>, pageCount: number, excluded: Set<number>): Candidate[] {
  const target = distinctive(entry.title);
  const out: Candidate[] = [];
  if (target.length < MIN_TITLE_CHARS) return out;
  for (let p = 1; p <= pageCount; p++) {
    if (excluded.has(p)) continue;
    const norm = normalize(pages[p] || "");
    const idx = norm.indexOf(target);
    if (idx === -1) continue;
    out.push({ page: p, idx, atTop: idx < 120 }); // normalized -> idx<120 ~ near page top (heading-like)
  }
  return out;
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

function solve(entries: TocEntry[], pages: Record<number, string>, pageCount: number, tocPages: number[]) {
  const excluded = new Set(tocPages);
  const lastToc = tocPages.length ? Math.max(...tocPages) : 0;

  // Pre-compute candidates per entry.
  const cands = entries.map((e) => findCandidates(e, pages, pageCount, excluded));

  // Offset prior: from entries with exactly one heading-like candidate.
  const offsets: number[] = [];
  entries.forEach((e, i) => {
    const c = cands[i];
    const top = c.filter((x) => x.atTop && x.page > lastToc);
    if (e.stated_page != null && top.length === 1) offsets.push(top[0].page - e.stated_page);
  });
  let priorOffset = offsets.length ? median(offsets) : (lastToc > 0 ? lastToc : 0);

  const resolved: any[] = [];
  let prevStart = lastToc; // chapters must start after the TOC

  entries.forEach((e, i) => {
    const c = cands[i].filter((x) => x.page > prevStart); // enforce monotonic order
    const expected = (e.stated_page != null ? e.stated_page : 0) + priorOffset;

    let chosen: Candidate | null = null;
    if (c.length) {
      chosen = [...c].sort((a, b) => {
        // Prefer heading-at-top, then closeness to the expected page.
        if (a.atTop !== b.atTop) return a.atTop ? -1 : 1;
        return Math.abs(a.page - expected) - Math.abs(b.page - expected);
      })[0];
    }

    let start: number, confidence: string, note: string | null = null;
    const dist = chosen ? Math.abs(chosen.page - expected) : Infinity;
    if (chosen && chosen.atTop && dist <= 1) { start = chosen.page; confidence = "high"; }
    else if (chosen && (chosen.atTop || dist <= 2)) { start = chosen.page; confidence = "medium"; }
    else if (chosen) { start = chosen.page; confidence = "low"; note = "matched far from expected page"; }
    else {
      // No title match at all -> fall back to stated page + offset prior, flag loudly.
      start = Math.max(prevStart + 1, (e.stated_page != null ? e.stated_page : prevStart - priorOffset) + priorOffset);
      start = Math.min(Math.max(start, prevStart + 1), pageCount);
      confidence = "unresolved";
      note = "no heading text found; estimated from page number";
    }

    // Adapt the running offset on trustworthy matches (handles mid-book drift).
    if (e.stated_page != null && (confidence === "high" || confidence === "medium")) {
      priorOffset = start - e.stated_page;
    }

    resolved.push({
      title: e.title,
      level: e.level,
      stated_page: e.stated_page,
      detected_pdf_page: start,
      confidence,
      note,
      candidate_count: cands[i].length,
      first_line: firstLine(pages[start] || ""),
    });
    prevStart = start;
  });

  // end_page = next entry's start - 1 (any level); last entry runs to document end.
  for (let i = 0; i < resolved.length; i++) {
    resolved[i].end_pdf_page = i + 1 < resolved.length
      ? Math.max(resolved[i].detected_pdf_page, resolved[i + 1].detected_pdf_page - 1)
      : pageCount;
  }

  return { prior_offset: priorOffset, entries: resolved };
}

// ---- S2: TOC parse via OpenAI ---------------------------------------------

async function parseTocWithLLM(tocText: string, openAIApiKey: string): Promise<TocEntry[]> {
  const prompt = `Below is the raw text of the table-of-contents pages from a textbook (page markers included).
Extract EVERY entry in reading order. For each entry return:
- title: the chapter/unit/lesson title WITHOUT the trailing page number
- stated_page: the printed page number shown in the TOC as an integer, or null if none
- level: 1 for top-level (Unit/Part), 2 for Chapter, 3 for Lesson/Section. Infer from numbering/indentation; if the list is flat, use 2.
Do not invent entries. Return ONLY: { "entries": [ { "title": "...", "stated_page": 87, "level": 2 } ] }

TOC TEXT:
"""
${tocText}
"""`;

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${openAIApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: "You extract a table of contents into strict JSON. Output JSON only." },
        { role: "user", content: prompt },
      ],
      temperature: 0,
      response_format: { type: "json_object" },
    }),
  });
  if (!resp.ok) throw new Error(`OpenAI TOC parse failed (${resp.status}): ${(await resp.text()).slice(0, 500)}`);

  const json = await resp.json();
  const content = json?.choices?.[0]?.message?.content ?? "{}";
  const parsed = typeof content === "string" ? JSON.parse(content) : content;
  const entries = Array.isArray(parsed?.entries) ? parsed.entries : [];
  return entries
    .map((e: any) => ({
      title: String(e?.title ?? "").trim(),
      stated_page: Number.isFinite(e?.stated_page) ? Number(e.stated_page) : null,
      level: [1, 2, 3].includes(e?.level) ? e.level : 2,
    }))
    .filter((e: TocEntry) => e.title.length > 0);
}

// ---- handler ---------------------------------------------------------------

serve(async (req) => {
  corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  let jobId: string | null = null;
  let userClient: ReturnType<typeof createClient> | null = null;
  let documentId: string | null = null;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const body = await req.json();
    documentId = body?.documentId ?? null;
    const text: string = typeof body?.text === "string" ? body.text : "";
    const pageCount: number = Number.isFinite(body?.pageCount) ? body.pageCount : 0;
    if (!documentId) return json({ error: "documentId is required" }, 400);

    const { data: doc, error: docErr } = await userClient
      .from("curriculum_documents")
      .select("id, school_id, title")
      .eq("id", documentId)
      .maybeSingle();
    if (docErr) return json({ error: docErr.message }, 500);
    if (!doc) return json({ error: "Document not found or not authorized" }, 404);

    const { data: job, error: jobErr } = await userClient
      .from("curriculum_parse_jobs")
      .insert({ document_id: doc.id, school_id: doc.school_id, status: "running", model: `toc:${MODEL}` })
      .select("id")
      .single();
    if (jobErr) return json({ error: `Failed to create parse job: ${jobErr.message}` }, 500);
    jobId = job.id as string;

    const pages = parsePages(text);
    const realPageCount = pageCount || Object.keys(pages).length;

    // --- locate TOC; loud failure if there's no clean contents section ---
    const tocPages = locateTocPages(pages, realPageCount);
    if (tocPages.length === 0) {
      const error = "No table-of-contents region detected in the first pages. This book may have no clean TOC — the no-TOC fallback (heading detection / manual entry) is out of scope for this gate.";
      await userClient.from("curriculum_parse_jobs").update({ status: "failed", error, updated_at: new Date().toISOString() }).eq("id", jobId);
      return json({ error, no_toc: true }, 422);
    }

    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) {
      await userClient.from("curriculum_parse_jobs").update({ status: "failed", error: "OpenAI not configured", updated_at: new Date().toISOString() }).eq("id", jobId);
      return json({ error: "OpenAI not configured" }, 500);
    }

    const tocText = tocPages.map((p) => `===== PAGE ${p} =====\n${pages[p] || ""}`).join("\n\n");
    const entries = await parseTocWithLLM(tocText, openAIApiKey);
    if (entries.length === 0) {
      const error = "TOC region found but no entries could be parsed from it.";
      await userClient.from("curriculum_parse_jobs").update({ status: "failed", error, updated_at: new Date().toISOString() }).eq("id", jobId);
      return json({ error, no_toc: true, toc_pages: tocPages }, 422);
    }

    const solved = solve(entries, pages, realPageCount, tocPages);

    const counts = solved.entries.reduce((acc: Record<string, number>, e: any) => {
      acc[e.confidence] = (acc[e.confidence] || 0) + 1; return acc;
    }, {});

    const toc_map = {
      toc_pages: tocPages,
      page_count: realPageCount,
      prior_offset: solved.prior_offset,
      confidence_summary: counts,
      entries: solved.entries,
    };

    await userClient.from("curriculum_parse_jobs").update({
      status: "succeeded",
      proposed_structure: { kind: "toc_map", toc_map },
      updated_at: new Date().toISOString(),
    }).eq("id", jobId);

    return json({ jobId, toc_map });
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error("detect-curriculum-toc error:", error);
    if (userClient && jobId) {
      await userClient.from("curriculum_parse_jobs").update({ status: "failed", error, updated_at: new Date().toISOString() }).eq("id", jobId);
    }
    return json({ error }, 500);
  }
});
