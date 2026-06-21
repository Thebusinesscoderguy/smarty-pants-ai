// Orchestrates the production curriculum upload pipeline (Option 3+):
//   upload nothing big → extract text in the browser → detect TOC (existing edge fn)
//   → build an editable book→units→lessons tree → on approve, materialize atomically
//   via the materialize_curriculum RPC.
//
// Upload stores TEXT + CHAPTER STRUCTURE ONLY — no image extraction/upload at upload
// time. Images move to an on-demand path (fetched lazily when a teacher opens a lesson
// that needs them); the extraction code is retained behind EXTRACT_IMAGES_AT_UPLOAD.
// The raw PDF is NEVER sent to storage — only extracted text + DB rows. That keeps
// upload instant and permanently removes both the file-size blocker and the image slog.

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { extractPdfAllText } from '@/utils/pdfExtractText';
import { extractPdfImages } from '@/utils/pdfExtractImages';

// Upfront embedded-image extraction/upload is OFF in production: curriculum upload
// stores text + chapter structure only, which makes it instant. The image pipeline
// (extractPdfImages) is kept wired-but-gated so the planned on-demand path — fetch a
// lesson's figures when a teacher actually opens it — can reuse it. Flip to true to
// restore upfront extraction. Typed as boolean so the gated block still type-checks.
const EXTRACT_IMAGES_AT_UPLOAD: boolean = false;

// ---- editable tree types (page ranges + structure; content is sliced at approve) ----
export interface LessonNode {
  id: string;
  title: string;
  start_page: number;
  end_page: number;
  confidence: string | null;
  first_line?: string;
  content?: string; // admin override; when empty, content is sliced from page range
}
export interface UnitNode {
  id: string;
  title: string;
  start_page: number;
  end_page: number;
  confidence: string | null;
  lessons: LessonNode[];
}
export interface CurriculumTree {
  units: UnitNode[];
}

export interface ImageMeta {
  page: number;
  storage_path: string;
  width: number;
  height: number;
  previewUrl: string; // object URL for the review thumbnails
}

export type ImportPhase =
  | 'idle' | 'extracting-text' | 'extracting-images' | 'uploading-images'
  | 'detecting' | 'ready' | 'publishing' | 'done' | 'error';

let _localId = 0;
const localId = (p: string) => `${p}-${_localId++}`;

// Mirror of the edge function's page-marker parser, so client-side content slices
// line up exactly with the pages the offset solver mapped chapters to.
function parsePages(text: string): Record<number, string> {
  const re = /===== PAGE (\d+) =====\n?([\s\S]*?)(?=\n*===== PAGE \d+ =====|$)/g;
  const pages: Record<number, string> = {};
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) pages[Number(m[1])] = (m[2] ?? '').trim();
  return pages;
}

function sliceContent(pages: Record<number, string>, start: number, end: number): string {
  const parts: string[] = [];
  for (let p = start; p <= end; p++) {
    const t = pages[p];
    if (t) parts.push(t);
  }
  return parts.join('\n\n').trim();
}

// Build the initial editable tree from the offset solver's flat, ordered entries.
// level 1/2 (top-most present) → units; deeper → lessons under the current unit.
// Flat list (single level) → each entry becomes a unit with one full-chapter lesson.
function buildTreeFromTocMap(tocMap: any, pageCount: number): CurriculumTree {
  const entries: any[] = Array.isArray(tocMap?.entries) ? tocMap.entries : [];
  if (entries.length === 0) return { units: [] };

  const levels = Array.from(new Set(entries.map((e) => e.level ?? 2)));
  const minLevel = Math.min(...levels);
  const hasChildren = levels.length > 1;

  const units: UnitNode[] = [];
  let current: UnitNode | null = null;

  const range = (e: any) => ({
    start: Number(e.detected_pdf_page) || 1,
    end: Number(e.end_pdf_page) || pageCount,
    confidence: e.confidence ?? null,
    first_line: e.first_line ?? '',
    title: String(e.title ?? '').trim() || 'Untitled',
  });

  for (const e of entries) {
    const r = range(e);
    if (!hasChildren) {
      const lesson: LessonNode = { id: localId('l'), title: r.title, start_page: r.start, end_page: r.end, confidence: r.confidence, first_line: r.first_line };
      units.push({ id: localId('u'), title: r.title, start_page: r.start, end_page: r.end, confidence: r.confidence, lessons: [lesson] });
    } else if ((e.level ?? 2) === minLevel) {
      current = { id: localId('u'), title: r.title, start_page: r.start, end_page: r.end, confidence: r.confidence, lessons: [] };
      units.push(current);
    } else {
      if (!current) {
        current = { id: localId('u'), title: 'Unit', start_page: r.start, end_page: r.end, confidence: r.confidence, lessons: [] };
        units.push(current);
      }
      current.lessons.push({ id: localId('l'), title: r.title, start_page: r.start, end_page: r.end, confidence: r.confidence, first_line: r.first_line });
    }
  }

  // Units that gained no lessons get one covering their whole range; unit range
  // is normalized to span its lessons.
  for (const u of units) {
    if (u.lessons.length === 0) {
      u.lessons.push({ id: localId('l'), title: u.title, start_page: u.start_page, end_page: u.end_page, confidence: u.confidence });
    }
    u.start_page = Math.min(...u.lessons.map((l) => l.start_page));
    u.end_page = Math.max(...u.lessons.map((l) => l.end_page));
  }

  return { units };
}

