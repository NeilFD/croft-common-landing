import CBStaticPage from "@/components/crazybear/CBStaticPage";

const Treatments = () => (
  <CBStaticPage
    title="Treatments"
    intro={"The Crazy Bear spa, plus little luxuries Town side.\nMassage, facials, and a long lie-down with somewhere to swim after."}
    seoDescription="Spa and treatments at Crazy Bear Country, with beauty add-ons at Crazy Bear Town. Massage, facials, and pool access."
    path="/treatments"
  >
    <div className="space-y-12">
      <div>
        <p className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60">Country / Stadhampton</p>
        <h2 className="mt-2 font-serif text-3xl uppercase">The Spa</h2>
        <p className="mt-4 font-cb-sans text-lg opacity-85">
          Treatment rooms behind the inn. Massage, facials, body. Bookable with a stay or as a day visit. Add lunch on the terrace.
        </p>
        <ul className="mt-6 grid sm:grid-cols-2 gap-3 font-cb-sans text-base">
          <li className="border border-foreground/15 p-4">Signature massage — 60 / 90 min</li>
          <li className="border border-foreground/15 p-4">Hot stone — 90 min</li>
          <li className="border border-foreground/15 p-4">Bespoke facial — 60 min</li>
          <li className="border border-foreground/15 p-4">Couples' room — 90 min</li>
        </ul>
      </div>

      <div>
        <p className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60">Town / Beaconsfield</p>
        <h2 className="mt-2 font-serif text-3xl uppercase">Beauty &amp; the Pool</h2>
        <p className="mt-4 font-cb-sans text-lg opacity-85">
          Quick fixes and proper polishing. Plus access to the hidden pool. Book it as part of a stay or as a half-day escape.
        </p>
        <ul className="mt-6 grid sm:grid-cols-2 gap-3 font-cb-sans text-base">
          <li className="border border-foreground/15 p-4">Express facial — 30 min</li>
          <li className="border border-foreground/15 p-4">Manicure / Pedicure</li>
          <li className="border border-foreground/15 p-4">Brows &amp; lashes</li>
          <li className="border border-foreground/15 p-4">Pool day — half / full</li>
        </ul>
      </div>

      <div className="text-center pt-4">
        <a
          href="/enquire"
          className="inline-block border border-foreground px-8 py-4 font-cb-mono text-[10px] tracking-[0.4em] uppercase hover:bg-foreground hover:text-background transition-colors"
        >
          Book a treatment
        </a>
      </div>
    </div>
  </CBStaticPage>
);

export default Treatments;
