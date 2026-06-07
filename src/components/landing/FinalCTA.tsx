import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { Reveal, WordReveal, EASE } from './primitives';

function CtaButton({ children, variant = 'light', onClick }: {
  children: React.ReactNode;
  variant?: 'light' | 'ghost';
  onClick?: () => void;
}) {
  const light = variant === 'light';
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04, y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className={
        light
          ? 'group inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-[0.975rem] font-semibold text-violet-700 shadow-[0_14px_40px_-12px_rgba(0,0,0,0.45)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50'
          : 'inline-flex items-center justify-center gap-2 rounded-2xl border border-white/40 bg-white/10 px-7 py-3.5 text-[0.975rem] font-semibold text-white backdrop-blur transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40'
      }
    >
      {children}
    </motion.button>
  );
}

export function FinalCTA({ onCta }: { onCta?: () => void }) {
  const reduce = useReducedMotion();
  return (
    <section id="cta" className="px-4 py-16 sm:py-24">
      <Reveal className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[2.5rem] px-6 py-16 text-center sm:px-12 sm:py-24">
          {/* animated gradient background */}
          <div className="lp-animated-gradient absolute inset-0 bg-[linear-gradient(120deg,#6D28D9,#7C3AED_30%,#A855F7_60%,#6366F1)]" />
          {/* drifting orbs over gradient */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <div className="lp-orb absolute -left-10 -top-10 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
            <div
              className="lp-orb absolute -bottom-16 right-0 h-80 w-80 rounded-full bg-fuchsia-300/25 blur-3xl"
              style={{ animationDelay: '-8s' }}
            />
            {/* subtle moving sheen */}
            {!reduce && (
              <motion.div
                initial={{ x: '-40%' }}
                animate={{ x: '140%' }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-y-0 w-1/3 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.18),transparent)] blur-xl"
              />
            )}
          </div>

          <div className="relative z-10">
            <div className="mb-6 flex justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30 backdrop-blur">
                <GraduationCap className="h-7 w-7 text-white" />
              </span>
            </div>

            <h2 className="font-display mx-auto max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-6xl">
              <WordReveal text="Give your school its calmest year yet" />
            </h2>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.4 }}
              className="mx-auto mt-5 max-w-xl text-lg text-violet-100"
            >
              Set up your whole school in a single weekend. Free for 30 days,
              white-glove onboarding included.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.5 }}
              className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <CtaButton variant="light" onClick={onCta}>
                Start free <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </CtaButton>
              <CtaButton variant="ghost">Book a demo</CtaButton>
            </motion.div>

            <div className="mt-7 flex items-center justify-center gap-2 text-sm text-violet-100">
              No credit card required · Cancel anytime
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

const FOOTER_COLS = [
  { title: 'Product', links: ['Features', 'How it works', 'Pricing', 'Security', 'Roadmap'] },
  { title: 'Company', links: ['About', 'Careers', 'Blog', 'Press', 'Contact'] },
  { title: 'Resources', links: ['Help center', 'Guides', 'API docs', 'Status', 'Community'] },
  { title: 'Legal', links: ['Privacy', 'Terms', 'FERPA', 'Cookies'] },
];

export function Footer() {
  return (
    <footer className="border-t border-violet-100/70 px-4 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div>
            <a href="#top" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#7C3AED,#A855F7)]">
                <GraduationCap className="h-5 w-5 text-white" strokeWidth={2.4} />
              </span>
              <span className="font-display text-lg font-extrabold tracking-tight text-[hsl(250_47%_11%)]">
                Teachly<span className="lp-text-gradient">AI</span>
              </span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[hsl(245_16%_50%)]">
              The AI operating system for modern K-12 schools. Calm software
              for the people who run education.
            </p>
          </div>

          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <h4 className="font-display text-sm font-bold text-[hsl(250_47%_15%)]">{col.title}</h4>
              <ul className="mt-3 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-[hsl(245_16%_50%)] transition-colors hover:text-violet-700">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-violet-100/70 pt-6 text-sm text-[hsl(245_16%_52%)] sm:flex-row">
          <p>© {new Date().getFullYear()} TeachlyAI, Inc. All rights reserved.</p>
          <p className="inline-flex items-center gap-1.5">
            Made for educators, with care.
          </p>
        </div>
      </div>
    </footer>
  );
}
