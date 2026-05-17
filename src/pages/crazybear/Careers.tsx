import CBStaticPage from "@/components/crazybear/CBStaticPage";

interface Role {
  title: string;
  site: "Town" | "Country" | "Both";
  type: string;
}

const ROLES: Role[] = [
  { title: "Restaurant Manager", site: "Country", type: "Full time" },
  { title: "Head Chef", site: "Town", type: "Full time" },
  { title: "Sous Chef", site: "Country", type: "Full time" },
  { title: "Bar Lead — Cocktails", site: "Town", type: "Full time" },
  { title: "Front of House", site: "Both", type: "Full / Part time" },
  { title: "Housekeeping", site: "Both", type: "Full / Part time" },
  { title: "Spa Therapist", site: "Country", type: "Part time" },
  { title: "Events Coordinator", site: "Both", type: "Full time" },
];

const Careers = () => (
  <CBStaticPage
    title="Careers"
    intro={"We are not a chain.\nWe do not behave like one.\nWork here if you want the work to matter."}
    seoDescription="Careers at The Crazy Bear. Front of house, kitchen, bar, spa and management roles at Town and Country."
    path="/careers"
  >
    <div className="space-y-12">
      <div>
        <h2 className="font-serif text-3xl uppercase">Why here</h2>
        <ul className="mt-6 space-y-4 font-cb-sans text-lg">
          <li className="border-t border-foreground/15 pt-4"><span className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60 block mb-1">One</span>Independent. Family run. No script.</li>
          <li className="border-t border-foreground/15 pt-4"><span className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60 block mb-1">Two</span>Proper training. Real progression. Across two sites.</li>
          <li className="border-t border-foreground/15 pt-4"><span className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60 block mb-1">Three</span>Tips that show. Meals that turn up. Holiday you can actually take.</li>
          <li className="border-t border-foreground/15 pt-4"><span className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60 block mb-1">Four</span>A team that knows hospitality is theatre. Bring presence.</li>
        </ul>
      </div>

      <div>
        <h2 className="font-serif text-3xl uppercase">Open roles</h2>
        <ul className="mt-6 divide-y divide-foreground/15 border-t border-b border-foreground/15">
          {ROLES.map((r) => (
            <li key={r.title} className="py-4 flex flex-wrap items-baseline gap-x-6 gap-y-1">
              <span className="font-serif text-2xl uppercase">{r.title}</span>
              <span className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60">{r.site}</span>
              <span className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60">{r.type}</span>
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
        <p className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-70">Don't see your role?</p>
        <p className="mt-3 font-cb-sans text-lg opacity-85">Send us a CV anyway. We're always looking for sharp ones.</p>
        <a
          href="mailto:careers@crazybear.dev"
          className="mt-6 inline-block border border-foreground px-8 py-4 font-cb-mono text-[10px] tracking-[0.4em] uppercase hover:bg-foreground hover:text-background transition-colors"
        >
          careers@crazybear.dev
        </a>
      </div>
    </div>
  </CBStaticPage>
);

export default Careers;
