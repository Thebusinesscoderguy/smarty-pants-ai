import { useRef } from 'react';
import {
  motion,
  useTransform,
  useReducedMotion,
  useSpring,
  useMotionValue,
  type MotionValue,
} from 'framer-motion';
import {
  ArrowRight, Sparkles, CalendarCheck, GraduationCap,
  MessageSquare,
} from 'lucide-react';
import {
  GradientOrbs, WordReveal, GradientButton, GhostButton, Magnetic, EASE,
} from './primitives';
import { cn } from '@/lib/utils';

/* ============================================================
   TeachlyAI — Hero (light, split layout)
   Left: headline word-reveal + subtitle + magnetic CTAs
   Right: floating browser mockup of the real dashboard with
          mouse-parallax 3D tilt, purple glow, floating stat cards
   ui-ux-pro-max: white + lavender, #7C3AED / #A78BFA / #4F46E5
   ============================================================ */

const DASHBOARD_IMG = '/teachly-dashboard.png';

/* ---- one floating glass stat card: parallax depth + idle float + spring entrance ---- */
function FloatingStat({
  mx, my, depth, drift, delay, className,
  icon: Icon, value, label, iconClass, accentDot = false,
}: {
  mx: MotionValue<number>;
  my: MotionValue<number>;
  depth: number;
  drift: number;
  delay: number;
  className?: string;
  icon: typeof CalendarCheck;
  value: string;
  label: string;
  iconClass: string;
  accentDot?: boolean;
}) {
  const reduce = useReducedMotion();
  const px = useSpring(useTransform(mx, [-0.5, 0.5], [-depth, depth]), {
    stiffness: 90, damping: 16, mass: 0.5,
  });
  const py = useSpring(useTransform(my, [-0.5, 0.5], [-depth, depth]), {
    stiffness: 90, damping: 16, mass: 0.5,
  });

  return (
    <motion.div
      style={reduce ? undefined : { x: px, y: py }}
      initial={{ opacity: 0, scale: 0.7, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 210, damping: 17, delay }}
      className={cn('absolute z-20', className)}
    >
      <motion.div
        animate={reduce ? undefined : { y: [0, -drift, 0] }}
        transition={{ duration: 5 + depth * 0.05, repeat: Infinity, ease: 'easeInOut', delay }}
        className="lp-glass relative flex items-center gap-3 rounded-2xl px-4 py-3"
      >
        {accentDot && (
          <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#EA580C] opacity-60" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-[#EA580C] ring-2 ring-white" />
          </span>
        )}
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', iconClass)}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <p className="text-lg font-bold text-[hsl(250_47%_11%)]">{value}</p>
          <p className="text-xs text-[hsl(245_16%_46%)]">{label}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ---- floating browser mockup: purple glow + cursor 3D tilt + the dashboard image ---- */
function HeroMockup({ mx, my }: { mx: MotionValue<number>; my: MotionValue<number> }) {
  const reduce = useReducedMotion();
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 100, damping: 16 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), { stiffness: 100, damping: 16 });

  return (
    <div className="relative" style={{ perspective: 1200 }}>
      {/* soft purple glow behind */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-10 -z-10 rounded-[3rem] bg-[radial-gradient(60%_60%_at_50%_45%,rgba(124,58,237,0.32),rgba(168,85,247,0.12)_55%,transparent_75%)] blur-2xl"
      />

      <motion.div
        style={reduce ? undefined : { rotateX, rotateY, transformStyle: 'preserve-3d' }}
        initial={{ opacity: 0, y: 48, rotateX: 10 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1, ease: EASE, delay: 0.45 }}
        className="relative will-change-transform"
      >
        {/* browser window frame */}
        <div className="lp-glass overflow-hidden rounded-[1.5rem] p-2 shadow-[0_44px_120px_-32px_rgba(91,33,182,0.5)]">
          <div className="overflow-hidden rounded-[1.15rem] bg-white">
            {/* chrome bar */}
            <div className="flex items-center gap-2 border-b border-violet-50 bg-white/80 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-rose-300" />
              <span className="h-3 w-3 rounded-full bg-amber-300" />
              <span className="h-3 w-3 rounded-full bg-emerald-300" />
              <div className="ml-3 flex flex-1 items-center justify-center">
                <div className="inline-flex items-center gap-2 rounded-lg bg-violet-50/70 px-3 py-1 text-xs font-medium text-violet-600">
                  <span className="h-2.5 w-2.5 rounded-full border border-violet-300" />
                  app.teachlyai.com/dashboard
                </div>
              </div>
            </div>
            {/* the real dashboard screenshot */}
            <img
              src={DASHBOARD_IMG}
              alt="TeachlyAI school administration dashboard"
              width={1877}
              height={1030}
              loading="eager"
              className="block w-full"
            />
          </div>
        </div>

        {/* floating stat cards */}
        <FloatingStat
          mx={mx} my={my} depth={40} drift={12} delay={0.9}
          className="-left-6 top-10"
          icon={CalendarCheck} value="98%" label="Attendance"
          iconClass="bg-violet-50 text-violet-600"
        />
        <FloatingStat
          mx={mx} my={my} depth={56} drift={10} delay={1.05}
          className="-left-8 bottom-16"
          icon={GraduationCap} value="142" label="Grades submitted"
          iconClass="bg-emerald-50 text-emerald-600"
        />
        <FloatingStat
          mx={mx} my={my} depth={30} drift={14} delay={1.2}
          className="-right-6 bottom-24"
          icon={MessageSquare} value="24" label="Parent messages"
          iconClass="bg-[#FFF1E8] text-[#EA580C]" accentDot
        />
      </motion.div>
    </div>
  );
}

export function Hero({ onCta }: { onCta?: () => void }) {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  // normalized cursor position: -0.5 (left/top) .. 0.5 (right/bottom)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  function handlePointerMove(e: React.PointerEvent) {
    if (reduce || !sectionRef.current) return;
    const r = sectionRef.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }
  function handlePointerLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <section
      ref={sectionRef}
      id="top"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative overflow-hidden px-4 pb-24 pt-32 sm:pt-36"
    >
      <GradientOrbs />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2 lg:gap-10">
        {/* ---- left: copy ---- */}
        <div className="text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white/70 px-4 py-1.5 text-sm font-medium text-violet-700 backdrop-blur"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[linear-gradient(135deg,#7C3AED,#A855F7)]">
              <Sparkles className="h-3 w-3 text-white" />
            </span>
            The AI operating system for modern K-12 schools
          </motion.div>

          <h1 className="font-display text-[2.6rem] font-extrabold leading-[1.04] tracking-tight text-[hsl(250_47%_11%)] sm:text-5xl lg:text-[3.75rem]">
            <WordReveal text="Run your whole school" />{' '}
            <WordReveal text="from one calm dashboard" delay={0.5} highlight={[2, 3]} />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 1 }}
            className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[hsl(245_16%_46%)] sm:text-xl lg:mx-0"
          >
            TeachlyAI unifies attendance, grading, parent messaging and analytics —
            with AI that does the busywork so your teachers can teach.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 1.15 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start"
          >
            <Magnetic strength={0.45}>
              <GradientButton onClick={onCta}>
                Start free <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </GradientButton>
            </Magnetic>
          </motion.div>

        </div>

        {/* ---- right: mockup ---- */}
        <div className="relative">
          <HeroMockup mx={mx} my={my} />
        </div>
      </div>
    </section>
  );
}
