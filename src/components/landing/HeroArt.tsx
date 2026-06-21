import { motion, useReducedMotion } from 'framer-motion';

/* ============================================================
   TeachlyAI — Hero abstract art panel
   Replaces the dashboard screenshot with a pure-SVG, brand-forward
   gradient-geometric composition. No literal UI, no text, no images.
   Colors come straight from the .teachly-lp tokens (src/index.css):
     #7C3AED violet · #A855F7 purple · #6366F1 / #4F46E5 indigo

   ───────────────────────────────────────────────────────────
   HOW TO TWEAK (no render code needed):
   • Coordinate system is the SVG viewBox: 1000 wide × 550 tall.
     x grows right, y grows down. (0,0) = top-left, (1000,550) = bottom-right.
   • BLOBS  → the soft, blurred background glows. Resize with rx/ry,
     move with cx/cy, soften with opacity or TUNING.blobBlur.
   • SHAPES → the crisp geometric forms. Each has a `kind`
     ('square' | 'disc' | 'ring' | 'pill' | 'dots'), position/size,
     and a float speed. Delete an entry to remove a shape; reorder
     entries to change stacking (later = on top).
   • TUNING → global dials: blur amount, drop-shadow strength,
     float distance, master opacity.
   Edit the arrays/objects below, save, and the panel re-renders.
   ============================================================ */

const TUNING = {
  blobBlur: 46, // ↑ = softer/cloudier background blobs
  shadowBlur: 30, // soft drop-shadow under solid shapes
  shadowOpacity: 0.28,
  floatDistance: 16, // px (in viewBox units) shapes drift up/down
  artOpacity: 1, // master opacity of the whole composition (0–1)
};

/* Soft blurred background glows. opacity is per-blob. */
const BLOBS = [
  { cx: 235, cy: 150, rx: 300, ry: 240, fill: 'url(#ha-blobViolet)', opacity: 0.55 },
  { cx: 815, cy: 470, rx: 320, ry: 250, fill: 'url(#ha-blobIndigo)', opacity: 0.5 },
  { cx: 720, cy: 120, rx: 200, ry: 180, fill: 'url(#ha-blobFuchsia)', opacity: 0.55 },
];

type Shape =
  | { kind: 'square'; x: number; y: number; size: number; rx: number; rotate: number; opacity: number; float: [number, number] }
  | { kind: 'disc'; cx: number; cy: number; r: number; opacity: number; float: [number, number] }
  | { kind: 'ring'; cx: number; cy: number; r: number; stroke: number; opacity: number; float: [number, number] }
  | { kind: 'pill'; x: number; y: number; w: number; h: number; opacity: number; float: [number, number] }
  | { kind: 'dots'; dots: { cx: number; cy: number; r: number; fill: string; opacity: number }[]; float: [number, number] };

/* Crisp geometric forms, drawn in array order (later = on top).
   float: [durationSeconds, delaySeconds]. */
const SHAPES: Shape[] = [
  // main rounded square — the hero form
  { kind: 'square', x: 380, y: 150, size: 280, rx: 60, rotate: -13, opacity: 0.92, float: [7.5, 0] },
  // indigo disc overlapping the square
  { kind: 'disc', cx: 690, cy: 360, r: 118, opacity: 0.9, float: [6, 0.6] },
  // outline ring, left side
  { kind: 'ring', cx: 320, cy: 360, r: 92, stroke: 13, opacity: 0.45, float: [8.5, 1.1] },
  // floating glass pill, top-right
  { kind: 'pill', x: 600, y: 120, w: 230, h: 72, opacity: 0.6, float: [6.8, 0.35] },
  // small accent dots
  {
    kind: 'dots',
    float: [5.5, 0.9],
    dots: [
      { cx: 470, cy: 470, r: 13, fill: '#7C3AED', opacity: 0.85 },
      { cx: 855, cy: 240, r: 10, fill: '#6366F1', opacity: 0.8 },
      { cx: 250, cy: 200, r: 8, fill: '#A855F7', opacity: 0.75 },
    ],
  },
];

