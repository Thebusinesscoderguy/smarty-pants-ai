// Report-card header logos.
//
// The three accreditation marks (Saudi Ministry of Education, MSA-CESS, Cognia) are the
// same on every card, so they're bundled as static assets. The school's own logo is
// per-school via report_card_settings.header_logo_url; when unset we fall back to The
// World Academy mark so the header always looks complete.
//
// Everything is rasterized to a PNG data URL in the browser at render time — this handles
// SVG sources (the browser rasterizes them, preserving transparency) and avoids any
// build-time image tooling. Cross-origin logos (a school's uploaded URL) need a
// CORS-enabled host; Supabase public buckets are. Any failure resolves to null and the
// caller simply omits that logo.

import cogniaUrl from '@/assets/report-card/cognia.png';
import msaUrl from '@/assets/report-card/msa-cess.png';
import moeUrl from '@/assets/report-card/moe.svg';
import twaUrl from '@/assets/report-card/twa.svg';

export interface RasterImage { dataUrl: string; width: number; height: number; }

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const canvasToPng = (img: CanvasImageSource, w: number, h: number): RasterImage | null => {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, w, h);
  return { dataUrl: canvas.toDataURL('image/png'), width: w, height: h };
};

// SVGs often lack intrinsic width/height, which makes <img> rasterize at a browser
// default. Read the viewBox aspect and inject an explicit size so output is crisp.
const svgToPng = async (url: string, targetH: number): Promise<RasterImage | null> => {
  const res = await fetch(url);
  let svg = await res.text();
  let aspect = 1;
  const vb = svg.match(/viewBox=["']([\d.\s,-]+)["']/);
  if (vb) {
    const p = vb[1].split(/[\s,]+/).map(Number);
    if (p.length === 4 && p[2] && p[3]) aspect = p[2] / p[3];
  }
  const targetW = Math.max(1, Math.round(targetH * aspect));
  svg = svg.replace(/<svg([^>]*?)>/, (_m, attrs) => {
    const cleaned = String(attrs)
      .replace(/\swidth=["'][^"']*["']/i, '')
      .replace(/\sheight=["'][^"']*["']/i, '');
    return `<svg${cleaned} width="${targetW}" height="${targetH}">`;
  });
  const blobUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = await loadImage(blobUrl);
    return canvasToPng(img, targetW, targetH);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
};

// Rasterizing the same logo repeatedly (e.g. "download all" across a class) is wasteful —
// memoize by url+height. Data URLs are small and stable for the session.
const cache = new Map<string, Promise<RasterImage | null>>();

export const rasterizeLogo = (url: string, targetH = 220): Promise<RasterImage | null> => {
  const key = `${targetH}|${url}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const p = rasterizeLogoUncached(url, targetH);
  cache.set(key, p);
  return p;
};

const rasterizeLogoUncached = async (url: string, targetH: number): Promise<RasterImage | null> => {
  try {
    if (/\.svg(\?|$)/i.test(url)) return await svgToPng(url, targetH);
    const img = await loadImage(url);
    if (!img.naturalWidth || !img.naturalHeight) return await svgToPng(url, targetH);
    const aspect = img.naturalWidth / img.naturalHeight;
    return canvasToPng(img, Math.max(1, Math.round(targetH * aspect)), targetH);
  } catch {
    return null;
  }
};

// jsPDF's built-in fonts can't shape or bidi-order Arabic. Instead of embedding an
// Arabic font + a shaping/bidi library, we let the browser's canvas do it (it shapes
// contextual forms and lays out RTL correctly) and embed the result as a small PNG.
// Rendered at high px for crispness; caller scales to the target mm height.
export const rasterizeText = (
  text: string,
  opts: { fontPx?: number; family?: string; weight?: string; color?: string; rtl?: boolean } = {},
): RasterImage | null => {
  if (!text) return null;
  const { fontPx = 44, family = '"Segoe UI", "Tahoma", "Arial", sans-serif', weight = 'normal', color = '#111', rtl = true } = opts;
  const fontStr = `${weight} ${fontPx}px ${family}`;
  const measureCtx = document.createElement('canvas').getContext('2d');
  if (!measureCtx) return null;
  measureCtx.font = fontStr;
  const w = Math.max(1, Math.ceil(measureCtx.measureText(text).width) + Math.ceil(fontPx * 0.4));
  const h = Math.ceil(fontPx * 1.35);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.font = fontStr;
  ctx.direction = rtl ? 'rtl' : 'ltr';
  ctx.textAlign = rtl ? 'right' : 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, rtl ? w - fontPx * 0.2 : fontPx * 0.2, h / 2);
  return { dataUrl: canvas.toDataURL('image/png'), width: w, height: h };
};

export interface ReportCardAssets {
  schoolLogo: RasterImage | null;
  /** Accreditation marks, POSITIONAL: [Ministry of Education, MSA-CESS, Cognia]. A failed
   *  load leaves null in its slot so the others keep their place in the header. */
  accreditation: (RasterImage | null)[];
}

export const loadReportCardAssets = async (headerLogoUrl?: string | null): Promise<ReportCardAssets> => {
  const [school, moe, msa, cognia] = await Promise.all([
    rasterizeLogo(headerLogoUrl?.trim() || twaUrl, 200),
    rasterizeLogo(moeUrl, 200),
    rasterizeLogo(msaUrl, 200),
    rasterizeLogo(cogniaUrl, 200),
  ]);
  return {
    schoolLogo: school,
    accreditation: [moe, msa, cognia],
  };
};
