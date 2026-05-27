import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCMSMode } from "@/contexts/CMSModeContext";
import { CMSText } from "@/components/cms/CMSText";
import BookTableButton from "@/components/booking/BookTableButton";
import BookRoomButton from "@/components/booking/BookRoomButton";
import {
  SEVENROOMS_VENUES,
  type SevenRoomsVenueKey,
} from "@/data/sevenroomsVenues";
import { MEWS_HOTELS, type MewsHotelKey } from "@/data/mewsHotels";
import bookHeroFood from "@/assets/hero-english-menu.png";

const HOTELS: { key: MewsHotelKey; blurb: string }[] = [
  {
    key: "beaconsfield",
    blurb: "Rooms above the Black Bear. Stay the night, walk to breakfast.",
  },
  {
    key: "stadhampton",
    blurb: "Country rooms, deep beds, big skies. Stadhampton-style.",
  },
];

/**
 * Reservations hub. One equal card per SevenRooms venue, in a single
 * uniform grid. Town / Country are delineated by the accent bar at the
 * top of each card (red = Town, teal = Country) and the eyebrow label —
 * no nested panels, no asymmetric groups.
 */
const VENUES: { key: SevenRoomsVenueKey; blurb: string }[] = [
  {
    key: "beaconsfield",
    blurb: "Open kitchen, big flavours. The Black Bear and The Rooms share one booking.",
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
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Book a table or a room | Crazy Bear";

    const metaDescId = "meta-desc-book";
    let metaDesc = document.getElementById(metaDescId) as HTMLMetaElement | null;
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      metaDesc.id = metaDescId;
      document.head.appendChild(metaDesc);
    }
    metaDesc.content =
      "Reserve a table or a room at Crazy Bear. Black Bear, Rooms and Hom Thai in Town; The Pub and rooms at Stadhampton in Country.";

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
        style={{ objectPosition: "center 40%" }}
      />
      <div aria-hidden className="absolute inset-0 bg-black/55" />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/85"
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
              fallback="Book it"
              as="h1"
              className="mt-4 font-display text-5xl md:text-7xl uppercase leading-[0.9] tracking-tight"
            />
            <CMSText
              page="book"
              section="hero"
              contentKey="subtitle"
              fallback="Pick a venue. Book a table or a room."
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

            {/* ───────────── Tables ───────────── */}
            <section className="mt-16">
              <div className="flex items-end justify-between gap-6 border-b border-white/20 pb-4">
                <div>
                  <CMSText
                    page="book"
                    section="tables"
                    contentKey="eyebrow"
                    fallback="Tables"
                    as="p"
                    className="font-cb-mono text-[10px] tracking-[0.5em] uppercase opacity-70"
                  />
                  <CMSText
                    page="book"
                    section="tables"
                    contentKey="heading"
                    fallback="Eat with us"
                    as="h2"
                    className="mt-2 font-display text-3xl md:text-4xl uppercase leading-none tracking-tight"
                  />
                </div>
              </div>

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
                      <h3 className="mt-4 font-display text-2xl uppercase leading-tight min-h-[3.5rem]">
                        {v.label}
                      </h3>
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
            </section>

            {/* ───────────── Stay the night ───────────── */}
            <section className="mt-20">
              <div className="flex items-end justify-between gap-6 border-b border-white/20 pb-4">
                <div>
                  <CMSText
                    page="book"
                    section="rooms"
                    contentKey="eyebrow"
                    fallback="Rooms"
                    as="p"
                    className="font-cb-mono text-[10px] tracking-[0.5em] uppercase opacity-70"
                  />
                  <CMSText
                    page="book"
                    section="rooms"
                    contentKey="heading"
                    fallback="Stay the night"
                    as="h2"
                    className="mt-2 font-display text-3xl md:text-4xl uppercase leading-none tracking-tight"
                  />
                </div>
              </div>

              <ul className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                {HOTELS.map(({ key, blurb }) => {
                  const h = MEWS_HOTELS[key];
                  return (
                    <li
                      key={key}
                      data-property={h.property}
                      className="relative flex h-full flex-col border border-white/20 bg-black/65 backdrop-blur-sm p-7"
                    >
                      <span
                        aria-hidden
                        className="absolute top-0 left-0 h-[3px] w-full cb-accent-bg"
                      />
                      <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase opacity-80">
                        {h.property === "town" ? "Crazy Bear Town" : "Crazy Bear Country"}
                      </p>
                      <h3 className="mt-4 font-display text-2xl uppercase leading-tight min-h-[3.5rem]">
                        {h.label}
                      </h3>
                      <CMSText
                        page="book"
                        section="rooms"
                        contentKey={`blurb-${key}`}
                        fallback={blurb}
                        as="p"
                        className="mt-4 font-cb-sans text-sm opacity-85 flex-1"
                      />
                      <div className="mt-6">
                        <BookRoomButton
                          hotel={key}
                          variant="outline"
                          tone="light"
                          className="w-full"
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* ───────────── Karaoke ───────────── */}
            <section className="mt-20">
              <div className="flex items-end justify-between gap-6 border-b border-white/20 pb-4">
                <div>
                  <CMSText
                    page="book"
                    section="karaoke"
                    contentKey="eyebrow"
                    fallback="Karaoke"
                    as="p"
                    className="font-cb-mono text-[10px] tracking-[0.5em] uppercase opacity-70"
                  />
                  <CMSText
                    page="book"
                    section="karaoke"
                    contentKey="heading"
                    fallback="Sing the night"
                    as="h2"
                    className="mt-2 font-display text-3xl md:text-4xl uppercase leading-none tracking-tight"
                  />
                </div>
              </div>

              <ul className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                <li
                  data-property="town"
                  className="relative flex h-full flex-col border border-white/20 bg-black/65 backdrop-blur-sm p-7"
                >
                  <span
                    aria-hidden
                    className="absolute top-0 left-0 h-[3px] w-full cb-accent-bg"
                  />
                  <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase opacity-80">
                    Crazy Bear Town
                  </p>
                  <h3 className="mt-4 font-display text-2xl uppercase leading-tight min-h-[3.5rem]">
                    Karaoke at Beaconsfield
                  </h3>
                  <CMSText
                    page="book"
                    section="karaoke"
                    contentKey="blurb-beaconsfield"
                    fallback="Private rooms. Loud songs. Cold drinks. Book a booth."
                    as="p"
                    className="mt-4 font-cb-sans text-sm opacity-85 flex-1"
                  />
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => navigate("/town/karaoke")}
                      aria-label="Book a karaoke booth at Beaconsfield"
                      data-property="town"
                      className="w-full inline-flex items-center justify-center font-cb-mono text-[10px] tracking-[0.5em] uppercase px-6 py-3 transition-colors border border-white/80 text-white hover:bg-white hover:text-black"
                    >
                      Book karaoke
                    </button>
                  </div>
                </li>
              </ul>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Book;
