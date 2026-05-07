import { Link } from "react-router-dom";
import bearMark from "@/assets/crazy-bear-mark.png";

interface CBTopNavProps {
  /** "light" = white text on dark hero. "dark" = black text on light page. */
  tone?: "light" | "dark";
}

const CBTopNav = ({ tone = "light" }: CBTopNavProps) => {
  const isLight = tone === "light";
  const text = isLight ? "text-white" : "text-foreground";
  const markFilter = isLight ? "invert" : "";

  return (
    <header
      className={`absolute top-0 left-0 right-0 z-30 px-6 md:px-12 pt-7 flex items-center justify-between ${text}`}
    >
      <Link to="/" className="flex items-center gap-3 group">
        <img
          src={bearMark}
          alt="Crazy Bear"
          className={`h-9 w-9 ${markFilter}`}
        />
        <span className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-90 group-hover:opacity-100">
          Crazy Bear
        </span>
      </Link>
      <nav className="flex items-center gap-7 md:gap-10">
        <Link
          to="/house-rules"
          className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-80 hover:opacity-100"
        >
          House Rules
        </Link>
        <Link
          to="/country"
          className="hidden sm:inline font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-80 hover:opacity-100"
        >
          Country
        </Link>
        <Link
          to="/town"
          className="hidden sm:inline font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-80 hover:opacity-100"
        >
          Town
        </Link>
        <Link
          to="/members"
          className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-80 hover:opacity-100"
        >
          Members
        </Link>
      </nav>
    </header>
  );
};

export default CBTopNav;
