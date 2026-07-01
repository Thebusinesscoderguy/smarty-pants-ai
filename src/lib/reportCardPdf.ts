import jsPDF from 'jspdf';
import { ReportCardData as RichReportCardData, ReportCardSubjectRow, termDisplayLabel } from './reportCardData';
import { CONVERSION_TABLE, EFFORT_LEGEND } from './gradeScale';
import { loadReportCardAssets, RasterImage } from './reportCardLogos';

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

const letterGrade = (pct: number) => pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : pct >= 60 ? 'D' : 'F';

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
}

const GRID_COLS: GridCol[] = [
  { key: 'no', header: 'NO', w: 7, rot: false, text: true },
  { key: 'subject', header: 'SUBJECT', w: 42, rot: false, text: true, left: true },
  { key: 'exams', header: 'Exams', w: 12, rot: true },
  { key: 'quizzes', header: 'Quizzes', w: 12, rot: true },
  { key: 'homework', header: 'Homework', w: 12, rot: true },
  { key: 'classwork', header: 'Classwork', w: 12, rot: true },
  { key: 'projects', header: 'Projects', w: 12, rot: true },
  { key: 'attendance', header: 'Attendance', w: 12, rot: true },
  { key: 'literacy', header: 'Literacy', w: 12, rot: true },
  { key: 'termTotal', header: 'Term Total', w: 13, rot: true },
  { key: 'termPct', header: 'Term%', w: 12, rot: true },
  { key: 'letter', header: 'Grade Letter', w: 12, rot: true, text: true },
  { key: 'effort', header: 'Effort', w: 11, rot: true, text: true },
  { key: 'endYear', header: 'End Year', w: 12, rot: true },
  { key: 'endYearLetter', header: 'End Year Grade', w: 13, rot: true, text: true },
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
  const accent = hexToRgb(settings?.accent_color || '#1f3b73');
  const assets = await loadReportCardAssets(settings?.header_logo_url);

  // ---- Header ---------------------------------------------------------------------------
  if (assets.schoolLogo) drawImageFit(doc, assets.schoolLogo, MARGIN, 6, 44, 18, 'left');

  let rx = PAGE_W - MARGIN;
  for (const logo of [...assets.accreditation].reverse()) {
    const ratio = Math.min(20 / logo.width, 16 / logo.height);
    const w = logo.width * ratio;
    drawImageFit(doc, logo, rx, 6, 20, 16, 'right');
    rx -= w + 3;
  }

  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
  doc.text(settings?.school_name || 'School Report Card', PAGE_W / 2, 12, { align: 'center' });
  doc.setTextColor(30, 30, 30); doc.setFontSize(11);
  doc.text('Term Report Card', PAGE_W / 2, 18, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text(data.student_line || card.name, PAGE_W / 2, 23.5, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text(data.grade_label || '', PAGE_W / 2, 28.5, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(90, 90, 90);
  doc.text(`${termDisplayLabel(card.term)} · ${card.academic_year}`, MARGIN, 31);

  // ---- Grid -----------------------------------------------------------------------------
  const gridX = MARGIN;
  const headerTop = 34;
  const headerH = 24;
  const rowH = 7;
  const gridW = GRID_COLS.reduce((s, c) => s + c.w, 0);

  // Header band
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(gridX, headerTop, gridW, headerH, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  let cx = gridX;
  for (const col of GRID_COLS) {
    const center = cx + col.w / 2;
    if (col.rot) {
      doc.text(col.header, center + 1.3, headerTop + headerH - 2, { angle: 90 });
    } else {
      doc.setFont('helvetica', 'bold');
      doc.text(col.header, center, headerTop + headerH - 3, { align: 'center' });
      doc.setFont('helvetica', 'normal');
    }
    cx += col.w;
  }

  // Rows
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(7.5);
  let ry = headerTop + headerH;
  const subjects = data.subjects || [];
  subjects.forEach((row, i) => {
    if (i % 2 === 1) { doc.setFillColor(244, 246, 250); doc.rect(gridX, ry, gridW, rowH, 'F'); }
    let colX = gridX;
    for (const col of GRID_COLS) {
      const raw = (row as any)[col.key];
      const value = col.text ? (raw ?? '') : fmt(raw as number);
      const center = colX + col.w / 2;
      const midY = ry + rowH / 2 + 1.2;
      if (col.left) {
        const clipped = doc.splitTextToSize(String(value), col.w - 3)[0] ?? '';
        doc.text(clipped, colX + 2, midY);
      } else {
        doc.text(String(value), center, midY, { align: 'center' });
      }
      colX += col.w;
    }
    ry += rowH;
  });

  // Grid borders
  doc.setDrawColor(200, 205, 215);
  doc.setLineWidth(0.15);
  const gridBottom = ry;
  let lineX = gridX;
  for (let i = 0; i <= GRID_COLS.length; i++) {
    doc.line(lineX, headerTop, lineX, gridBottom);
    if (i < GRID_COLS.length) lineX += GRID_COLS[i].w;
  }
  for (let yy = headerTop + headerH; yy <= gridBottom; yy += rowH) doc.line(gridX, yy, gridX + gridW, yy);
  doc.setDrawColor(accent[0], accent[1], accent[2]); doc.setLineWidth(0.4);
  doc.rect(gridX, headerTop, gridW, gridBottom - headerTop);

  // Term comment under the grid (page 1)
  let ty = gridBottom + 6;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text(`${termDisplayLabel(card.term)} Comment`, gridX, ty);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 40); doc.setFontSize(8.5);
  const tc = doc.splitTextToSize(data.termComment || '—', gridW);
  doc.text(tc, gridX, ty + 4.5);

  // ---- Right sidebar --------------------------------------------------------------------
  const sx = gridX + gridW + 4;
  const sw = PAGE_W - MARGIN - sx;
  let sy = headerTop;

  // Score Card
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(sx, sy, sw, 7, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('Score Card', sx + sw / 2, sy + 5, { align: 'center' });
  sy += 7;
  doc.setDrawColor(200, 205, 215); doc.setLineWidth(0.2);
  doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  const scRows: [string, string][] = [
    ['Average', fmt(data.overall)],
    ['Grade Letter', data.scoreCardLetter || ''],
  ];
  for (const [k, v] of scRows) {
    doc.rect(sx, sy, sw, 7);
    doc.text(k, sx + 2, sy + 5);
    doc.setFont('helvetica', 'bold'); doc.text(v, sx + sw - 2, sy + 5, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    sy += 7;
  }

  // Conversion Table
  sy += 4;
  doc.setFillColor(accent[0], accent[1], accent[2]); doc.rect(sx, sy, sw, 6, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text('Conversion Table', sx + sw / 2, sy + 4.2, { align: 'center' });
  sy += 6;
  const c1 = sx, c2 = sx + sw * 0.5, c3 = sx + sw * 0.78;
  doc.setTextColor(60, 60, 60); doc.setFontSize(6.6);
  doc.rect(sx, sy, sw, 5);
  doc.text('Percentage', c1 + 1.5, sy + 3.4);
  doc.text('Letter', c2 + 1, sy + 3.4);
  doc.text('GPA', c3 + 1, sy + 3.4);
  sy += 5;
  doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 30, 30);
  const convRowH = 4.6;
  for (const b of CONVERSION_TABLE) {
    doc.rect(sx, sy, sw, convRowH);
    doc.text(b.range, c1 + 1.5, sy + 3.1);
    doc.text(b.letter, c2 + 1, sy + 3.1);
    doc.text(String(b.gpa), c3 + 1, sy + 3.1);
    sy += convRowH;
  }

  // Effort / behavior legend
  sy += 4;
  doc.setFillColor(accent[0], accent[1], accent[2]); doc.rect(sx, sy, sw, 6, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text('Effort / Behavior', sx + sw / 2, sy + 4.2, { align: 'center' });
  sy += 6;
  doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.8);
  for (const e of EFFORT_LEGEND) {
    doc.rect(sx, sy, sw, convRowH);
    doc.setFont('helvetica', 'bold'); doc.text(e.code, c1 + 1.5, sy + 3.1);
    doc.setFont('helvetica', 'normal'); doc.text(e.description, c2 - 6, sy + 3.1);
    sy += convRowH;
  }

  drawFooter(doc, settings, 1, 2);

  // ---- Page 2: per-subject comments -----------------------------------------------------
  doc.addPage();
  doc.setTextColor(accent[0], accent[1], accent[2]); doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
  doc.text('Teacher Comments', MARGIN, 16);
  const subjW = 55;
  const commW = PAGE_W - 2 * MARGIN - subjW;
  let py = 22;
  doc.setFillColor(accent[0], accent[1], accent[2]); doc.rect(MARGIN, py, subjW + commW, 7, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(9);
  doc.text('Subject', MARGIN + 2, py + 5);
  doc.text('Comment', MARGIN + subjW + 2, py + 5);
  py += 7;
  doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
  doc.setDrawColor(200, 205, 215); doc.setLineWidth(0.15);
  for (const row of subjects) {
    const lines = doc.splitTextToSize(row.comment || '—', commW - 4);
    const cellH = Math.max(8, lines.length * 4.2 + 3);
    if (py + cellH > PAGE_H - 14) { drawFooter(doc, settings, 2, 2); doc.addPage(); py = 16; }
    doc.rect(MARGIN, py, subjW, cellH);
    doc.rect(MARGIN + subjW, py, commW, cellH);
    doc.setFont('helvetica', 'bold'); doc.text(row.subject, MARGIN + 2, py + 5);
    doc.setFont('helvetica', 'normal'); doc.text(lines, MARGIN + subjW + 2, py + 5);
    py += cellH;
  }

  // Overall term comment box
  py += 6;
  doc.setFont('helvetica', 'bold'); doc.setTextColor(accent[0], accent[1], accent[2]); doc.setFontSize(10);
  doc.text(`${termDisplayLabel(card.term)} Comment`, MARGIN, py);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 40); doc.setFontSize(9);
  const overallLines = doc.splitTextToSize(data.termComment || '—', PAGE_W - 2 * MARGIN);
  doc.text(overallLines, MARGIN, py + 5);

  drawFooter(doc, settings, 2, 2);
}

const drawFooter = (doc: jsPDF, settings: any, page: number, total: number) => {
  doc.setFontSize(8); doc.setTextColor(130, 130, 130); doc.setFont('helvetica', 'normal');
  if (settings?.footer_text) doc.text(String(settings.footer_text), PAGE_W / 2, PAGE_H - 5, { align: 'center', maxWidth: PAGE_W - 40 });
  doc.text(`Page ${page} of ${total}`, PAGE_W - MARGIN, PAGE_H - 5, { align: 'right' });
};
