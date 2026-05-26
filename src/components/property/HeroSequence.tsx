import { useEffect, useRef, useState, type ReactNode } from "react";

export interface HeroSequenceFrame {
  src: string;
  alt?: string;
  /** Optional short beat word(s). When absent, the base headline is shown. */
  beat?: string;
}

interface Props {
  frames: HeroSequenceFrame[];
  eyebrow: ReactNode;
  /** Base headline shown on the first (and last) frame. */
  headline: ReactNode;
  /** Optional body line shown on the last frame only. */
  finalBody?: ReactNode;
  /** Image fit. Defaults to "cover". */
  fit?: "cover" | "contain";
  /** Object-position passed to <img>. */
  objectPosition?: string;
  /** LCP optimisation: priority load on the first frame. */
  eager?: boolean;
}

const MAX_FRAMES = 5;

/**
 * Editorial scroll-pinned hero sequence.
 *
 * Renders a tall wrapper whose inner panel is `position: sticky; top: 0`,
 * so as the user scrolls the page pins. Progress through the wrapper is
 * mapped to a crossfade between adjacent image frames plus a headline
 * "beat" swap and a property-accent progress bar.
 *
 * Falls back gracefully:
 *  - 0 frames -> renders nothing.
 *  - 1 frame  -> static hero, no pin.
 *  - prefers-reduced-motion -> all frames stacked vertically, no pin.
 */
