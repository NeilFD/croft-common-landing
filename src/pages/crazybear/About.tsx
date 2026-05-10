import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import CBTopNav from "@/components/crazybear/CBTopNav";
import CBFooter from "@/components/crazybear/CBFooter";
import CBBreadcrumb from "@/components/seo/CBBreadcrumb";
import { CMSText } from "@/components/cms/CMSText";
import { useEditMode } from "@/contexts/EditModeContext";
import { useCMSList, type CMSListDisplay, type CMSListSeed } from "@/hooks/useCMSList";
import { useCMSAssets } from "@/hooks/useCMSAssets";
import heroImage from "@/assets/hero-exterior.jpg";
import townLook1 from "@/assets/cb-town-culture-look-1-burlesque.jpg";
import townLook2 from "@/assets/cb-town-culture-look-2-homthai.jpg";
import townLook3 from "@/assets/cb-town-culture-look-3-redroom.jpg";
import townLook4 from "@/assets/cb-town-culture-look-4-rococo.jpg";
import countryLook1 from "@/assets/cb-country-culture-look-1-routemaster.jpg";
import countryLook2 from "@/assets/cb-country-culture-look-2-bedroom.jpg";
import countryLook3 from "@/assets/cb-country-culture-look-3-feast.jpg";
import countryLook4 from "@/assets/cb-country-culture-look-4-terrace.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const PAGE = "about";

const PinkDot = () => (
  <span
    aria-hidden
    className="inline-block w-2 h-2 rounded-full bg-pink-500 ml-2 align-middle shadow-[0_0_0_3px_rgba(236,72,153,0.18)]"
  />
);

const TIMELINE_SEED: CMSListSeed[] = [
  {
    heading: "A pub, a punt, a turf floor.",
    body: "The Stadhampton local reopens. Real grass laid across the bar floor. Sheep optional, occasionally arriving anyway.",
    meta: { year: "1993", source: "" },
  },
  {
    heading: "The cow in the dining room.",
    body: "Taxidermy, mirrors, chandeliers in places chandeliers don't belong. The Crazy Bear look starts to harden.",
    meta: { year: "Late 90s", source: "" },
  },
  {
    heading: "Town arrives.",
    body: "A wonky coaching inn in Beaconsfield is taken on and rebuilt as a townhouse hotel. Glass loos. Silver leaf walls. Black on black on black.",
    meta: { year: "2002", source: "" },
  },
  {
    heading: "Live fish in the cisterns.",
    body: "Koi swim behind the gents' urinals at Town. Talking point. Conversation starter. Still there.",
    meta: { year: "Town", source: "" },
  },
  {
    heading: "The Thai room opens.",
    body: "Hom Thai lands upstairs at Town. Gold leaf, lanterns, proper heat. Quietly one of the best Thai rooms in the country.",
    meta: { year: "Town", source: "" },
  },
  {
    heading: "The burlesque years.",
    body: "Saturday nights you don't put in the brochure. Feathers, heels, late finishes, longer mornings.",
    meta: { year: "00s", source: "" },
  },
  {
    heading: "Bedrooms in the trees.",
    body: "Treehouse suites at Country. Roll-top baths above the canopy. Breakfast brought up by hand.",
    meta: { year: "Country", source: "" },
  },
  {
    heading: "Today.",
    body: "Two hotels. Same spirit. Slightly better behaved. Only slightly.",
    meta: { year: "Now", source: "" },
  },
];

const QUOTES_SEED: CMSListSeed[] = [
  {
    heading: "One of the most extraordinary hotels in Britain.",
    body: "",
    meta: { attribution: "The Times" },
  },
  {
    heading: "Bonkers, brilliant, beautifully done.",
    body: "",
    meta: { attribution: "The Telegraph" },
  },
  {
    heading: "Glamour with a wink. And teeth.",
    body: "",
    meta: { attribution: "Tatler" },
  },
];

