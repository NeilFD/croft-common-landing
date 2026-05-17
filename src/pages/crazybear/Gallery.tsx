import CBStaticPage from "@/components/crazybear/CBStaticPage";
import { InstagramIcon, TikTokIcon } from "@/components/crazybear/icons/SocialIcons";

const TAGS = [
  { label: "Food", count: 9 },
  { label: "Rooms", count: 6 },
  { label: "Nights", count: 9 },
  { label: "Dogs", count: 4 },
];

const Gallery = () => (
  <CBStaticPage
    title="Gallery"
    intro={"What it looks like in here.\nFood, rooms, late nights and the occasional dog."}
    seoDescription="Crazy Bear social gallery. Food, rooms, late nights and dogs from Town and Country. Follow us on Instagram and TikTok."
    path="/gallery"
  >
    {/* Tag filter row (visual only — kept simple for v1) */}
    <ul className="flex flex-wrap gap-2 mb-10 justify-center">
      {TAGS.map((t) => (
        <li
          key={t.label}
          className="font-cb-mono text-[10px] tracking-[0.4em] uppercase border border-foreground/30 px-4 py-2"
        >
          {t.label} <span className="opacity-50">/ {t.count}</span>
        </li>
      ))}
    </ul>

    {/* Masonry-ish grid placeholder using brand greys */}
    <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {Array.from({ length: 18 }).map((_, i) => (
        <li
          key={i}
          className={`bg-foreground/10 ${i % 5 === 0 ? "aspect-[3/4]" : i % 4 === 0 ? "aspect-square" : "aspect-[4/3]"}`}
          aria-hidden="true"
        />
      ))}
    </ul>

    <div className="mt-16 text-center space-y-6">
      <p className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-70">Follow along</p>
      <div className="flex items-center justify-center gap-6">
        <a
          href="https://instagram.com/crazybearhotels"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-3 border border-foreground px-6 py-4 font-cb-mono text-[10px] tracking-[0.4em] uppercase hover:bg-foreground hover:text-background transition-colors"
        >
          <InstagramIcon className="h-5 w-5" />
          @crazybearhotels
        </a>
        <a
          href="https://tiktok.com/@crazybeargroup"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-3 border border-foreground px-6 py-4 font-cb-mono text-[10px] tracking-[0.4em] uppercase hover:bg-foreground hover:text-background transition-colors"
        >
          <TikTokIcon className="h-5 w-5" />
          @crazybeargroup
        </a>
      </div>
    </div>
  </CBStaticPage>
);

export default Gallery;
