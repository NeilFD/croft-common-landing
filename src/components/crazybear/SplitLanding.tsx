import { Link } from "react-router-dom";

export interface SplitSide {
  label: string;
  image: string;
  href: string;
  cta: string;
  /** Optional eyebrow above the big label */
  eyebrow?: string;
}

interface SplitLandingProps {
  left: SplitSide;
  right: SplitSide;
}

const SplitLanding = ({ left, right }: SplitLandingProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen w-full bg-black">
      <Side side={left} property="town" />
      <Side side={right} property="country" />
    </div>
  );
};

const Side = ({ side, property }: { side: SplitSide; property: "town" | "country" }) => (
  <Link
    to={side.href}
    data-property={property}
    className="group relative flex items-end overflow-hidden min-h-[50vh] md:min-h-screen"
  >
    <img
      src={side.image}
      alt={side.label}
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40 transition-colors duration-500 group-hover:from-black/90" />
    <div className="relative z-10 w-full px-6 md:px-12 pb-16 md:pb-24 pt-32 text-white">
      {side.eyebrow && (
        <p className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-80 mb-4">
          {side.eyebrow}
        </p>
      )}
      <h2 className="font-display uppercase leading-[0.9] tracking-tight text-5xl md:text-7xl">
        {side.label}
      </h2>
      <span className="mt-6 inline-flex items-center font-cb-mono text-[10px] tracking-[0.4em] uppercase border border-white/80 px-6 py-3 transition-colors duration-300 group-hover:bg-white group-hover:text-black">
        {side.cta}
      </span>
    </div>
  </Link>
);

export default SplitLanding;
