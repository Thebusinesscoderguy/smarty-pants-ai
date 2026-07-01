import jsPDF from 'jspdf';
import { ReportCardData as RichReportCardData, ReportCardSubjectRow, termDisplayLabel } from './reportCardData';
import { CONVERSION_TABLE, EFFORT_LEGEND, letterFromPercent } from './gradeScale';
import { loadReportCardAssets, rasterizeText, RasterImage } from './reportCardLogos';

export type SectionConfig = {
  type: 'header' | 'student_info' | 'subjects_table' | 'attendance' | 'behavior' | 'comments' | 'signature';
  enabled: boolean;
  label?: string;
  show_letter?: boolean;
  show_breakdown?: boolean;
};

export type ReportCardLayout = {
  sections: SectionConfig[];
};

export const defaultLayoutConfig: ReportCardLayout = {
  sections: [
    { type: 'header', enabled: true },
    { type: 'student_info', enabled: true },
    { type: 'subjects_table', enabled: true, show_letter: true },
    { type: 'attendance', enabled: true, show_breakdown: true },
    { type: 'behavior', enabled: false },
    { type: 'comments', enabled: true, label: "Principal's Remarks" },
    { type: 'signature', enabled: true },
  ],
};

export interface ReportCardData {
  name: string;
  term: string;
  academic_year: string;
  data: {
    overall?: number;
    attendance_rate?: number | null;
    subjects?: { subject: string; avg: number }[];
    comments?: string;
    attendance_breakdown?: { present: number; absent: number; late: number; excused: number };
    student_id_display?: string;
    grade?: string;
  };
}

