import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { CMSText } from "@/components/cms/CMSText";
import { useEditMode } from "@/contexts/EditModeContext";
import { useCMSList, type CMSListDisplay, type CMSListSeed } from "@/hooks/useCMSList";
import { useCMSAssets } from "@/hooks/useCMSAssets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SpotifyPlaylistEmbed from "@/components/crazybear/culture/SpotifyPlaylistEmbed";
import { useCMSContent } from "@/hooks/useCMSContent";
import HouseRulesInline from "@/components/crazybear/culture/HouseRulesInline";
import townHero from "@/assets/cb-hero-town-new.jpg";
import countryHero from "@/assets/cb-hero-country-new.jpg";

type Site = "town" | "country";

interface Copy {
  page: string;
  title: string;
  metaDescription: string;
  canonical: string;
  eyebrow: string;
  headline: string;
  tagline: string;
  introKicker: string;
  introBody: string;
  collageHeading: string;
  collageKicker: string;
  playlistHeading: string;
  playlistKicker: string;
  playlistFallback: string;
  timelineKicker: string;
  timelineHeading: string;
  quotesKicker: string;
  quotesHeading: string;
  closingKicker: string;
  closingHeading: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
  hero: string;
  collageSeed: CMSListSeed[];
  timelineSeed: CMSListSeed[];
  quotesSeed: CMSListSeed[];
}

const TOWN: Copy = {
  page: "town-culture",
  title: "Town Culture | The Crazy Bear, Beaconsfield",
  metaDescription:
    "Town culture. Koi behind the urinals, Hom Thai upstairs, silver-leaf walls and late nights in Beaconsfield. Twenty years of black on black on black.",
  canonical: "https://www.crazybear.dev/town/culture",
  eyebrow: "Beaconsfield / Est. 2002",
  headline: "Town. After dark.",
  tagline:
    "A coaching inn, gutted and reborn in black, silver and Thai gold. Live fish in the cisterns. Glass loos. The kind of weekend you don't put in the brochure.",
  introKicker: "The soul of Town",
  introBody: `In 2002 a wonky old coaching inn in the middle of Beaconsfield was taken on, stripped back, blacked out and lined in silver leaf. Glass loos went in. Koi went in behind the urinals. The Thai room went in upstairs.

Town was always meant to be a townhouse, not a hotel. Eight bedrooms, a couple of bars, two restaurants and a pool out the back. Heels on the staircase by ten. Cocktails by eleven. Breakfast a quiet apology by noon.

It still is.`,
  collageHeading: "The look.",
  collageKicker: "Black on black on black",
  playlistHeading: "The soundtrack.",
  playlistKicker: "Britpop, lounge, late nights",
  playlistFallback: "https://open.spotify.com/playlist/37i9dQZF1DWYBO1MoTDhZI",
  timelineKicker: "The greatest hits",
  timelineHeading: "Stories from upstairs.",
  quotesKicker: "What they wrote",
  quotesHeading: "Town in print.",
  closingKicker: "Stay up late",
  closingHeading: "Come for the cocktails. Stay for the consequences.",
  ctaPrimaryLabel: "Book a room",
  ctaPrimaryHref: "/town/rooms",
  ctaSecondaryLabel: "Eat with us",
  ctaSecondaryHref: "/town/food",
  hero: townHero,
  collageSeed: [
    { heading: "Silver leaf", body: "The bar walls. Hand-applied. Catches every candle.", meta: {} },
    { heading: "The koi", body: "Behind the urinals. Conversation starters since 2002.", meta: {} },
    { heading: "Hom Thai", body: "Lanterns, gold leaf, proper heat upstairs.", meta: {} },
    { heading: "The pool", body: "Out the back. Optional swimwear. Not optional shower.", meta: {} },
  ],
  timelineSeed: [
    {
      heading: "The townhouse opens.",
      body: "Eight bedrooms. Two bars. Two kitchens. The whole place repainted in black and silver in under a year.",
      meta: { year: "2002" },
    },
    {
      heading: "Glass loos go in.",
      body: "You can see out. They can't see in. Allegedly.",
      meta: { year: "2002" },
    },
    {
      heading: "Hom Thai upstairs.",
      body: "Quietly one of the best Thai dining rooms in the country. Quietly.",
      meta: { year: "2003" },
    },
    {
      heading: "The burlesque years.",
      body: "Saturday nights, feathers, heels, late finishes. Word travelled fast in the M40 corridor.",
      meta: { year: "Mid-00s" },
    },
    {
      heading: "Cocktails get serious.",
      body: "The bar list grows up. The drinkers, mostly, do not.",
      meta: { year: "2010s" },
    },
    {
      heading: "Today.",
      body: "Same building. Same spirit. Slightly tighter ship. Slightly.",
      meta: { year: "Now" },
    },
  ],
  quotesSeed: [
    { heading: "A boutique hotel with a wicked sense of humour.", body: "", meta: { attribution: "The Times" } },
    { heading: "Black, silver, gold and entirely off-grid in the best way.", body: "", meta: { attribution: "Tatler" } },
    { heading: "Worth the trip from London just for the bar.", body: "", meta: { attribution: "ES Magazine" } },
  ],
};

