import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";

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
    <ol className="space-y-4">
      {rules.map((r, i) => {
        const text =
          i < lineIdx ? r : i === lineIdx ? r.slice(0, charIdx) : "";
        const isTyping = i === lineIdx && charIdx < r.length;
        return (
          <li
            key={i}
            className="font-serif text-xl md:text-2xl leading-snug text-black min-h-[1.6em]"
          >
            {text}
            {isTyping && (
              <span className="inline-block w-[2px] h-[1em] -mb-[2px] ml-[2px] bg-black animate-pulse" />
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
    <main className="min-h-screen bg-white text-black flex flex-col">
      <header className="px-8 pt-10 flex items-center justify-between">
        <p className="text-[10px] tracking-[0.4em] uppercase opacity-70">
          Crazy Bear
        </p>
        <Link
          to="/members"
          className="text-[10px] tracking-[0.4em] uppercase opacity-70 hover:opacity-100"
        >
          Members
        </Link>
      </header>

      <section className="flex-1 px-6 md:px-16 py-16">
        <div className="max-w-3xl">
          <p className="text-[10px] tracking-[0.5em] uppercase opacity-60 mb-6">
            House Rules
          </p>
          <h1 className="font-serif text-4xl md:text-6xl leading-[1.05] text-[hsl(330,80%,55%)]">
            We identify as anything you want us to be
          </h1>
          <div className="mt-12">
            <TypewriterRules />
          </div>
        </div>
      </section>

      <footer className="px-6 md:px-16 pb-16">
        <div className="flex flex-col md:flex-row gap-10 md:gap-20">
          <Link
            to="/country"
            className="group flex flex-col items-start text-left"
          >
            <span className="text-[10px] tracking-[0.4em] uppercase opacity-60 group-hover:opacity-100">
              Enter
            </span>
            <span className="mt-3 font-serif text-5xl md:text-6xl border-b-2 border-black/20 pb-2 group-hover:border-black">
              Country
            </span>
            <span className="mt-2 text-xs tracking-[0.3em] uppercase opacity-60">
              Stadhampton
            </span>
          </Link>
          <Link
            to="/town"
            className="group flex flex-col items-start text-left"
          >
            <span className="text-[10px] tracking-[0.4em] uppercase opacity-60 group-hover:opacity-100">
              Enter
            </span>
            <span className="mt-3 font-serif text-5xl md:text-6xl border-b-2 border-black/20 pb-2 group-hover:border-black">
              Town
            </span>
            <span className="mt-2 text-xs tracking-[0.3em] uppercase opacity-60">
              Beaconsfield
            </span>
          </Link>
        </div>
      </footer>
    </main>
  </>
);

export default Landing;
