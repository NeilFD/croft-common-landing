import { Link } from "react-router-dom";
import { useEffect } from "react";
import { SITE_MAP, PRIMARY_CTAS, PROPERTY_PICKER, LEGAL_LINKS, MEMBERS_ENTRY } from "@/data/cbSiteMap";

interface CBNavOverlayProps {
  open: boolean;
  onClose: () => void;
}

const CBNavOverlay = ({ open, onClose }: CBNavOverlayProps) => {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black text-white overflow-y-auto"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 24px)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
    >
      <div className="flex items-center justify-between px-6 md:px-12 pb-6 border-b border-white/15">
        <Link
          to="/"
          onClick={onClose}
          className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-80 hover:opacity-100"
        >
          Crazy Bear
        </Link>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-80 hover:opacity-100"
        >
          Close
        </button>
      </div>

      <nav className="px-6 md:px-12 py-10 md:py-16">
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-12">
          {SITE_MAP.map((group) => (
            <li key={group.id}>
              <h2 className="font-display text-3xl md:text-4xl uppercase leading-[0.9] tracking-tight">
                {group.label}
              </h2>
              <ul className="mt-5 space-y-2">
                {group.links.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      onClick={onClose}
                      className="font-cb-sans text-sm tracking-wide opacity-80 hover:opacity-100 hover:underline underline-offset-4"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        <div className="mt-16 pt-10 border-t border-white/15 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60 mb-3">
              Choose your setting
            </p>
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {PROPERTY_PICKER.map((p) => (
                <li key={p.path}>
                  <Link
                    to={p.path}
                    onClick={onClose}
                    className="font-cb-mono text-xs tracking-[0.3em] uppercase opacity-80 hover:opacity-100"
                  >
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:text-right">
            <p className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60 mb-3">
              More
            </p>
            <ul className="flex md:justify-end flex-wrap gap-x-6 gap-y-2">
              {LEGAL_LINKS.map((p) => (
                <li key={p.path}>
                  <Link
                    to={p.path}
                    onClick={onClose}
                    className="font-cb-mono text-xs tracking-[0.3em] uppercase opacity-80 hover:opacity-100"
                  >
                    {p.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to={MEMBERS_ENTRY.path}
                  onClick={onClose}
                  className="font-cb-mono text-xs tracking-[0.3em] uppercase opacity-80 hover:opacity-100"
                >
                  {MEMBERS_ENTRY.label}
                </Link>
              </li>
              <li>
                <Link
                  to={PRIMARY_CTAS.enquire.path}
                  onClick={onClose}
                  className="font-cb-mono text-xs tracking-[0.3em] uppercase opacity-80 hover:opacity-100"
                >
                  {PRIMARY_CTAS.enquire.label}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex">
          <Link
            to={PRIMARY_CTAS.book.path}
            onClick={onClose}
            className="inline-flex items-center justify-center bg-white text-black font-cb-mono text-xs tracking-[0.4em] uppercase px-8 py-4 hover:opacity-90 transition-opacity"
          >
            {PRIMARY_CTAS.book.label} a room
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default CBNavOverlay;
