import CBStaticPage from "@/components/crazybear/CBStaticPage";

const Press = () => (
  <CBStaticPage
    title="Press"
    intro={"Logos, lines, words on the record.\nFor anyone writing about us."}
    seoDescription="Press kit for The Crazy Bear. Logos, brand assets, recent coverage and a press contact."
    path="/press"
  >
    <div className="space-y-12">
      <div>
        <h2 className="font-serif text-3xl uppercase">The short version</h2>
        <p className="mt-4 font-cb-sans text-lg opacity-85">
          Two hotels, one spirit. The Crazy Bear Country opened in Stadhampton in 1994. The Crazy Bear Town followed
          in Beaconsfield. Three decades of theatrical bedrooms, fierce food, late nights and a dress code of: try.
        </p>
      </div>

      <div>
        <h2 className="font-serif text-3xl uppercase">Press contact</h2>
        <p className="mt-4 font-cb-sans text-lg opacity-85">
          For interviews, shoots, image requests and embargoed news:
        </p>
        <a
          href="mailto:press@crazybear.dev"
          className="mt-3 inline-block font-cb-mono text-[12px] tracking-[0.35em] uppercase underline underline-offset-4"
        >
          press@crazybear.dev
        </a>
      </div>

      <div>
        <h2 className="font-serif text-3xl uppercase">Downloads</h2>
        <ul className="mt-6 grid sm:grid-cols-2 gap-3 font-cb-sans">
          <li className="border border-foreground/15 p-4">Logo pack (PNG + SVG)</li>
          <li className="border border-foreground/15 p-4">Brand guidelines (PDF)</li>
          <li className="border border-foreground/15 p-4">Photography library (low-res)</li>
          <li className="border border-foreground/15 p-4">Founder bio</li>
        </ul>
        <p className="mt-3 font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60">
          Email us for the full library
        </p>
      </div>

      <div>
        <h2 className="font-serif text-3xl uppercase">Recent coverage</h2>
        <ul className="mt-6 space-y-4 font-cb-sans">
          <li className="border-t border-foreground/15 pt-4">
            <p className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60">Conde Nast Traveller</p>
            <p className="mt-1 text-lg">The country inn that refuses to behave</p>
          </li>
          <li className="border-t border-foreground/15 pt-4">
            <p className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60">Financial Times — How To Spend It</p>
            <p className="mt-1 text-lg">A weekend at Crazy Bear Country</p>
          </li>
          <li className="border-t border-foreground/15 pt-4">
            <p className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60">Time Out London</p>
            <p className="mt-1 text-lg">The Beaconsfield hideout you've been missing</p>
          </li>
        </ul>
      </div>
    </div>
  </CBStaticPage>
);

export default Press;