interface RunArgs { file: File; subjectId: string; gradeLevel: string; title: string }

export function useCurriculumImport() {
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [phase, setPhase] = useState<ImportPhase>('idle');
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [tree, setTree] = useState<CurriculumTree | null>(null);
  const [images, setImages] = useState<ImageMeta[]>([]);
  const [pages, setPages] = useState<Record<number, string>>({});
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [bookTitle, setBookTitle] = useState('');

  // Resolve the signed-in school admin once.
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: school } = await supabase
        .from('school_accounts').select('id').eq('admin_user_id', user.id).maybeSingle();
      if (school) setSchoolId(school.id);
    })();
  }, []);

  const reset = useCallback(() => {
    images.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    setPhase('idle'); setStatus(''); setError(null);
    setTree(null); setImages([]); setPages({});
    setDocumentId(null); setJobId(null); setBookTitle('');
  }, [images]);

  const run = useCallback(async ({ file, subjectId, gradeLevel, title }: RunArgs) => {
    if (!schoolId || !userId) { setError('Must be signed in as a school admin.'); setPhase('error'); return; }
    if (!subjectId || !title.trim()) { setError('Pick a subject and enter a book title.'); setPhase('error'); return; }

    setError(null);
    setBookTitle(title.trim());
    try {
      // 1. text
      setPhase('extracting-text'); setStatus('Extracting text from every page…');
      const { text, pageCount, charCount } = await extractPdfAllText(file);
      if (charCount < 200) {
        throw new Error('This PDF has almost no selectable text (it may be scanned images). Text-based parsing needs a digital PDF.');
      }
      const pagesMap = parsePages(text);
      setPages(pagesMap);

      // 2. create the document row (NO raw PDF in storage; keep text for provenance)
      setStatus('Creating document record…');
      const { data: doc, error: docErr } = await (supabase as any)
        .from('curriculum_documents')
        .insert({
          school_id: schoolId, subject_id: subjectId, grade_level: gradeLevel,
          title: title.trim(), storage_path: null, mime_type: 'application/pdf',
          page_count: pageCount, char_count: charCount, extracted_text: text,
          status: 'parsing', created_by: userId,
        })
        .select('id').single();
      if (docErr) throw new Error(`Document insert failed: ${docErr.message}`);
      const docId = doc.id as string;
      setDocumentId(docId);

      // 3. embedded images — DEFERRED to the on-demand path (see EXTRACT_IMAGES_AT_UPLOAD).
      // Production upload skips this entirely; the block below is preserved verbatim so
      // re-enabling it (or lifting it into the on-demand fetch) is a one-line flag change.
      if (EXTRACT_IMAGES_AT_UPLOAD) {
        setPhase('extracting-images'); setStatus('Extracting embedded images…');
        const extracted = await extractPdfImages(file, {
          onProgress: (done, total, kept) =>
            setStatus(`Extracting images… page ${done}/${total} (${kept} found)`),
        });

        // Upload in parallel batches instead of one-at-a-time. Filtering, dedupe and
        // the 500 cap already happened upstream in extractPdfImages — `extracted` is final.
        setPhase('uploading-images');
        const UPLOAD_CONCURRENCY = 15;
        const uploaded: ImageMeta[] = [];
        let done = 0;
        for (let start = 0; start < extracted.length; start += UPLOAD_CONCURRENCY) {
          const batch = extracted.slice(start, start + UPLOAD_CONCURRENCY);
          const results = await Promise.all(batch.map(async (img) => {
            const path = `${schoolId}/${docId}/images/${img.page}-${img.index}.png`;
            const { error: upErr } = await supabase.storage
              .from('curriculum-docs')
              .upload(path, img.blob, { contentType: 'image/png', upsert: true });
            done++;
            setStatus(`Uploaded ${done}/${extracted.length} images…`);
            if (upErr) {
              // One bad image shouldn't sink the whole import — skip and continue.
              console.warn('Image upload failed, skipping:', path, upErr.message);
              return null;
            }
            return {
              page: img.page, storage_path: path, width: img.width, height: img.height,
              previewUrl: URL.createObjectURL(img.blob),
            } as ImageMeta;
          }));
          for (const r of results) if (r) uploaded.push(r);
        }
        setImages(uploaded);
      }

      // 4. detect TOC + offset solve (existing edge function, unchanged)
      setPhase('detecting'); setStatus('Detecting table of contents & mapping pages…');
      const { data: tocData, error: fnErr } = await supabase.functions.invoke('detect-curriculum-toc', {
        body: { documentId: docId, text, pageCount },
      });
      if (fnErr) {
        let msg = fnErr.message || 'TOC detection failed';
        try { const j = await (fnErr as any)?.context?.json?.(); if (j?.error) msg = j.error; } catch { /* ignore */ }
        throw new Error(msg);
      }
      const tocMap = tocData?.toc_map ?? tocData;
      if (tocData?.jobId) setJobId(tocData.jobId);

      // 5. editable tree
      setTree(buildTreeFromTocMap(tocMap, pageCount));
      setPhase('ready'); setStatus(`Detected ${tocMap?.entries?.length ?? 0} sections across ${pageCount} pages.`);
    } catch (e: any) {
      setError(e?.message || 'Import failed'); setPhase('error'); setStatus('');
    }
  }, [schoolId, userId]);

  // Build the materialize payload from the (possibly admin-edited) tree, slicing
  // content + linking images by each lesson's CURRENT page range.
  const approve = useCallback(async (publish: boolean): Promise<string | null> => {
    if (!tree || !documentId) { setError('Nothing to publish yet.'); return null; }
    setPhase('publishing'); setStatus(publish ? 'Publishing curriculum…' : 'Saving draft…'); setError(null);
    try {
      const payload = {
        document_id: documentId,
        job_id: jobId,
        title: bookTitle,
        publish,
        units: tree.units.map((u) => ({
          title: u.title,
          start_page: u.start_page,
          end_page: u.end_page,
          confidence: u.confidence,
          lessons: u.lessons.map((l) => ({
            title: l.title,
            start_page: l.start_page,
            end_page: l.end_page,
            confidence: l.confidence,
            source_pages: `${l.start_page}-${l.end_page}`,
            content: (l.content && l.content.trim()) ? l.content : sliceContent(pages, l.start_page, l.end_page),
            images: images
              .filter((img) => img.page >= l.start_page && img.page <= l.end_page)
              .map((img) => ({ storage_path: img.storage_path, page_number: img.page, width: img.width, height: img.height })),
          })),
        })),
      };

      const { data, error: rpcErr } = await (supabase as any).rpc('materialize_curriculum', { p: payload });
      if (rpcErr) throw new Error(rpcErr.message);
      setPhase('done'); setStatus(publish ? 'Published.' : 'Draft saved.');
      return (data as string) ?? null;
    } catch (e: any) {
      setError(e?.message || 'Publish failed'); setPhase('ready'); setStatus('');
      return null;
    }
  }, [tree, documentId, jobId, bookTitle, pages, images]);

  // Lets the review UI show/prefill the text a lesson's page range currently covers.
  const getContent = useCallback(
    (start: number, end: number) => sliceContent(pages, start, end),
    [pages],
  );

  return {
    schoolId, userId,
    phase, status, error,
    tree, setTree, images, bookTitle,
    run, approve, reset, getContent,
  };
}
