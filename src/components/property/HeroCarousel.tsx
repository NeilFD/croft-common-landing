import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  images: string[];
  intervalMs?: number;
  transitionMs?: number;
  alt?: string;
}

// Triptych hero: left third + wide centre + right third, with thin gaps
// between panels. Each panel slides smoothly to the next image; chevron
// controls let you advance or reverse manually.
const HeroCarousel = ({
  images,
  intervalMs = 9000,
  transitionMs = 2200,
  alt = "",
}: Props) => {
  const [index, setIndex] = useState(0);
  const pausedRef = useRef(false);

  const advance = useCallback(
    (dir: 1 | -1) => {
      setIndex((i) => (i + dir + images.length) % images.length);
    },
    [images.length],
  );

  useEffect(() => {
    if (images.length < 2) return;
    const id = setInterval(() => {
      if (!pausedRef.current) advance(1);
    }, intervalMs);
    return () => clearInterval(id);
  }, [images.length, intervalMs, advance]);

  if (images.length === 0) return null;

  // A single panel that holds a horizontal strip of every image and
  // translates between them. The strip is duplicated so the loop wraps
  // without a visible reset.
  const Panel = ({ offset }: { offset: number }) => {
    const total = images.length;
    const ordered = Array.from({ length: total }, (_, i) => images[(i + offset) % total]);
    // Duplicate to allow seamless wrap from last back to first.
    const strip = [...ordered, ordered[0]];
    return (
      <div className="relative h-full w-full overflow-hidden bg-black">
        <div
          className="flex h-full"
          style={{
            width: `${strip.length * 100}%`,
            transform: `translateX(-${(index * 100) / strip.length}%)`,
            transition: `transform ${transitionMs}ms cubic-bezier(0.65, 0, 0.35, 1)`,
          }}
        >
          {strip.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="h-full"
              style={{ width: `${100 / strip.length}%` }}
            >
              <img
                src={src}
                alt={alt}
                className="h-full w-full object-cover"
                loading="eager"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
    >
      <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-[1fr_3fr_1fr] gap-2 bg-black">
        <div className="hidden md:block">
          <Panel offset={0} />
        </div>
        <Panel offset={1} />
        <div className="hidden md:block">
          <Panel offset={2} />
        </div>
      </div>

      {/* Chevron controls */}
      <button
        type="button"
        aria-label="Previous image"
        onClick={() => advance(-1)}
        className="absolute left-3 md:left-6 top-1/2 z-20 -translate-y-1/2 grid place-items-center h-11 w-11 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm transition-colors"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Next image"
        onClick={() => advance(1)}
        className="absolute right-3 md:right-6 top-1/2 z-20 -translate-y-1/2 grid place-items-center h-11 w-11 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm transition-colors"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
        </svg>
      </button>
    </div>
  );
};

export default HeroCarousel;
