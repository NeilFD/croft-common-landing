/**
 * BRAND 2026 — Hero pull-quote SCENE.
 * Full-bleed dark moment that lets a single line do the heavy lifting.
 * Apple-keynote scale, single accent (eyebrow + CTA only), quote in pure
 * warm off-white so colour doesn't fight itself.
 *
 * Use between page sections inside a property scope.
 */
import { Link } from "react-router-dom";
import type { ReactNode } from "react";

interface Props {
  eyebrow: string;
  children: ReactNode;
  ctaLabel?: string;
  ctaTo?: string;
  align?: "left" | "center";
}

const QuoteScene = ({ eyebrow, children, ctaLabel, ctaTo, align = "left" }: Props) => (
  <section className="relative w-full bg-black text-white overflow-hidden">
    {/* Single hairline of property accent across the top */}
    <span aria-hidden className="absolute top-0 left-0 h-[2px] w-full cb-accent-bg" />

    <div
      className={`mx-auto max-w-6xl px-6 md:px-12 py-28 md:py-40 ${
        align === "center" ? "text-center" : "text-left"
      }`}
    >
      <p
        className={`cb-accent-on-dark font-cb-mono text-[10px] md:text-xs tracking-[0.5em] uppercase ${
          align === "center" ? "mx-auto" : ""
        }`}
      >
        {eyebrow}
      </p>

      <blockquote
        className={`mt-10 md:mt-14 font-serif italic text-white leading-[0.95] tracking-tight
          text-[clamp(2.75rem,9vw,9rem)]
          ${align === "center" ? "max-w-5xl mx-auto" : "max-w-5xl"}`}
      >
        {children}
      </blockquote>

      {ctaLabel && ctaTo && (
        <div className={`mt-14 md:mt-20 ${align === "center" ? "flex justify-center" : ""}`}>
          <Link to={ctaTo} className="cb-accent-btn">
            {ctaLabel}
          </Link>
        </div>
      )}
    </div>
  </section>
);

export default QuoteScene;
