/**
 * BRAND 2026 — Hero pull-quote SCENE.
 * Full-bleed dark moment. The headline is the punchy line (huge italic serif,
 * Apple-keynote scale). One supporting body sentence sits underneath. Single
 * accent CTA. One accent colour per scene — quote stays white, accent only on
 * the hairline + CTA.
 */
import { Link } from "react-router-dom";
import type { ReactNode } from "react";

interface Props {
  headline: ReactNode;
  body?: ReactNode;
  ctaLabel?: string;
  ctaTo?: string;
  align?: "left" | "center";
}

const QuoteScene = ({ headline, body, ctaLabel, ctaTo, align = "left" }: Props) => (
  <section className="relative w-full bg-black text-white overflow-hidden">
    <span aria-hidden className="absolute top-0 left-0 h-[2px] w-full cb-accent-bg" />

    <div
      className={`mx-auto max-w-5xl px-6 md:px-12 py-24 md:py-32 ${
        align === "center" ? "text-center" : "text-left"
      }`}
    >
      <h2
        className={`font-serif italic text-white leading-[0.95] tracking-tight
          text-[clamp(2.5rem,6.5vw,6rem)]
          ${align === "center" ? "max-w-4xl mx-auto" : "max-w-4xl"}`}
      >
        {headline}
      </h2>

      {body && (
        <p
          className={`mt-8 md:mt-10 font-cb-sans text-lg md:text-2xl leading-snug text-white/70 max-w-2xl
            ${align === "center" ? "mx-auto" : ""}`}
        >
          {body}
        </p>
      )}

      {ctaLabel && ctaTo && (
        <div className={`mt-12 md:mt-16 ${align === "center" ? "flex justify-center" : ""}`}>
          <Link to={ctaTo} className="cb-scene-cta">
            <span>{ctaLabel}</span>
            <span aria-hidden className="cb-scene-cta__arrow">→</span>
          </Link>
        </div>
      )}
    </div>
  </section>
);

export default QuoteScene;
