import { useEffect, useState } from "react";

interface Props {
  images: string[];
  intervalMs?: number;
  alt?: string;
}

// Triptych hero: left third + wide centre + right third. Each panel rotates
// through the image set on its own offset, giving a slow, layered storefront
// feel that fills the full viewport width without awkward cropping.
const HeroCarousel = ({ images, intervalMs = 6000, alt = "" }: Props) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [images.length, intervalMs]);

  if (images.length === 0) return null;

  const at = (offset: number) => images[(index + offset) % images.length];

  const Panel = ({ src }: { src: string }) => (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <img
        key={src}
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover animate-cb-fade"
        loading="eager"
      />
    </div>
  );

  return (
    <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-[1fr_3fr_1fr] gap-[2px] bg-black">
      <div className="hidden md:block">
        <Panel src={at(0)} />
      </div>
      <Panel src={at(1)} />
      <div className="hidden md:block">
        <Panel src={at(2)} />
      </div>
    </div>
  );
};

export default HeroCarousel;
