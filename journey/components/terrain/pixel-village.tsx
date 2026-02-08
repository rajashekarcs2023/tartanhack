export function PixelVillage({ x, y, label, reached }: { x: number; y: number; label: string; reached: boolean }) {
  return (
    <g transform={`translate(${x},${y})`}>
      {reached && <circle cx={0} cy={-6} r={18} fill="#ffd700" opacity={0.15} style={{ animation: "pulse 2s ease-in-out infinite" }} />}
      <rect x={-10} y={-16} width={20} height={16} fill={reached ? "#c4956a" : "#6a5a4a"} stroke="#3a2a1a" strokeWidth={1} />
      <polygon points="-13,-16 13,-16 0,-24" fill={reached ? "#8b3a3a" : "#4a3a3a"} />
      <rect x={-3} y={-8} width={6} height={8} fill={reached ? "#ffd700" : "#3a3a2a"} opacity={0.7} />
      <text x={0} y={10} textAnchor="middle" fill={reached ? "#ffd700" : "#8b7355"} style={{ fontSize: 5, fontFamily: "'Press Start 2P',monospace" }}>{label}</text>
    </g>
  );
}
