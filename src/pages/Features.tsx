import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  CalendarCheck, GraduationCap, ClipboardList, ListChecks, FileText,
  Wallet, MessageSquare, BarChart3, Upload, Brain, BookOpen, Library,
  CheckCircle2, Mic, Sparkles, Gamepad2, LineChart, ArrowRight, Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SEO } from '@/components/SEO';
import { useLanguage } from '@/contexts/LanguageContext';
import { Nav } from '@/components/landing/Nav';
import { FinalCTA, Footer, DEMO_MAILTO } from '@/components/landing/FinalCTA';
import {
  GradientOrbs, WordReveal, GradientButton, GhostButton, Magnetic,
  Reveal, StaggerGroup, staggerItem,
} from '@/components/landing/primitives';

/* ============================================================
   TeachlyAI — Features page.
   Aligned with the landing: management-first, then AI, then the
   student learning companion (demoted). Shares the landing's
   purple/lavender system + motion primitives. English, no i18n
   (matches the current landing).
   ============================================================ */

type Feat = { icon: React.ElementType; tk: string; accent: string };

const MANAGEMENT: Feat[] = [
  { icon: CalendarCheck, tk: 'mgmt1', accent: 'from-violet-500 to-indigo-500' },
  { icon: GraduationCap, tk: 'mgmt2', accent: 'from-emerald-500 to-teal-500' },
  { icon: ClipboardList, tk: 'mgmt3', accent: 'from-fuchsia-500 to-pink-500' },
  { icon: ListChecks, tk: 'mgmt4', accent: 'from-sky-500 to-indigo-500' },
  { icon: FileText, tk: 'mgmt5', accent: 'from-amber-500 to-orange-500' },
  { icon: Wallet, tk: 'mgmt6', accent: 'from-violet-500 to-fuchsia-500' },
  { icon: MessageSquare, tk: 'mgmt7', accent: 'from-sky-500 to-violet-500' },
  { icon: BarChart3, tk: 'mgmt8', accent: 'from-rose-500 to-pink-500' },
  { icon: Upload, tk: 'mgmt9', accent: 'from-indigo-500 to-violet-500' },
];

const AI: Feat[] = [
  { icon: Brain, tk: 'ai1', accent: 'from-violet-500 to-indigo-500' },
  { icon: BookOpen, tk: 'ai2', accent: 'from-fuchsia-500 to-violet-500' },
  { icon: Library, tk: 'ai3', accent: 'from-sky-500 to-indigo-500' },
  { icon: CheckCircle2, tk: 'ai4', accent: 'from-emerald-500 to-teal-500' },
];

const STUDENTS: Feat[] = [
  { icon: Mic, tk: 'stu1', accent: 'from-violet-500 to-indigo-500' },
  { icon: Sparkles, tk: 'stu2', accent: 'from-fuchsia-500 to-pink-500' },
  { icon: Gamepad2, tk: 'stu3', accent: 'from-amber-500 to-orange-500' },
  { icon: LineChart, tk: 'stu4', accent: 'from-sky-500 to-indigo-500' },
];

