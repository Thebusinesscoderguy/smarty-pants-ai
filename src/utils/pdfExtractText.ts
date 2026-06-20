// All-pages text extraction for curriculum PDFs.
//
// Extends the existing pdfjs setup (see pdfFirstPageToImage.ts) BEYOND page-1-only:
// it loops every page, pulls the text layer, and inserts "===== PAGE n =====" markers
// between pages so downstream splitting can cite source pages.
//
// charCount (non-whitespace, excluding the markers) is returned so the caller / edge
// function can detect a scanned / image-only PDF (no text layer) and fail loudly
// instead of silently producing an empty split.

export interface PdfExtractResult {
  text: string;       // full text with page markers
  pageCount: number;
  charCount: number;  // non-whitespace chars of actual content
}

export async function extractPdfAllText(pdfFile: File): Promise<PdfExtractResult> {
  const arrayBuffer = await pdfFile.arrayBuffer();

  // Dynamic import the legacy build to avoid React/Vite conflicts (same as pdfFirstPageToImage).
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/legacy/build/pdf.worker.mjs',
    import.meta.url
  ).toString();

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;

  const parts: string[] = [];
  for (let n = 1; n <= pageCount; n++) {
    const page = await pdf.getPage(n);
    const content = await page.getTextContent();
    const pageText = (content.items as any[])
      .map((it) => (typeof it?.str === 'string' ? it.str : ''))
      .join(' ')
      .replace(/[ \t]+/g, ' ')
      .trim();
    parts.push(`===== PAGE ${n} =====\n${pageText}`);
  }

  const text = parts.join('\n\n').trim();
  const charCount = text
    .replace(/===== PAGE \d+ =====/g, '')
    .replace(/\s+/g, '')
    .length;

  return { text, pageCount, charCount };
}