const HeroSequence = ({
  frames,
  eyebrow,
  headline,
  finalBody,
  fit = "cover",
  objectPosition,
  eager = true,
}: Props) => {
  const trimmed = frames.slice(0, MAX_FRAMES);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0); // 0..(frames.length - 1)
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mqReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqMobile = window.matchMedia("(max-width: 768px)");
    const sync = () => {
      setReducedMotion(mqReduced.matches);
      setIsMobile(mqMobile.matches);
    };
    sync();
    mqReduced.addEventListener?.("change", sync);
    mqMobile.addEventListener?.("change", sync);
    return () => {
      mqReduced.removeEventListener?.("change", sync);
      mqMobile.removeEventListener?.("change", sync);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion || trimmed.length < 2) return;
    const el = wrapperRef.current;
    if (!el) return;

    let raf = 0;
    const compute = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // Travel = (height - viewport). Progress 0 when top of wrapper hits
      // top of viewport, 1 when bottom hits top of viewport.
      const travel = el.offsetHeight - vh;
      if (travel <= 0) return;
      const scrolled = Math.min(Math.max(-rect.top, 0), travel);
      const pct = scrolled / travel; // 0..1
      setProgress(pct * (trimmed.length - 1));
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [reducedMotion, trimmed.length]);

  if (trimmed.length === 0) return null;

  // Reduced-motion fallback: stack each frame full-bleed, no pin.
  if (reducedMotion || trimmed.length < 2) {
    return (
      <>
        {trimmed.map((frame, i) => {
          const isFirst = i === 0;
          const isLast = i === trimmed.length - 1;
          const beatNode = !isFirst && !isLast && frame.beat ? frame.beat : null;
          return (
            <section
              key={`${frame.src}-${i}`}
              className="relative h-[100dvh] min-h-[480px] w-full overflow-hidden bg-black text-white"
            >
              <img
                src={frame.src}
                alt={frame.alt ?? ""}
                className={`absolute inset-0 h-full w-full ${fit === "contain" ? "object-contain" : "object-cover"}`}
                style={objectPosition ? { objectPosition } : undefined}
                loading={i === 0 && eager ? "eager" : "lazy"}
                decoding={i === 0 ? "sync" : "async"}
                fetchPriority={i === 0 && eager ? "high" : "auto"}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <span aria-hidden className="absolute top-0 left-0 h-[2px] w-full cb-accent-bg z-10" />
              <div className="relative z-10 flex h-full items-end px-6 pb-24 md:px-12 md:pb-28">
                <div>
                  <p className="cb-accent-on-dark text-[10px] tracking-[0.4em] uppercase opacity-90">{eyebrow}</p>
                  <h1 className="mt-3 font-serif text-5xl md:text-7xl uppercase">
                    {beatNode ?? headline}
                  </h1>
                  {isLast && finalBody && (
                    <p className="mt-4 font-cb-sans text-lg md:text-xl max-w-xl">{finalBody}</p>
                  )}
                  <span aria-hidden className="cb-accent-rule mt-5" />
                </div>
              </div>
            </section>
          );
        })}
      </>
    );
  }

  const total = trimmed.length;
  const lastIndex = total - 1;
  const current = Math.min(Math.floor(progress), lastIndex);
  const next = Math.min(current + 1, lastIndex);
  const alpha = progress - current; // 0..1 crossfade weight toward `next`

  // Headline pick: snap to whichever frame is more visible. Use isLast/isFirst
  // to bring back the base headline at the start and end.
  const headlineIndex = alpha > 0.5 ? next : current;
  const headlineFrame = trimmed[headlineIndex];
  const isFirst = headlineIndex === 0;
  const isLast = headlineIndex === lastIndex;
  const beatNode = !isFirst && !isLast && headlineFrame.beat ? headlineFrame.beat : null;

  // Mobile: shorter pin distance to save scroll real estate.
  const pinMultiplier = isMobile ? 0.7 : 1;
  const wrapperHeight = `calc(${total} * ${pinMultiplier} * 100dvh)`;
  const progressPct = Math.min(progress / lastIndex, 1) * 100;

  return (
    <div
      ref={wrapperRef}
      className="relative w-full"
      style={{ height: wrapperHeight }}
    >
      <section className="sticky top-0 h-[100dvh] min-h-[480px] w-full overflow-hidden bg-black text-white">
        {/* Two stacked image layers, opacity-crossfade between current and next */}
        {trimmed.map((frame, i) => {
          let opacity = 0;
          if (i === current) opacity = 1 - alpha;
          else if (i === next) opacity = alpha;
          // Always mount adjacent frames so they decode in time.
          const mounted = i === current || i === next;
          if (!mounted) return null;
          return (
            <img
              key={`${frame.src}-${i}`}
              src={frame.src}
              alt={frame.alt ?? ""}
              className={`absolute inset-0 h-full w-full ${fit === "contain" ? "object-contain" : "object-cover"}`}
              style={{
                opacity,
                objectPosition,
                willChange: "opacity",
                transform: "translateZ(0)",
                transition: "opacity 120ms linear",
              }}
              loading={i === 0 && eager ? "eager" : "lazy"}
              decoding={i === 0 ? "sync" : "async"}
              fetchPriority={i === 0 && eager ? "high" : "auto"}
            />
          );
        })}
        {/* Preload all remaining frames once mounted, so the next swap is ready. */}
        {trimmed.map((frame, i) =>
          i === current || i === next ? null : (
            <link key={`pre-${i}`} rel="preload" as="image" href={frame.src} />
          )
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <span aria-hidden className="absolute top-0 left-0 h-[2px] w-full cb-accent-bg z-10" />

        <div className="relative z-10 flex h-full items-end px-6 pb-24 md:px-12 md:pb-28">
          <div>
            <p className="cb-accent-on-dark text-[10px] tracking-[0.4em] uppercase opacity-90">
              {eyebrow}
            </p>
            <h1
              key={`h-${headlineIndex}`}
              className="mt-3 font-serif text-5xl md:text-7xl uppercase animate-fade-in"
            >
              {beatNode ?? headline}
            </h1>
            {isLast && finalBody && (
              <p className="mt-4 font-cb-sans text-lg md:text-xl max-w-xl animate-fade-in">
                {finalBody}
              </p>
            )}
            <span aria-hidden className="cb-accent-rule mt-5" />
          </div>
        </div>

        {/* Property-accent progress bar, bottom-flush, grows 0 -> 100% */}
        <span
          aria-hidden
          className="absolute bottom-0 left-0 h-[2px] cb-accent-bg z-10"
          style={{ width: `${progressPct}%`, transition: "width 80ms linear" }}
        />

        {/* Scroll cue on first frame only */}
        {progress < 0.05 && (
          <a
            href="#cb-page-body"
            aria-label="Scroll for more"
            className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-white/80 hover:text-white transition-colors"
          >
            <span className="block animate-cb-bounce">
              <svg
                viewBox="0 0 24 24"
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </a>
        )}
      </section>
    </div>
  );
};

export default HeroSequence;
