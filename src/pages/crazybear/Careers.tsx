import CBStaticPage from "@/components/crazybear/CBStaticPage";
import { CMSText } from "@/components/cms/CMSText";

const PAGE = "careers";

interface Role {
  id: string;
  title: string;
  site: string;
  type: string;
}

const ROLES: Role[] = [
  { id: "restaurant-manager", title: "Restaurant Manager", site: "Country", type: "Full time" },
  { id: "head-chef", title: "Head Chef", site: "Town", type: "Full time" },
  { id: "sous-chef", title: "Sous Chef", site: "Country", type: "Full time" },
  { id: "bar-lead", title: "Bar Lead — Cocktails", site: "Town", type: "Full time" },
  { id: "foh", title: "Front of House", site: "Both", type: "Full / Part time" },
  { id: "housekeeping", title: "Housekeeping", site: "Both", type: "Full / Part time" },
  { id: "spa-therapist", title: "Spa Therapist", site: "Country", type: "Part time" },
  { id: "events-coordinator", title: "Events Coordinator", site: "Both", type: "Full time" },
];

const REASONS = [
  { id: "one", label: "One", body: "Independent. Family run. No script." },
  { id: "two", label: "Two", body: "Proper training. Real progression. Across two sites." },
  { id: "three", label: "Three", body: "Tips that show. Meals that turn up. Holiday you can actually take." },
  { id: "four", label: "Four", body: "A team that knows hospitality is theatre. Bring presence." },
];

const Careers = () => (
  <CBStaticPage
    title="Careers"
    intro={"We are not a chain.\nWe do not behave like one.\nWork here if you want the work to matter."}
    seoDescription="Careers at The Crazy Bear. Front of house, kitchen, bar, spa and management roles at Town and Country."
    path="/careers"
    cmsPage={PAGE}
  >
    <div className="space-y-12">
      <div>
        <CMSText page={PAGE} section="why" contentKey="title" fallback="Why here" as="h2" className="font-serif text-3xl uppercase" />
        <ul className="mt-6 space-y-4 font-cb-sans text-lg">
          {REASONS.map((r) => (
            <li key={r.id} className="border-t border-foreground/15 pt-4">
              <CMSText
                page={PAGE}
                section={`why-${r.id}`}
                contentKey="label"
                fallback={r.label}
                as="span"
                className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60 block mb-1"
              />
              <CMSText
                page={PAGE}
                section={`why-${r.id}`}
                contentKey="body"
                fallback={r.body}
                as="span"
              />
            </li>
          ))}
        </ul>
      </div>

      <div>
        <CMSText page={PAGE} section="roles" contentKey="title" fallback="Open roles" as="h2" className="font-serif text-3xl uppercase" />
        <ul className="mt-6 divide-y divide-foreground/15 border-t border-b border-foreground/15">
          {ROLES.map((r) => (
            <li key={r.id} className="py-4 flex flex-wrap items-baseline gap-x-6 gap-y-1">
              <CMSText
                page={PAGE}
                section={`role-${r.id}`}
                contentKey="title"
                fallback={r.title}
                as="span"
                className="font-serif text-2xl uppercase"
              />
              <CMSText
                page={PAGE}
                section={`role-${r.id}`}
                contentKey="site"
                fallback={r.site}
                as="span"
                className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60"
              />
              <CMSText
                page={PAGE}
                section={`role-${r.id}`}
                contentKey="type"
                fallback={r.type}
                as="span"
                className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60"
              />
              <span className="ml-auto">
                <a
                  href="mailto:careers@crazybear.dev"
                  className="font-cb-mono text-[10px] tracking-[0.4em] uppercase underline underline-offset-4"
                >
                  Apply
                </a>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="text-center pt-4">
        <CMSText page={PAGE} section="cta" contentKey="eyebrow" fallback="Don't see your role?" as="p" className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-70" />
        <CMSText
          page={PAGE}
          section="cta"
          contentKey="body"
          fallback="Send us a CV anyway. We're always looking for sharp ones."
          as="p"
          className="mt-3 font-cb-sans text-lg opacity-85"
        />
        <a
          href="mailto:careers@crazybear.dev"
          className="mt-6 inline-block border border-foreground px-8 py-4 font-cb-mono text-[10px] tracking-[0.4em] uppercase hover:bg-foreground hover:text-background transition-colors"
        >
          <CMSText page={PAGE} section="cta" contentKey="email" fallback="careers@crazybear.dev" as="span" />
        </a>
      </div>
    </div>
  </CBStaticPage>
);

export default Careers;
