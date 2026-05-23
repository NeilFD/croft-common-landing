/**
 * BRAND 2026 — Editorial italic serif pull-quote.
 * Used sparingly for handwritten-feel moments lifted from the 2026 deck
 * ("You look like trouble", "8ish", "The 90s. Many memories. No evidence.").
 * Picks up the active property accent colour automatically. On dark
 * surfaces it uses the on-dark variant (Gold / Copper) for contrast;
 * pass onLight when sitting on a light background.
 */
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  eyebrow?: string;
  className?: string;
  size?: string;
  onLight?: boolean;
}

const PullQuoteSerif = ({
  children,
  eyebrow,
  className = "",
  size = "text-5xl md:text-7xl lg:text-8xl",
  onLight = false,
}: Props) => (
  <figure className={`my-12 md:my-16 ${className}`}>
    {eyebrow && (
      <figcaption className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60 mb-4">
        {eyebrow}
      </figcaption>
    )}
    <blockquote className={`cb-pullquote ${onLight ? "on-light" : ""} ${size}`}>
      {children}
    </blockquote>
  </figure>
);

export default PullQuoteSerif;
