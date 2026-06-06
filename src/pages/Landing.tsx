import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { Nav } from '@/components/landing/Nav';
import { Hero } from '@/components/landing/Hero';
import { LogoMarquee } from '@/components/landing/LogoMarquee';
import { BentoFeatures } from '@/components/landing/BentoFeatures';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { FinalCTA, Footer } from '@/components/landing/FinalCTA';

/* ============================================================
   TeachlyAI — premium landing page
   Design system: ui-ux-pro-max (purple/lavender on white)
   Motion: framer-motion layered on every section
   ============================================================ */

export default function Landing() {
  const navigate = useNavigate();
  const goSignup = useCallback(() => navigate('/auth'), [navigate]);

  return (
    <div className="teachly-lp min-h-dvh scroll-smooth antialiased">
      <SEO
        title="TeachlyAI — The AI operating system for modern K-12 schools"
        description="TeachlyAI unifies attendance, grading, lesson planning, parent messaging and analytics with AI that handles the busywork. Trusted by 1,200+ schools."
        path="/"
      />

      <Nav onCta={goSignup} />

      <main>
        <Hero onCta={goSignup} />
        <LogoMarquee />
        <BentoFeatures />
        <HowItWorks />
        <FinalCTA onCta={goSignup} />
      </main>

      <Footer />
    </div>
  );
}
