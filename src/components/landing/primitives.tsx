import { useRef } from 'react';
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useSpring,
  type Variants,
  type HTMLMotionProps,
} from 'framer-motion';
import { cn } from '@/lib/utils';

/* ============================================================
   TeachlyAI landing — shared framer-motion primitives
   Easing + timing follow ui-ux-pro-max animation rules:
   enter ease-out, 150–650ms, transform/opacity only,
   30–50ms stagger, reduced-motion aware.
   ============================================================ */

export const EASE = [0.16, 1, 0.3, 1] as const; // expo-out, premium feel
export const EASE_SOFT = [0.22, 1, 0.36, 1] as const;

/* ---- scroll-triggered fade + slide-up ---- */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  once = true,
  amount = 0.25,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
  amount?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/* ---- stagger container + child ---- */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export function StaggerGroup({
  children,
  className,
  amount = 0.2,
  ...rest
}: { children: React.ReactNode; className?: string; amount?: number } & HTMLMotionProps<'div'>) {
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/* ---- oversized headline: staggered word reveal ---- */
export function WordReveal({
  text,
  className,
  wordClassName,
  delay = 0,
  highlight = [],
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
  /** indices of words to render with the purple gradient */
  highlight?: number[];
}) {
  const reduce = useReducedMotion();
  const words = text.split(' ');

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: delay } },
  };
  const word: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: '0.9em', rotateX: 35 },
    show: {
      opacity: 1,
      y: '0em',
      rotateX: 0,
      transition: { duration: 0.85, ease: EASE },
    },
  };

  return (
    <motion.span
      className={cn('inline', className)}
      variants={container}
      initial="hidden"
      animate="show"
      style={{ perspective: 800 }}
      aria-label={text}
    >
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <motion.span
            variants={word}
            className={cn(
              'inline-block',
              highlight.includes(i) && 'lp-text-gradient',
              wordClassName,
            )}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

/* ---- animated gradient orbs (decorative background) ---- */
export function GradientOrbs({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      <div className="lp-orb absolute -top-32 left-[6%] h-[34rem] w-[34rem] rounded-full bg-violet-400/30 blur-[120px]" />
      <div
        className="lp-orb absolute top-[8%] right-[4%] h-[30rem] w-[30rem] rounded-full bg-fuchsia-300/30 blur-[120px]"
        style={{ animationDelay: '-6s' }}
      />
      <div
        className="lp-orb absolute top-[34%] left-[38%] h-[26rem] w-[26rem] rounded-full bg-indigo-300/30 blur-[120px]"
        style={{ animationDelay: '-12s' }}
      />
      {/* faint grid, masked to fade at edges */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(91,33,182,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(91,33,182,0.035)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_72%)]" />
    </div>
  );
}

/* ---- premium gradient CTA button with hover scale + shine ---- */
export function GradientButton({
  children,
  className,
  ...rest
}: { children: React.ReactNode; className?: string } & HTMLMotionProps<'button'>) {
  return (
    <motion.button
      whileHover={{ scale: 1.035, y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className={cn(
        'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl px-7 py-3.5',
        'text-[0.975rem] font-semibold text-white',
        'bg-[linear-gradient(120deg,#7C3AED,#A855F7_55%,#6366F1)] bg-[length:200%_auto]',
        'shadow-[0_12px_30px_-8px_rgba(124,58,237,0.55)]',
        'transition-[background-position] duration-500 hover:bg-right',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300/60',
        className,
      )}
      {...rest}
    >
      {/* moving sheen */}
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.35),transparent)] transition-transform duration-700 group-hover:translate-x-full" />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </motion.button>
  );
}

/* ---- ghost / secondary button ---- */
export function GhostButton({
  children,
  className,
  ...rest
}: { children: React.ReactNode; className?: string } & HTMLMotionProps<'button'>) {
  return (
    <motion.button
      whileHover={{ scale: 1.035, y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-white/70 px-7 py-3.5',
        'text-[0.975rem] font-semibold text-violet-700 backdrop-blur',
        'shadow-[0_6px_20px_-10px_rgba(124,58,237,0.35)] transition-colors hover:bg-white hover:border-violet-300',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200/70',
        className,
      )}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

/* ---- magnetic wrapper: child drifts toward the cursor, springs back ---- */
export function Magnetic({
  children,
  strength = 0.4,
  className,
}: {
  children: React.ReactNode;
  /** 0 = no pull, 1 = follows cursor 1:1 */
  strength?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 250, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 250, damping: 18, mass: 0.4 });

  function handleMove(e: React.MouseEvent) {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  }
  function reset() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={reduce ? undefined : { x: sx, y: sy }}
      className={cn('inline-flex', className)}
    >
      {children}
    </motion.div>
  );
}