// Use the single shared scale everywhere (no crude 90/80/70/60 bands anywhere).
const letterGrade = (pct: number) => letterFromPercent(pct);

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export function renderReportCardToPdf(
  doc: jsPDF,
  card: ReportCardData,
  settings: any,
  layout: ReportCardLayout = defaultLayoutConfig
) {
  const accent = hexToRgb(settings?.accent_color || '#7C3AED');
  let y = 18;
  const left = 20;
  const right = 190;

  for (const section of layout.sections) {
    if (!section.enabled) continue;
    if (y > 260) { doc.addPage(); y = 18; }

    switch (section.type) {
      case 'header': {
        doc.setFontSize(18); doc.setTextColor(accent[0], accent[1], accent[2]);
        doc.text(settings?.school_name || 'School Report Card', 105, y, { align: 'center' });
        doc.setDrawColor(accent[0], accent[1], accent[2]); doc.setLineWidth(0.8);
        doc.line(left, y + 3, right, y + 3);
        doc.setTextColor(0, 0, 0); doc.setFontSize(10);
        doc.text(`Report Card · ${card.term} · ${card.academic_year}`, 105, y + 9, { align: 'center' });
        y += 18;
        break;
      }
      case 'student_info': {
        doc.setFontSize(11);
        doc.text(`Student: ${card.name}`, left, y);
        if (card.data.grade) doc.text(`Grade: ${card.data.grade}`, 110, y);
        y += 7;
        if (card.data.student_id_display) { doc.text(`ID: ${card.data.student_id_display}`, left, y); y += 7; }
        y += 2;
        break;
      }
      case 'subjects_table': {
        doc.setFontSize(13); doc.setTextColor(accent[0], accent[1], accent[2]);
        doc.text('Academic Performance', left, y);
        doc.setTextColor(0, 0, 0); doc.setFontSize(11);
        y += 7;
        doc.setFont(undefined, 'bold');
        doc.text('Subject', left, y); doc.text('Score', 150, y, { align: 'right' });
        if (section.show_letter) doc.text('Grade', right, y, { align: 'right' });
        doc.setFont(undefined, 'normal');
        doc.line(left, y + 1, right, y + 1);
        y += 6;
        (card.data.subjects || []).forEach(s => {
          if (y > 270) { doc.addPage(); y = 18; }
          doc.text(s.subject, left, y);
          doc.text(`${s.avg}%`, 150, y, { align: 'right' });
          if (section.show_letter) doc.text(letterGrade(s.avg), right, y, { align: 'right' });
          y += 6;
        });
        if (card.data.overall != null) {
          y += 2; doc.setFont(undefined, 'bold');
          doc.text(`Overall Average: ${card.data.overall}%`, left, y);
          doc.setFont(undefined, 'normal'); y += 8;
        } else y += 4;
        break;
      }
      case 'attendance': {
        doc.setFontSize(13); doc.setTextColor(accent[0], accent[1], accent[2]);
        doc.text('Attendance', left, y);
        doc.setTextColor(0, 0, 0); doc.setFontSize(11); y += 7;
        doc.text(`Attendance Rate: ${card.data.attendance_rate ?? '-'}%`, left, y); y += 6;
        const b = card.data.attendance_breakdown;
        if (section.show_breakdown && b) {
          doc.setFontSize(10); doc.setTextColor(100, 100, 100);
          doc.text(`Present: ${b.present}  ·  Absent: ${b.absent}  ·  Late: ${b.late}  ·  Excused: ${b.excused}`, left, y);
          doc.setTextColor(0, 0, 0); doc.setFontSize(11); y += 6;
        }
        y += 2;
        break;
      }
      case 'behavior': {
        doc.setFontSize(13); doc.setTextColor(accent[0], accent[1], accent[2]);
        doc.text('Conduct', left, y); doc.setTextColor(0, 0, 0); doc.setFontSize(11);
        y += 7; doc.text('Excellent', left, y); y += 8;
        break;
      }
      case 'comments': {
        doc.setFontSize(13); doc.setTextColor(accent[0], accent[1], accent[2]);
        doc.text(section.label || "Principal's Remarks", left, y);
        doc.setTextColor(0, 0, 0); doc.setFontSize(11); y += 7;
        const text = card.data.comments || '';
        const lines = doc.splitTextToSize(text, right - left);
        doc.text(lines, left, y); y += lines.length * 6 + 4;
        break;
      }
      case 'signature': {
        y = Math.max(y, 250);
        doc.setFontSize(10);
        doc.text('_________________', left, y);
        doc.text('_________________', 85, y);
        doc.text('_________________', 150, y);
        y += 5;
        doc.text(`Principal${settings?.principal_name ? ': ' + settings.principal_name : ''}`, left, y);
        doc.text('Class Teacher', 85, y);
        doc.text('Parent', 150, y);
        y += 8;
        break;
      }
    }
  }

  if (settings?.footer_text) {
    doc.setFontSize(8); doc.setTextColor(120, 120, 120);
    doc.text(settings.footer_text, 105, 290, { align: 'center', maxWidth: 170 });
  }
}

/* =========================================================================================
 * Full reference-layout report card (A4 landscape). This is what students/parents/admins
 * download. It renders the per-subject grid, the Score Card, the %→letter→GPA conversion
 * table, the effort/behavior legend, and a page-2 per-subject + term comment section, with
 * the school logo (left) and the three accreditation logos (right) in the header.
 * ======================================================================================= */

export interface ReportCardInput {
  name: string;
  term: string;
  academic_year: string;
  data: RichReportCardData;
}

const PAGE_W = 297;
const PAGE_H = 210;
const MARGIN = 8;

const fmt = (n: number | null | undefined): string =>
  n === null || n === undefined || Number.isNaN(Number(n)) ? '' : Number(n).toFixed(2);

interface GridCol {
  key: keyof ReportCardSubjectRow;
  header: string;
  w: number;
  rot: boolean;   // rotated (vertical) header
  text?: boolean; // render value as-is (letters/effort/subject) rather than a 2dp number
  left?: boolean; // left-align (subject)
  fill?: 'light' | 'dark'; // column shading (matches the reference card)
  boldData?: boolean;      // bold cell values (Term Total / Term% / Grade Letter / Effort)
  band?: boolean;          // sits under the "Term X YYYY-YYYY" band (Exams..Literacy)
}

