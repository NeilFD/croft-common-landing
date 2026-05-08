import type { GalleryItem } from "@/data/galleryData";

interface Props {
  items: GalleryItem[];
  eyebrow?: string;
  title?: string;
}

const CBGallery = ({ items, eyebrow, title }: Props) => {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24 text-foreground">
      {(eyebrow || title) && (
        <header className="mb-10 text-center">
          {eyebrow && (
            <p className="text-[10px] tracking-[0.4em] uppercase opacity-70">{eyebrow}</p>
          )}
          {title && <h2 className="mt-3 font-serif text-3xl md:text-5xl">{title}</h2>}
        </header>
      )}
      <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.src} className="group">
            <div className="relative aspect-[4/5] overflow-hidden bg-muted">
              <img
                src={item.src}
                alt={item.alt}
                loading="lazy"
                decoding="async"
                width={1200}
                height={1500}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
            </div>
            <p className="mt-3 font-cb-sans text-sm md:text-base tracking-wide">
              {item.caption}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default CBGallery;
