import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useCMSMode } from "@/contexts/CMSModeContext";
import { CMSText } from "@/components/cms/CMSText";
import BookTableButton from "@/components/booking/BookTableButton";
import {
  SEVENROOMS_VENUES,
  type SevenRoomsVenueKey,
} from "@/data/sevenroomsVenues";
import bookHeroFood from "@/assets/cb-hero-blackbear.jpg";

/**
 * Reservations hub. One equal card per SevenRooms venue, in a single
 * uniform grid. Town / Country are delineated by the accent bar at the
 * top of each card (red = Town, teal = Country) and the eyebrow label —
 * no nested panels, no asymmetric groups.
 */
const VENUES: { key: SevenRoomsVenueKey; blurb: string }[] = [
  {
    key: "beaconsfield",
    blurb: "Open kitchen, big flavours. The Black Bear and The B&B share one booking.",
  },
  {
    key: "beaconsfield-thai",
    blurb: "Lacquer, lanterns, proper Thai.",
  },
  {
    key: "stadhampton-oak",
    blurb: "Real ale, proper food, fires lit.",
  },
];

const Book: React.FC = () => {
  const { isCMSMode } = useCMSMode();

  useEffect(() => {
    document.title = "Book a table | Crazy Bear";

    const metaDescId = "meta-desc-book";
    let metaDesc = document.getElementById(metaDescId) as HTMLMetaElement | null;
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      metaDesc.id = metaDescId;
      document.head.appendChild(metaDesc);
    }
    metaDesc.content =
      "Reserve a table at Crazy Bear. Black Bear & B&B, Hom Thai (Town) and The Pub at Stadhampton (Country).";

    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.href;
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Hi-res food backdrop */}
      <img
        src={bookHeroFood}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: "center 35%" }}
      />
      <div aria-hidden className="absolute inset-0 bg-black/75" />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/70 to-black"
      />

      <div className="relative z-10 flex flex-1 flex-col">
        {!isCMSMode && (
          <header className="px-6 pt-6 md:px-12">
            <Link
              to="/"
              aria-label="Back to home"
              className="inline-block font-cb-mono text-[10px] tracking-[0.5em] uppercase border border-white text-white bg-black/60 px-6 py-3 hover:bg-white hover:text-black transition-colors"
            >
              Back
            </Link>
          </header>
        )}

        <main className="flex-1 px-6 md:px-12 py-12 md:py-20">
          <div className="mx-auto max-w-6xl">
            <CMSText
              page="book"
              section="hero"
              contentKey="eyebrow"
              fallback="Reservations"
              as="p"
              className="font-cb-mono text-[10px] tracking-[0.5em] uppercase opacity-80"
            />
            <CMSText
              page="book"
              section="hero"
              contentKey="title"
              fallback="Book a table"
              as="h1"
              className="mt-4 font-display text-5xl md:text-7xl uppercase leading-[0.9] tracking-tight"
            />
            <CMSText
              page="book"
              section="hero"
              contentKey="subtitle"
              fallback="Pick a venue. Live availability runs straight from our restaurants."
              as="p"
              className="mt-6 max-w-2xl font-cb-sans text-lg md:text-xl opacity-90"
            />

            {/* Property-key legend */}
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 font-cb-mono text-[10px] tracking-[0.4em] uppercase">
              <span data-property="town" className="flex items-center gap-3">
                <span aria-hidden className="block h-[2px] w-8 cb-accent-bg" />
                Crazy Bear Town
              </span>
              <span data-property="country" className="flex items-center gap-3">
                <span aria-hidden className="block h-[2px] w-8 cb-accent-bg" />
                Crazy Bear Country
              </span>
            </div>

            {/* Uniform 3-card grid */}
            <ul className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {VENUES.map(({ key, blurb }) => {
                const v = SEVENROOMS_VENUES[key];
                return (
                  <li
                    key={key}
                    data-property={v.property}
                    className="relative flex h-full flex-col border border-white/20 bg-black/65 backdrop-blur-sm p-7"
                  >
                    <span
                      aria-hidden
                      className="absolute top-0 left-0 h-[3px] w-full cb-accent-bg"
                    />
                    <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase opacity-80">
                      {v.property === "town" ? "Crazy Bear Town" : "Crazy Bear Country"}
                    </p>
                    <h2 className="mt-4 font-display text-2xl uppercase leading-tight min-h-[3.5rem]">
                      {v.label}
                    </h2>
                    <p className="mt-4 font-cb-sans text-sm opacity-85 flex-1">
                      {blurb}
                    </p>
                    <div className="mt-6">
                      <BookTableButton
                        venue={key}
                        variant="outline"
                        tone="light"
                        className="w-full"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Book;
