import bar from "@/assets/karaoke/bar-shelves.jpg";

const pours = [
  { name: "House Margarita", note: "Tequila, lime, salt rim", price: "£12" },
  { name: "Espresso Martini", note: "Vodka, Mr Black, sugar", price: "£13" },
  { name: "Negroni Sbagliato", note: "Campari, vermouth, prosecco", price: "£12" },
  { name: "Whisky Sour", note: "Bourbon, lemon, egg white", price: "£13" },
  { name: "Disco Spritz", note: "Aperol, pink grapefruit, fizz", price: "£11" },
  { name: "Cold Tap Lager", note: "Half / Pint", price: "£4 / £7" },
];

const BackBar = () => (
  <section className="relative bg-[hsl(var(--kar-black))] text-[hsl(var(--kar-cream))]">
    <div className="grid md:grid-cols-2">
      <div className="order-2 md:order-1 flex flex-col justify-center px-8 py-20 md:px-16 lg:px-24">
        <p className="kar-condensed text-sm tracking-[0.5em] uppercase text-[hsl(var(--kar-neon))]">
          From the bar
        </p>
        <h2 className="kar-display mt-4 text-5xl md:text-7xl uppercase leading-[0.9]">
          Wet your<br />whistle.
        </h2>
        <ul className="mt-10 divide-y divide-[hsl(var(--kar-blood)/0.35)]">
          {pours.map((p) => (
            <li key={p.name} className="flex items-baseline justify-between gap-6 py-4">
              <div>
                <p className="kar-display text-xl md:text-2xl uppercase leading-tight">{p.name}</p>
                <p className="mt-1 font-cb-sans text-sm opacity-70">{p.note}</p>
              </div>
              <span className="kar-condensed text-base md:text-lg tracking-[0.15em] px-3 py-1 border border-[hsl(var(--kar-gold))] text-[hsl(var(--kar-gold))] whitespace-nowrap">
                {p.price}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="order-1 md:order-2 relative aspect-[4/5] md:aspect-auto md:min-h-[640px] overflow-hidden">
        <img
          src={bar}
          alt="Back bar shelves stacked with bottles, warm amber light"
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[hsl(var(--kar-black))]" />
      </div>
    </div>
  </section>
);

export default BackBar;
