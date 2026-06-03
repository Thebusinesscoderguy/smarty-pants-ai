import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ColumnDef, ParsedFile } from './types';

// ---------- CSV ----------
export const parseCSV = (text: string): string[][] => {
  const rows: string[][] = [];
  let cur = ''; let row: string[] = []; let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else cur += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(cur); cur = ''; }
      else if (c === '\n' || c === '\r') {
        if (cur || row.length) { row.push(cur); rows.push(row); row = []; cur = ''; }
        if (c === '\r' && text[i + 1] === '\n') i++;
      } else cur += c;
    }
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter(r => r.some(c => (c ?? '').toString().trim()));
};

export const toCSV = (cols: ColumnDef[], rows: Record<string, any>[]): string => {
  const header = cols.map(c => c.label);
  const data = rows.map(r => cols.map(c => formatCell(r[c.key])));
  return [header, ...data].map(r => r.map(escapeCsv).join(',')).join('\n');
};

const escapeCsv = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const formatCell = (v: any) => v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);

// ---------- XLSX ----------
export const parseXLSX = async (file: File): Promise<ParsedFile> => {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const arr: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
  const cleaned = arr.filter(r => Array.isArray(r) && r.some(c => String(c ?? '').trim()));
  if (!cleaned.length) return { headers: [], rows: [] };
  const headers = cleaned[0].map((h: any) => String(h ?? '').trim());
  const rows = cleaned.slice(1).map(r => {
    const o: Record<string, any> = {};
    headers.forEach((h, i) => { o[h] = r[i] ?? ''; });
    return o;
  });
  return { headers, rows };
};

export const buildXLSX = (label: string, cols: ColumnDef[], rows: Record<string, any>[]): Blob => {
  const aoa: any[][] = [cols.map(c => c.label), ...rows.map(r => cols.map(c => r[c.key] ?? ''))];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, label.slice(0, 30));
  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

export const parseCSVFile = async (file: File): Promise<ParsedFile> => {
  const text = await file.text();
  const rows = parseCSV(text);
  if (!rows.length) return { headers: [], rows: [] };
  const headers = rows[0].map(h => h.trim());
  const data = rows.slice(1).map(r => {
    const o: Record<string, any> = {};
    headers.forEach((h, i) => { o[h] = r[i] ?? ''; });
    return o;
  });
  return { headers, rows: data };
};

// ---------- PDF Export ----------
export const buildPDF = (title: string, cols: ColumnDef[], rows: Record<string, any>[]): Blob => {
  const doc = new jsPDF({ orientation: cols.length > 6 ? 'landscape' : 'portrait' });
  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleString()}`, 14, 24);
  doc.setTextColor(0);
  autoTable(doc, {
    head: [cols.map(c => c.label)],
    body: rows.map(r => cols.map(c => formatCell(r[c.key]))),
    startY: 30,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [234, 88, 12] }, // orange
    margin: { left: 10, right: 10 },
  });
  return doc.output('blob');
};

// ---------- PDF Import (best-effort table detection) ----------
export const parsePDF = async (file: File): Promise<ParsedFile> => {
  const pdfjs: any = await import('pdfjs-dist');
  try {
    // Workerless mode fallback for browser environments lacking worker
    pdfjs.GlobalWorkerOptions.workerSrc =
      `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  } catch {}
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const lines: string[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();
    // Group items by approximate Y
    const map: Record<string, string[]> = {};
    for (const it of tc.items as any[]) {
      const y = Math.round(it.transform[5]);
      map[y] = map[y] || [];
      map[y].push(it.str);
    }
    Object.keys(map)
      .map(Number).sort((a, b) => b - a)
      .forEach(y => lines.push(map[y].join('\t')));
  }
  if (!lines.length) return { headers: [], rows: [] };
  // Use first non-empty line as headers, split by 2+ spaces or tabs
  const split = (s: string) => s.split(/\t+|\s{2,}/).map(c => c.trim()).filter(Boolean);
  const headers = split(lines[0]);
  const rows = lines.slice(1)
    .map(split)
    .filter(r => r.length >= Math.min(2, headers.length))
    .map(r => {
      const o: Record<string, any> = {};
      headers.forEach((h, i) => { o[h] = r[i] ?? ''; });
      return o;
    });
  return { headers, rows };
};

// ---------- Download helper ----------
export const downloadBlob = (filename: string, blob: Blob) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const downloadText = (filename: string, text: string, mime = 'text/csv') =>
  downloadBlob(filename, new Blob([text], { type: mime }));

// ---------- Auto map columns ----------
export const autoMap = (fileHeaders: string[], cols: ColumnDef[]): Record<string, string> => {
  const map: Record<string, string> = {};
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const col of cols) {
    const target = norm(col.key);
    const targetLabel = norm(col.label);
    const found = fileHeaders.find(h => {
      const n = norm(h);
      return n === target || n === targetLabel || n.includes(target) || target.includes(n);
    });
    if (found) map[col.key] = found;
  }
  return map;
};

// ---------- Coerce cell values to expected types ----------
export const coerce = (val: any, col: ColumnDef): any => {
  if (val == null || val === '') return col.required ? '' : null;
  const s = String(val).trim();
  if (col.type === 'number') { const n = Number(s); return Number.isNaN(n) ? s : n; }
  if (col.type === 'boolean') return /^(true|1|yes|y)$/i.test(s);
  if (col.type === 'date') { const d = new Date(s); return Number.isNaN(d.getTime()) ? s : d.toISOString().split('T')[0]; }
  return s;
};
