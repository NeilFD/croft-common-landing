import CBStaticPage from "@/components/crazybear/CBStaticPage";
import { CMSText } from "@/components/cms/CMSText";
import { InstagramIcon, TikTokIcon } from "@/components/crazybear/icons/SocialIcons";

const PAGE = "gallery";

const TAGS = [
  { id: "food", label: "Food", count: 9 },
  { id: "rooms", label: "Rooms", count: 6 },
  { id: "nights", label: "Nights", count: 9 },
  { id: "dogs", label: "Dogs", count: 4 },
];

const Gallery = () => (
  <CBStaticPage
    title="Gallery"
    intro={"What it looks like in here.\nFood, rooms, late nights and the occasional dog."}
    seoDescription="Crazy Bear social gallery. Food, rooms, late nights and dogs from Town and Country. Follow us on Instagram and TikTok."
    path="/gallery"
    cmsPage={PAGE}
  >
    <ul className="flex flex-wrap gap-2 mb-10 justify-center">
      {TAGS.map((t) => (
        <li
          key={t.id}
          className="font-cb-mono text-[10px] tracking-[0.4em] uppercase border border-foreground/30 px-4 py-2"
        >
          <CMSText page={PAGE} section={`tag-${t.id}`} contentKey="label" fallback={t.label} as="span" />{" "}
          <span className="opacity-50">/ {t.count}</span>
        </li>
      ))}
    </ul>

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
      <CMSText page={PAGE} section="social" contentKey="eyebrow" fallback="Follow along" as="p" className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-70" />
      <div className="flex items-center justify-center gap-6">
        <a
          href="https://instagram.com/crazybearhotels"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-3 border border-foreground px-6 py-4 font-cb-mono text-[10px] tracking-[0.4em] uppercase hover:bg-foreground hover:text-background transition-colors"
        >
          <InstagramIcon className="h-5 w-5" />
          <CMSText page={PAGE} section="social" contentKey="instagram" fallback="@crazybearhotels" as="span" />
        </a>
        <a
          href="https://tiktok.com/@crazybeargroup"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-3 border border-foreground px-6 py-4 font-cb-mono text-[10px] tracking-[0.4em] uppercase hover:bg-foreground hover:text-background transition-colors"
        >
          <TikTokIcon className="h-5 w-5" />
          <CMSText page={PAGE} section="social" contentKey="tiktok" fallback="@crazybeargroup" as="span" />
        </a>
      </div>
    </div>
  </CBStaticPage>
);

export default Gallery;
