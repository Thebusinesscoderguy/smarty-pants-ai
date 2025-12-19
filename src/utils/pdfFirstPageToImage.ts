// Utility to convert the first page of a PDF into a JPEG File (client-side)
// Used so we can run “vision” extraction on PDFs by sending an image instead.

export async function pdfFirstPageToJpegFile(pdfFile: File): Promise<File> {
  const arrayBuffer = await pdfFile.arrayBuffer();

  // Dynamic import to keep PDF code out of the main bundle until needed.
  const pdfjs = await import('pdfjs-dist');

  // Configure worker for pdfjs in Vite.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (pdfjs as any).GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();

  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);

  // Render at a reasonable scale for OCR (keeps output small but readable)
  const viewport = page.getViewport({ scale: 1.8 });
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);

  await (page.render({ canvasContext: ctx, viewport, canvas } as any) as any).promise;

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to create image from PDF'))),
      'image/jpeg',
      0.9
    );
  });

  const baseName = pdfFile.name.replace(/\.pdf$/i, '');
  return new File([blob], `${baseName}-page-1.jpg`, { type: 'image/jpeg' });
}