const About = () => {
  const { isEditMode } = useEditMode();
  const { assets } = useCMSAssets(PAGE, "hero");
  const hero = assets[0]?.src ?? heroImage;

  return (
    <>
      <Helmet>
        <title>About | The Crazy Bear</title>
        <meta
          name="description"
          content="Born in 1993. Two hotels, one spirit. The story of The Crazy Bear at Stadhampton and Beaconsfield. Turf floors, fish cisterns and thirty years of mischief."
        />
        <link rel="canonical" href="https://www.crazybear.dev/about" />
      </Helmet>

      <main className="bg-background text-foreground font-cb-sans">
        {/* Hero manifesto */}
        <section className="relative h-[88vh] min-h-[560px] w-full overflow-hidden bg-black text-white">
          <img
            src={hero}
            alt="The Crazy Bear, established 1993"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/85" />

          <CBTopNav tone="light" />

          <div className="relative z-10 flex h-full flex-col items-start justify-end px-6 pb-24 md:px-16 md:pb-28 max-w-5xl">
            <CMSText
              page={PAGE}
              section="hero"
              contentKey="eyebrow"
              fallback="Est. 1993 / Stadhampton + Beaconsfield"
              as="p"
              className="font-cb-mono text-[10px] md:text-xs tracking-[0.5em] uppercase opacity-85"
            />
            <CMSText
              page={PAGE}
              section="hero"
              contentKey="headline"
              fallback="Born in 1993. Yet to grow up."
              as="h1"
              className="mt-6 font-display uppercase text-5xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tight"
            />
            <CMSText
              page={PAGE}
              section="hero"
              contentKey="sub"
              fallback="Two hotels. One spirit. A thirty year run of bad behaviour, good food, and the occasional fish in the cistern."
              as="p"
              className="mt-7 max-w-2xl font-cb-sans text-lg md:text-xl leading-relaxed opacity-90"
            />
          </div>

          <a
            href="#about-body"
            aria-label="Scroll for more"
            className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-white/80 hover:text-white transition-colors"
          >
            <span className="block animate-cb-bounce">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </a>
        </section>

        <CBBreadcrumb />

        {/* Origin paragraph */}
        <section id="about-body" className="mx-auto max-w-3xl px-6 pt-16 pb-12 scroll-mt-16">
          <CMSText
            page={PAGE}
            section="intro"
            contentKey="kicker"
            fallback="The story so far."
            as="p"
            className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60"
          />
          <CMSText
            page={PAGE}
            section="intro"
            contentKey="body"
            fallback={`In 1993, Jason Hunt bought a wonky little pub in the Oxfordshire village of Stadhampton, called it The Crazy Bear, and laid real turf across the floor. People came for a pint and stayed for the spectacle. The kitchen took itself seriously. Nothing else did.

Nine years later, a coaching inn in Beaconsfield was given the same treatment, in reverse: stripped back, blacked out, lined in silver leaf, fitted with glass loos and live koi swimming behind the urinals. Town was born.

Two hotels. One spirit. Pubs and rooms and Thai kitchens and treehouses and burlesque nights and breakfasts that go on too long. Born in 1993. Yet to grow up.`}
            as="p"
            className="mt-5 font-cb-sans text-lg md:text-xl leading-relaxed text-foreground/90 whitespace-pre-line"
          />
        </section>

        {/* Visual collage — Town + Country */}
        <section className="border-t border-foreground/10 bg-background">
          <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
            <p className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60">Two hotels. One spirit.</p>
            <h2 className="mt-3 font-display text-3xl md:text-5xl uppercase tracking-tight text-foreground">
              The look.
            </h2>

            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              {[
                { src: townLook1, alt: "Burlesque night at Town" },
                { src: countryLook1, alt: "Reception by Routemaster at Country" },
                { src: townLook2, alt: "Hom Thai at Town" },
                { src: countryLook2, alt: "Copper bath bedroom at Country" },
                { src: townLook3, alt: "Red room at Town" },
                { src: countryLook3, alt: "Long Thai lunch at Country" },
                { src: townLook4, alt: "Rococo interior at Town" },
                { src: countryLook4, alt: "Firepit terrace at Country" },
              ].map((img, i) => (
                <div
                  key={i}
                  className={`relative overflow-hidden bg-black ${
                    i === 0 || i === 5 ? "row-span-2 aspect-[3/4]" : "aspect-square"
                  }`}
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>
              ))}
            </div>

            <p className="mt-8 font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60">
              Town &mdash; Beaconsfield &nbsp;/&nbsp; Country &mdash; Stadhampton
            </p>
          </div>
        </section>

        {/* Timeline */}
        <Timeline editable={isEditMode} />

        {/* Quote wall */}
        <Quotes editable={isEditMode} />

        {/* Closing CTA */}
        <section className="border-t border-foreground/10 bg-black text-white">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <Link
              to="/town"
              className="group flex items-center justify-between px-7 md:px-12 py-12 md:py-16 hover:bg-white/[0.06] transition-colors"
            >
              <div>
                <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase opacity-70">Beaconsfield</p>
                <p className="mt-2 font-display text-4xl md:text-6xl uppercase tracking-tight">Town</p>
              </div>
              <span className="font-cb-mono text-xs tracking-[0.4em] uppercase opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                Enter &rarr;
              </span>
            </Link>
            <Link
              to="/country"
              className="group flex items-center justify-between px-7 md:px-12 py-12 md:py-16 border-t md:border-t-0 md:border-l border-white/20 hover:bg-white/[0.06] transition-colors"
            >
              <div>
                <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase opacity-70">Stadhampton</p>
                <p className="mt-2 font-display text-4xl md:text-6xl uppercase tracking-tight">Country</p>
              </div>
              <span className="font-cb-mono text-xs tracking-[0.4em] uppercase opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                Enter &rarr;
              </span>
            </Link>
          </div>
        </section>

        <CBFooter />
      </main>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

const Timeline = ({ editable }: { editable: boolean }) => {
  const mode = editable ? "cms" : "live";
  const { items, addItem, updateItem, removeItem, reorder } = useCMSList(PAGE, "timeline", {
    mode,
    fallback: TIMELINE_SEED,
  });
  const [dragId, setDragId] = useState<string | null>(null);

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
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
        <p className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60">A short history of</p>
        <h2 className="mt-3 font-display text-3xl md:text-5xl uppercase tracking-tight text-foreground">
          Bad ideas that worked.
        </h2>

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
              <Plus className="h-4 w-4" /> Add timeline entry
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

interface TimelineEntryProps {
  item: CMSListDisplay;
  editable: boolean;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onSave: (patch: { heading?: string; body?: string; meta?: Record<string, any> }) => void;
  onRemove: () => void;
}

const TimelineEntry = ({
  item, editable, isDragging,
  onDragStart, onDragEnd, onDragOver, onDrop,
  onSave, onRemove,
}: TimelineEntryProps) => {
  const [editingYear, setEditingYear] = useState(false);
  const [editingHeading, setEditingHeading] = useState(false);
  const [editingBody, setEditingBody] = useState(false);
  const [editingSource, setEditingSource] = useState(false);

  const year = item.meta?.year ?? "";
  const source = item.meta?.source ?? "";

  return (
    <li
      draggable={editable}
      onDragStart={editable ? onDragStart : undefined}
      onDragEnd={editable ? onDragEnd : undefined}
      onDragOver={editable ? onDragOver : undefined}
      onDrop={editable ? onDrop : undefined}
      className={`relative ${isDragging ? "opacity-40" : ""}`}
    >
      {/* Dot on the rail */}
      <span
        aria-hidden
        className="absolute -left-[37px] md:-left-[49px] top-2 h-3 w-3 rounded-full bg-pink-500 shadow-[0_0_0_4px_hsl(var(--background))]"
      />

      <div className="flex items-start gap-3">
        {editable && (
          <span className="cursor-grab active:cursor-grabbing text-foreground/40 hover:text-foreground/80 select-none mt-1" aria-hidden>
            <GripVertical className="h-4 w-4" />
          </span>
        )}
        <div className="flex-1 min-w-0">
          {/* Year / label */}
          {editable && editingYear ? (
            <Input
              autoFocus
              defaultValue={year}
              onBlur={(e) => { onSave({ meta: { ...item.meta, year: e.target.value } }); setEditingYear(false); }}
              onKeyDown={(e) => {
                if (e.key === "Enter") { (e.target as HTMLInputElement).blur(); }
                if (e.key === "Escape") setEditingYear(false);
              }}
              className="font-cb-mono text-xs tracking-[0.35em] uppercase max-w-[200px]"
            />
          ) : (
            <p
              onClick={() => editable && setEditingYear(true)}
              className={`font-cb-mono text-[11px] tracking-[0.4em] uppercase opacity-60 ${editable ? "cursor-text" : ""}`}
            >
              {year || (editable ? "Year" : "")}
              {editable && <PinkDot />}
            </p>
          )}

          {/* Heading */}
          {editable && editingHeading ? (
            <Input
              autoFocus
              defaultValue={item.heading}
              onBlur={(e) => { onSave({ heading: e.target.value }); setEditingHeading(false); }}
              onKeyDown={(e) => {
                if (e.key === "Enter") { (e.target as HTMLInputElement).blur(); }
                if (e.key === "Escape") setEditingHeading(false);
              }}
              className="mt-2 font-display text-2xl md:text-3xl"
            />
          ) : (
            <h3
              onClick={() => editable && setEditingHeading(true)}
              className={`mt-2 font-display text-2xl md:text-3xl uppercase tracking-tight text-foreground ${editable ? "cursor-text" : ""}`}
            >
              {item.heading}
              {editable && <PinkDot />}
            </h3>
          )}

          {/* Body */}
          {editable && editingBody ? (
            <Textarea
              autoFocus
              defaultValue={item.body}
              onBlur={(e) => { onSave({ body: e.target.value }); setEditingBody(false); }}
              onKeyDown={(e) => { if (e.key === "Escape") setEditingBody(false); }}
              className="mt-3 font-cb-sans text-base md:text-lg min-h-[100px]"
            />
          ) : (
            <p
              onClick={() => editable && setEditingBody(true)}
              className={`mt-3 font-cb-sans text-base md:text-lg leading-relaxed text-foreground/85 ${editable ? "cursor-text" : ""}`}
            >
              {item.body}
              {editable && <PinkDot />}
            </p>
          )}

          {/* Source */}
          {(editable || source) && (
            editable && editingSource ? (
              <Input
                autoFocus
                defaultValue={source}
                placeholder="Source (e.g. The Times, 2004)"
                onBlur={(e) => { onSave({ meta: { ...item.meta, source: e.target.value } }); setEditingSource(false); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { (e.target as HTMLInputElement).blur(); }
                  if (e.key === "Escape") setEditingSource(false);
                }}
                className="mt-3 font-cb-mono text-[11px] tracking-[0.2em] uppercase max-w-md"
              />
            ) : (
              <p
                onClick={() => editable && setEditingSource(true)}
                className={`mt-3 font-cb-mono text-[10px] tracking-[0.3em] uppercase opacity-50 ${editable ? "cursor-text" : ""}`}
              >
                {source ? `Source / ${source}` : (editable ? "Add source" : "")}
                {editable && <PinkDot />}
              </p>
            )
          )}
        </div>

        {editable && (
          <button
            type="button"
            onClick={() => { if (confirm("Delete this entry?")) onRemove(); }}
            aria-label="Delete entry"
            className="p-2 text-foreground/40 hover:text-destructive transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {editable && item.isDraft && (
        <span className="absolute -top-2 right-0 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-pink-500/15 text-pink-700">
          Draft
        </span>
      )}
    </li>
  );
};

/* ------------------------------------------------------------------ */
/* Quotes wall                                                         */
/* ------------------------------------------------------------------ */

const Quotes = ({ editable }: { editable: boolean }) => {
  const mode = editable ? "cms" : "live";
  const { items, addItem, updateItem, removeItem } = useCMSList(PAGE, "quotes", {
    mode,
    fallback: QUOTES_SEED,
  });

  if (!items.length && !editable) return null;

  return (
    <section className="border-t border-foreground/10 bg-background">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <p className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60">In the press</p>
        <h2 className="mt-3 font-display text-3xl md:text-5xl uppercase tracking-tight text-foreground">
          What they said.
        </h2>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
          {items.map((item) => (
            <QuoteCard
              key={item.id}
              item={item}
              editable={editable}
              onSave={(patch) => updateItem(item.id, patch)}
              onRemove={() => removeItem(item.id)}
            />
          ))}
        </div>

        {editable && (
          <div className="mt-10">
            <Button variant="outline" size="sm" onClick={() => addItem({ heading: "New quote", meta: { attribution: "Source" } })} className="gap-2">
              <Plus className="h-4 w-4" /> Add quote
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

interface QuoteCardProps {
  item: CMSListDisplay;
  editable: boolean;
  onSave: (patch: { heading?: string; meta?: Record<string, any> }) => void;
  onRemove: () => void;
}

const QuoteCard = ({ item, editable, onSave, onRemove }: QuoteCardProps) => {
  const [editingQuote, setEditingQuote] = useState(false);
  const [editingAttr, setEditingAttr] = useState(false);
  const attribution = item.meta?.attribution ?? "";

  return (
    <figure className="relative border-t border-foreground/20 pt-6">
      {editable && editingQuote ? (
        <Textarea
          autoFocus
          defaultValue={item.heading}
          onBlur={(e) => { onSave({ heading: e.target.value }); setEditingQuote(false); }}
          onKeyDown={(e) => { if (e.key === "Escape") setEditingQuote(false); }}
          className="font-display text-xl md:text-2xl min-h-[120px]"
        />
      ) : (
        <blockquote
          onClick={() => editable && setEditingQuote(true)}
          className={`font-display text-xl md:text-2xl leading-snug uppercase tracking-tight text-foreground ${editable ? "cursor-text" : ""}`}
        >
          &ldquo;{item.heading}&rdquo;
          {editable && <PinkDot />}
        </blockquote>
      )}

      {editable && editingAttr ? (
        <Input
          autoFocus
          defaultValue={attribution}
          placeholder="Attribution"
          onBlur={(e) => { onSave({ meta: { ...item.meta, attribution: e.target.value } }); setEditingAttr(false); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") { (e.target as HTMLInputElement).blur(); }
            if (e.key === "Escape") setEditingAttr(false);
          }}
          className="mt-4 font-cb-mono text-[11px] tracking-[0.3em] uppercase max-w-xs"
        />
      ) : (
        <figcaption
          onClick={() => editable && setEditingAttr(true)}
          className={`mt-4 font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60 ${editable ? "cursor-text" : ""}`}
        >
          {attribution || (editable ? "Attribution" : "")}
          {editable && <PinkDot />}
        </figcaption>
      )}

      {editable && (
        <button
          type="button"
          onClick={() => { if (confirm("Delete this quote?")) onRemove(); }}
          aria-label="Delete quote"
          className="absolute -top-1 right-0 p-1 text-foreground/40 hover:text-destructive transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}

      {editable && item.isDraft && (
        <span className="absolute top-1 left-0 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-pink-500/15 text-pink-700">
          Draft
        </span>
      )}
    </figure>
  );
};

export default About;
