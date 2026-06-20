// Phase 2 SPIKE — parse-curriculum-document
//
// Takes already-extracted PDF text (the client extracts it with pdfExtractText.ts),
// chunks it while trying to respect chapter boundaries (NOT naive fixed splits),
// sends each chunk to the AI, and stitches the results into a proposed
// book -> units -> lessons tree stored in curriculum_parse_jobs.proposed_structure.
//
// HARD RULES for the spike:
//  - DRAFT ONLY. This function NEVER writes to curriculum_books / curriculum_units /
//    curriculum_lessons. It only touches curriculum_parse_jobs + the document's status.
//  - LOUD FAILURE on scanned / image-only PDFs (no text layer): mark the job + document
//    'failed' with an explicit error instead of returning an empty structure.
//  - Admin-only: all DB access goes through a user-scoped client so RLS
//    (is_school_admin_of) is the authority. verify_jwt is on.

import { buildCorsHeaders } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

let corsHeaders = buildCorsHeaders();

const CHUNK_CHAR_BUDGET = 28000;  // ~7k tokens of source text per chunk
const MAX_CHUNKS = 12;            // bound cost/runtime for the spike
const MIN_CHARS_PER_PAGE = 80;    // below this average => almost certainly scanned / no text layer
const MIN_TOTAL_CHARS = 400;      // absolute floor regardless of page count
const MODEL = "google/gemini-2.5-flash";

// Split full text into chapter-ish segments at detected headings, keeping each
// heading attached to its body. Falls back to page-marker boundaries when the
// document has no recognizable headings.
function splitIntoSegments(text: string): string[] {
  const headingRe = /^\s*((chapter|unit|lesson|section|part)\s+\d+\b|\d+\.\s+\S)/gim;
  const indices: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = headingRe.exec(text)) !== null) {
    indices.push(m.index);
    if (indices.length > 4000) break;
  }

  if (indices.length < 2) {
    // No usable headings — fall back to page-marker segments so we still respect
    // a natural boundary rather than slicing mid-sentence.
    const byPage = text.split(/(?====== PAGE \d+ =====)/g).filter((s) => s.trim());
    return byPage.length ? byPage : [text];
  }

  const segs: string[] = [];
  if (indices[0] > 0) segs.push(text.slice(0, indices[0])); // front matter
  for (let i = 0; i < indices.length; i++) {
    const start = indices[i];
    const end = i + 1 < indices.length ? indices[i + 1] : text.length;
    segs.push(text.slice(start, end));
  }
  return segs.filter((s) => s.trim());
}

// Greedily pack chapter segments into chunks under the char budget without
// splitting a chapter across chunks. Oversized single chapters are hard-split by
// paragraph as a last resort.
function packChunks(segments: string[]): string[] {
  const chunks: string[] = [];
  let cur = "";

  const flush = () => { if (cur.trim()) { chunks.push(cur); cur = ""; } };

  for (const seg of segments) {
    if (seg.length > CHUNK_CHAR_BUDGET) {
      flush();
      const paras = seg.split(/\n{2,}/);
      let buf = "";
      for (const p of paras) {
        if (buf && (buf.length + p.length + 2) > CHUNK_CHAR_BUDGET) {
          chunks.push(buf);
          buf = p;
        } else {
          buf = buf ? `${buf}\n\n${p}` : p;
        }
      }
      if (buf.trim()) chunks.push(buf);
    } else if (cur && (cur.length + seg.length + 2) > CHUNK_CHAR_BUDGET) {
      flush();
      cur = seg;
    } else {
      cur = cur ? `${cur}\n\n${seg}` : seg;
    }
  }
  flush();
  return chunks.slice(0, MAX_CHUNKS);
}

