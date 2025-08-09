import React, { useId } from "react";
import { cn } from "@/lib/utils";

interface SolidDiceProps {
  face: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}

// Positions (viewBox 0..100)
const P = {
  tl: { cx: 25, cy: 25 },
  tr: { cx: 75, cy: 25 },
  ml: { cx: 25, cy: 50 },
  mr: { cx: 75, cy: 50 },
  bl: { cx: 25, cy: 75 },
  br: { cx: 75, cy: 75 },
  c: { cx: 50, cy: 50 },
};

const PIPS: Record<SolidDiceProps["face"], { cx: number; cy: number }[]> = {
  1: [P.c],
  2: [P.tl, P.br],
  3: [P.tl, P.c, P.br],
  4: [P.tl, P.tr, P.bl, P.br],
  5: [P.tl, P.tr, P.c, P.bl, P.br],
  6: [P.tl, P.tr, P.ml, P.mr, P.bl, P.br],
};

// A solid, rounded square with masked-out pips (true cut-outs)
const SolidDice: React.FC<SolidDiceProps> = ({ face, className }) => {
  const maskId = useId();
  const pips = PIPS[face];

  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("block", className)}
      role="img"
      aria-label={`Dice face ${face}`}
    >
      <defs>
        <mask id={maskId}>
          {/* White reveals, black conceals (creates holes) */}
          <rect x="0" y="0" width="100" height="100" rx="18" fill="white" />
          {pips.map((p, i) => (
            <circle key={i} cx={p.cx} cy={p.cy} r={6.5} fill="black" />
          ))}
        </mask>
      </defs>

      {/* Solid body uses currentColor for perfect monochrome theming */}
      <rect
        x="0"
        y="0"
        width="100"
        height="100"
        rx="18"
        fill="currentColor"
        mask={`url(#${maskId})`}
      />
    </svg>
  );
};

export default SolidDice;
