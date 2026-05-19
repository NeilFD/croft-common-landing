/**
 * Pure SVG mirror-ball. Slow rotation, soft inner highlight, drifting specks.
 * Decorative — aria-hidden.
 */
interface Props {
  size?: number;
  className?: string;
}

const DiscoBall = ({ size = 320, className = "" }: Props) => {
  const facets = [] as JSX.Element[];
  const rings = 9;
  const facetsPerRing = 14;
  for (let r = 0; r < rings; r++) {
    const lat = (r / (rings - 1)) * Math.PI - Math.PI / 2;
    const y = Math.sin(lat) * 0.92;
    const radius = Math.cos(lat) * 0.92;
    const h = 0.08;
    const w = (2 * Math.PI * radius) / facetsPerRing;
    for (let i = 0; i < facetsPerRing; i++) {
      const lng = (i / facetsPerRing) * Math.PI * 2;
      const x = Math.cos(lng) * radius;
      // pseudo-random shade based on indices
      const seed = (Math.sin(r * 13.7 + i * 5.3) + 1) / 2;
      const shade = 0.45 + seed * 0.45;
      facets.push(
        <rect
          key={`${r}-${i}`}
          x={x - w / 2}
          y={y - h / 2}
          width={w * 0.95}
          height={h * 0.95}
          fill={`rgba(255,255,255,${shade})`}
          style={{ mixBlendMode: "screen" }}
        />
      );
    }
  }

  return (
    <svg
      viewBox="-1 -1 2 2"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="kar-ball-base" cx="0.35" cy="0.35" r="0.9">
          <stop offset="0%" stopColor="#f7f9ff" stopOpacity="0.95" />
          <stop offset="35%" stopColor="#b8c0cc" stopOpacity="0.85" />
          <stop offset="70%" stopColor="#2a2f3a" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#06070b" stopOpacity="1" />
        </radialGradient>
        <radialGradient id="kar-ball-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="hsl(354 78% 42%)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="hsl(354 78% 42%)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* outer red glow */}
      <circle cx="0" cy="0" r="0.98" fill="url(#kar-ball-glow)" />
      {/* base sphere */}
      <circle cx="0" cy="0" r="0.92" fill="url(#kar-ball-base)" />
      {/* spinning facet layer */}
      <g className="kar-spin">{facets}</g>
      {/* specular highlight */}
      <ellipse cx="-0.32" cy="-0.4" rx="0.18" ry="0.1" fill="rgba(255,255,255,0.55)" />
    </svg>
  );
};

export default DiscoBall;