const COUNTRY: Copy = {
  page: "country-culture",
  title: "Country Culture | The Crazy Bear, Stadhampton",
  metaDescription:
    "Country culture. Turf floors, treehouse suites, cows in the dining room and thirty years of long Sundays in Stadhampton, Oxfordshire.",
  canonical: "https://www.crazybear.dev/country/culture",
  eyebrow: "Stadhampton / Est. 1993",
  headline: "Country. Misbehaving since 1993.",
  tagline:
    "A 16th century inn, a turf floor, a cow in the dining room and a treehouse with a roll-top bath. Thirty years of Sundays that wouldn't end.",
  introKicker: "The soul of Country",
  introBody: `In 1993 a wonky little pub in Stadhampton was given a name, a kitchen, and a real turf floor. People came for a pint and stayed for the spectacle. Sheep wandered in. Nobody stopped them.

The dining room got a cow. The bedrooms got mirrors in places mirrors don't usually go. The garden got treehouses with roll-top baths above the canopy. Breakfast was brought up by hand, slowly.

The pub still pours. The kitchen still takes itself seriously. Nothing else does.`,
  collageHeading: "The look.",
  collageKicker: "Antlers, mirrors, candlelight",
  playlistHeading: "The soundtrack.",
  playlistKicker: "Britpop, folk, long Sundays",
  playlistFallback: "https://open.spotify.com/playlist/37i9dQZF1DWXHYAFP0XcrJ",
  timelineKicker: "The greatest hits",
  timelineHeading: "Stories from the garden.",
  quotesKicker: "What they wrote",
  quotesHeading: "Country in print.",
  closingKicker: "Stay the night",
  closingHeading: "Sunday lunch. Treehouse bath. Repeat.",
  ctaPrimaryLabel: "Book a treehouse",
  ctaPrimaryHref: "/country/rooms",
  ctaSecondaryLabel: "Eat with us",
  ctaSecondaryHref: "/country/pub/food",
  hero: countryHero,
  collageSeed: [
    { heading: "The turf floor", body: "Real grass. Real opening night. Allegedly real sheep.", meta: {} },
    { heading: "The cow", body: "Taxidermy. Dining room. Don't ask.", meta: {} },
    { heading: "Treehouse suites", body: "Roll-top bath above the canopy. Champagne by lift.", meta: {} },
    { heading: "The garden", body: "Slow lunches. Longer afternoons. Fires lit by four.", meta: {} },
  ],
  timelineSeed: [
    {
      heading: "The pub reopens.",
      body: "A wonky little local in Stadhampton gets a name, a kitchen, and a turf floor.",
      meta: { year: "1993" },
    },
    {
      heading: "The cow moves in.",
      body: "Mirrors, antlers, chandeliers. The Crazy Bear look starts to harden.",
      meta: { year: "Late 90s" },
    },
    {
      heading: "Treehouse suites.",
      body: "Bedrooms in the trees. Roll-top baths above the canopy. Breakfast brought up by hand.",
      meta: { year: "00s" },
    },
    {
      heading: "Weddings.",
      body: "Marquees, fireworks, cake at midnight. Vows occasionally remembered.",
      meta: { year: "00s" },
    },
    {
      heading: "Today.",
      body: "Two restaurants, a pub, treehouses, and the same spirit. Slightly tidier. Slightly.",
      meta: { year: "Now" },
    },
  ],
  quotesSeed: [
    { heading: "One of the most extraordinary pubs in Britain.", body: "", meta: { attribution: "The Times" } },
    { heading: "Bonkers, brilliant, beautifully done.", body: "", meta: { attribution: "The Telegraph" } },
    { heading: "A treehouse with a bath. We may never leave.", body: "", meta: { attribution: "Conde Nast Traveller" } },
  ],
};

