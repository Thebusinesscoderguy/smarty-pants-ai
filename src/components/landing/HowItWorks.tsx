import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { UploadCloud, Wand2, Rocket, Check, Sparkles, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reveal, EASE } from './primitives';

type StepKind = 'import' | 'setup' | 'golive';

const STEPS: { icon: React.ElementType; n: string; title: string; body: string; kind: StepKind }[] = [
  {
    icon: UploadCloud,
    n: '01',
    title: 'Import your school',
    body: 'Upload your roster, classes and timetable — or sync from your SIS. We map everything automatically in minutes.',
    kind: 'import',
  },
  {
    icon: Wand2,
    n: '02',
    title: 'Let AI set things up',
    body: 'TeachlyAI drafts lesson plans, seating, grading scales and parent groups. Review, tweak, approve.',
    kind: 'setup',
  },
  {
    icon: Rocket,
    n: '03',
    title: 'Go live, calmly',
    body: 'Teachers, parents and students get tailored access. Watch attendance, grades and engagement in real time.',
    kind: 'golive',
  },
];

/* small skeleton "text" line */
function Bar({ w = 'w-full', tone = 'bg-violet-100' }: { w?: string; tone?: string }) {
  return <span className={cn('block h-1.5 rounded-full', w, tone)} />;
}

/* decorative, abstract UI sketch that fills each step card */
function StepSketch({ kind }: { kind: StepKind }) {
  if (kind === 'import') {
    return (
      <div className="rounded-2xl border border-violet-100 bg-white/80 p-3.5 shadow-[0_12px_40px_-26px_rgba(124,58,237,0.45)]">
        <div className="mb-2.5 flex items-center gap-2 border-b border-violet-50 pb-2">
          <UploadCloud className="h-3.5 w-3.5 text-violet-400" />
          <Bar w="w-1/3" tone="bg-violet-200" />
          <span className="flex-1" />
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-600">
            <RefreshCw className="h-2.5 w-2.5" /> SIS sync
          </span>
        </div>
        {['w-2/3', 'w-1/2', 'w-3/5'].map((w, i) => (
          <div key={i} className="flex items-center gap-2.5 py-1">
            <span className="h-5 w-5 shrink-0 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100" />
            <Bar w={w} tone="bg-violet-100" />
          </div>
        ))}
      </div>
    );
  }

  if (kind === 'setup') {
    return (
      <div className="rounded-2xl border border-violet-100 bg-white/80 p-3.5 shadow-[0_12px_40px_-26px_rgba(124,58,237,0.45)]">
        <div className="mb-2.5 inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-600">
          <Sparkles className="h-2.5 w-2.5" /> Drafting
        </div>
        <div className="space-y-1.5">
          <Bar w="w-5/6" tone="bg-violet-200" />
          <Bar w="w-full" tone="bg-violet-100" />
          <Bar w="w-2/3" tone="bg-violet-100" />
        </div>
        <div className="mt-3 flex items-center justify-end gap-2">
          <span className="rounded-md border border-violet-100 px-2 py-1 text-[10px] font-semibold text-violet-400">Tweak</span>
          <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-br from-violet-500 to-indigo-500 px-2 py-1 text-[10px] font-semibold text-white">
            <Check className="h-2.5 w-2.5" strokeWidth={3} /> Approve
          </span>
        </div>
      </div>
    );
  }

  // golive
  const audiences = ['Teachers', 'Parents', 'Students'];
  return (
    <div className="rounded-2xl border border-violet-100 bg-white/80 p-3.5 shadow-[0_12px_40px_-26px_rgba(124,58,237,0.45)]">
      <div className="mb-2.5 flex items-center gap-2 border-b border-violet-50 pb-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
        </span>
        <span className="text-[11px] font-semibold text-violet-600">Live</span>
        <span className="flex-1" />
        <BarChartGlyph />
      </div>
      {audiences.map((a, i) => (
        <div key={a} className="flex items-center gap-2.5 py-1">
          <span className={cn('h-2 w-2 shrink-0 rounded-full', ['bg-violet-500', 'bg-indigo-400', 'bg-fuchsia-400'][i])} />
          <span className="text-[12px] font-medium text-[hsl(250_30%_30%)]">{a}</span>
          <span className="flex-1" />
          <Bar w="w-10" tone="bg-violet-100" />
        </div>
      ))}
    </div>
  );
}

/* tiny inline upward-trend glyph */
function BarChartGlyph() {
  return (
    <svg viewBox="0 0 32 16" className="h-3.5 w-8" aria-hidden>
      <polyline
        points="1,13 9,9 17,11 25,5 31,2"
        fill="none"
        stroke="#7C3AED"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StepIcon({ icon: Icon }: { icon: React.ElementType }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      initial={reduce ? { opacity: 0 } : { scale: 0.4, opacity: 0, rotate: -25 }}
      whileInView={{ scale: 1, opacity: 1, rotate: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ type: 'spring', stiffness: 240, damping: 16 }}
      className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-[0_16px_40px_-16px_rgba(124,58,237,0.55)] ring-1 ring-violet-100"
    >
      <span className="absolute inset-0 rounded-2xl bg-[linear-gradient(135deg,rgba(124,58,237,0.12),rgba(168,85,247,0.06))]" />
      <Icon className="relative h-7 w-7 text-violet-600" strokeWidth={2.2} />
    </motion.span>
  );
}

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 70%', 'end 60%'],
  });
  // animated vertical/horizontal connector that fills as you scroll
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section id="how" className="relative px-4 py-24 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-violet-50/70 px-3.5 py-1 text-sm font-medium text-violet-600">
          How it works
        </span>
        <h2 className="font-display mt-5 text-4xl font-extrabold tracking-tight text-[hsl(250_47%_11%)] sm:text-5xl">
          Live in <span className="lp-text-gradient">three steps</span>
        </h2>
        <p className="mt-4 text-lg text-[hsl(245_16%_46%)]">
          A guided, step-by-step setup — from importing your data to going live.
        </p>
      </Reveal>

      <div ref={ref} className="relative mx-auto mt-16 max-w-5xl">
        {/* connector track */}
        <div className="absolute left-8 top-8 hidden h-[calc(100%-4rem)] w-px bg-violet-100 md:left-0 md:top-8 md:h-px md:w-full">
          <motion.div
            style={{ scaleX: lineScale, scaleY: lineScale }}
            className="h-full w-full origin-top bg-[linear-gradient(180deg,#7C3AED,#A855F7)] md:origin-left md:bg-[linear-gradient(90deg,#7C3AED,#A855F7,#6366F1)]"
          />
        </div>

        <div className="grid gap-12 md:grid-cols-3 md:gap-8">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, ease: EASE, delay: i * 0.12 }}
              className="relative flex gap-5 md:flex-col md:gap-0"
            >
              <div className="md:mb-6">
                <StepIcon icon={s.icon} />
              </div>
              <div className="flex-1">
                <span className="font-display text-sm font-bold tracking-widest text-violet-400">
                  STEP {s.n}
                </span>
                <h3 className="font-display mt-1 text-xl font-bold text-[hsl(250_47%_13%)]">
                  {s.title}
                </h3>
                <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-[hsl(245_16%_46%)]">
                  {s.body}
                </p>
                <div className="mt-5 max-w-xs">
                  <StepSketch kind={s.kind} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
