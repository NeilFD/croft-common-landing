import { Link } from "react-router-dom";
import { Suspense, lazy, useState } from "react";
import bearMark from "@/assets/crazy-bear-mark.png";
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

  const linkCls = "font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-80 hover:opacity-100";

  return (
    <>
      <header
        className={`absolute top-0 left-0 right-0 z-30 px-6 md:px-12 flex items-center justify-between ${text}`}
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 28px)' }}
      >
        <Link to="/" className="flex items-center group">
          <img
            src={bearMark}
            alt="Crazy Bear"
            className={`h-14 w-14 md:h-16 md:w-16 ${markFilter}`}
          />
        </Link>
        <nav className="flex items-center gap-7 md:gap-10">
          <Link to="/about" className={linkCls}>About</Link>
          <Link to="/house-rules" className={linkCls}>House Rules</Link>
          <Link to="/town" className={`hidden sm:inline ${linkCls}`}>Town</Link>
          <Link to="/country" className={`hidden sm:inline ${linkCls}`}>Country</Link>
          <Suspense fallback={<button onClick={() => setLoginOpen(true)} className={linkCls} type="button">Member Login</button>}>
            <CBMemberNavItems linkCls={linkCls} onLoginOpen={() => setLoginOpen(true)} />
          </Suspense>
        </nav>
      </header>
      {loginOpen && (
        <Suspense fallback={null}>
          <CBMemberLoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
        </Suspense>
      )}
    </>
  );
};

export default CBTopNav;
