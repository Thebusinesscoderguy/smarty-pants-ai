import { useState } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { GraduationCap, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GradientButton, EASE } from './primitives';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how' },
  { label: 'Schools', href: '#proof' },
  { label: 'Pricing', href: '#cta' },
];

export function Nav({ onCta }: { onCta?: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();
  const { user, signOut, isSigningOut } = useAuth();
  const navigate = useNavigate();

  const handleDashboard = () => navigate('/');
  const handleSignOut = async () => { await signOut(); };

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 24));


  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: EASE }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3 sm:pt-4"
    >
      <motion.nav
        animate={{
          width: scrolled ? 'min(64rem, 100%)' : 'min(72rem, 100%)',
          backgroundColor: scrolled ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.45)',
          boxShadow: scrolled
            ? '0 16px 50px -20px rgba(91,33,182,0.28)'
            : '0 8px 30px -22px rgba(91,33,182,0.18)',
        }}
        transition={{ duration: 0.5, ease: EASE }}
        className="flex items-center justify-between gap-4 rounded-2xl border border-white/70 px-4 py-2.5 backdrop-blur-xl sm:px-5"
      >
        <a href="#top" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#7C3AED,#A855F7)] shadow-[0_8px_20px_-6px_rgba(124,58,237,0.6)]">
            <GraduationCap className="h-5 w-5 text-white" strokeWidth={2.4} />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight text-[hsl(250_47%_11%)]">
            Teachly<span className="lp-text-gradient">AI</span>
          </span>
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="relative rounded-lg px-3.5 py-2 text-sm font-medium text-[hsl(245_16%_40%)] transition-colors hover:text-violet-700"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <a
            href="/auth"
            className="rounded-xl px-3.5 py-2 text-sm font-semibold text-[hsl(250_47%_18%)] transition-colors hover:text-violet-700"
          >
            Sign in
          </a>
          <GradientButton className="px-5 py-2.5 text-sm" onClick={onCta}>
            Start free
          </GradientButton>
        </div>

        <button
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-100 bg-white/70 text-violet-700 md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: EASE }}
            className={cn(
              'absolute inset-x-4 top-[4.5rem] rounded-2xl border border-white/70 bg-white/90 p-3 backdrop-blur-xl md:hidden',
              'shadow-[0_20px_50px_-20px_rgba(91,33,182,0.3)]',
            )}
          >
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-4 py-3 text-sm font-medium text-[hsl(245_16%_38%)] transition-colors hover:bg-violet-50 hover:text-violet-700"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 p-1">
              <a
                href="/auth"
                className="rounded-xl border border-violet-100 px-4 py-2.5 text-center text-sm font-semibold text-violet-700"
              >
                Sign in
              </a>
              <GradientButton className="w-full px-4 py-2.5 text-sm" onClick={onCta}>
                Start free
              </GradientButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
