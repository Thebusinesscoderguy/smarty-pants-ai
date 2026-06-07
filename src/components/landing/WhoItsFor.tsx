import { motion, useReducedMotion } from 'framer-motion';
import {
  Building2, GraduationCap, Heart, BookOpen, Check, Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reveal, StaggerGroup, staggerItem } from './primitives';

/* ============================================================
   WhoItsFor — one role card per audience. Every bullet maps to
   a real Teachly capability (see BentoFeatures / app pages):
   no invented claims, no numbers, no testimonials.
   ============================================================ */

type Role = {
  icon: React.ElementType;
  role: string;
  tagline: string;
  accent: string;     // icon tile gradient
  points: string[];
};

const ROLES: Role[] = [
  {
    icon: Building2,
    role: 'Principals',
    tagline: 'A calm command center for the whole school.',
    accent: 'from-violet-500 to-indigo-500',
    points: [
      'School-wide analytics to spot at-risk students early',
      'One view across attendance, grades and messaging',
      'Manage staff, classes and rosters in one place',
    ],
  },
  {
    icon: GraduationCap,
    role: 'Teachers',
    tagline: 'Less admin, more time to actually teach.',
    accent: 'from-fuchsia-500 to-violet-500',
    points: [
      'AI lesson & quiz builder — edit, never start from scratch',
      'One-tap attendance with automatic parent alerts',
      'Auto-compiled report cards in a click',
    ],
  },
  {
    icon: Heart,
    role: 'Parents',
    tagline: 'Stay close to your child’s school life.',
    accent: 'from-sky-500 to-indigo-500',
    points: [
      'Instant alerts the moment your child is marked absent',
      'Message teachers in one inbox, auto-translated',
      'Follow grades and progress as they happen',
    ],
  },
  {
    icon: BookOpen,
    role: 'Students',
    tagline: 'A clear, focused place to learn.',
    accent: 'from-emerald-500 to-teal-500',
    points: [
      'Adaptive quizzes and lessons tailored to you',
      'Tailored access to your classes and schedule',
      'Track your own grades and progress',
    ],
  },
];

function RoleCard({ r }: { r: Role }) {
  const reduce = useReducedMotion();
  const Icon = r.icon;
  return (
    <motion.article
      variants={staggerItem}
      whileHover={reduce ? undefined : { y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={cn(
        'lp-gradient-border group relative flex flex-col overflow-hidden rounded-3xl p-6',
        'shadow-[0_18px_50px_-30px_rgba(91,33,182,0.35)] backdrop-blur',
      )}
    >
      <div className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(124,58,237,0.07),transparent_55%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative z-10 flex h-full flex-col">
        <motion.span
          whileHover={reduce ? undefined : { rotate: -8, scale: 1.08 }}
          transition={{ type: 'spring', stiffness: 320, damping: 14 }}
          className={cn(
            'mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg',
            r.accent,
          )}
        >
          <Icon className="h-6 w-6" strokeWidth={2.2} />
        </motion.span>

        <h3 className="font-display text-lg font-bold tracking-tight text-[hsl(250_47%_13%)]">
          {r.role}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-[hsl(245_16%_46%)]">
          {r.tagline}
        </p>

        <ul className="mt-5 space-y-2.5">
          {r.points.map((p) => (
            <li key={p} className="flex items-start gap-2.5 text-[13.5px] leading-snug text-[hsl(250_30%_24%)]">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-white">
                <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>
    </motion.article>
  );
}

export function WhoItsFor() {
  return (
    <section id="who-its-for" className="relative px-4 py-24 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-violet-50/70 px-3.5 py-1 text-sm font-medium text-violet-600">
          <Users className="h-3.5 w-3.5" /> Who it’s for
        </span>
        <h2 className="font-display mt-5 text-4xl font-extrabold tracking-tight text-[hsl(250_47%_11%)] sm:text-5xl">
          One platform, <span className="lp-text-gradient">every role</span>
        </h2>
        <p className="mt-4 text-lg text-[hsl(245_16%_46%)]">
          Principals, teachers, parents and students each get a view
          built around what they actually need to do.
        </p>
      </Reveal>

      <StaggerGroup className="mx-auto mt-14 grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        {ROLES.map((r) => (
          <RoleCard key={r.role} r={r} />
        ))}
      </StaggerGroup>
    </section>
  );
}