export function HeroArt() {
  const reduce = useReducedMotion();

  // tasteful idle drift; disabled under prefers-reduced-motion
  const float = (dur: number, delay: number) =>
    reduce
      ? {}
      : {
          animate: { y: [0, -TUNING.floatDistance, 0] },
          transition: { duration: dur, repeat: Infinity, ease: 'easeInOut' as const, delay },
        };

  return (
    <div className="relative aspect-[1877/1030] w-full overflow-hidden rounded-[1.15rem] bg-[linear-gradient(135deg,#FBF8FF_0%,#F4ECFF_55%,#ECE4FF_100%)]">
      <svg
        viewBox="0 0 1000 550"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        style={{ opacity: TUNING.artOpacity }}
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
            <feGaussianBlur stdDeviation={TUNING.blobBlur} />
          </filter>
          <filter id="ha-soft" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="22" stdDeviation={TUNING.shadowBlur} floodColor="#5B21B6" floodOpacity={TUNING.shadowOpacity} />
          </filter>
        </defs>

        {/* ---- soft gradient blobs (depth / atmosphere) ---- */}
        {BLOBS.map((b, i) => (
          <ellipse
            key={`blob-${i}`}
            cx={b.cx}
            cy={b.cy}
            rx={b.rx}
            ry={b.ry}
            fill={b.fill}
            filter="url(#ha-blur)"
            opacity={b.opacity}
          />
        ))}

        {/* ---- overlapping translucent geometric forms ---- */}
        {SHAPES.map((s, i) => {
          const key = `shape-${i}`;
          if (s.kind === 'square') {
            const cx = s.x + s.size / 2;
            const cy = s.y + s.size / 2;
            return (
              <motion.g key={key} {...float(...s.float)}>
                <rect
                  x={s.x}
                  y={s.y}
                  width={s.size}
                  height={s.size}
                  rx={s.rx}
                  fill="url(#ha-violet)"
                  opacity={s.opacity}
                  filter="url(#ha-soft)"
                  transform={`rotate(${s.rotate} ${cx} ${cy})`}
                />
                {/* inner sheen */}
                <rect
                  x={s.x}
                  y={s.y}
                  width={s.size}
                  height={s.size}
                  rx={s.rx}
                  fill="url(#ha-sheen)"
                  transform={`rotate(${s.rotate} ${cx} ${cy})`}
                />
              </motion.g>
            );
          }
          if (s.kind === 'disc') {
            return (
              <motion.g key={key} {...float(...s.float)}>
                <circle cx={s.cx} cy={s.cy} r={s.r} fill="url(#ha-indigo)" opacity={s.opacity} filter="url(#ha-soft)" />
                {/* highlight */}
                <circle cx={s.cx - 38} cy={s.cy - 42} r={s.r * 0.34} fill="#FFFFFF" opacity="0.16" />
              </motion.g>
            );
          }
          if (s.kind === 'ring') {
            return (
              <motion.g key={key} {...float(...s.float)}>
                <circle cx={s.cx} cy={s.cy} r={s.r} fill="none" stroke="#A855F7" strokeWidth={s.stroke} opacity={s.opacity} />
              </motion.g>
            );
          }
          if (s.kind === 'pill') {
            return (
              <motion.g key={key} {...float(...s.float)}>
                <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.h / 2} fill="#FFFFFF" opacity={s.opacity} />
                <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.h / 2} fill="none" stroke="#A855F7" strokeWidth="1.5" opacity="0.35" />
                <circle cx={s.x + 40} cy={s.y + s.h / 2} r={s.h * 0.24} fill="url(#ha-violet)" />
              </motion.g>
            );
          }
          // dots
          return (
            <motion.g key={key} {...float(...s.float)}>
              {s.dots.map((d, j) => (
                <circle key={j} cx={d.cx} cy={d.cy} r={d.r} fill={d.fill} opacity={d.opacity} />
              ))}
            </motion.g>
          );
        })}

        {/* faint top-edge glass highlight across the whole panel */}
        <rect x="0" y="0" width="1000" height="200" fill="url(#ha-sheen)" />
      </svg>
    </div>
  );
}