const GRID_COLS: GridCol[] = [
  { key: 'no', header: 'NO', w: 7, rot: false, text: true },
  { key: 'subject', header: 'SUBJECT', w: 52, rot: false, text: true, left: true },
  { key: 'exams', header: 'Exams', w: 12, rot: true, band: true },
  { key: 'quizzes', header: 'Quizzes', w: 12, rot: true, band: true },
  { key: 'homework', header: 'Homework', w: 12, rot: true, band: true },
  { key: 'classwork', header: 'Classwork', w: 12, rot: true, band: true },
  { key: 'projects', header: 'Projects', w: 12, rot: true, band: true },
  { key: 'attendance', header: 'Attendance', w: 12, rot: true, band: true },
  { key: 'literacy', header: 'Literacy', w: 12, rot: true, band: true },
  { key: 'termTotal', header: 'Term Total', w: 13, rot: true, fill: 'light', boldData: true },
  { key: 'termPct', header: 'Term%', w: 12, rot: true, fill: 'light', boldData: true },
  { key: 'letter', header: 'Grade Letter', w: 12, rot: true, text: true, fill: 'light', boldData: true },
  { key: 'effort', header: 'Effort', w: 11, rot: true, text: true, fill: 'light', boldData: true },
  { key: 'endYear', header: 'End Year', w: 12, rot: true, fill: 'dark' },
  { key: 'endYearLetter', header: 'End Year Grade', w: 13, rot: true, text: true, fill: 'dark' },
];

const drawImageFit = (
  doc: jsPDF, img: RasterImage, x: number, y: number, maxW: number, maxH: number,
  align: 'left' | 'right' | 'center' = 'left',
) => {
  const ratio = Math.min(maxW / img.width, maxH / img.height);
  const w = img.width * ratio;
  const h = img.height * ratio;
  const dx = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
  doc.addImage(img.dataUrl, 'PNG', dx, y + (maxH - h) / 2, w, h);
};

const newLandscapeDoc = (): jsPDF => new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

/** Single-card PDF for one download. */
export async function generateReportCardPdf(card: ReportCardInput, settings: any): Promise<jsPDF> {
  const doc = newLandscapeDoc();
  await renderReportCard(doc, card, settings);
  return doc;
}

/** Multi-card PDF (e.g. an admin "download all"), one card's two pages after another. */
export async function generateReportCardsPdf(cards: ReportCardInput[], settings: any): Promise<jsPDF> {
  const doc = newLandscapeDoc();
  for (let i = 0; i < cards.length; i++) {
    if (i > 0) doc.addPage();
    await renderReportCard(doc, cards[i], settings);
  }
  return doc;
}

