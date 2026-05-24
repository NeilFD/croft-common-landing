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
  /**
   * Hero tone the nav sits on top of, BEFORE the user scrolls.
   * "light" = white text (use on dark / photographic heroes — the Crazy Bear default).
   * "dark"  = black text (use on bright / white backgrounds — rare).
   *
   * Legibility is guaranteed on ANY background via the frosted backdrop
   * strip + dual text-shadow primitive below — the tone is just the
   * aesthetic baseline, not a contrast guess.
   */
  tone?: "light" | "dark";
}

const SCROLL_SOLID_THRESHOLD = 60;

const CBTopNav = ({ tone = "light" }: CBTopNavProps) => {
  const isLight = tone === "light";
  const [loginOpen, setLoginOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const propertyCtx = useOptionalProperty();
  const propertyKey = propertyCtx?.property as keyof typeof PROPERTY_ACCENTS | undefined;
  const accent = propertyKey ? PROPERTY_ACCENTS[propertyKey] : null;

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

  const bookBtnCls = isLight
    ? "border border-white/80 bg-transparent hover:bg-white hover:text-black"
    : "border border-foreground/80 bg-transparent hover:bg-foreground hover:text-background";

  return (
    <>
      {/* Fixed legibility strip — sits behind the nav across the full width.
          Frosted when over the hero, solid once scrolled. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed top-0 left-0 right-0 z-20 transition-colors duration-200 ${stripCls}`}
        style={{
          height: "calc(env(safe-area-inset-top) + 96px)",
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
        <Link to={accent ? `/${propertyKey}` : "/"} className="flex items-center gap-3 md:gap-4 group" aria-label={accent ? `Crazy Bear ${accent.label} home` : "Crazy Bear home"}>
          {accent ? (
            <span
              aria-hidden="true"
              className="block h-12 w-12 md:h-14 md:w-14"
              style={{
                backgroundColor: accent.color,
                WebkitMaskImage: `url(${bearMark})`,
                maskImage: `url(${bearMark})`,
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
              }}
            />
          ) : (
            <img
              src={bearMark}
              alt="Crazy Bear"
              className={`h-12 w-12 md:h-14 md:w-14 ${markFilter}`}
            />
          )}
          {accent && (
            <span
              className="font-display uppercase leading-none text-[15px] md:text-[18px] tracking-[0.08em]"
              style={{
                color: accent.color,
                textShadow: scrolled
                  ? "0 0 1px rgba(255,255,255,0.35)"
                  : "0 1px 2px rgba(255,255,255,0.55), 0 0 14px rgba(255,255,255,0.35)",
              }}
            >
              Crazy Bear <span className="block md:inline">{accent.label}</span>
            </span>
          )}
        </Link>
        <nav className="flex items-center gap-3 sm:gap-5 md:gap-7">
          <Link
            to={PRIMARY_CTAS.book.path}
            className={`inline-flex items-center font-cb-mono text-[9px] sm:text-[10px] tracking-[0.35em] sm:tracking-[0.4em] uppercase px-3 sm:px-4 py-1.5 sm:py-2 transition-colors ${bookBtnCls}`}
          >
            {PRIMARY_CTAS.book.label}
          </Link>
          <Suspense fallback={null}>
            <CBMemberNavItems linkCls={linkCls} onLoginOpen={() => setLoginOpen(true)} />
          </Suspense>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className={linkCls}
          >
            Menu
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
