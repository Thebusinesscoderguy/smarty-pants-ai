import { motion, useReducedMotion } from 'framer-motion';
import {
  CalendarCheck, Brain, MessageSquare, BarChart3,
  Sparkles, FileText, ArrowUpRight, Check, Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reveal, StaggerGroup, staggerItem, EASE } from './primitives';

type FeatureKind = 'quiz' | 'attendance' | 'analytics' | 'messaging' | 'report';

type Feature = {
  icon: React.ElementType;
  kind: FeatureKind;
  title: string;
  body: string;
  className: string; // grid span
  accent: string;    // icon tint bg
  span?: boolean;    // large card
};

const FEATURES: Feature[] = [
  {
    icon: Brain,
    kind: 'quiz',
    title: 'AI lesson & quiz builder',
    body: 'Generate standards-aligned lessons, worksheets and adaptive quizzes in seconds. Teachers edit, never start from scratch.',
    className: 'md:col-span-2 md:row-span-2',
    accent: 'from-violet-500 to-indigo-500',
    span: true,
  },
  {
    icon: CalendarCheck,
    kind: 'attendance',
    title: 'Smart attendance',
    body: 'One-tap roll call with auto-alerts to parents for absences.',
    className: 'md:col-span-1',
    accent: 'from-emerald-500 to-teal-500',
  },
  {
    icon: BarChart3,
    kind: 'analytics',
    title: 'Live analytics',
    body: 'Spot at-risk students early with predictive insights.',
    className: 'md:col-span-1',
    accent: 'from-fuchsia-500 to-pink-500',
  },
  {
    icon: MessageSquare,
    kind: 'messaging',
    title: 'Unified messaging',
    body: 'Parents, teachers and admin in one secure inbox — translated automatically.',
    className: 'md:col-span-2',
    accent: 'from-sky-500 to-indigo-500',
  },
  {
    icon: FileText,
    kind: 'report',
    title: 'Report cards',
    body: 'Auto-compiled, branded PDFs in a click.',
    className: 'md:col-span-1',
    accent: 'from-amber-500 to-orange-500',
  },
];

/* ============================================================
   FeatureVisual — tasteful, CSS/SVG-drawn UI sketches.
   Purely abstract product mockups (no real data/screenshots),
   kept in the landing's purple/lavender palette.
   ============================================================ */

/** little reusable skeleton "text" line */
function Bar({ w = 'w-full', tone = 'bg-violet-100' }: { w?: string; tone?: string }) {
  return <span className={cn('block h-1.5 rounded-full', w, tone)} />;
}

