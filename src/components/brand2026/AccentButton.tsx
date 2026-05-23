/**
 * BRAND 2026 — Accent CTA.
 * Picks up the active property accent (Town Red / Country Pesto) via the
 * cb-accent token. Ghost variant uses the contrast-safe on-dark colour
 * (Gold for Town, Copper for Country) so it stays legible on near-black.
 *
 * Outside a property scope it falls back to foreground (black/white).
 */
import { Link } from "react-router-dom";
import type { ReactNode } from "react";

interface BaseProps {
  children: ReactNode;
  variant?: "filled" | "ghost";
  className?: string;
}

interface LinkProps extends BaseProps {
  to: string;
  href?: never;
  onClick?: never;
  type?: never;
}

interface AnchorProps extends BaseProps {
  href: string;
  to?: never;
  onClick?: never;
  type?: never;
}

interface ButtonProps extends BaseProps {
  onClick: () => void;
  to?: never;
  href?: never;
  type?: "button" | "submit";
}

type Props = LinkProps | AnchorProps | ButtonProps;

const AccentButton = (props: Props) => {
  const { children, variant = "filled", className = "" } = props;
  const cls = `${variant === "ghost" ? "cb-accent-btn--ghost" : "cb-accent-btn"} ${className}`.trim();

  if ("to" in props && props.to) {
    return (
      <Link to={props.to} className={cls}>
        {children}
      </Link>
    );
  }
  if ("href" in props && props.href) {
    return (
      <a href={props.href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button type={props.type ?? "button"} onClick={props.onClick} className={cls}>
      {children}
    </button>
  );
};

export default AccentButton;
