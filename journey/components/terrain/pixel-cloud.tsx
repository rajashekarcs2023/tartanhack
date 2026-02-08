export function PixelCloud({ x, y, scale = 1, speed = 60 }: { x: number; y: number; scale?: number; speed?: number }) {
  return (
    <g opacity={0.6} style={{ animation: `float-cloud ${speed}s linear infinite` }}>
      <ellipse cx={x} cy={y} rx={20 * scale} ry={8 * scale} fill="#e8e0f0" />
      <ellipse cx={x - 10 * scale} cy={y - 3 * scale} rx={14 * scale} ry={7 * scale} fill="#f0e8f8" />
      <ellipse cx={x + 12 * scale} cy={y - 2 * scale} rx={12 * scale} ry={6 * scale} fill="#f0e8f8" />
    </g>
  );
}