async function splitChunk(
  chunkText: string,
  chunkIndex: number,
  totalChunks: number,
  bookMeta: { title: string; grade_level: string },
  lovableKey: string,
): Promise<any[]> {
  const prompt = `You are a curriculum specialist splitting a textbook into a clean structure.
This is chunk ${chunkIndex + 1} of ${totalChunks} from the book "${bookMeta.title}" (grade level: ${bookMeta.grade_level}).
The text contains "===== PAGE n =====" markers indicating the source page number.

Identify the UNITS (chapters) and, within each unit, the LESSONS that appear in THIS chunk.
- Do NOT invent units/lessons that are not present in this text.
- Use the page markers to fill source_pages (e.g. "12-18") for each lesson.
- summary = 1-2 sentence overview grounded ONLY in the text.
- If this chunk is front-matter / index / non-content, return an empty units array.

Return ONLY JSON: { "units": [ { "title": "...", "summary": "...", "lessons": [ { "title": "...", "summary": "...", "source_pages": "..." } ] } ] }

TEXT:
"""
${chunkText}
"""`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${lovableKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: "You output strict JSON only." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!resp.ok) {
    const detail = await resp.text();
    throw new Error(`AI gateway error on chunk ${chunkIndex + 1} (${resp.status}): ${detail.slice(0, 500)}`);
  }

  const json = await resp.json();
  const content = json?.choices?.[0]?.message?.content ?? "{}";
  let parsed: any;
  try {
    parsed = typeof content === "string" ? JSON.parse(content) : content;
  } catch {
    throw new Error(`AI returned invalid JSON on chunk ${chunkIndex + 1}`);
  }
  return Array.isArray(parsed?.units) ? parsed.units : [];
}

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

    // RLS is the authority: only an admin of the document's school can read it.
    const { data: doc, error: docErr } = await userClient
      .from("curriculum_documents")
      .select("id, school_id, subject_id, grade_level, title, status")
      .eq("id", documentId)
      .maybeSingle();
    if (docErr) return json({ error: docErr.message }, 500);
    if (!doc) return json({ error: "Document not found or not authorized" }, 404);

    // Open a parse job (running).
    const { data: job, error: jobErr } = await userClient
      .from("curriculum_parse_jobs")
      .insert({ document_id: doc.id, school_id: doc.school_id, status: "running", model: MODEL })
      .select("id")
      .single();
    if (jobErr) return json({ error: `Failed to create parse job: ${jobErr.message}` }, 500);
    jobId = job.id as string;
    await userClient.from("curriculum_documents").update({ status: "parsing", updated_at: new Date().toISOString() }).eq("id", doc.id);

    // --- LOUD scanned / no-text-layer failure path ---
    const charCount = text.replace(/===== PAGE \d+ =====/g, "").replace(/\s+/g, "").length;
    const avgPerPage = pageCount > 0 ? charCount / pageCount : charCount;
    if (charCount < MIN_TOTAL_CHARS || (pageCount > 0 && avgPerPage < MIN_CHARS_PER_PAGE)) {
      const error = `No extractable text (${charCount} chars across ${pageCount} pages, avg ${avgPerPage.toFixed(0)}/page). This looks like a scanned / image-only PDF with no text layer. Re-upload a text-based PDF or run OCR first.`;
      await userClient.from("curriculum_parse_jobs").update({ status: "failed", error, updated_at: new Date().toISOString() }).eq("id", jobId);
      await userClient.from("curriculum_documents").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", doc.id);
      return json({ error, scanned: true, charCount, pageCount }, 422);
    }

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      await userClient.from("curriculum_parse_jobs").update({ status: "failed", error: "AI gateway not configured", updated_at: new Date().toISOString() }).eq("id", jobId);
      return json({ error: "AI gateway not configured" }, 500);
    }

    // Chapter-aware chunking.
    const segments = splitIntoSegments(text);
    const chunks = packChunks(segments);

    // Split each chunk, then stitch into one ordered tree.
    const units: any[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkUnits = await splitChunk(chunks[i], i, chunks.length, { title: doc.title, grade_level: doc.grade_level }, lovableKey);
      for (const u of chunkUnits) {
        const lessons = Array.isArray(u?.lessons) ? u.lessons : [];
        units.push({
          title: String(u?.title ?? "Untitled unit"),
          summary: u?.summary ? String(u.summary) : null,
          order_index: units.length,
          lessons: lessons.map((l: any, j: number) => ({
            title: String(l?.title ?? `Lesson ${j + 1}`),
            summary: l?.summary ? String(l.summary) : null,
            source_pages: l?.source_pages ? String(l.source_pages) : null,
            order_index: j,
          })),
        });
      }
    }

    const proposed = {
      book: { title: doc.title, subject_id: doc.subject_id, grade_level: doc.grade_level, status: "draft" },
      units,
      meta: { chunks: chunks.length, truncated: segments.length > 0 && packChunks(segments).length >= MAX_CHUNKS && chunks.length === MAX_CHUNKS, charCount, pageCount, model: MODEL },
    };

    await userClient.from("curriculum_parse_jobs").update({ status: "succeeded", proposed_structure: proposed, updated_at: new Date().toISOString() }).eq("id", jobId);
    await userClient.from("curriculum_documents").update({ status: "parsed", page_count: pageCount, updated_at: new Date().toISOString() }).eq("id", doc.id);

    return json({ jobId, proposed_structure: proposed });
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error("parse-curriculum-document error:", error);
    // Best-effort: mark the job failed so it never sits stuck in 'running'.
    if (userClient && jobId) {
      await userClient.from("curriculum_parse_jobs").update({ status: "failed", error, updated_at: new Date().toISOString() }).eq("id", jobId);
      if (documentId) await userClient.from("curriculum_documents").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", documentId);
    }
    return json({ error }, 500);
  }
});
