// Curriculum text segmentation — lifted verbatim from parse-curriculum-document
// so retrieval and ingestion use the same boundary logic. (The parser keeps its
// own copy untouched; this is the shared home for reuse going forward.)

export const CHUNK_CHAR_BUDGET = 28000; // ~7k tokens of source text per chunk
export const MAX_CHUNKS = 12;

// Split full text into chapter-ish segments at detected headings, keeping each
// heading attached to its body. Falls back to page-marker boundaries when the
// document has no recognizable headings.
export function splitIntoSegments(text: string): string[] {
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
export function packChunks(segments: string[]): string[] {
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