const PinkDot = () => (
  <span
    aria-hidden
    className="inline-block w-2 h-2 rounded-full bg-pink-500 ml-2 align-middle shadow-[0_0_0_3px_rgba(236,72,153,0.18)]"
  />
);

interface Props {
  site: Site;
}

const CulturePage = ({ site }: Props) => {
  const c = site === "town" ? TOWN : COUNTRY;
  const { isEditMode } = useEditMode();
  const { assets } = useCMSAssets(c.page, "hero");
  const hero = assets[0]?.src ?? c.hero;

  return (
    <>
      <Helmet>
        <title>{c.title}</title>
        <meta name="description" content={c.metaDescription} />
        <link rel="canonical" href={c.canonical} />
      </Helmet>

      <article className="bg-background text-foreground font-cb-sans">
        {/* Hero */}
        <section className="relative h-[82vh] min-h-[520px] w-full overflow-hidden bg-black text-white">
          <img src={hero} alt={`${site === "town" ? "Town" : "Country"} culture`} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/30 to-black/85" />
          <div className="relative z-10 flex h-full flex-col items-start justify-end px-6 pb-20 md:px-16 md:pb-24 max-w-5xl">
            <CMSText
              page={c.page}
              section="hero"
              contentKey="eyebrow"
              fallback={c.eyebrow}
              as="p"
              className="font-cb-mono text-[10px] md:text-xs tracking-[0.5em] uppercase opacity-85"
            />
            <CMSText
              page={c.page}
              section="hero"
              contentKey="headline"
              fallback={c.headline}
              as="h1"
              className="mt-5 font-display uppercase text-5xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tight"
            />
            <CMSText
              page={c.page}
              section="hero"
              contentKey="tagline"
              fallback={c.tagline}
              as="p"
              className="mt-6 max-w-2xl font-cb-sans text-lg md:text-xl leading-relaxed opacity-90"
            />
          </div>
        </section>

        {/* Intro */}
        <section className="mx-auto max-w-3xl px-6 pt-16 pb-12">
          <CMSText
            page={c.page}
            section="intro"
            contentKey="kicker"
            fallback={c.introKicker}
            as="p"
            className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60"
          />
          <CMSText
            page={c.page}
            section="intro"
            contentKey="body"
            fallback={c.introBody}
            as="p"
            className="mt-5 font-cb-sans text-lg md:text-xl leading-relaxed text-foreground/90 whitespace-pre-line"
          />
        </section>

        {/* Collage */}
        <Collage page={c.page} editable={isEditMode} kicker={c.collageKicker} heading={c.collageHeading} seed={c.collageSeed} />

        {/* Playlist */}
        <PlaylistSection
          page={c.page}
          fallbackUrl={c.playlistFallback}
          heading={c.playlistHeading}
          kicker={c.playlistKicker}
          editable={isEditMode}
          site={site}
        />

        {/* Timeline */}
        <Timeline page={c.page} editable={isEditMode} kicker={c.timelineKicker} heading={c.timelineHeading} seed={c.timelineSeed} />

        {/* House Rules */}
        <HouseRulesInline tone="dark" />

        {/* Quotes */}
        <Quotes page={c.page} editable={isEditMode} kicker={c.quotesKicker} heading={c.quotesHeading} seed={c.quotesSeed} />

        {/* Closing CTA */}
        <section className="border-t border-foreground/10 bg-black text-white">
          <div className="mx-auto max-w-5xl px-6 py-20 md:py-28 text-center">
            <CMSText
              page={c.page}
              section="closing"
              contentKey="kicker"
              fallback={c.closingKicker}
              as="p"
              className="font-cb-mono text-[10px] tracking-[0.5em] uppercase opacity-70"
            />
            <CMSText
              page={c.page}
              section="closing"
              contentKey="headline"
              fallback={c.closingHeading}
              as="h2"
              className="mt-5 font-display uppercase text-3xl md:text-5xl tracking-tight"
            />
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                to={c.ctaPrimaryHref}
                className="inline-block font-cb-mono text-[10px] tracking-[0.5em] uppercase border border-white px-7 py-4 hover:bg-white hover:text-black transition-colors"
              >
                {c.ctaPrimaryLabel}
              </Link>
              <Link
                to={c.ctaSecondaryHref}
                className="inline-block font-cb-mono text-[10px] tracking-[0.5em] uppercase border border-white/40 px-7 py-4 hover:bg-white/10 transition-colors"
              >
                {c.ctaSecondaryLabel}
              </Link>
            </div>
          </div>
        </section>
      </article>
    </>
  );
};

