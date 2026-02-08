export function PixelMountain({ x, y, w = 80, h = 50, color = "#4a3a5a" }: { x: number; y: number; w?: number; h?: number; color?: string }) {
  return (
    <g>
      <polygon points={`${x},${y} ${x + w / 2},${y - h} ${x + w},${y}`} fill={color} />
      <polygon points={`${x + w * 0.3},${y - h * 0.5} ${x + w / 2},${y - h} ${x + w * 0.7},${y - h * 0.5}`} fill="#e8e0f0" opacity={0.7} />
      <polygon points={`${x + w * 0.4},${y - h * 0.7} ${x + w / 2},${y - h} ${x + w * 0.6},${y - h * 0.7}`} fill="#fff" opacity={0.5} />
    </g>
  );
}
