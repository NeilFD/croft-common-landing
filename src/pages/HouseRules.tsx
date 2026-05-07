import { Helmet } from "react-helmet-async";
import CBTopNav from "@/components/crazybear/CBTopNav";

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
      <CBTopNav tone="dark" />

      <section className="pt-40 md:pt-48 pb-32 px-6 md:px-12">
        <div className="mx-auto max-w-3xl">
          <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase opacity-60">
            Section 01 / Conduct
          </p>
          <h1 className="mt-6 font-display text-5xl md:text-7xl uppercase leading-[0.9] tracking-tight">
            House
            <br />
            Rules
          </h1>

          <p className="mt-12 font-display text-2xl md:text-4xl uppercase leading-tight tracking-tight max-w-2xl">
            {statement}.
          </p>
          <p className="mt-5 font-cb-mono text-[10px] tracking-[0.5em] uppercase opacity-60">
            Read once.  Don't forget.
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
            End of transmission.
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