/* -------------------------------- Collage -------------------------------- */

const Collage = ({
  page, editable, heading, kicker, seed,
}: { page: string; editable: boolean; heading: string; kicker: string; seed: CMSListSeed[] }) => {
  const mode = editable ? "cms" : "live";
  const { items, addItem, updateItem, removeItem } = useCMSList(page, "collage", { mode, fallback: seed });
  const { assets } = useCMSAssets(page, "collage");

  if (!items.length && !editable) return null;

  return (
    <section className="border-t border-foreground/10 bg-background">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <p className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60">{kicker}</p>
        <h2 className="mt-3 font-display text-3xl md:text-5xl uppercase tracking-tight">{heading}</h2>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {items.map((item, i) => {
            const img = assets[i % Math.max(1, assets.length)]?.src;
            return (
              <CollageCard
                key={item.id}
                item={item}
                img={img}
                editable={editable}
                onSave={(patch) => updateItem(item.id, patch)}
                onRemove={() => removeItem(item.id)}
              />
            );
          })}
        </div>

        {editable && (
          <div className="mt-8">
            <Button variant="outline" size="sm" onClick={() => addItem({ heading: "New tile", body: "" })} className="gap-2">
              <Plus className="h-4 w-4" /> Add tile
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

const CollageCard = ({
  item, img, editable, onSave, onRemove,
}: {
  item: CMSListDisplay;
  img?: string;
  editable: boolean;
  onSave: (p: { heading?: string; body?: string }) => void;
  onRemove: () => void;
}) => {
  const [editingH, setEditingH] = useState(false);
  const [editingB, setEditingB] = useState(false);
  return (
    <figure className="relative group">
      <div className="aspect-[3/4] w-full overflow-hidden bg-foreground/10">
        {img ? (
          <img src={img} alt={item.heading} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="h-full w-full grid place-items-center font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-50">
            Add image
          </div>
        )}
      </div>
      <figcaption className="mt-3">
        {editable && editingH ? (
          <Input autoFocus defaultValue={item.heading}
            onBlur={(e) => { onSave({ heading: e.target.value }); setEditingH(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditingH(false); }}
            className="font-display text-sm" />
        ) : (
          <p onClick={() => editable && setEditingH(true)}
            className={`font-display text-base md:text-lg uppercase tracking-tight ${editable ? "cursor-text" : ""}`}>
            {item.heading}{editable && <PinkDot />}
          </p>
        )}
        {(editable || item.body) && (editable && editingB ? (
          <Textarea autoFocus defaultValue={item.body}
            onBlur={(e) => { onSave({ body: e.target.value }); setEditingB(false); }}
            onKeyDown={(e) => { if (e.key === "Escape") setEditingB(false); }}
            className="mt-2 text-xs min-h-[60px]" />
        ) : (
          <p onClick={() => editable && setEditingB(true)}
            className={`mt-1 font-cb-sans text-xs md:text-sm opacity-70 ${editable ? "cursor-text" : ""}`}>
            {item.body}{editable && <PinkDot />}
          </p>
        ))}
      </figcaption>
      {editable && (
        <button type="button" onClick={() => { if (confirm("Delete this tile?")) onRemove(); }}
          aria-label="Delete tile"
          className="absolute top-2 right-2 p-1.5 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </figure>
  );
};

/* -------------------------------- Timeline ------------------------------- */

const Timeline = ({
  page, editable, heading, kicker, seed,
}: { page: string; editable: boolean; heading: string; kicker: string; seed: CMSListSeed[] }) => {
  const mode = editable ? "cms" : "live";
  const { items, addItem, updateItem, removeItem, reorder } = useCMSList(page, "timeline", { mode, fallback: seed });
  const [dragId, setDragId] = useState<string | null>(null);

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) { setDragId(null); return; }
    const ids = items.map((i) => i.id);
    const fromIdx = ids.indexOf(dragId);
    const toIdx = ids.indexOf(targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...ids];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setDragId(null);
    reorder(next);
  };

  if (!items.length && !editable) return null;

  return (
    <section className="border-t border-foreground/10 bg-background">
      <div className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        <p className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60">{kicker}</p>
        <h2 className="mt-3 font-display text-3xl md:text-5xl uppercase tracking-tight">{heading}</h2>

        <ol className="mt-12 relative border-l border-foreground/15 pl-8 md:pl-12 space-y-12">
          {items.map((item) => (
            <TimelineEntry
              key={item.id}
              item={item}
              editable={editable}
              isDragging={dragId === item.id}
              onDragStart={() => setDragId(item.id)}
              onDragEnd={() => setDragId(null)}
              onDragOver={(e) => { if (dragId) e.preventDefault(); }}
              onDrop={() => handleDrop(item.id)}
              onSave={(patch) => updateItem(item.id, patch)}
              onRemove={() => removeItem(item.id)}
            />
          ))}
        </ol>

        {editable && (
          <div className="mt-10">
            <Button variant="outline" size="sm" onClick={() => addItem()} className="gap-2">
              <Plus className="h-4 w-4" /> Add entry
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

const TimelineEntry = ({
  item, editable, isDragging, onDragStart, onDragEnd, onDragOver, onDrop, onSave, onRemove,
}: {
  item: CMSListDisplay;
  editable: boolean;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onSave: (patch: { heading?: string; body?: string; meta?: Record<string, any> }) => void;
  onRemove: () => void;
}) => {
  const [editingYear, setEditingYear] = useState(false);
  const [editingHeading, setEditingHeading] = useState(false);
  const [editingBody, setEditingBody] = useState(false);
  const year = item.meta?.year ?? "";

  return (
    <li
      draggable={editable}
      onDragStart={editable ? onDragStart : undefined}
      onDragEnd={editable ? onDragEnd : undefined}
      onDragOver={editable ? onDragOver : undefined}
      onDrop={editable ? onDrop : undefined}
      className={`relative ${isDragging ? "opacity-40" : ""}`}
    >
      <span aria-hidden className="absolute -left-[37px] md:-left-[49px] top-2 h-3 w-3 rounded-full bg-pink-500 shadow-[0_0_0_4px_hsl(var(--background))]" />

      <div className="flex items-start gap-3">
        {editable && (
          <span className="cursor-grab active:cursor-grabbing text-foreground/40 hover:text-foreground/80 select-none mt-1" aria-hidden>
            <GripVertical className="h-4 w-4" />
          </span>
        )}
        <div className="flex-1 min-w-0">
          {editable && editingYear ? (
            <Input autoFocus defaultValue={year}
              onBlur={(e) => { onSave({ meta: { ...item.meta, year: e.target.value } }); setEditingYear(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditingYear(false); }}
              className="font-cb-mono text-xs tracking-[0.35em] uppercase max-w-[200px]" />
          ) : (
            <p onClick={() => editable && setEditingYear(true)}
              className={`font-cb-mono text-[11px] tracking-[0.4em] uppercase opacity-60 ${editable ? "cursor-text" : ""}`}>
              {year || (editable ? "Year" : "")}{editable && <PinkDot />}
            </p>
          )}

          {editable && editingHeading ? (
            <Input autoFocus defaultValue={item.heading}
              onBlur={(e) => { onSave({ heading: e.target.value }); setEditingHeading(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditingHeading(false); }}
              className="mt-2 font-display text-2xl md:text-3xl" />
          ) : (
            <h3 onClick={() => editable && setEditingHeading(true)}
              className={`mt-2 font-display text-2xl md:text-3xl uppercase tracking-tight text-foreground ${editable ? "cursor-text" : ""}`}>
              {item.heading}{editable && <PinkDot />}
            </h3>
          )}

          {editable && editingBody ? (
            <Textarea autoFocus defaultValue={item.body}
              onBlur={(e) => { onSave({ body: e.target.value }); setEditingBody(false); }}
              onKeyDown={(e) => { if (e.key === "Escape") setEditingBody(false); }}
              className="mt-3 font-cb-sans text-base md:text-lg min-h-[100px]" />
          ) : (
            <p onClick={() => editable && setEditingBody(true)}
              className={`mt-3 font-cb-sans text-base md:text-lg leading-relaxed text-foreground/85 ${editable ? "cursor-text" : ""}`}>
              {item.body}{editable && <PinkDot />}
            </p>
          )}
        </div>

        {editable && (
          <button type="button" onClick={() => { if (confirm("Delete this entry?")) onRemove(); }}
            aria-label="Delete entry"
            className="p-2 text-foreground/40 hover:text-destructive transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {editable && item.isDraft && (
        <span className="absolute -top-2 right-0 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-pink-500/15 text-pink-700">Draft</span>
      )}
    </li>
  );
};

/* --------------------------------- Quotes -------------------------------- */

const Quotes = ({
  page, editable, heading, kicker, seed,
}: { page: string; editable: boolean; heading: string; kicker: string; seed: CMSListSeed[] }) => {
  const mode = editable ? "cms" : "live";
  const { items, addItem, updateItem, removeItem } = useCMSList(page, "quotes", { mode, fallback: seed });

  if (!items.length && !editable) return null;

  return (
    <section className="border-t border-foreground/10 bg-background">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <p className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60">{kicker}</p>
        <h2 className="mt-3 font-display text-3xl md:text-5xl uppercase tracking-tight text-foreground">{heading}</h2>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
          {items.map((item) => (
            <QuoteCard key={item.id} item={item} editable={editable}
              onSave={(patch) => updateItem(item.id, patch)} onRemove={() => removeItem(item.id)} />
          ))}
        </div>

        {editable && (
          <div className="mt-10">
            <Button variant="outline" size="sm"
              onClick={() => addItem({ heading: "New quote", meta: { attribution: "Source" } })}
              className="gap-2">
              <Plus className="h-4 w-4" /> Add quote
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

const QuoteCard = ({
  item, editable, onSave, onRemove,
}: {
  item: CMSListDisplay;
  editable: boolean;
  onSave: (patch: { heading?: string; meta?: Record<string, any> }) => void;
  onRemove: () => void;
}) => {
  const [editingQuote, setEditingQuote] = useState(false);
  const [editingAttr, setEditingAttr] = useState(false);
  const attribution = item.meta?.attribution ?? "";

  return (
    <figure className="relative border-t border-foreground/20 pt-6">
      {editable && editingQuote ? (
        <Textarea autoFocus defaultValue={item.heading}
          onBlur={(e) => { onSave({ heading: e.target.value }); setEditingQuote(false); }}
          onKeyDown={(e) => { if (e.key === "Escape") setEditingQuote(false); }}
          className="font-display text-xl md:text-2xl min-h-[120px]" />
      ) : (
        <blockquote onClick={() => editable && setEditingQuote(true)}
          className={`font-display text-xl md:text-2xl leading-snug uppercase tracking-tight text-foreground ${editable ? "cursor-text" : ""}`}>
          &ldquo;{item.heading}&rdquo;{editable && <PinkDot />}
        </blockquote>
      )}

      {editable && editingAttr ? (
        <Input autoFocus defaultValue={attribution} placeholder="Attribution"
          onBlur={(e) => { onSave({ meta: { ...item.meta, attribution: e.target.value } }); setEditingAttr(false); }}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditingAttr(false); }}
          className="mt-4 font-cb-mono text-[11px] tracking-[0.3em] uppercase max-w-xs" />
      ) : (
        <figcaption onClick={() => editable && setEditingAttr(true)}
          className={`mt-4 font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60 ${editable ? "cursor-text" : ""}`}>
          {attribution || (editable ? "Attribution" : "")}{editable && <PinkDot />}
        </figcaption>
      )}

      {editable && (
        <button type="button" onClick={() => { if (confirm("Delete this quote?")) onRemove(); }}
          aria-label="Delete quote"
          className="absolute -top-1 right-0 p-1 text-foreground/40 hover:text-destructive transition-colors">
          <Trash2 className="h-4 w-4" />
        </button>
      )}
      {editable && item.isDraft && (
        <span className="absolute top-1 left-0 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-pink-500/15 text-pink-700">Draft</span>
      )}
    </figure>
  );
};

export default CulturePage;
