import { Link } from "react-router-dom";
import { SITE_MAP, PRIMARY_CTAS, MEMBERS_ENTRY } from "@/data/cbSiteMap";

/**
 * Homepage content sections that mirror the global nav order.
 * Scrolling the page = navigating the menu. Each section is a signpost,
 * not a rebuild of the destination page.
 *
 * Visual language reuses existing tokens (font-display, font-cb-mono,
 * font-cb-sans, B&W). No new design.
 */
const CBLandingSections = () => {
  return (
    <div className="bg-black text-white">
      {SITE_MAP.map((group, idx) => (
        <section
          key={group.id}
          id={group.id}
          aria-labelledby={`${group.id}-heading`}
          className={`border-t border-white/15 px-6 md:px-12 py-20 md:py-28 ${
            idx % 2 === 1 ? "bg-white text-black" : ""
          }`}
        >
          <div className="mx-auto max-w-6xl">
            <p
              className={`font-cb-mono text-[10px] tracking-[0.5em] uppercase ${
                idx % 2 === 1 ? "opacity-60" : "opacity-70"
              }`}
            >
              {String(idx + 1).padStart(2, "0")} &nbsp;/&nbsp; {group.label}
            </p>
            <h2
              id={`${group.id}-heading`}
              className="mt-4 font-display text-5xl md:text-7xl uppercase leading-[0.9] tracking-tight"
            >
              {group.label}
            </h2>
            <p className="mt-6 max-w-2xl font-cb-sans text-lg md:text-xl leading-relaxed opacity-80">
              {group.intro}
            </p>

            <ul className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
              {group.links.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={`group flex items-center justify-between border-b py-3 ${
                      idx % 2 === 1
                        ? "border-black/20 hover:border-black"
                        : "border-white/20 hover:border-white"
                    } transition-colors`}
                  >
                    <h3 className="font-cb-sans text-base tracking-wide">
                      {link.label}
                    </h3>
                    <span className="font-cb-mono text-xs tracking-[0.3em] uppercase opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                      &rarr;
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}

      {/* Visit us — addresses & primary CTAs */}
      <section
        id="visit"
        aria-labelledby="visit-heading"
        className="border-t border-white/15 px-6 md:px-12 py-20 md:py-28"
      >
        <div className="mx-auto max-w-6xl">
          <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase opacity-70">
            {String(SITE_MAP.length + 1).padStart(2, "0")} &nbsp;/&nbsp; Visit us
          </p>
          <h2
            id="visit-heading"
            className="mt-4 font-display text-5xl md:text-7xl uppercase leading-[0.9] tracking-tight"
          >
            Visit us
          </h2>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-12">
            <article>
              <p className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60">
                Country &nbsp;/&nbsp; Stadhampton
              </p>
              <h3 className="mt-3 font-display text-3xl uppercase leading-tight">
                Crazy Bear Country
              </h3>
              <address className="not-italic mt-4 font-cb-sans text-base leading-relaxed opacity-90">
                Bear Lane
                <br />
                Stadhampton OX44 7UR
              </address>
              <a
                href="tel:01865890714"
                className="mt-3 inline-block font-cb-sans text-base underline-offset-4 hover:underline"
              >
                01865 890 714
              </a>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to={PRIMARY_CTAS.book.path}
                  className="inline-flex items-center bg-white text-black font-cb-mono text-[10px] tracking-[0.4em] uppercase px-4 py-2 hover:opacity-90"
                >
                  Book a room
                </Link>
                <Link
                  to="/country/pub/food"
                  className="inline-flex items-center border border-white/70 font-cb-mono text-[10px] tracking-[0.4em] uppercase px-4 py-2 hover:bg-white hover:text-black transition-colors"
                >
                  Reserve a table
                </Link>
                <a
                  href="https://maps.google.com/?q=Crazy+Bear+Stadhampton+OX44+7UR"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center font-cb-mono text-[10px] tracking-[0.4em] uppercase px-4 py-2 opacity-70 hover:opacity-100"
                >
                  Get directions
                </a>
              </div>
            </article>

            <article>
              <p className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60">
                Town &nbsp;/&nbsp; Beaconsfield
              </p>
              <h3 className="mt-3 font-display text-3xl uppercase leading-tight">
                Crazy Bear Town
              </h3>
              <address className="not-italic mt-4 font-cb-sans text-base leading-relaxed opacity-90">
                75 Wycombe End
                <br />
                Beaconsfield HP9 1LX
              </address>
              <a
                href="tel:01494673086"
                className="mt-3 inline-block font-cb-sans text-base underline-offset-4 hover:underline"
              >
                01494 673 086
              </a>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to={PRIMARY_CTAS.book.path}
                  className="inline-flex items-center bg-white text-black font-cb-mono text-[10px] tracking-[0.4em] uppercase px-4 py-2 hover:opacity-90"
                >
                  Book a room
                </Link>
                <Link
                  to="/town/food/black-bear"
                  className="inline-flex items-center border border-white/70 font-cb-mono text-[10px] tracking-[0.4em] uppercase px-4 py-2 hover:bg-white hover:text-black transition-colors"
                >
                  Reserve a table
                </Link>
                <a
                  href="https://maps.google.com/?q=Crazy+Bear+Beaconsfield+HP9+1LX"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center font-cb-mono text-[10px] tracking-[0.4em] uppercase px-4 py-2 opacity-70 hover:opacity-100"
                >
                  Get directions
                </a>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Quiet Bear's Den entry. Subscribers get in. Gold gets extras. */}
      <section
        aria-label="Bear's Den"
        className="border-t border-white/15 bg-black px-6 md:px-12 py-12"
      >
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="font-cb-sans text-base md:text-lg opacity-90">
            Subscribe for the Bear's Den. Gold for 25% off, everywhere.
          </p>
          <Link
            to={MEMBERS_ENTRY.path}
            className="inline-flex items-center self-start md:self-auto border border-white/70 font-cb-mono text-[10px] tracking-[0.4em] uppercase px-4 py-2 hover:bg-white hover:text-black transition-colors"
          >
            {MEMBERS_ENTRY.label} &rarr;
          </Link>
        </div>
      </section>
    </div>
  );
};

export default CBLandingSections;
