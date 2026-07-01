// Shared grade scale for report cards + gradebook summary.
// Bands, letters and GPA values are taken verbatim from the school's official
// report card (see the "Conversion Table" on the reference PDF). A percentage maps
// to the first band whose lower bound it meets; bounds are the printed x.5 values,
// so 89.4 -> B+ and 89.5 -> A-.

export interface GradeBand {
  /** Inclusive lower bound of the band, on the 0-100 scale. */
  min: number;
  /** Label as printed in the conversion table, e.g. "97.5 - 100". */
  range: string;
  letter: string;
  gpa: number;
}

// Highest band first — letterFromPercent relies on descending order.
export const CONVERSION_TABLE: GradeBand[] = [
  { min: 97.5, range: '97.5 - 100', letter: 'A+', gpa: 4.0 },
  { min: 93.5, range: '93.5 - 97.4', letter: 'A', gpa: 3.9 },
  { min: 89.5, range: '89.5 - 93.4', letter: 'A-', gpa: 3.7 },
  { min: 86.5, range: '86.5 - 89.4', letter: 'B+', gpa: 3.3 },
  { min: 82.5, range: '82.5 - 86.4', letter: 'B', gpa: 3.0 },
  { min: 79.5, range: '79.5 - 82.4', letter: 'B-', gpa: 2.7 },
  { min: 76.5, range: '76.5 - 79.4', letter: 'C+', gpa: 2.3 },
  { min: 72.5, range: '72.5 - 76.4', letter: 'C', gpa: 2.0 },
  { min: 69.5, range: '69.5 - 72.4', letter: 'C-', gpa: 1.7 },
  { min: 66.5, range: '66.5 - 69.4', letter: 'D+', gpa: 1.3 },
  { min: 62.5, range: '62.5 - 66.4', letter: 'D', gpa: 1.0 },
  { min: 59.5, range: '59.5 - 62.4', letter: 'D-', gpa: 0.7 },
  { min: 0, range: '0 - 59.4', letter: 'F', gpa: 0.0 },
];

const bandForPercent = (pct: number): GradeBand => {
  const p = Number.isFinite(pct) ? pct : 0;
  // Bands are sorted high→low; the first whose lower bound we meet wins.
  return CONVERSION_TABLE.find(b => p >= b.min) ?? CONVERSION_TABLE[CONVERSION_TABLE.length - 1];
};

export const letterFromPercent = (pct: number): string => bandForPercent(pct).letter;

export const gpaFromPercent = (pct: number): number => bandForPercent(pct).gpa;

// Effort / behavior ratings, as printed in the report card legend. Ordered best→worst.
export type EffortCode = 'O' | 'VG' | 'G' | 'IS' | 'S' | 'NI' | 'U';

export const EFFORT_LEGEND: { code: EffortCode; description: string }[] = [
  { code: 'O', description: 'Outstanding' },
  { code: 'VG', description: 'Very Good' },
  { code: 'G', description: 'Good' },
  { code: 'IS', description: 'Improvement Seen' },
  { code: 'S', description: 'Satisfactory' },
  { code: 'NI', description: 'Needs Improvement' },
  { code: 'U', description: 'Unsatisfactory' },
];

export const EFFORT_CODES: EffortCode[] = EFFORT_LEGEND.map(e => e.code);
