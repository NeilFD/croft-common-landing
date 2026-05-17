import { Link } from "react-router-dom";
import { useEffect } from "react";
import {
  SITE_TREE,
  PRIMARY_CTAS,
  PROPERTY_PICKER,
  LEGAL_LINKS,
  MEMBERS_ENTRY,
  type SiteTreeBranch,
  type SiteTreeSection,
} from "@/data/cbSiteMap";

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
        {/* Two sites, mirrored */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
          <SiteColumn branch={SITE_TREE.town} onClose={onClose} />
          <SiteColumn branch={SITE_TREE.country} onClose={onClose} />
        </div>

        {/* Across both */}
        <section className="mt-16 pt-10 border-t border-white/15">
          <p className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60 mb-4">
            Across both
          </p>
          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {SITE_TREE.both.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  onClick={onClose}
                  className="font-cb-sans text-base tracking-wide opacity-90 hover:opacity-100 hover:underline underline-offset-4"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Footer row: book / enquire / property switch / legal */}
        <div className="mt-12 pt-8 border-t border-white/15 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div className="flex flex-wrap gap-4">
            <Link
              to={PRIMARY_CTAS.book.path}
              onClick={onClose}
              className="inline-flex items-center justify-center bg-white text-black font-cb-mono text-xs tracking-[0.4em] uppercase px-8 py-4 hover:opacity-90 transition-opacity"
            >
              {PRIMARY_CTAS.book.label} a room
            </Link>
            <Link
              to={PRIMARY_CTAS.enquire.path}
              onClick={onClose}
              className="inline-flex items-center justify-center border border-white font-cb-mono text-xs tracking-[0.4em] uppercase px-8 py-4 hover:bg-white hover:text-black transition-colors"
            >
              {PRIMARY_CTAS.enquire.label}
            </Link>
          </div>

          <div className="flex flex-col md:items-end gap-3">
            <ul className="flex flex-wrap md:justify-end gap-x-6 gap-y-2">
              {PROPERTY_PICKER.map((p) => (
                <li key={p.path}>
                  <Link
                    to={p.path}
                    onClick={onClose}
                    className="font-cb-mono text-[10px] tracking-[0.3em] uppercase opacity-80 hover:opacity-100"
                  >
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="flex flex-wrap md:justify-end gap-x-6 gap-y-2">
              <li>
                <Link
                  to={MEMBERS_ENTRY.path}
                  onClick={onClose}
                  className="font-cb-mono text-[10px] tracking-[0.3em] uppercase opacity-80 hover:opacity-100"
                >
                  {MEMBERS_ENTRY.label}
                </Link>
              </li>
              {LEGAL_LINKS.map((p) => (
                <li key={p.path}>
                  <Link
                    to={p.path}
                    onClick={onClose}
                    className="font-cb-mono text-[10px] tracking-[0.3em] uppercase opacity-80 hover:opacity-100"
                  >
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>
    </div>
  );
};

/* -------------------------- Site column -------------------------- */

const SiteColumn = ({
  branch,
  onClose,
}: {
  branch: SiteTreeBranch;
  onClose: () => void;
}) => (
  <div>
    <Link
      to={branch.home.path}
      onClick={onClose}
      className="block group"
    >
      <h2 className="font-display text-3xl md:text-5xl uppercase leading-[0.9] tracking-tight group-hover:underline underline-offset-[6px]">
        {branch.label}
      </h2>
      <span className="mt-2 inline-block font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60 group-hover:opacity-100">
        {branch.home.label} →
      </span>
    </Link>

    <ul className="mt-8 space-y-1">
      {branch.sections.map((section) => (
        <li key={section.label + (section.path ?? "")}>
          <NavSection section={section} onClose={onClose} />
        </li>
      ))}
    </ul>
  </div>
);

/* -------------------------- Section ------------------------------ */

const linkClass =
  "font-cb-sans text-base tracking-wide opacity-90 hover:opacity-100 hover:underline underline-offset-4";

const summaryClass =
  "list-none cursor-pointer font-display text-xl md:text-2xl uppercase tracking-tight py-2 flex items-center justify-between gap-4 select-none focus:outline-none focus-visible:underline underline-offset-4";

const NavSection = ({
  section,
  onClose,
}: {
  section: SiteTreeSection;
  onClose: () => void;
}) => {
  // Flat link (no children)
  if (!section.links || section.links.length === 0) {
    return (
      <Link
        to={section.path ?? "#"}
        onClick={onClose}
        className="block py-2 font-display text-xl md:text-2xl uppercase tracking-tight opacity-90 hover:opacity-100 hover:underline underline-offset-4"
      >
        {section.label}
      </Link>
    );
  }

  // Concertina
  return (
    <details
      className="group border-b border-white/10 [&_summary::-webkit-details-marker]:hidden"
      {...(section.defaultOpenMd ? { open: true } : {})}
      data-nav-section={section.label.toLowerCase()}
    >
      <summary className={summaryClass}>
        <span>{section.label}</span>
        <span
          aria-hidden
          className="font-cb-mono text-base leading-none opacity-60 group-open:rotate-45 transition-transform"
        >
          +
        </span>
      </summary>
      <ul className="pb-4 pl-4 space-y-2">
        {section.path && (
          <li>
            <Link
              to={section.path}
              onClick={onClose}
              className={`${linkClass} italic opacity-70`}
            >
              All {section.label.toLowerCase()}
            </Link>
          </li>
        )}
        {section.links.map((link) => (
          <li key={link.path}>
            <Link to={link.path} onClick={onClose} className={linkClass}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
};

export default CBNavOverlay;
