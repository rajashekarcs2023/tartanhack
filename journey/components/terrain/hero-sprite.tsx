export function HeroSprite({ x, y, walking = false }: { x: number; y: number; walking?: boolean }) {
  return (
    <g transform={`translate(${x},${y})`} className={walking ? "animate-hero-bob" : ""}>
      {/* glow */}
      <ellipse cx={0} cy={4} rx={10} ry={4} fill="#ffd700" opacity={0.2} />
      {/* body */}
      <rect x={-4} y={-4} width={8} height={10} fill="#2a5aaa" rx={1} />
      {/* head */}
      <rect x={-3} y={-10} width={6} height={6} fill="#f0c8a0" rx={1} />
      {/* hair */}
      <rect x={-3} y={-12} width={6} height={3} fill="#5a3a1a" rx={1} />
      {/* eyes */}
      <rect x={-2} y={-9} width={1.5} height={1.5} fill="#1a1a1a" /><rect x={1} y={-9} width={1.5} height={1.5} fill="#1a1a1a" />
      {/* legs */}
      <rect x={-3} y={6} width={3} height={4} fill="#3a3a5a" /><rect x={0} y={6} width={3} height={4} fill="#3a3a5a" />
      {/* sparkles */}
      {[0, 1, 2].map(i => <circle key={i} cx={-8 + i * 8} cy={-14 - i * 3} r={1.5} fill="#ffd700" opacity={0.7} className="animate-sparkle" style={{ animationDelay: `${i * 0.5}s` }} />)}
    </g>
  );
}
