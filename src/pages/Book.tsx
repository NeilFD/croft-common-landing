import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useCMSMode } from "@/contexts/CMSModeContext";
import { CMSText } from "@/components/cms/CMSText";
import BookTableButton from "@/components/booking/BookTableButton";
import {
  SEVENROOMS_VENUES,
  type SevenRoomsVenueKey,
} from "@/data/sevenroomsVenues";

/**
 * Reservations hub. One card per SevenRooms venue. Each opens the
 * Crazy-Bear-styled BookTableButton modal with that venue's live widget.
 *
 * Cards are property-scoped via `data-property` so the existing
 * Town (red) / Country (teal) accents flow through.
 */
const VENUE_ORDER: { key: SevenRoomsVenueKey; blurb: string }[] = [
  {
    key: "beaconsfield",
    blurb: "Town. Open kitchen, big flavours. The Black Bear & The B&B share one booking.",
  },
  {
    key: "beaconsfield-thai",
    blurb: "Town. Hom Thai. Lacquer, lanterns, proper Thai.",
  },
  {
    key: "stadhampton-oak",
    blurb: "Country. The Pub at Stadhampton. Real ale, proper food, fires lit.",
  },
];

const Book: React.FC = () => {
  const navigate = useNavigate();
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
    <div className="relative min-h-screen bg-black text-white flex flex-col">
      {!isCMSMode && (
        <header className="px-6 pt-6">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="border-white/40 text-white hover:bg-white hover:text-black"
          >
            Back
          </Button>
        </header>
      )}

      <main className="flex-1 px-6 md:px-12 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <CMSText
            page="book"
            section="hero"
            contentKey="eyebrow"
            fallback="Reservations"
            as="p"
            className="font-cb-mono text-[10px] tracking-[0.5em] uppercase opacity-70"
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
            fallback="Pick a venue. The booking widget runs live availability from our restaurants."
            as="p"
            className="mt-6 max-w-2xl font-cb-sans text-lg md:text-xl opacity-80"
          />

          <ul className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
            {VENUE_ORDER.map(({ key, blurb }) => {
              const v = SEVENROOMS_VENUES[key];
              return (
                <li
                  key={key}
                  data-property={v.property}
                  className="relative flex flex-col border border-white/15 bg-black p-6 md:p-7"
                >
                  <span aria-hidden className="absolute top-0 left-0 h-[2px] w-full cb-accent-bg" />
                  <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase opacity-70">
                    {v.property === "town" ? "Crazy Bear Town" : "Crazy Bear Country"}
                  </p>
                  <h2 className="mt-3 font-display text-2xl md:text-3xl uppercase leading-tight">
                    {v.label}
                  </h2>
                  <p className="mt-3 font-cb-sans text-sm opacity-80 flex-1">{blurb}</p>
                  <div className="mt-6">
                    <BookTableButton venue={key} variant="outline" tone="light" />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </main>
    </div>
  );
};

export default Book;
