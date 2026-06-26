import {
  LayoutGrid, CalendarCheck, GraduationCap, MessageSquare, BookOpen,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

/* ============================================================
   TeachlyAI — Hero dashboard mockup
   A stylized, idealized product screen (NOT a real screenshot,
   NOT abstract art). Decorative only — fake data, no routes.
   Brand tokens from .teachly-lp (src/index.css):
     #7C3AED violet · #A855F7 purple · #6366F1 indigo
   Sits inside the browser frame in Hero.tsx; keeps the same
   1877/1030 panel aspect so the hero layout doesn't shift.

   ── TWEAK HERE ─────────────────────────────────────────────
   Edit the NAV / GRADES / MESSAGES arrays and ATTENDANCE below
   to change the fake content. Keep it sparse — "calm" is the brief.
   ============================================================ */

const NAV = [
  { icon: LayoutGrid, labelKey: 'lpm.overview', active: true },
  { icon: CalendarCheck, labelKey: 'lpm.attendance' },
  { icon: GraduationCap, labelKey: 'lpm.grades' },
  { icon: MessageSquare, labelKey: 'lpm.messages' },
  { icon: BookOpen, labelKey: 'lpm.curriculum' },
];

const ATTENDANCE = 96; // % present today (drives the donut)

const GRADES = [
  { name: 'Amelia Rivera', subjectKey: 'lpm.subjMath', mark: 'A' },
  { name: 'Noah Patel', subjectKey: 'lpm.subjScience', mark: 'A−' },
  { name: 'Liam Chen', subjectKey: 'lpm.subjEnglish', mark: 'B+' },
];

const MESSAGES = [
  { from: 'Mr. Daniels', textKey: 'lpm.msg1', time: '2m' },
  { from: 'PTA Group', textKey: 'lpm.msg2', time: '1h' },
];

const INK = 'hsl(250_47%_11%)';
const MUTED = 'hsl(245_16%_55%)';

/* soft, calm card surface — matches the page's radius + shadow language */
const CARD =
  'rounded-2xl border border-violet-100/70 bg-white p-3 shadow-[0_10px_30px_-18px_rgba(91,33,182,0.25)]';

const initials = (name: string) =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

/* attendance donut, brand-gradient stroke */
function Donut({ value }: { value: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const off = c * (1 - value / 100);
  return (
    <svg viewBox="0 0 80 80" className="h-14 w-14 shrink-0">
      <defs>
        <linearGradient id="dm-donut" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      <circle cx="40" cy="40" r={r} fill="none" stroke="#EDE7FF" strokeWidth="9" />
      <circle
        cx="40" cy="40" r={r} fill="none" stroke="url(#dm-donut)" strokeWidth="9"
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
        transform="rotate(-90 40 40)"
      />
      <text x="40" y="45" textAnchor="middle" fontSize="17" fontWeight="800" fill="#171034">
        {value}%
      </text>
    </svg>
  );
}

export function DashboardMockup() {
  const { t } = useLanguage();
  return (
    <div className="aspect-[1877/1030] w-full overflow-hidden bg-[#FBF9FF]">
      <div className="flex h-full">
        {/* ---- left sidebar ---- */}
        <aside className="flex w-[30%] max-w-[170px] flex-col gap-1 border-r border-violet-100/70 bg-white/70 p-3">
          {/* brand mark */}
          <div className="mb-3 flex items-center gap-2 px-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#7C3AED,#A855F7)] shadow-[0_6px_14px_-6px_rgba(124,58,237,0.7)]">
              <GraduationCap className="h-4 w-4 text-white" strokeWidth={2.4} />
            </span>
            <span className="text-[12px] font-extrabold tracking-tight text-[hsl(250_47%_11%)]">
              Teachly<span className="lp-text-gradient">AI</span>
            </span>
          </div>

          {NAV.map(({ icon: Icon, labelKey, active }) => (
            <div
              key={labelKey}
              className={
                active
                  ? 'flex items-center gap-2 rounded-lg bg-violet-50 px-2.5 py-2 text-[11px] font-semibold text-violet-700'
                  : 'flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] font-medium text-[hsl(245_16%_55%)]'
              }
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{t(labelKey)}</span>
            </div>
          ))}
        </aside>

        {/* ---- main area ---- */}
        <main className="flex flex-1 flex-col gap-3 p-4">
          {/* greeting header */}
          <div className="flex items-center justify-between">
            <div className="leading-tight">
              <p className="text-[13px] font-bold text-[hsl(250_47%_11%)]">
                {t('lpm.greeting')}
              </p>
              <p className="text-[10px] text-[hsl(245_16%_55%)]">
                {t('lpm.dateLine')}
              </p>
            </div>
            <span className="h-7 w-7 rounded-full bg-[linear-gradient(135deg,#A855F7,#6366F1)] shadow-[0_6px_14px_-6px_rgba(99,102,241,0.7)]" />
          </div>

          {/* attendance + parent messages */}
          <div className="grid grid-cols-2 gap-3">
            {/* attendance */}
            <div className={CARD}>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-[hsl(245_16%_55%)]">
                {t('lpm.attendance')}
              </p>
              <div className="mt-1.5 flex items-center gap-2.5">
                <Donut value={ATTENDANCE} />
                <div className="leading-tight">
                  <p className="text-[11px] font-semibold text-[hsl(250_47%_11%)]">{t('lpm.presentToday')}</p>
                  <p className="mt-0.5 text-[9px] text-[hsl(245_16%_55%)]">{t('lpm.vsLastWeek')}</p>
                </div>
              </div>
            </div>

            {/* parent messages */}
            <div className={CARD}>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-[hsl(245_16%_55%)]">
                {t('lpm.parentMessages')}
              </p>
              <div className="mt-2 space-y-2">
                {MESSAGES.map((m) => (
                  <div key={m.from} className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[8px] font-bold text-violet-700">
                      {initials(m.from)}
                    </span>
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="truncate text-[10px] font-semibold text-[hsl(250_47%_11%)]">{m.from}</p>
                      <p className="truncate text-[9px] text-[hsl(245_16%_55%)]">{t(m.textKey)}</p>
                    </div>
                    <span className="shrink-0 text-[9px] text-[hsl(245_16%_60%)]">{m.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* recent grades */}
          <div className={CARD}>
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-[hsl(245_16%_55%)]">
                {t('lpm.recentGrades')}
              </p>
              <span className="text-[9px] text-[hsl(245_16%_60%)]">{t('lpm.thisWeek')}</span>
            </div>
            <div className="mt-1.5 divide-y divide-violet-50">
              {GRADES.map((g) => (
                <div key={g.name} className="flex items-center gap-2 py-1.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#EDE7FF,#F6F1FF)] text-[8px] font-bold text-violet-700">
                    {initials(g.name)}
                  </span>
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-[10px] font-semibold text-[hsl(250_47%_11%)]">{g.name}</p>
                    <p className="text-[9px] text-[hsl(245_16%_55%)]">{t(g.subjectKey)}</p>
                  </div>
                  <span className="shrink-0 rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">
                    {g.mark}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