function FeatureCard({ f }: { f: Feat }) {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const Icon = f.icon;
  return (
    <motion.article
      variants={staggerItem}
      whileHover={reduce ? undefined : { y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="lp-gradient-border group relative flex flex-col overflow-hidden rounded-3xl p-6 shadow-[0_18px_50px_-30px_rgba(91,33,182,0.35)] backdrop-blur"
    >
      <div className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(124,58,237,0.07),transparent_55%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative z-10 flex h-full flex-col">
        <span className={cn('mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg', f.accent)}>
          <Icon className="h-6 w-6" strokeWidth={2.2} />
        </span>
        <h3 className="font-display text-lg font-bold tracking-tight text-[hsl(250_47%_13%)]">{t(`feat.${f.tk}t`)}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[hsl(245_16%_46%)]">{t(`feat.${f.tk}b`)}</p>
      </div>
    </motion.article>
  );
}

function SectionHead({
  badge, icon: Icon, title, accent, subtitle,
}: { badge: string; icon: React.ElementType; title: string; accent: string; subtitle: string }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-violet-50/70 px-3.5 py-1 text-sm font-medium text-violet-600">
        <Icon className="h-3.5 w-3.5" /> {badge}
      </span>
      <h2 className="font-display mt-5 text-4xl font-extrabold tracking-tight text-[hsl(250_47%_11%)] sm:text-5xl">
        {title} <span className="lp-text-gradient">{accent}</span>
      </h2>
      <p className="mt-4 text-lg text-[hsl(245_16%_46%)]">{subtitle}</p>
    </Reveal>
  );
}

export default function Features() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const goSignup = useCallback(() => navigate('/auth'), [navigate]);
  const bookDemo = useCallback(() => { window.location.href = DEMO_MAILTO; }, []);

  return (
    <div className="teachly-lp min-h-dvh scroll-smooth antialiased">
      <SEO
        title="Features — TeachlyAI: the AI operating system for K-12 schools"
        description="Run attendance, grading, exams, report cards, fees and parent messaging in one place — with AI that builds lessons and quizzes from your own curriculum, plus an AI tutor for students."
        path="/features"
      />

      <Nav onCta={goSignup} />

      <main>
        {/* ---- hero ---- */}
        <section id="top" className="relative overflow-hidden px-4 pb-16 pt-32 sm:pt-36">
          <GradientOrbs />
          <div className="relative mx-auto max-w-3xl text-center">
            <Reveal>
              <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white/70 px-4 py-1.5 text-sm font-medium text-violet-700 backdrop-blur">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[linear-gradient(135deg,#7C3AED,#A855F7)]">
                  <Sparkles className="h-3 w-3 text-white" />
                </span>
                {t('feat.heroBadge')}
              </span>
            </Reveal>

            <h1 className="font-display text-[2.6rem] font-extrabold leading-[1.05] tracking-tight text-[hsl(250_47%_11%)] sm:text-5xl lg:text-[3.5rem]">
              <WordReveal text={t('feat.heroTitle1')} />{' '}
              <WordReveal text={t('feat.heroTitle2')} delay={0.4} highlight={[2, 3]} />
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[hsl(245_16%_46%)] sm:text-xl">
              {t('feat.heroSubtitle')}
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Magnetic strength={0.45}>
                <GradientButton onClick={goSignup}>
                  {t('feat.startFree')} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </GradientButton>
              </Magnetic>
              <GhostButton onClick={bookDemo}>{t('feat.bookDemo')}</GhostButton>
            </div>
          </div>
        </section>

        {/* ---- TIER 1: management ---- */}
        <section id="features" className="relative px-4 py-20 sm:py-24">
          <SectionHead
            badge={t('feat.t1Badge')}
            icon={Layers}
            title={t('feat.t1Title')}
            accent={t('feat.t1Accent')}
            subtitle={t('feat.t1Subtitle')}
          />
          <StaggerGroup className="mx-auto mt-14 grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {MANAGEMENT.map((f) => <FeatureCard key={f.tk} f={f} />)}
          </StaggerGroup>
        </section>

        {/* ---- TIER 2: AI ---- */}
        <section className="relative px-4 py-20 sm:py-24">
          <SectionHead
            badge={t('feat.t2Badge')}
            icon={Brain}
            title={t('feat.t2Title')}
            accent={t('feat.t2Accent')}
            subtitle={t('feat.t2Subtitle')}
          />
          <StaggerGroup className="mx-auto mt-14 grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {AI.map((f) => <FeatureCard key={f.tk} f={f} />)}
          </StaggerGroup>
        </section>

        {/* ---- TIER 3: students (demoted) ---- */}
        <section className="relative px-4 py-20 sm:py-24">
          <SectionHead
            badge={t('feat.t3Badge')}
            icon={Gamepad2}
            title={t('feat.t3Title')}
            accent={t('feat.t3Accent')}
            subtitle={t('feat.t3Subtitle')}
          />
          <StaggerGroup className="mx-auto mt-14 grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {STUDENTS.map((f) => <FeatureCard key={f.tk} f={f} />)}
          </StaggerGroup>
        </section>
      </main>

      <FinalCTA onCta={goSignup} />
      <Footer />
    </div>
  );
}
