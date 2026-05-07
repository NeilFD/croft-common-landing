import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import heroImage from "@/assets/stadhampton-property.jpg";

const rules = [
  "Inhibitions will get you nowhere",
  "Dress like your ex is watching",
  "Crazy Bear is for the 'gram, not on a gram",
  "No phones = No evidence",
  "Everyone's got problems, keep yours to yourself",
  "Be cool, no-one likes that guy",
  "Be safe, be respectful, be anything but your midweek self",
];

const TYPING_SPEED = 22;
const LINE_PAUSE = 350;

const TypewriterRules = () => {
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);

  useEffect(() => {
    if (lineIdx >= rules.length) return;
    const current = rules[lineIdx];
    if (charIdx < current.length) {
      const t = setTimeout(() => setCharIdx((c) => c + 1), TYPING_SPEED);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setLineIdx((l) => l + 1);
      setCharIdx(0);
    }, LINE_PAUSE);
    return () => clearTimeout(t);
  }, [lineIdx, charIdx]);

  return (
    <ol className="space-y-3">
      {rules.map((r, i) => {
        const text =
          i < lineIdx ? r : i === lineIdx ? r.slice(0, charIdx) : "";
        const isTyping = i === lineIdx && charIdx < r.length;
        return (
          <li
            key={i}
            className="font-serif text-lg md:text-xl leading-snug text-white min-h-[1.6em]"
          >
            {text}
            {isTyping && (
              <span className="inline-block w-[2px] h-[1em] -mb-[2px] ml-[2px] bg-white animate-pulse" />
            )}
          </li>
        );
      })}
    </ol>
  );
};

const Landing = () => (
  <>
    <Helmet>
      <title>Crazy Bear | House Rules</title>
      <meta
        name="description"
        content="The Crazy Bear house rules. Country in Stadhampton, Town in Beaconsfield."
      />
    </Helmet>
    <main className="relative min-h-screen text-white overflow-hidden">
      {/* Hero background */}
      <img
        src={heroImage}
        alt="Crazy Bear country house"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/65" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/80" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="px-8 pt-10 flex items-center justify-between max-w-3xl mx-auto w-full">
          <p className="text-[10px] tracking-[0.4em] uppercase opacity-80">
            Crazy Bear
          </p>
          <Link
            to="/members"
            className="text-[10px] tracking-[0.4em] uppercase opacity-80 hover:opacity-100"
          >
            Members
          </Link>
        </header>

        <section className="flex-1 flex items-center px-6 py-16">
          <div className="mx-auto w-full max-w-2xl text-left">
            <p className="text-[10px] tracking-[0.5em] uppercase opacity-70 mb-6">
              House Rules
            </p>
            <h1 className="font-serif text-4xl md:text-6xl leading-[1.05] text-[hsl(330,85%,62%)] drop-shadow-[0_2px_20px_rgba(0,0,0,0.4)]">
              We identify as anything you want us to be
            </h1>
            <div className="mt-10">
              <TypewriterRules />
            </div>
          </div>
        </section>

        <footer className="px-6 pb-16">
          <div className="mx-auto w-full max-w-2xl flex flex-col sm:flex-row gap-10 sm:gap-16">
            <Link
              to="/country"
              className="group flex flex-col items-start text-left"
            >
              <span className="text-[10px] tracking-[0.4em] uppercase opacity-70 group-hover:opacity-100">
                Enter
              </span>
              <span className="mt-3 font-serif text-5xl md:text-6xl border-b-2 border-white/30 pb-2 group-hover:border-white">
                Country
              </span>
              <span className="mt-2 text-xs tracking-[0.3em] uppercase opacity-70">
                Stadhampton
              </span>
            </Link>
            <Link
              to="/town"
              className="group flex flex-col items-start text-left"
            >
              <span className="text-[10px] tracking-[0.4em] uppercase opacity-70 group-hover:opacity-100">
                Enter
              </span>
              <span className="mt-3 font-serif text-5xl md:text-6xl border-b-2 border-white/30 pb-2 group-hover:border-white">
                Town
              </span>
              <span className="mt-2 text-xs tracking-[0.3em] uppercase opacity-70">
                Beaconsfield
              </span>
            </Link>
          </div>
        </footer>
      </div>
    </main>
  </>
);

export default Landing;
