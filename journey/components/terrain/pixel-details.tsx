export function PixelFlower({ x, y, color = "#ff6b8a" }: { x: number; y: number; color?: string }) {
  return (
    <g><circle cx={x} cy={y} r={2.5} fill={color} opacity={0.8} /><circle cx={x} cy={y} r={1} fill="#fff" /></g>
  );
}

export function PixelRock({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <ellipse cx={0} cy={0} rx={6} ry={4} fill="#7a7a6a" /><ellipse cx={-2} cy={-2} rx={3} ry={2} fill="#9a9a8a" opacity={0.6} />
    </g>
  );
}

export function PixelRiver({ x1, y1, x2, y2, width = 12 }: { x1: number; y1: number; x2: number; y2: number; width?: number }) {
  return (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#4a8ab4" strokeWidth={width} strokeLinecap="round" opacity={0.6} />
  );
}

export function PixelBridge({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={-14} y={-3} width={28} height={6} fill="#8b6508" stroke="#5a3a08" strokeWidth={1} rx={1} />
      <rect x={-12} y={-6} width={3} height={3} fill="#6a4a08" /><rect x={9} y={-6} width={3} height={3} fill="#6a4a08" />
    </g>
  );
}
