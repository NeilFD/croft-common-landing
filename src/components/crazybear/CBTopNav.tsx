import { Link } from "react-router-dom";
import { Suspense, lazy, useEffect, useState } from "react";
import bearMark from "@/assets/crazy-bear-mark.png";
import CBNavOverlay from "@/components/crazybear/CBNavOverlay";
import { PRIMARY_CTAS } from "@/data/cbSiteMap";
import { useOptionalProperty } from "@/contexts/PropertyContext";
const CBMemberNavItems = lazy(() => import("@/components/crazybear/CBMemberNavItems"));
const CBMemberLoginModal = lazy(() => import("@/components/crazybear/CBMemberLoginModal"));

const PROPERTY_ACCENTS = {
  town: { color: "#4E0000", label: "Town" },
  country: { color: "#063F47", label: "Country" },
} as const;

interface CBTopNavProps {
  tone?: "light" | "dark";
  /**
   * Force the property wordmark ("Crazy Bear Town" / "Crazy Bear Country")
   * in the header without activating the tinted accent backdrop. Used by
   * sub-enclaves like /town/karaoke and /pub that sit under a property
   * but keep their own visual theming.
   */
  wordmark?: "town" | "country";
}

const SCROLL_SOLID_THRESHOLD = 60;

const CBTopNav = ({ tone = "light", wordmark }: CBTopNavProps) => {
  const isLight = tone === "light";
  const [loginOpen, setLoginOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const propertyCtx = useOptionalProperty();
  const propertyKey = (wordmark ?? (propertyCtx?.property as keyof typeof PROPERTY_ACCENTS | undefined)) as keyof typeof PROPERTY_ACCENTS | undefined;
  const accent = propertyKey ? PROPERTY_ACCENTS[propertyKey] : null;
  // Only tint the backdrop strip when the property is active via context
  // (i.e. /town and /country shells). Sub-enclaves passing `wordmark` keep
  // their own theming and just get the wordmark label.
  const tintBackdrop = !!propertyCtx;

  // Scroll-aware solidification (Apple / Hermès pattern).
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > SCROLL_SOLID_THRESHOLD);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ---- Legibility primitive ---------------------------------------------
  // A frosted strip behind the nav, tinted with the OPPOSITE tone so text
  // always has a microscopic contrast pad. Combined with a dual text-shadow,
  // the nav stays readable on any hero — dark velvet, bright sky, busy
  // carousels, half-and-half edges.
  // -----------------------------------------------------------------------

  const text = isLight ? "text-white" : "text-foreground";
  const markFilter = isLight ? "invert" : "";

  // Backdrop tint when over the hero (translucent + blurred).
  const heroBackdrop = isLight
    ? "bg-black/30 backdrop-blur-md"
    : "bg-white/40 backdrop-blur-md";

  // Solid bar once scrolled past the hero.
  const solidBackdrop = isLight
    ? "bg-black/95 backdrop-blur-md border-b border-white/10"
    : "bg-white/95 backdrop-blur-md border-b border-black/10";

  const stripCls = scrolled ? solidBackdrop : heroBackdrop;

  // Dual text-shadow — opposite tone at low opacity, invisible on flat
  // backgrounds, lifesaver against photo edges.
  const textShadow = isLight
    ? "0 1px 2px rgba(0,0,0,0.6), 0 0 14px rgba(0,0,0,0.35)"
    : "0 1px 2px rgba(255,255,255,0.7), 0 0 14px rgba(255,255,255,0.4)";

  const linkCls =
    "font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-90 hover:opacity-100";

  // Neon red flickering BOOK CTA — fixed treatment across light/dark nav tones.
  const bookBtnCls = "cb-neon-book border-2 border-[#ff1a1a] text-[#ffd6d6]";

  return (
    <>
      {/* Fixed legibility strip — sits behind the nav across the full width.
          Frosted when over the hero, solid once scrolled. Tinted with the
          property accent inside /town and /country scopes. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed top-0 left-0 right-0 z-20 transition-colors duration-200 ${accent && tintBackdrop ? "backdrop-blur-md border-b border-white/10" : stripCls}`}
        style={{
          height: "calc(env(safe-area-inset-top) + 96px)",
          backgroundColor: accent && tintBackdrop
            ? scrolled
              ? `${accent.color}8C`
              : `${accent.color}4D`
            : undefined,
        }}
      />
      <header
        className={`fixed top-0 left-0 right-0 z-30 px-6 md:px-12 flex items-center justify-between transition-colors duration-200 ${text}`}
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 22px)",
          paddingBottom: "14px",
          textShadow: scrolled ? "none" : textShadow,
        }}
      >
        <Link to="/" className="flex items-center gap-3 md:gap-4 group" aria-label={accent ? `Crazy Bear ${accent.label} home` : "Crazy Bear home"}>
          <img
            src={bearMark}
            alt="Crazy Bear"
            className={`h-12 w-12 md:h-14 md:w-14 ${markFilter}`}
          />
          {accent && (
            <span
              className="font-display uppercase leading-none text-[15px] md:text-[18px] tracking-[0.08em]"
              style={{ textShadow: "none", color: "inherit" }}
            >
              Crazy Bear <span className="block md:inline">{accent.label}</span>
            </span>
          )}
        </Link>
        <nav className="flex items-center gap-3 sm:gap-5 md:gap-7">
          <Link to="/rooms" className={`hidden md:inline-flex ${linkCls}`}>Our Rooms</Link>
          <Link to="/food" className={`hidden md:inline-flex ${linkCls}`}>Food</Link>
          <Link to="/meetings-and-events" className={`hidden lg:inline-flex ${linkCls}`}>Meetings & Events</Link>
          <Link to="/offers" className={`hidden md:inline-flex ${linkCls}`}>Offers</Link>
          <Link to="/whats-on" className={`hidden lg:inline-flex ${linkCls}`}>What's Happening</Link>
          <Link to="/country/events/weddings" className={`hidden lg:inline-flex ${linkCls}`}>Weddings</Link>
          <Suspense fallback={null}>
            <CBMemberNavItems linkCls={`hidden md:inline-flex ${linkCls}`} onLoginOpen={() => setLoginOpen(true)} />
          </Suspense>
          <Link
            to={PRIMARY_CTAS.book.path}
            className={`inline-flex items-center font-cb-mono text-[9px] sm:text-[10px] tracking-[0.35em] sm:tracking-[0.4em] uppercase px-3 sm:px-4 py-1.5 sm:py-2 transition-colors ${bookBtnCls}`}
          >
            {PRIMARY_CTAS.book.label}
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className="md:hidden inline-flex flex-col items-end justify-center gap-[5px] h-9 w-9 -mr-1"
            style={{ textShadow: "none" }}
          >
            <span className={`block h-[2px] w-7 ${isLight ? "bg-white" : "bg-foreground"}`} />
            <span className={`block h-[2px] w-5 ${isLight ? "bg-white" : "bg-foreground"}`} />
          </button>
        </nav>
      </header>

      <CBNavOverlay open={menuOpen} onClose={() => setMenuOpen(false)} />

      {loginOpen && (
        <Suspense fallback={null}>
          <CBMemberLoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
        </Suspense>
      )}
    </>
  );
};

export default CBTopNav;