function QuizVisual() {
  const reduce = useReducedMotion();
  const options = [
    { correct: false },
    { correct: true },
    { correct: false },
  ];
  return (
    <div className="rounded-2xl border border-violet-100 bg-white/80 p-4 shadow-[0_12px_40px_-24px_rgba(124,58,237,0.45)]">
      {/* prompt chip */}
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-600">
          <Sparkles className="h-3 w-3" /> Generated
        </span>
        <span className="flex-1" />
        <span className="text-[11px] font-medium text-violet-300">Question 1</span>
      </div>
      {/* question lines */}
      <div className="space-y-1.5">
        <Bar w="w-4/5" tone="bg-violet-200" />
        <Bar w="w-3/5" tone="bg-violet-100" />
      </div>
      {/* answer options */}
      <div className="mt-4 space-y-2">
        {options.map((o, i) => (
          <motion.div
            key={i}
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.45, ease: EASE }}
            className={cn(
              'flex items-center gap-2.5 rounded-xl border px-3 py-2',
              o.correct
                ? 'border-violet-300 bg-gradient-to-r from-violet-50 to-indigo-50'
                : 'border-violet-100 bg-white',
            )}
          >
            <span
              className={cn(
                'flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                o.correct ? 'bg-gradient-to-br from-violet-500 to-indigo-500 text-white' : 'border border-violet-200',
              )}
            >
              {o.correct && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>
            <Bar w={o.correct ? 'w-1/2' : i === 0 ? 'w-2/3' : 'w-3/5'} tone={o.correct ? 'bg-violet-300' : 'bg-violet-100'} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AttendanceVisual() {
  const rows = [true, true, false, true];
  return (
    <div className="rounded-2xl border border-violet-100 bg-white/80 p-3.5">
      {rows.map((present, i) => (
        <div
          key={i}
          className={cn('flex items-center gap-2.5 py-1.5', i > 0 && 'border-t border-violet-50')}
        >
          <span className="h-6 w-6 shrink-0 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100" />
          <Bar w={['w-2/3', 'w-1/2', 'w-3/5', 'w-2/5'][i]} tone="bg-violet-100" />
          <span className="flex-1" />
          <span
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-md',
              present
                ? 'bg-gradient-to-br from-violet-500 to-indigo-500 text-white'
                : 'border border-dashed border-violet-200 text-violet-300',
            )}
          >
            {present ? <Check className="h-3 w-3" strokeWidth={3} /> : <span className="text-[10px] font-bold">–</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

function AnalyticsVisual() {
  const reduce = useReducedMotion();
  // smooth upward trend line drawn as SVG
  const pts = '4,40 20,34 36,36 52,24 68,28 84,14 100,9';
  return (
    <div className="rounded-2xl border border-violet-100 bg-white/80 p-3.5">
      <div className="relative h-[58px] w-full">
        <svg viewBox="0 0 104 48" className="h-full w-full overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lpAnalyticsLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
            <linearGradient id="lpAnalyticsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(124,58,237,0.18)" />
              <stop offset="100%" stopColor="rgba(124,58,237,0)" />
            </linearGradient>
          </defs>
          {/* baseline ticks */}
          {[12, 36, 60, 84].map((x) => (
            <line key={x} x1={x} y1="2" x2={x} y2="46" stroke="rgba(124,58,237,0.06)" strokeWidth="1" />
          ))}
          <polygon points={`4,48 ${pts} 100,48`} fill="url(#lpAnalyticsFill)" />
          <motion.polyline
            points={pts}
            fill="none"
            stroke="url(#lpAnalyticsLine)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduce ? { opacity: 1 } : { pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease: EASE }}
          />
          <circle cx="100" cy="9" r="3" fill="#7C3AED" />
        </svg>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-violet-500" />
        <Bar w="w-1/3" tone="bg-violet-100" />
        <span className="flex-1" />
        <Bar w="w-12" tone="bg-violet-100" />
      </div>
    </div>
  );
}

function MessagingVisual() {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white/80 p-3.5">
      <div className="space-y-2.5">
        {/* incoming */}
        <div className="flex items-end gap-2">
          <span className="h-6 w-6 shrink-0 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100" />
          <div className="max-w-[60%] rounded-2xl rounded-bl-sm bg-violet-50 px-3 py-2">
            <Bar w="w-24" tone="bg-violet-200" />
          </div>
        </div>
        {/* outgoing */}
        <div className="flex items-end justify-end gap-2">
          <div className="max-w-[60%] rounded-2xl rounded-br-sm bg-gradient-to-br from-violet-500 to-indigo-500 px-3 py-2">
            <Bar w="w-20" tone="bg-white/70" />
          </div>
        </div>
      </div>
      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-600">
        <Globe className="h-3 w-3" /> Auto-translated
      </div>
    </div>
  );
}

function ReportVisual() {
  const rows = ['A', 'A', 'B'];
  return (
    <div className="rounded-2xl border border-violet-100 bg-white/80 p-3.5">
      <div className="mb-2.5 flex items-center gap-2 border-b border-violet-50 pb-2">
        <FileText className="h-3.5 w-3.5 text-violet-400" />
        <Bar w="w-1/3" tone="bg-violet-200" />
      </div>
      {rows.map((g, i) => (
        <div key={i} className="flex items-center gap-2 py-1">
          <Bar w={['w-1/2', 'w-2/5', 'w-3/5'][i]} tone="bg-violet-100" />
          <span className="flex-1" />
          <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-indigo-500 px-1 text-[11px] font-bold text-white">
            {g}
          </span>
        </div>
      ))}
    </div>
  );
}

function FeatureVisual({ kind }: { kind: FeatureKind }) {
  switch (kind) {
    case 'quiz': return <QuizVisual />;
    case 'attendance': return <AttendanceVisual />;
    case 'analytics': return <AnalyticsVisual />;
    case 'messaging': return <MessagingVisual />;
    case 'report': return <ReportVisual />;
  }
}

function FeatureCard({ f }: { f: Feature }) {
  const reduce = useReducedMotion();
  const Icon = f.icon;
  return (
    <motion.article
      variants={staggerItem}
      whileHover={reduce ? undefined : { y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={cn(
        'lp-gradient-border group relative flex flex-col overflow-hidden rounded-3xl p-6 sm:p-7',
        'shadow-[0_18px_50px_-30px_rgba(91,33,182,0.35)] backdrop-blur',
        f.className,
      )}
    >
      {/* hover spotlight wash */}
      <div className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(124,58,237,0.07),transparent_55%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative z-10 flex h-full flex-col">
        {/* animated icon tile */}
        <motion.span
          whileHover={reduce ? undefined : { rotate: -8, scale: 1.08 }}
          transition={{ type: 'spring', stiffness: 320, damping: 14 }}
          className={cn(
            'mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg',
            f.accent,
          )}
        >
          <Icon className="h-6 w-6" strokeWidth={2.2} />
        </motion.span>

        <h3 className={cn(
          'font-display font-bold tracking-tight text-[hsl(250_47%_13%)]',
          f.span ? 'text-2xl' : 'text-lg',
        )}>
          {f.title}
        </h3>
        <p className={cn(
          'mt-2 text-[hsl(245_16%_46%)]',
          f.span ? 'max-w-md text-base leading-relaxed' : 'text-sm leading-relaxed',
        )}>
          {f.body}
        </p>

        {/* feature UI sketch — fills the card and hints at the product */}
        <div className={cn('pt-6', f.span ? 'mt-auto' : 'mt-5')}>
          <FeatureVisual kind={f.kind} />
        </div>

        <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-violet-600 opacity-0 transition-all duration-300 group-hover:opacity-100">
          Learn more
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </motion.article>
  );
}

export function BentoFeatures() {
  return (
    <section id="features" className="relative px-4 py-24 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-violet-50/70 px-3.5 py-1 text-sm font-medium text-violet-600">
          <Sparkles className="h-3.5 w-3.5" /> Everything in one place
        </span>
        <h2 className="font-display mt-5 text-4xl font-extrabold tracking-tight text-[hsl(250_47%_11%)] sm:text-5xl">
          One platform. <span className="lp-text-gradient">Zero busywork.</span>
        </h2>
        <p className="mt-4 text-lg text-[hsl(245_16%_46%)]">
          Replace a dozen disconnected tools with a single, beautifully
          calm system your whole school actually enjoys using.
        </p>
      </Reveal>

      <StaggerGroup className="mx-auto mt-14 grid max-w-6xl auto-rows-[minmax(0,1fr)] grid-cols-1 gap-4 sm:gap-5 md:grid-cols-4">
        {FEATURES.map((f) => (
          <FeatureCard key={f.title} f={f} />
        ))}
      </StaggerGroup>
    </section>
  );
}
