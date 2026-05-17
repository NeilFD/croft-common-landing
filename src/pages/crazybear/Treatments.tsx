import CBStaticPage from "@/components/crazybear/CBStaticPage";
import { CMSText } from "@/components/cms/CMSText";

const PAGE = "treatments";

const SPA_ITEMS = [
  { id: "signature", label: "Signature massage — 60 / 90 min" },
  { id: "hot-stone", label: "Hot stone — 90 min" },
  { id: "facial", label: "Bespoke facial — 60 min" },
  { id: "couples", label: "Couples' room — 90 min" },
];

const BEAUTY_ITEMS = [
  { id: "express-facial", label: "Express facial — 30 min" },
  { id: "manicure", label: "Manicure / Pedicure" },
  { id: "brows", label: "Brows & lashes" },
  { id: "pool-day", label: "Pool day — half / full" },
];

const Treatments = () => (
  <CBStaticPage
    title="Treatments"
    intro={"The Crazy Bear spa, plus little luxuries Town side.\nMassage, facials, and a long lie-down with somewhere to swim after."}
    seoDescription="Spa and treatments at Crazy Bear Country, with beauty add-ons at Crazy Bear Town. Massage, facials, and pool access."
    path="/treatments"
    cmsPage={PAGE}
  >
    <div className="space-y-12">
      <div>
        <CMSText page={PAGE} section="spa" contentKey="eyebrow" fallback="Country / Stadhampton" as="p" className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60" />
        <CMSText page={PAGE} section="spa" contentKey="title" fallback="The Spa" as="h2" className="mt-2 font-serif text-3xl uppercase" />
        <CMSText
          page={PAGE}
          section="spa"
          contentKey="body"
          fallback="Treatment rooms behind the inn. Massage, facials, body. Bookable with a stay or as a day visit. Add lunch on the terrace."
          as="p"
          className="mt-4 font-cb-sans text-lg opacity-85"
        />
        <ul className="mt-6 grid sm:grid-cols-2 gap-3 font-cb-sans text-base">
          {SPA_ITEMS.map((it) => (
            <li key={it.id} className="border border-foreground/15 p-4">
              <CMSText page={PAGE} section={`spa-${it.id}`} contentKey="label" fallback={it.label} as="span" />
            </li>
          ))}
        </ul>
      </div>

      <div>
        <CMSText page={PAGE} section="beauty" contentKey="eyebrow" fallback="Town / Beaconsfield" as="p" className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60" />
        <CMSText page={PAGE} section="beauty" contentKey="title" fallback="Beauty & the Pool" as="h2" className="mt-2 font-serif text-3xl uppercase" />
        <CMSText
          page={PAGE}
          section="beauty"
          contentKey="body"
          fallback="Quick fixes and proper polishing. Plus access to the hidden pool. Book it as part of a stay or as a half-day escape."
          as="p"
          className="mt-4 font-cb-sans text-lg opacity-85"
        />
        <ul className="mt-6 grid sm:grid-cols-2 gap-3 font-cb-sans text-base">
          {BEAUTY_ITEMS.map((it) => (
            <li key={it.id} className="border border-foreground/15 p-4">
              <CMSText page={PAGE} section={`beauty-${it.id}`} contentKey="label" fallback={it.label} as="span" />
            </li>
          ))}
        </ul>
      </div>

      <div className="text-center pt-4">
        <a
          href="/enquire"
          className="inline-block border border-foreground px-8 py-4 font-cb-mono text-[10px] tracking-[0.4em] uppercase hover:bg-foreground hover:text-background transition-colors"
        >
          <CMSText page={PAGE} section="cta" contentKey="button" fallback="Book a treatment" as="span" />
        </a>
      </div>
    </div>
  </CBStaticPage>
);

export default Treatments;
