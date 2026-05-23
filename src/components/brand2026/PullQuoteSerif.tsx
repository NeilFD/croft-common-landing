/**
 * BRAND 2026 — Editorial italic serif pull-quote.
 * Used sparingly for handwritten-feel moments lifted from the 2026 deck
 * ("You look like trouble", "8ish", "The 90s. Many memories. No evidence.").
 * Picks up the active property accent colour automatically.
 */
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Optional small label above the quote (mono caps). */
  eyebrow?: string;
  className?: string;
  /** Tailwind size override for the quote text. */
  size?: string;
}

const PullQuoteSerif = ({
  children,
  eyebrow,
  className = "",
  size = "text-4xl md:text-6xl",
}: Props) => (
  <figure className={`my-12 md:my-16 ${className}`}>
    {eyebrow && (
      <figcaption className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60 mb-4">
        {eyebrow}
      </figcaption>
    )}
    <blockquote className={`cb-pullquote ${size}`}>{children}</blockquote>
  </figure>
);

export default PullQuoteSerif;
