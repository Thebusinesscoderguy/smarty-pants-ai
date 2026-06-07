import { Reveal } from './primitives';

/* Infinite-scroll capability strip. The track is duplicated and translated
   -50% via the `lp-marquee` keyframe, giving a seamless loop. CSS-driven
   (GPU transform) so it stays smooth; pauses on hover; reduced-motion safe. */

const CAPABILITIES = [
  'AI lesson planning',
  'Smart quizzes',
  'Attendance',
  'Gradebook',
  'Parent messaging',
  'Progress analytics',
  'Curriculum-aligned',
  '15+ languages',
];

function Row({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <ul
      className="lp-marquee-track flex shrink-0 items-center gap-12 pr-12"
      aria-hidden={ariaHidden}
    >
      {CAPABILITIES.map((s, i) => (
        <li
          key={`${s}-${i}`}
          className="flex items-center gap-2.5 whitespace-nowrap text-lg font-semibold text-[hsl(245_16%_55%)] transition-colors hover:text-violet-700"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 text-sm font-bold text-violet-600">
            {s[0]}
          </span>
          {s}
        </li>
      ))}
    </ul>
  );
}

export function LogoMarquee() {
  return (
    <section id="proof" className="relative py-16">
      <Reveal className="mx-auto mb-9 max-w-2xl px-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-500">
          Built for the whole school
        </p>
        <p className="mt-2 text-2xl font-bold text-[hsl(250_47%_14%)]">
          Everything students, parents, teachers &amp; admins need — in one place
        </p>
      </Reveal>

      {/* edge fade mask */}
      <div className="lp-marquee-group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="flex w-max">
          <Row />
          <Row ariaHidden />
        </div>
      </div>
    </section>
  );
}
