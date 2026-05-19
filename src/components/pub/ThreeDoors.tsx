import { Link } from "react-router-dom";
import foodImg from "@/assets/pub/pub-food-sign.jpg";
import drinkImg from "@/assets/pub/pub-cask-ales.jpg";
import snacksImg from "@/assets/pub/pub-fireside.jpg";

interface Door {
  label: string;
  caption: string;
  to: string;
  image: string;
  imageAlt: string;
  focal: string;
}

const DOORS: Door[] = [
  {
    label: "Eat",
    caption: "Pies, chops, Sunday roast.",
    to: "/pub/food",
    image: foodImg,
    imageAlt: "Hand-painted Great British Comfort Food sign on a green pub door",
    focal: "center 35%",
  },
  {
    label: "Drink",
    caption: "Cask ale. Proper wine. A short, sharp list.",
    to: "/pub/drink",
    image: drinkImg,
    imageAlt: "Painted Purveyor of Quality Cask Ales sign on a white pub wall",
    focal: "center 30%",
  },
  {
    label: "Snacks",
    caption: "Pork scratchings. Scotch eggs. The good stuff.",
    to: "/pub/snacks",
    image: snacksImg,
    imageAlt: "Pint of ale and white wine on a copper table by an open fire",
    focal: "center 55%",
  },
];

/**
 * Three photographic 'doors' — primary navigation into Eat / Drink / Snacks.
 * No fake CSS wood. The image is the door.
 */
const ThreeDoors = () => {
  return (
    <section className="bg-[hsl(var(--pub-oxblood-deep))] py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase text-[hsl(var(--pub-brass))] text-center">
          Step in
        </p>
        <h2 className="pub-display mt-3 text-5xl md:text-7xl uppercase text-center text-[hsl(var(--pub-cream))]">
          Three doors
        </h2>
        <div className="pub-brass-rule mt-6 mx-auto h-px w-32" />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {DOORS.map((door, i) => (
            <Link
              key={door.to}
              to={door.to}
              className="group relative block aspect-[3/4] overflow-hidden rounded-sm border border-[hsl(var(--pub-brass-deep))] shadow-[0_20px_60px_-20px_hsl(0_0%_0%_/_0.7)] transition-transform duration-500 hover:-translate-y-1"
            >
              <img
                src={door.image}
                alt={door.imageAlt}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                style={{ objectPosition: door.focal }}
              />
              {/* Bottom-up dark gradient so type reads */}
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, hsl(8 50% 8% / 0.15) 0%, hsl(8 50% 8% / 0.05) 40%, hsl(8 60% 5% / 0.7) 75%, hsl(8 60% 4% / 0.95) 100%)",
                }}
              />

              {/* Door number plate, top-left */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <span className="font-cb-mono text-[10px] tracking-[0.4em] uppercase text-[hsl(var(--pub-brass))]">
                  Door {String(i + 1).padStart(2, "0")}
                </span>
                <span className="h-px w-8 bg-[hsl(var(--pub-brass)/0.7)]" />
              </div>

              {/* Label block, bottom */}
              <div className="absolute inset-x-0 bottom-0 z-10 px-7 pb-7">
                <p className="pub-display text-5xl md:text-6xl uppercase leading-none text-[hsl(var(--pub-cream))]">
                  {door.label}
                </p>
                <div className="pub-brass-rule mt-4 h-px w-16" />
                <p className="mt-4 font-cb-sans text-sm md:text-base text-[hsl(var(--pub-cream))] opacity-90 max-w-[26ch]">
                  {door.caption}
                </p>
                <p className="mt-4 font-cb-mono text-[10px] tracking-[0.4em] uppercase text-[hsl(var(--pub-brass))] opacity-0 group-hover:opacity-100 transition-opacity">
                  Enter →
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ThreeDoors;
