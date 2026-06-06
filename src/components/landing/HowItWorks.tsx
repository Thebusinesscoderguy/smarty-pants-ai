import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { UploadCloud, Wand2, Rocket } from 'lucide-react';
import { Reveal, EASE } from './primitives';

const STEPS = [
  {
    icon: UploadCloud,
    n: '01',
    title: 'Import your school',
    body: 'Upload your roster, classes and timetable — or sync from your SIS. We map everything automatically in minutes.',
  },
  {
    icon: Wand2,
    n: '02',
    title: 'Let AI set things up',
    body: 'TeachlyAI drafts lesson plans, seating, grading scales and parent groups. Review, tweak, approve.',
  },
  {
    icon: Rocket,
    n: '03',
    title: 'Go live, calmly',
    body: 'Teachers, parents and students get tailored access. Watch attendance, grades and engagement in real time.',
  },
];

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
          Most schools are fully onboarded over a single weekend.
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
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
