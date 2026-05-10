import { Helmet } from "react-helmet-async";
import CBTopNav from "@/components/crazybear/CBTopNav";
import heroImage from "@/assets/cb-town-culture-look-1-burlesque.jpg";

const statement = "We identify as anything you want us to be";

const rules = [
  "Inhibitions will get you nowhere",
  "Dress like your ex is watching",
  "Crazy Bear is for the 'gram, not on a gram",
  "No phones = No evidence",
  "Everyone's got problems, keep yours to yourself",
  "Be cool, no-one likes that guy",
  "Be safe, be respectful, be anything but your midweek self",
];

const HouseRules = () => (
  <>
    <Helmet>
      <title>House Rules | The Crazy Bear</title>
      <meta
        name="description"
        content="The Crazy Bear house rules. How to behave, dress and disappear."
      />
    </Helmet>

    <main className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative h-[70vh] min-h-[480px] w-full overflow-hidden bg-black text-white">
        <img
          src={heroImage}
          alt="Crazy Bear, Town"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/85" />

        <CBTopNav tone="light" />

        <div className="relative z-10 flex h-full flex-col items-start justify-end px-6 md:px-12 pb-16 md:pb-20 max-w-5xl">
          <p className="font-cb-mono text-[10px] md:text-xs tracking-[0.5em] uppercase opacity-85">
            Section 01 / Conduct
          </p>
          <h1 className="mt-6 font-display uppercase text-5xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tight">
            House
            <br />
            Rules
          </h1>
        </div>
      </section>

      <section className="pt-16 md:pt-24 pb-32 px-6 md:px-12">
        <div className="mx-auto max-w-3xl">
          <p className="font-display text-2xl md:text-4xl uppercase leading-tight tracking-tight max-w-2xl">
            {statement}.
          </p>
          <p className="mt-5 font-cb-mono tracking-[0.5em] uppercase opacity-60 text-base">
            Read once. Never think twice.
          </p>

          <ol className="mt-16 border-t border-foreground/15">
            {rules.map((rule, i) => (
              <li
                key={i}
                className="flex gap-6 md:gap-10 py-7 md:py-9 border-b border-foreground/15 items-baseline"
              >
                <span className="font-cb-mono text-xs opacity-50 w-10 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-cb-sans text-xl md:text-2xl leading-snug tracking-tight">
                  {rule}
                </span>
              </li>
            ))}
          </ol>

          <p className="mt-20 font-cb-mono text-[10px] tracking-[0.5em] uppercase opacity-50">
            End.
          </p>
        </div>
      </section>

      <footer className="border-t border-foreground/10 py-10 px-6 md:px-12 font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:justify-between gap-3">
          <span>&copy; {new Date().getFullYear()} The Crazy Bear</span>
          <span>Stadhampton &middot; Beaconsfield</span>
        </div>
      </footer>
    </main>
  </>
);

export default HouseRules;
