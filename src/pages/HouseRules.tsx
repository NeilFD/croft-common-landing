import { Helmet } from "react-helmet-async";
import CBTopNav from "@/components/crazybear/CBTopNav";
import heroImage from "@/assets/cb-town-culture-look-1-burlesque.jpg";
import { CMSText } from "@/components/cms/CMSText";
import { useCMSList } from "@/hooks/useCMSList";
import { useCMSMode } from "@/contexts/CMSModeContext";

const DEFAULT_RULES = [
  "Inhibitions will get you nowhere",
  "Dress like your ex is watching",
  "Crazy Bear is for the 'gram, not on a gram",
  "No phones = No evidence",
  "Everyone's got problems, keep yours to yourself",
  "Be cool, no-one likes that guy",
  "Be safe, be respectful, be anything but your midweek self",
];

const HouseRules = () => {
  const { isCMSMode } = useCMSMode();
  const { items } = useCMSList(
    "house-rules",
    "rules",
    DEFAULT_RULES.map((text, i) => ({ id: `seed-${i}`, sort_order: i, content_data: { text } }))
  );
  const rules: string[] = items.length
    ? items.map((it: any) => it.content_data?.text ?? "")
    : DEFAULT_RULES;

  return (
    <>
      <Helmet>
        <title>House Rules | The Crazy Bear</title>
        <meta
          name="description"
          content="The Crazy Bear house rules. How to behave, dress and disappear."
        />
      </Helmet>

      <main className="min-h-screen bg-background text-foreground">
        <section className="relative h-[70vh] min-h-[480px] w-full overflow-hidden bg-black text-white">
          <img
            src={heroImage}
            alt="Crazy Bear, Town"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/85" />

          {!isCMSMode && <CBTopNav tone="light" />}

          <div className="relative z-10 flex h-full flex-col items-start justify-end px-6 md:px-12 pb-16 md:pb-20 max-w-5xl">
            <CMSText
              page="house-rules"
              section="hero"
              contentKey="eyebrow"
              fallback="Section 01 / Conduct"
              as="p"
              className="font-cb-mono text-[10px] md:text-xs tracking-[0.5em] uppercase opacity-85"
            />
            <CMSText
              page="house-rules"
              section="hero"
              contentKey="title"
              fallback="House Rules"
              as="h1"
              className="mt-6 font-display uppercase text-5xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tight"
            />
          </div>
        </section>

        <section className="pt-16 md:pt-24 pb-32 px-6 md:px-12">
          <div className="mx-auto max-w-3xl">
            <CMSText
              page="house-rules"
              section="body"
              contentKey="statement"
              fallback="We identify as anything you want us to be."
              as="p"
              className="font-display text-2xl md:text-4xl uppercase leading-tight tracking-tight max-w-2xl"
            />
            <CMSText
              page="house-rules"
              section="body"
              contentKey="caption"
              fallback="Read once. Never think twice."
              as="p"
              className="mt-5 font-cb-mono tracking-[0.5em] uppercase opacity-60 text-base"
            />

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

            <CMSText
              page="house-rules"
              section="body"
              contentKey="end"
              fallback="End."
              as="p"
              className="mt-20 font-cb-mono text-[10px] tracking-[0.5em] uppercase opacity-50"
            />
          </div>
        </section>

        {!isCMSMode && (
          <footer className="border-t border-foreground/10 py-10 px-6 md:px-12 font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60">
            <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:justify-between gap-3">
              <span>&copy; {new Date().getFullYear()} The Crazy Bear</span>
              <span>Stadhampton &middot; Beaconsfield</span>
            </div>
          </footer>
        )}
      </main>
    </>
  );
};

export default HouseRules;
