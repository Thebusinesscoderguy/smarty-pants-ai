import jsPDF from 'jspdf';

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
  const accent = hexToRgb(settings?.accent_color || '#f97316');
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