/** Draws one card (2 pages) starting on the doc's CURRENT page. */
async function renderReportCard(doc: jsPDF, card: ReportCardInput, settings: any): Promise<void> {
  const data = (card.data || {}) as RichReportCardData;
  const assets = await loadReportCardAssets(settings?.header_logo_url);

  // The reference card is monochrome: black text, thin black borders, light-gray fills on
  // the summary columns/headers and a darker gray on the End Year pair. No accent color.
  const LIGHT: [number, number, number] = [217, 217, 217];
  const DARK: [number, number, number] = [166, 166, 166];
  const BOX: [number, number, number] = [243, 243, 243];

  // ---- Header ---------------------------------------------------------------------------
  if (assets.schoolLogo) drawImageFit(doc, assets.schoolLogo, MARGIN + 2, 7, 40, 23, 'left');
  let rx = PAGE_W - MARGIN;
  for (const logo of [...assets.accreditation].reverse()) {
    const ratio = Math.min(18 / logo.width, 14 / logo.height);
    const w = logo.width * ratio;
    drawImageFit(doc, logo, rx, 7, 18, 14, 'right');
    rx -= w + 3;
  }

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(settings?.school_name || 'School Report Card', PAGE_W / 2, 14, { align: 'center' });
  doc.setFontSize(11);
  doc.text('Term Report Card', PAGE_W / 2, 19.5, { align: 'center' });
  doc.setFontSize(10);
  doc.text(data.student_line || card.name, PAGE_W / 2, 24.5, { align: 'center' });
  const rawGrade = String(data.grade_label || '');
  const gradeLabel = rawGrade && !/^g/i.test(rawGrade) ? `G${rawGrade}` : rawGrade;
  doc.text(gradeLabel, PAGE_W / 2, 29.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');

  // ---- Grid -----------------------------------------------------------------------------
  const gridX = MARGIN;
  const headerTop = 33;
  const headerH = 26;
  const bandH = 5;
  const rowH = 6;
  const gridW = GRID_COLS.reduce((s, c) => s + c.w, 0);

  // Column x positions.
  const colX: number[] = [];
  { let x = gridX; for (const c of GRID_COLS) { colX.push(x); x += c.w; } }

  // Shaded header cells (full header height) for the summary/end-year columns.
  GRID_COLS.forEach((c, i) => {
    if (!c.fill) return;
    const f = c.fill === 'dark' ? DARK : LIGHT;
    doc.setFillColor(f[0], f[1], f[2]);
    doc.rect(colX[i], headerTop, c.w, headerH, 'F');
  });

  // "Term X YYYY-YYYY" band across the mark columns (Exams..Literacy) only.
  const bandStart = colX[GRID_COLS.findIndex(c => c.band)];
  const lastBandIdx = GRID_COLS.map(c => !!c.band).lastIndexOf(true);
  const bandEnd = colX[lastBandIdx] + GRID_COLS[lastBandIdx].w;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`${termDisplayLabel(card.term)} ${card.academic_year}`, bandStart + 1.5, headerTop + 3.6);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.15);
  doc.line(bandStart, headerTop + bandH, bandEnd, headerTop + bandH);

  // Column header labels: NO/SUBJECT horizontal bold; the rest rotated bold. Band columns
  // start below the term band; the shaded summary columns use the full header height.
  doc.setFontSize(7);
  GRID_COLS.forEach((c, i) => {
    const center = colX[i] + c.w / 2;
    if (c.rot) {
      doc.text(c.header, center + 1.2, headerTop + headerH - 2, { angle: 90 });
    } else {
      doc.setFontSize(8);
      const hy = headerTop + headerH - 2.5;
      if (c.key === 'subject') doc.text(c.header, colX[i] + 2, hy);
      else doc.text(c.header, center, hy, { align: 'center' });
      doc.setFontSize(7);
    }
  });
  doc.setFont('helvetica', 'normal');

  // ---- Rows -----------------------------------------------------------------------------
  let ry = headerTop + headerH;
  const subjects = data.subjects || [];
  doc.setFontSize(7);
  for (const row of subjects) {
    GRID_COLS.forEach((c, i) => {
      if (!c.fill) return;
      const f = c.fill === 'dark' ? DARK : LIGHT;
      doc.setFillColor(f[0], f[1], f[2]);
      doc.rect(colX[i], ry, c.w, rowH, 'F');
    });
    GRID_COLS.forEach((c, i) => {
      const raw = (row as any)[c.key];
      const value = c.text ? (raw ?? '') : fmt(raw as number);
      const midY = ry + rowH / 2 + 1.1;
      if (c.left) {
        // Subject: bold English, then the Arabic name (canvas-rasterized for correct RTL
        // shaping) immediately after it, exactly like the reference card.
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        const eng = String(value);
        doc.text(eng, colX[i] + 2, midY);
        if (row.subjectAr) {
          const img = rasterizeText(row.subjectAr, { fontPx: 40, weight: 'bold' });
          if (img) {
            const engW = doc.getTextWidth(eng);
            const th = 3.4;
            let iw = img.width * (th / img.height);
            const maxIw = c.w - engW - 6;
            if (iw > maxIw) iw = Math.max(0, maxIw);
            const drawH = iw > 0 ? img.height * (iw / img.width) : 0;
            if (iw > 0) doc.addImage(img.dataUrl, 'PNG', colX[i] + 2 + engW + 2, ry + rowH / 2 - drawH / 2, iw, drawH);
          }
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
      } else {
        if (c.boldData) doc.setFont('helvetica', 'bold');
        if (c.fill === 'dark') doc.setTextColor(70, 70, 70);
        doc.text(String(value), colX[i] + c.w / 2, midY, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        if (c.boldData) doc.setFont('helvetica', 'normal');
      }
    });
    ry += rowH;
  }

  // ---- Grid borders (thin black inner, heavier outer) ------------------------------------
  const gridBottom = ry;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.15);
  GRID_COLS.forEach((_c, i) => { if (i > 0) doc.line(colX[i], headerTop, colX[i], gridBottom); });
  for (let yy = headerTop + headerH; yy < gridBottom; yy += rowH) doc.line(gridX, yy, gridX + gridW, yy);
  doc.setLineWidth(0.4);
  doc.rect(gridX, headerTop, gridW, gridBottom - headerTop);
  doc.setLineWidth(0.15);
  doc.line(gridX, headerTop + headerH, gridX + gridW, headerTop + headerH);

  // ---- Term comment box (light gray, full grid width) ------------------------------------
  const commentText = data.termComment || '';
  const commentLines = doc.splitTextToSize(commentText || ' ', gridW - 8);
  const boxH = 6 + commentLines.length * 3.6 + 2;
  const boxY = gridBottom + 5;
  doc.setFillColor(BOX[0], BOX[1], BOX[2]);
  doc.setDrawColor(190, 190, 190);
  doc.setLineWidth(0.2);
  doc.rect(gridX, boxY, gridW, boxH, 'FD');
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`${termDisplayLabel(card.term)} Comment`, gridX + 4, boxY + 4.6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(commentLines, gridX + 4, boxY + 8.6);

  // ---- Right sidebar ----------------------------------------------------------------------
  const sx = gridX + gridW + 4;
  const sw = PAGE_W - MARGIN - sx;
  let sy = headerTop;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.15);

  const sideHeader = (label: string, h = 6) => {
    doc.setFillColor(LIGHT[0], LIGHT[1], LIGHT[2]);
    doc.rect(sx, sy, sw, h, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(label, sx + sw / 2, sy + h / 2 + 1.3, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    sy += h;
  };

  // Score Card
  sideHeader('Score Card');
  const scRows: [string, string, boolean][] = [
    ['Average', fmt(data.overall), false],
    ['Grade Letter', data.scoreCardLetter || '', true],
  ];
  for (const [k, v, boldV] of scRows) {
    const labelW = sw * 0.62;
    doc.setFillColor(LIGHT[0], LIGHT[1], LIGHT[2]);
    doc.rect(sx, sy, labelW, 6, 'FD');
    doc.rect(sx + labelW, sy, sw - labelW, 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(k, sx + 2, sy + 4.2);
    doc.setFont('helvetica', boldV ? 'bold' : 'normal');
    doc.text(v, sx + labelW + (sw - labelW) / 2, sy + 4.2, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    sy += 6;
  }

  // Conversion Table (Percentage / Grade / Grade Letter / GPA — like the reference)
  sy += 3;
  sideHeader('Conversion Table');
  const cw1 = sw * 0.44, cw2 = sw * 0.17, cw3 = sw * 0.23, cw4 = sw * 0.16;
  const cx1 = sx, cx2 = sx + cw1, cx3 = cx2 + cw2, cx4 = cx3 + cw3;
  const convHdrH = 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.rect(cx1, sy, cw1, convHdrH); doc.rect(cx2, sy, cw2, convHdrH);
  doc.rect(cx3, sy, cw3, convHdrH); doc.rect(cx4, sy, cw4, convHdrH);
  doc.text('Percentage', cx1 + 1.3, sy + 4.5);
  doc.text('Grade', cx2 + cw2 / 2, sy + 4.5, { align: 'center' });
  doc.text('Grade', cx3 + cw3 / 2, sy + 3.1, { align: 'center' });
  doc.text('Letter', cx3 + cw3 / 2, sy + 5.6, { align: 'center' });
  doc.text('GPA', cx4 + cw4 / 2, sy + 4.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  sy += convHdrH;
  const convRowH = 4.4;
  doc.setFontSize(6.4);
  for (const b of CONVERSION_TABLE) {
    doc.rect(cx1, sy, cw1, convRowH); doc.rect(cx2, sy, cw2, convRowH);
    doc.rect(cx3, sy, cw3, convRowH); doc.rect(cx4, sy, cw4, convRowH);
    doc.text(b.range, cx1 + 1.3, sy + 3.0);
    doc.text(b.letter, cx2 + cw2 / 2, sy + 3.0, { align: 'center' });
    doc.text(b.letter, cx3 + cw3 / 2, sy + 3.0, { align: 'center' });
    doc.text(String(b.gpa), cx4 + 1.2, sy + 3.0);
    sy += convRowH;
  }

  // Behavior legend (worst -> best, like the reference)
  sy += 3;
  sideHeader('Conversion Table Behavior');
  const bw1 = sw * 0.42;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.rect(sx, sy, bw1, 5); doc.rect(sx + bw1, sy, sw - bw1, 5);
  doc.text('Abbreviation', sx + 1.3, sy + 3.4);
  doc.text('Description', sx + bw1 + 1.3, sy + 3.4);
  doc.setFont('helvetica', 'normal');
  sy += 5;
  doc.setFontSize(6.4);
  for (const e of [...EFFORT_LEGEND].reverse()) {
    doc.rect(sx, sy, bw1, convRowH); doc.rect(sx + bw1, sy, sw - bw1, convRowH);
    doc.text(e.code, sx + 1.3, sy + 3.0);
    doc.text(e.description, sx + bw1 + 1.3, sy + 3.0);
    sy += convRowH;
  }

  drawFooter(doc, settings, 1, 2);

  // ---- Page 2: per-subject comments -------------------------------------------------------
  doc.addPage();
  const subjW = 60;
  const commW = PAGE_W - 2 * MARGIN - subjW;
  let py = 14;
  doc.setFillColor(LIGHT[0], LIGHT[1], LIGHT[2]);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.15);
  doc.rect(MARGIN, py, subjW, 7, 'FD');
  doc.rect(MARGIN + subjW, py, commW, 7, 'FD');
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Subject', MARGIN + 2, py + 4.8);
  doc.text('Comment', MARGIN + subjW + 2, py + 4.8);
  doc.setFont('helvetica', 'normal');
  py += 7;
  doc.setFontSize(8);
  for (const row of subjects) {
    const lines = doc.splitTextToSize(row.comment || ' ', commW - 4);
    const cellH = Math.max(7, lines.length * 3.8 + 3.2);
    if (py + cellH > PAGE_H - 16) { drawFooter(doc, settings, 2, 2); doc.addPage(); py = 14; }
    doc.rect(MARGIN, py, subjW, cellH);
    doc.rect(MARGIN + subjW, py, commW, cellH);
    doc.setFont('helvetica', 'bold');
    doc.text(row.subject, MARGIN + 2, py + 4.6);
    doc.setFont('helvetica', 'normal');
    doc.text(lines, MARGIN + subjW + 2, py + 4.6);
    py += cellH;
  }

  // Overall term comment (same light box as page 1)
  py += 5;
  const p2Lines = doc.splitTextToSize(data.termComment || ' ', PAGE_W - 2 * MARGIN - 8);
  const p2BoxH = 6 + p2Lines.length * 3.6 + 2;
  doc.setFillColor(BOX[0], BOX[1], BOX[2]);
  doc.setDrawColor(190, 190, 190);
  doc.setLineWidth(0.2);
  doc.rect(MARGIN, py, PAGE_W - 2 * MARGIN, p2BoxH, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`${termDisplayLabel(card.term)} Comment`, MARGIN + 4, py + 4.6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(p2Lines, MARGIN + 4, py + 8.6);

  drawFooter(doc, settings, 2, 2);
}

const drawFooter = (doc: jsPDF, settings: any, page: number, total: number) => {
  doc.setFontSize(8); doc.setTextColor(130, 130, 130); doc.setFont('helvetica', 'normal');
  if (settings?.footer_text) doc.text(String(settings.footer_text), PAGE_W / 2, PAGE_H - 5, { align: 'center', maxWidth: PAGE_W - 40 });
  doc.text(`Page ${page} of ${total}`, PAGE_W - MARGIN, PAGE_H - 5, { align: 'right' });
  doc.setTextColor(0, 0, 0);
};
