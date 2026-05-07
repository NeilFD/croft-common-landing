import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const houseRules = [
  "We identify as anything you want us to be",
  "Inhibitions will get you nowhere",
  "Dress like your ex is watching",
  "Crazy Bear is for the 'gram, not on a gram",
  "No phones = No evidence",
  "Everyone's got problems, keep yours to yourself",
  "Be cool, no-one likes that guy",
  "Be safe, be respectful, be anything but your midweek self",
];

const Landing = () => (
  <>
    <Helmet>
      <title>Crazy Bear | House Rules</title>
      <meta
        name="description"
        content="The Crazy Bear house rules. Country in Stadhampton, Town in Beaconsfield."
      />
    </Helmet>
    <main className="min-h-screen bg-black text-white flex flex-col">
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

      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <p className="text-[10px] tracking-[0.5em] uppercase opacity-60 mb-8">
          House Rules
        </p>
        <ol className="max-w-2xl w-full space-y-5 text-center">
          {houseRules.map((rule, i) => (
            <li
              key={i}
              className="font-serif text-xl md:text-2xl leading-snug"
            >
              {rule}
            </li>
          ))}
        </ol>
      </section>

      <footer className="px-8 pb-12">
        <div className="mx-auto max-w-3xl flex flex-col sm:flex-row gap-4 sm:gap-12 items-center justify-center">
          <Link
            to="/country"
            className="group flex flex-col items-center text-center"
          >
            <span className="text-[10px] tracking-[0.4em] uppercase opacity-60 group-hover:opacity-100">
              Enter
            </span>
            <span className="mt-2 font-serif text-2xl border-b border-white/30 pb-1 group-hover:border-white">
              Country
            </span>
            <span className="mt-1 text-[10px] tracking-[0.3em] uppercase opacity-60">
              Stadhampton
            </span>
          </Link>
          <span className="hidden sm:block h-12 w-px bg-white/20" />
          <Link
            to="/town"
            className="group flex flex-col items-center text-center"
          >
            <span className="text-[10px] tracking-[0.4em] uppercase opacity-60 group-hover:opacity-100">
              Enter
            </span>
            <span className="mt-2 font-serif text-2xl border-b border-white/30 pb-1 group-hover:border-white">
              Town
            </span>
            <span className="mt-1 text-[10px] tracking-[0.3em] uppercase opacity-60">
              Beaconsfield
            </span>
          </Link>
        </div>
      </footer>
    </main>
  </>
);

export default Landing;
