import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  images: string[];
  intervalMs?: number;
  transitionMs?: number;
  alt?: string;
}

// Triptych hero: side image + wide centre image + side image, with defined gaps.
// Each panel uses a three-frame strip so the movement is only a direct slide.
const HeroCarousel = ({
  images,
  intervalMs = 12000,
  transitionMs = 3200,
  alt = "",
}: Props) => {
  const total = images.length;
  const [index, setIndex] = useState(0);
  const [slideOffset, setSlideOffset] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const pausedRef = useRef(false);
  const movingRef = useRef(false);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wrapIndex = useCallback((value: number) => ((value % total) + total) % total, [total]);

  const advance = useCallback(
    (dir: 1 | -1) => {
      if (total < 2 || movingRef.current) return;

      movingRef.current = true;
      setIsSliding(true);
      setSlideOffset(dir);

      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
      finishTimerRef.current = setTimeout(() => {
        setIsSliding(false);
        setIndex((i) => wrapIndex(i + dir));
        setSlideOffset(0);
        movingRef.current = false;
      }, transitionMs);
    },
    [total, transitionMs, wrapIndex],
  );

  useEffect(() => {
    if (total < 2) return;
    const id = setInterval(() => {
      if (!pausedRef.current) advance(1);
    }, intervalMs);
    return () => clearInterval(id);
  }, [total, intervalMs, advance]);

  useEffect(() => {
    return () => {
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    };
  }, []);

  if (total === 0) return null;

  const Panel = ({ offset }: { offset: number }) => {
    const panelIndex = index + offset;
    const strip = [images[wrapIndex(panelIndex - 1)], images[wrapIndex(panelIndex)], images[wrapIndex(panelIndex + 1)]];

    return (
      <div className="relative h-full w-full overflow-hidden bg-background">
        <div
          className="flex h-full"
          style={{
            width: "300%",
            transform: `translateX(-${(1 + slideOffset) * (100 / 3)}%)`,
            transition: isSliding
              ? `transform ${transitionMs}ms cubic-bezier(0.45, 0, 0.2, 1)`
              : "none",
          }}
        >
          {strip.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="h-full"
              style={{ width: `${100 / 3}%` }}
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
      <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-[1fr_3fr_1fr] gap-4 md:gap-6 bg-background">
        <div className="hidden md:block">
          <Panel offset={-1} />
        </div>
        <Panel offset={0} />
        <div className="hidden md:block">
          <Panel offset={1} />
        </div>
      </div>

      <button
        type="button"
        aria-label="Previous image"
        onClick={() => advance(-1)}
        className="absolute left-3 md:left-6 top-1/2 z-20 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-background/45 text-background-foreground backdrop-blur-sm transition-colors hover:bg-background/75"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Next image"
        onClick={() => advance(1)}
        className="absolute right-3 md:right-6 top-1/2 z-20 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-background/45 text-background-foreground backdrop-blur-sm transition-colors hover:bg-background/75"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
        </svg>
      </button>
    </div>
  );
};

export default HeroCarousel;
