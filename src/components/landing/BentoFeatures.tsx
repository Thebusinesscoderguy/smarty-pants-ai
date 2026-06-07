import { motion, useReducedMotion } from 'framer-motion';
import {
  CalendarCheck, Brain, MessageSquare, BarChart3,
  Sparkles, FileText, Bell, ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reveal, StaggerGroup, staggerItem, EASE } from './primitives';

type Feature = {
  icon: React.ElementType;
  title: string;
  body: string;
  className: string; // grid span
  accent: string;    // icon tint bg
  span?: boolean;    // large card
};

const FEATURES: Feature[] = [
  {
    icon: Brain,
    title: 'AI lesson & quiz builder',
    body: 'Generate standards-aligned lessons, worksheets and adaptive quizzes in seconds. Teachers edit, never start from scratch.',
    className: 'md:col-span-2 md:row-span-2',
    accent: 'from-violet-500 to-indigo-500',
    span: true,
  },
  {
    icon: CalendarCheck,
    title: 'Smart attendance',
    body: 'One-tap roll call with auto-alerts to parents for absences.',
    className: 'md:col-span-1',
    accent: 'from-emerald-500 to-teal-500',
  },
  {
    icon: BarChart3,
    title: 'Live analytics',
    body: 'Spot at-risk students early with predictive insights.',
    className: 'md:col-span-1',
    accent: 'from-fuchsia-500 to-pink-500',
  },
  {
    icon: MessageSquare,
    title: 'Unified messaging',
    body: 'Parents, teachers and admin in one secure inbox — translated automatically.',
    className: 'md:col-span-2',
    accent: 'from-sky-500 to-indigo-500',
  },
  {
    icon: FileText,
    title: 'Report cards',
    body: 'Auto-compiled, branded PDFs in a click.',
    className: 'md:col-span-1',
    accent: 'from-amber-500 to-orange-500',
  },
];

function FeatureCard({ f, index }: { f: Feature; index: number }) {
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

        {f.span && (
          <div className="mt-auto pt-6">
            {/* mini animated bars to fill the large card */}
            <div className="flex items-end gap-2">
              {[42, 68, 54, 88, 72, 96, 60].map((h, i) => (
                <motion.span
                  key={i}
                  initial={{ height: 6, opacity: 0.4 }}
                  whileInView={{ height: h * 0.7, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.06, duration: 0.7, ease: EASE }}
                  className="w-full rounded-full bg-gradient-to-t from-violet-200 to-violet-500"
                  style={{ maxHeight: 72 }}
                />
              ))}
            </div>
          </div>
        )}

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
        {FEATURES.map((f, i) => (
          <FeatureCard key={f.title} f={f} index={i} />
        ))}
      </StaggerGroup>
    </section>
  );
}
