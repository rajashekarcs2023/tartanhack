export function PixelTree({ x, y, variant = "oak", scale = 1 }: { x: number; y: number; variant?: "oak" | "pine" | "cherry"; scale?: number }) {
  const s = scale;
  if (variant === "pine") return (
    <g transform={`translate(${x},${y}) scale(${s})`} className="animate-sway" style={{ transformOrigin: `${x}px ${y}px` }}>
      <rect x={-2} y={0} width={4} height={10} fill="#5a3a1a" />
      <polygon points="-8,-2 8,-2 0,-18" fill="#1a5a1a" /><polygon points="-6,-10 6,-10 0,-22" fill="#2a7a2a" /><polygon points="-4,-16 4,-16 0,-26" fill="#3a9a3a" />
    </g>
  );
  if (variant === "cherry") return (
    <g transform={`translate(${x},${y}) scale(${s})`} className="animate-sway" style={{ transformOrigin: `${x}px ${y}px` }}>
      <rect x={-2} y={0} width={4} height={8} fill="#5a3a1a" />
      <circle cx={0} cy={-8} r={10} fill="#d87a8a" opacity={0.9} /><circle cx={-4} cy={-12} r={6} fill="#e89aaa" opacity={0.7} />
      <circle cx={3} cy={-4} r={2} fill="#ffaacc" opacity={0.5} />
    </g>
  );
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} className="animate-sway" style={{ transformOrigin: `${x}px ${y}px` }}>
      <rect x={-2} y={0} width={4} height={10} fill="#5a3a1a" />
      <circle cx={0} cy={-6} r={9} fill="#2a6a2a" /><circle cx={-4} cy={-10} r={6} fill="#3a8a3a" /><circle cx={4} cy={-8} r={5} fill="#3a7a3a" />
    </g>
  );
}
