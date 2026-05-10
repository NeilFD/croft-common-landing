import { Link } from "react-router-dom";

const RULES = [
  "Inhibitions will get you nowhere",
  "Dress like your ex is watching",
  "Crazy Bear is for the 'gram, not on a gram",
  "No phones = No evidence",
  "Everyone's got problems, keep yours to yourself",
  "Be cool, no-one likes that guy",
  "Be safe, be respectful, be anything but your midweek self",
];

interface Props {
  tone?: "light" | "dark";
}

const HouseRulesInline = ({ tone = "dark" }: Props) => {
  const isLight = tone === "light";
  const wrap = isLight ? "bg-black text-white" : "bg-background text-foreground";
  const rule = isLight ? "border-white/15" : "border-foreground/15";

  return (
    <section className={`border-t ${rule} ${wrap}`}>
      <div className="mx-auto max-w-4xl px-6 py-20 md:py-28">
        <p className={`font-cb-mono text-[10px] tracking-[0.45em] uppercase ${isLight ? "opacity-70" : "opacity-60"}`}>
          Setting the tone
        </p>
        <h2 className="mt-3 font-display text-3xl md:text-5xl uppercase tracking-tight">
          House Rules.
        </h2>
        <p className={`mt-5 max-w-2xl font-cb-sans text-lg ${isLight ? "opacity-85" : "text-foreground/80"}`}>
          Read once. Never think twice.
        </p>

        <ol className={`mt-12 border-t ${rule}`}>
          {RULES.map((r, i) => (
            <li
              key={i}
              className={`flex gap-6 md:gap-10 py-6 md:py-7 border-b ${rule} items-baseline`}
            >
              <span className={`font-cb-mono text-xs ${isLight ? "opacity-50" : "opacity-50"} w-10 shrink-0`}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-cb-sans text-lg md:text-2xl leading-snug tracking-tight">
                {r}
              </span>
            </li>
          ))}
        </ol>

        <Link
          to="/house-rules"
          className={`mt-10 inline-block font-cb-mono text-[10px] tracking-[0.45em] uppercase ${isLight ? "opacity-70 hover:opacity-100" : "opacity-70 hover:opacity-100"} underline-offset-4 hover:underline`}
        >
          Read the full rules &rarr;
        </Link>
      </div>
    </section>
  );
};

export default HouseRulesInline;
