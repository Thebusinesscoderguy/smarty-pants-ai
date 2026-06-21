import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SEO } from '@/components/SEO';
import { Nav } from '@/components/landing/Nav';
import { Hero } from '@/components/landing/Hero';
import { LogoMarquee } from '@/components/landing/LogoMarquee';
import { WhoItsFor } from '@/components/landing/WhoItsFor';
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
  const { user, loading, isSchoolAdmin, isTeacher } = useAuth();
  const goSignup = useCallback(() => navigate('/auth'), [navigate]);

  // A signed-in school (admin/teacher) has no reason to sit on the marketing
  // page — drop them straight into the school console. The role flags resolve
  // asynchronously after auth, so this effect re-fires once they settle.
  useEffect(() => {
    if (!loading && user && (isSchoolAdmin || isTeacher)) {
      navigate('/school-admin', { replace: true });
    }
  }, [loading, user, isSchoolAdmin, isTeacher, navigate]);

  return (
    <div className="teachly-lp min-h-dvh scroll-smooth antialiased">
      <SEO
        title="TeachlyAI — The AI operating system for modern K-12 schools"
        description="TeachlyAI unifies attendance, grading, lesson planning, parent messaging and analytics with AI that handles the busywork. Built for modern K-12 schools."
        path="/"
      />

      <Nav onCta={goSignup} />

      <main>
        <Hero onCta={goSignup} />
        <LogoMarquee />
        <WhoItsFor />
        <BentoFeatures />
        <HowItWorks />
        <FinalCTA onCta={goSignup} />
      </main>

      <Footer />
    </div>
  );
}
