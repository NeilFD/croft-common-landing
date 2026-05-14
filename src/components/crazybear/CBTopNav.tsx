import { Link } from "react-router-dom";
import { Suspense, lazy, useState } from "react";
import bearMark from "@/assets/crazy-bear-mark.png";
import CBNavOverlay from "@/components/crazybear/CBNavOverlay";
import { PRIMARY_CTAS } from "@/data/cbSiteMap";
const CBMemberNavItems = lazy(() => import("@/components/crazybear/CBMemberNavItems"));
const CBMemberLoginModal = lazy(() => import("@/components/crazybear/CBMemberLoginModal"));

interface CBTopNavProps {
  /** "light" = white text on dark hero. "dark" = black text on light page. */
  tone?: "light" | "dark";
}

const CBTopNav = ({ tone = "light" }: CBTopNavProps) => {
  const isLight = tone === "light";
  const text = isLight ? "text-white" : "text-foreground";
  const markFilter = isLight ? "invert" : "";
  const [loginOpen, setLoginOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const linkCls =
    "font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-80 hover:opacity-100";

  const bookBtnCls = isLight
    ? "border border-white/70 bg-transparent hover:bg-white hover:text-black"
    : "border border-foreground/70 bg-transparent hover:bg-foreground hover:text-background";

  return (
    <>
      <header
        className={`absolute top-0 left-0 right-0 z-30 px-6 md:px-12 flex items-center justify-between ${text}`}
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 28px)" }}
      >
        <Link to="/" className="flex items-center group" aria-label="Crazy Bear home">
          <img
            src={bearMark}
            alt="Crazy Bear"
            className={`h-14 w-14 md:h-16 md:w-16 ${markFilter}`}
          />
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6 md:gap-8">
          <Link
            to={PRIMARY_CTAS.book.path}
            className={`hidden sm:inline-flex items-center font-cb-mono text-[10px] tracking-[0.4em] uppercase px-4 py-2 transition-colors ${bookBtnCls}`}
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

      {/* Mobile-only bottom-of-header Book button when sm hidden */}
      <Link
        to={PRIMARY_CTAS.book.path}
        className={`sm:hidden fixed top-4 right-20 z-30 font-cb-mono text-[10px] tracking-[0.4em] uppercase px-3 py-2 ${bookBtnCls}`}
        style={{ marginTop: "env(safe-area-inset-top)" }}
      >
        {PRIMARY_CTAS.book.label}
      </Link>

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
