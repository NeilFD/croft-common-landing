import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

interface Props {
  images: string[];
  intervalMs?: number;
  alt?: string;
}

// Triptych hero carousel: smooth single-track slide using Embla.
// Desktop shows three slides at once (with the active centred); mobile shows one.
const HeroCarousel = ({ images, intervalMs = 6500, alt = "" }: Props) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "center",
      containScroll: false,
      duration: 60,
      skipSnaps: false,
      startIndex: 0,
    },
    [
      Autoplay({
        delay: intervalMs,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    ],
  );

  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  // Preload neighbouring images to avoid blank frames mid-slide.
  useEffect(() => {
    if (!images.length) return;
    const total = images.length;
    const targets = [
      selected,
      (selected + 1) % total,
      (selected - 1 + total) % total,
      (selected + 2) % total,
    ];
    targets.forEach((i) => {
      const src = images[i];
      if (!src) return;
      const img = new Image();
      img.src = src;
      if ("decode" in img && typeof (img as HTMLImageElement).decode === "function") {
        (img as HTMLImageElement).decode().catch(() => {});
      }
    });
  }, [selected, images]);

  if (!images.length) return null;

  return (
    <div className="absolute inset-0">
      <div className="h-full overflow-hidden" ref={emblaRef}>
        <div className="flex h-full -ml-6 md:-ml-10">
          {images.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="relative h-full shrink-0 grow-0 basis-full md:basis-[60%] pl-6 md:pl-10"
            >
              <div className="h-full w-full overflow-hidden">
                <img
                  src={src}
                  alt={alt}
                  width={1920}
                  height={1280}
                  className="h-full w-full object-cover select-none"
                  draggable={false}
                  loading={i === 0 ? "eager" : i <= 2 ? "eager" : "lazy"}
                  decoding={i === 0 ? "sync" : "async"}
                  fetchPriority={i === 0 ? "high" : "auto"}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label="Previous image"
        onClick={() => emblaApi?.scrollPrev()}
        className="absolute left-3 md:left-6 top-1/2 z-20 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full bg-background/50 text-foreground backdrop-blur-sm transition-colors hover:bg-background/80"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Next image"
        onClick={() => emblaApi?.scrollNext()}
        className="absolute right-3 md:right-6 top-1/2 z-20 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full bg-background/50 text-foreground backdrop-blur-sm transition-colors hover:bg-background/80"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
        </svg>
      </button>
    </div>
  );
};

export default HeroCarousel;
