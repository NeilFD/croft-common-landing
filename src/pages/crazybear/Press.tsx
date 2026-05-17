import CBStaticPage from "@/components/crazybear/CBStaticPage";
import { CMSText } from "@/components/cms/CMSText";

const PAGE = "press";

interface Cov {
  id: string;
  outlet: string;
  headline: string;
}

const COVERAGE: Cov[] = [
  { id: "cnt", outlet: "Conde Nast Traveller", headline: "The country inn that refuses to behave" },
  { id: "ft", outlet: "Financial Times — How To Spend It", headline: "A weekend at Crazy Bear Country" },
  { id: "to", outlet: "Time Out London", headline: "The Beaconsfield hideout you've been missing" },
];

const DOWNLOADS = [
  { id: "logos", label: "Logo pack (PNG + SVG)" },
  { id: "guidelines", label: "Brand guidelines (PDF)" },
  { id: "photos", label: "Photography library (low-res)" },
  { id: "bio", label: "Founder bio" },
];

const Press = () => (
  <CBStaticPage
    title="Press"
    intro={"Logos, lines, words on the record.\nFor anyone writing about us."}
    seoDescription="Press kit for The Crazy Bear. Logos, brand assets, recent coverage and a press contact."
    path="/press"
    cmsPage={PAGE}
  >
    <div className="space-y-12">
      <div>
        <CMSText page={PAGE} section="short" contentKey="title" fallback="The short version" as="h2" className="font-serif text-3xl uppercase" />
        <CMSText
          page={PAGE}
          section="short"
          contentKey="body"
          fallback="Two hotels, one spirit. The Crazy Bear Country opened in Stadhampton in 1994. The Crazy Bear Town followed in Beaconsfield. Three decades of theatrical bedrooms, fierce food, late nights and a dress code of: try."
          as="p"
          className="mt-4 font-cb-sans text-lg opacity-85 whitespace-pre-line"
        />
      </div>

      <div>
        <CMSText page={PAGE} section="contact" contentKey="title" fallback="Press contact" as="h2" className="font-serif text-3xl uppercase" />
        <CMSText
          page={PAGE}
          section="contact"
          contentKey="body"
          fallback="For interviews, shoots, image requests and embargoed news:"
          as="p"
          className="mt-4 font-cb-sans text-lg opacity-85"
        />
        <CMSText
          page={PAGE}
          section="contact"
          contentKey="email"
          fallback="press@crazybear.dev"
          as="a"
          href="mailto:press@crazybear.dev"
          className="mt-3 inline-block font-cb-mono text-[12px] tracking-[0.35em] uppercase underline underline-offset-4"
        />
      </div>

      <div>
        <CMSText page={PAGE} section="downloads" contentKey="title" fallback="Downloads" as="h2" className="font-serif text-3xl uppercase" />
        <ul className="mt-6 grid sm:grid-cols-2 gap-3 font-cb-sans">
          {DOWNLOADS.map((d) => (
            <li key={d.id} className="border border-foreground/15 p-4">
              <CMSText page={PAGE} section={`download-${d.id}`} contentKey="label" fallback={d.label} as="span" />
            </li>
          ))}
        </ul>
        <CMSText
          page={PAGE}
          section="downloads"
          contentKey="note"
          fallback="Email us for the full library"
          as="p"
          className="mt-3 font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60"
        />
      </div>

      <div>
        <CMSText page={PAGE} section="coverage" contentKey="title" fallback="Recent coverage" as="h2" className="font-serif text-3xl uppercase" />
        <ul className="mt-6 space-y-4 font-cb-sans">
          {COVERAGE.map((c) => (
            <li key={c.id} className="border-t border-foreground/15 pt-4">
              <CMSText
                page={PAGE}
                section={`coverage-${c.id}`}
                contentKey="outlet"
                fallback={c.outlet}
                as="p"
                className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60"
              />
              <CMSText
                page={PAGE}
                section={`coverage-${c.id}`}
                contentKey="headline"
                fallback={c.headline}
                as="p"
                className="mt-1 text-lg"
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  </CBStaticPage>
);

export default Press;
