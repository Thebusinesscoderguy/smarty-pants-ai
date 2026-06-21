// Per-page embedded-image extraction for curriculum PDFs (client-side).
//
// Companion to pdfExtractText.ts. Walks every page's operator list, pulls the
// embedded raster image XObjects (and inline images), encodes each to a PNG blob
// via canvas, and tags it with the page it came from so downstream code can link
// it to whichever lesson's page-range contains that page.
//
// Tradeoffs (chosen deliberately — see plan): this pulls real embedded photos but
// NOT vector/SVG diagrams, and raw PDFs often contain decorative fragments, rules,
// and duplicates. We therefore filter by a minimum pixel area and de-duplicate by
// a cheap content signature, and cap the total so a 500-page book can't explode
// into thousands of uploads.

export interface ExtractedImage {
  page: number;        // 1-based PDF page the image appears on
  index: number;       // running index across the whole document (stable order)
  blob: Blob;          // image/png
  width: number;
  height: number;
  hash: string;        // signature used for de-duplication
}

export interface ExtractImagesOptions {
  /** Minimum width*height (in px) to keep — filters out rules, bullets, tiny decorations. */
  minPixels?: number;
  /** Hard cap on number of images returned (protects against huge books). */
  maxImages?: number;
  /** Progress callback: (pagesDone, pageCount, imagesKept). */
  onProgress?: (pagesDone: number, pageCount: number, imagesKept: number) => void;
}

// Cheap signature: dimensions + a sparse sample of the RGBA bytes. Identical
// repeated assets (headers, watermarks) collapse to the same key without the cost
// of hashing megabytes per image.
function signature(width: number, height: number, data: Uint8ClampedArray | Uint8Array): string {
  let acc = 0x811c9dc5;
  const step = Math.max(1, Math.floor(data.length / 512)); // ~512 samples
  for (let i = 0; i < data.length; i += step) {
    acc ^= data[i];
    acc = Math.imul(acc, 0x01000193);
  }
  return `${width}x${height}:${(acc >>> 0).toString(16)}`;
}

// Resolve a pdfjs image object to { width, height, rgba } regardless of which
// internal representation this build hands back (ImageBitmap, {data}, or canvas).
async function toRgbaCanvas(
  img: any,
): Promise<{ canvas: HTMLCanvasElement; data: Uint8ClampedArray } | null> {
  if (!img) return null;
  const width = img.width ?? img.bitmap?.width;
  const height = img.height ?? img.bitmap?.height;
  if (!width || !height) return null;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Case 1: an ImageBitmap (or canvas/image) we can draw directly.
  const drawable = img.bitmap ?? img;
  if (typeof ImageBitmap !== 'undefined' && drawable instanceof ImageBitmap) {
    ctx.drawImage(drawable, 0, 0);
  } else if (drawable instanceof HTMLCanvasElement || drawable instanceof HTMLImageElement) {
    ctx.drawImage(drawable, 0, 0);
  } else if (img.data) {
    // Case 2: raw pixel buffer. pdfjs may give RGB (3) or RGBA (4) bytes.
    const src: Uint8Array | Uint8ClampedArray = img.data;
    const channels = src.length / (width * height);
    const out = ctx.createImageData(width, height);
    if (channels === 4) {
      out.data.set(src);
    } else if (channels === 3) {
      for (let i = 0, j = 0; i < src.length; i += 3, j += 4) {
        out.data[j] = src[i];
        out.data[j + 1] = src[i + 1];
        out.data[j + 2] = src[i + 2];
        out.data[j + 3] = 255;
      }
    } else if (channels === 1) {
      for (let i = 0, j = 0; i < src.length; i += 1, j += 4) {
        out.data[j] = out.data[j + 1] = out.data[j + 2] = src[i];
        out.data[j + 3] = 255;
      }
    } else {
      return null;
    }
    ctx.putImageData(out, 0, 0);
  } else {
    return null;
  }

  const data = ctx.getImageData(0, 0, width, height).data;
  return { canvas, data };
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to encode extracted image'))),
      'image/png',
    );
  });
}

export async function extractPdfImages(
  pdfFile: File,
  opts: ExtractImagesOptions = {},
): Promise<ExtractedImage[]> {
  const { minPixels = 5000, maxImages = 500, onProgress } = opts;

  const arrayBuffer = await pdfFile.arrayBuffer();
  // Same legacy build + worker wiring as pdfExtractText.ts / pdfFirstPageToImage.ts.
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/legacy/build/pdf.worker.mjs',
    import.meta.url,
  ).toString();
  const OPS = (pdfjsLib as any).OPS;

  const pdf = await (pdfjsLib as any).getDocument({ data: arrayBuffer }).promise;
  const pageCount = pdf.numPages;

  const results: ExtractedImage[] = [];
  const seen = new Set<string>();
  let index = 0;

  for (let n = 1; n <= pageCount && results.length < maxImages; n++) {
    const page = await pdf.getPage(n);
    const opList = await page.getOperatorList();

    // Collect the image-object names referenced on this page.
    const keys: string[] = [];
    for (let i = 0; i < opList.fnArray.length; i++) {
      const fn = opList.fnArray[i];
      if (fn === OPS.paintImageXObject || fn === OPS.paintJpegXObject || fn === OPS.paintImageXObjectRepeat) {
        const name = opList.argsArray[i]?.[0];
        if (typeof name === 'string') keys.push(name);
      }
    }

    for (const key of keys) {
      if (results.length >= maxImages) break;
      // Image objects live on page.objs; some shared ones on commonObjs.
      let imgObj: any = null;
      try {
        imgObj = await new Promise((resolve) => {
          try {
            if (page.objs.has(key)) page.objs.get(key, resolve);
            else if (pdf.commonObjs?.has?.(key)) pdf.commonObjs.get(key, resolve);
            else resolve(null);
          } catch {
            resolve(null);
          }
        });
      } catch {
        imgObj = null;
      }

      const rendered = await toRgbaCanvas(imgObj);
      if (!rendered) continue;
      const { canvas, data } = rendered;
      if (canvas.width * canvas.height < minPixels) continue;

      const hash = signature(canvas.width, canvas.height, data);
      if (seen.has(hash)) continue;
      seen.add(hash);

      const blob = await canvasToPng(canvas);
      results.push({ page: n, index: index++, blob, width: canvas.width, height: canvas.height, hash });
    }

    // Free retained page resources before moving on (large books).
    page.cleanup();
    onProgress?.(n, pageCount, results.length);
  }

  return results;
}
