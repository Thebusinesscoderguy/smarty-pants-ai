import { motion, useReducedMotion } from 'framer-motion';

/* ============================================================
   TeachlyAI — Hero abstract art panel
   Replaces the dashboard screenshot with a pure-SVG, brand-forward
   gradient-geometric composition. No literal UI, no text, no images.
   Colors come straight from the .teachly-lp tokens (src/index.css):
     #7C3AED violet · #A855F7 purple · #6366F1 / #4F46E5 indigo
   Same aspect-ratio + radius as the old screenshot panel so the
   hero layout/dimensions are unchanged.
   ============================================================ */

export function HeroArt() {
  const reduce = useReducedMotion();

  // tasteful idle drift; disabled under prefers-reduced-motion
  const float = (dur: number, delay: number, dist = 16) =>
    reduce
      ? {}
      : {
          animate: { y: [0, -dist, 0] },
          transition: { duration: dur, repeat: Infinity, ease: 'easeInOut', delay },
        };

  return (
    <div className="relative aspect-[1877/1030] w-full overflow-hidden rounded-[1.15rem] bg-[linear-gradient(135deg,#FBF8FF_0%,#F4ECFF_55%,#ECE4FF_100%)]">
      <svg
        viewBox="0 0 1000 550"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <defs>
          {/* signature brand gradients */}
          <linearGradient id="ha-violet" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="55%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
          <linearGradient id="ha-indigo" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>
          <radialGradient id="ha-blobViolet" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#A855F7" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="ha-blobIndigo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="ha-blobFuchsia" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#D8B4FE" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#D8B4FE" stopOpacity="0" />
          </radialGradient>
          {/* top glass highlight */}
          <linearGradient id="ha-sheen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
            <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          <filter id="ha-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="46" />
          </filter>
          <filter id="ha-soft" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="22" stdDeviation="30" floodColor="#5B21B6" floodOpacity="0.28" />
          </filter>
        </defs>

        {/* ---- soft gradient blobs (depth / atmosphere) ---- */}
        <ellipse cx="235" cy="150" rx="300" ry="240" fill="url(#ha-blobViolet)" filter="url(#ha-blur)" opacity="0.55" />
        <ellipse cx="815" cy="470" rx="320" ry="250" fill="url(#ha-blobIndigo)" filter="url(#ha-blur)" opacity="0.5" />
        <ellipse cx="720" cy="120" rx="200" ry="180" fill="url(#ha-blobFuchsia)" filter="url(#ha-blur)" opacity="0.55" />

        {/* ---- overlapping translucent geometric forms ---- */}
        {/* main rounded square */}
        <motion.g {...float(7.5, 0)} style={{ transformOrigin: '520px 290px' }}>
          <rect
            x="380"
            y="150"
            width="280"
            height="280"
            rx="60"
            fill="url(#ha-violet)"
            opacity="0.92"
            filter="url(#ha-soft)"
            transform="rotate(-13 520 290)"
          />
          {/* inner sheen on the square */}
          <rect
            x="380"
            y="150"
            width="280"
            height="280"
            rx="60"
            fill="url(#ha-sheen)"
            transform="rotate(-13 520 290)"
          />
        </motion.g>

        {/* indigo disc, overlapping the square's lower-right */}
        <motion.g {...float(6, 0.6, 13)}>
          <circle cx="690" cy="360" r="118" fill="url(#ha-indigo)" opacity="0.9" filter="url(#ha-soft)" />
          <circle cx="652" cy="318" r="40" fill="#FFFFFF" opacity="0.16" />
        </motion.g>

        {/* outline ring, left side */}
        <motion.g {...float(8.5, 1.1, 12)}>
          <circle cx="320" cy="360" r="92" fill="none" stroke="#A855F7" strokeWidth="13" opacity="0.45" />
        </motion.g>

        {/* floating glass pill, top-right */}
        <motion.g {...float(6.8, 0.35, 15)}>
          <rect x="600" y="120" width="230" height="72" rx="36" fill="#FFFFFF" opacity="0.6" />
          <rect x="600" y="120" width="230" height="72" rx="36" fill="none" stroke="#A855F7" strokeWidth="1.5" opacity="0.35" />
          <circle cx="640" cy="156" r="17" fill="url(#ha-violet)" />
        </motion.g>

        {/* small accent dots */}
        <motion.g {...float(5.5, 0.9, 10)}>
          <circle cx="470" cy="470" r="13" fill="#7C3AED" opacity="0.85" />
          <circle cx="855" cy="240" r="10" fill="#6366F1" opacity="0.8" />
          <circle cx="250" cy="200" r="8" fill="#A855F7" opacity="0.75" />
        </motion.g>

        {/* faint top-edge glass highlight across the whole panel */}
        <rect x="0" y="0" width="1000" height="200" fill="url(#ha-sheen)" />
      </svg>
    </div>
  );
}
