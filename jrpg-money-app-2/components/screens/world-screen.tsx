"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { useJourney } from "@/store/journey-store";
import { RpgButton } from "@/components/rpg/rpg-panel";
import { GameMenu } from "@/components/rpg/game-menu";

/* ── 15 waypoints winding through 5 biomes ── */
const WP = [
  { x: 160, y: 1520, label: "Start Village", biome: "meadow" },
  { x: 260, y: 1400, label: "First Savings", biome: "meadow" },
  { x: 120, y: 1290, label: "Budget Inn", biome: "meadow" },
  { x: 300, y: 1170, label: "Commitment Bridge", biome: "forest" },
  { x: 170, y: 1060, label: "Forest Shrine", biome: "forest" },
  { x: 310, y: 940, label: "River Crossing", biome: "forest" },
  { x: 140, y: 830, label: "Halfway Rest", biome: "hills" },
  { x: 320, y: 720, label: "Hilltop View", biome: "hills" },
  { x: 160, y: 610, label: "Wind Pass", biome: "hills" },
  { x: 300, y: 500, label: "Mountain Gate", biome: "mountain" },
  { x: 130, y: 390, label: "Frost Camp", biome: "mountain" },
  { x: 280, y: 290, label: "Eagle Ridge", biome: "mountain" },
  { x: 170, y: 200, label: "Summit Trail", biome: "peak" },
  { x: 280, y: 120, label: "Golden Gate", biome: "peak" },
  { x: 220, y: 50, label: "Goal Castle", biome: "peak" },
];
const MAP_W = 430;
const MAP_H = 1650;

/* ── Seeded random for consistent terrain ── */
function seeded(seed: number) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

/* ── SVG sub-components ── */
function PineTree({ x, y, scale = 1, shade = 0 }: { x: number; y: number; scale?: number; shade?: number }) {
  const g = shade === 0 ? "#1a6e1a" : shade === 1 ? "#0f5f0f" : "#2a8a2a";
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} style={{ animation: `sway ${2.5 + shade * 0.5}s ease-in-out infinite` }}>
      <polygon points="0,-22 -8,-4 8,-4" fill={g} stroke="#0a4a0a" strokeWidth={0.5} />
      <polygon points="0,-16 -6,0 6,0" fill={g} opacity={0.8} />
      <rect x={-2} y={-4} width={4} height={8} fill="#5a3a1e" />
    </g>
  );
}

function OakTree({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} style={{ animation: `sway 3s ease-in-out infinite` }}>
      <ellipse cx={0} cy={-16} rx={10} ry={10} fill="#2d7a2d" />
      <ellipse cx={5} cy={-18} rx={8} ry={8} fill="#3a9a3a" opacity={0.7} />
      <ellipse cx={-4} cy={-14} rx={7} ry={7} fill="#1e6e1e" opacity={0.6} />
      <rect x={-2} y={-6} width={4} height={10} fill="#6b4226" />
    </g>
  );
}

function CherryTree({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`} style={{ animation: "sway 3.5s ease-in-out infinite" }}>
      <ellipse cx={0} cy={-14} rx={9} ry={9} fill="#e8a0b0" />
      <ellipse cx={4} cy={-16} rx={7} ry={7} fill="#f0b8c8" opacity={0.7} />
      <rect x={-1.5} y={-5} width={3} height={9} fill="#6b4226" />
      {[[-6, -18], [2, -20], [7, -14], [-3, -12]].map(([fx, fy], i) => (
        <circle key={i} cx={fx} cy={fy} r={1.2} fill="#ff69b4" opacity={0.7} />
      ))}
    </g>
  );
}

function Rock({ x, y, w }: { x: number; y: number; w: number }) {
  return (
    <g>
      <ellipse cx={x} cy={y} rx={w} ry={w * 0.55} fill="#8a8a7a" />
      <ellipse cx={x - w * 0.15} cy={y - w * 0.15} rx={w * 0.7} ry={w * 0.35} fill="#9a9a8a" />
    </g>
  );
}

function Bush({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <ellipse cx={x} cy={y} rx={6} ry={4} fill="#3a8a3a" />
      <ellipse cx={x + 4} cy={y - 1} rx={5} ry={3.5} fill="#4a9a4a" opacity={0.8} />
    </g>
  );
}

function Village({ x, y, label, active, reached, size = "sm" }: { x: number; y: number; label: string; active: boolean; reached: boolean; size?: "sm" | "lg" }) {
  const s = size === "lg" ? 1.5 : 1;
  return (
    <g transform={`translate(${x},${y})`}>
      {active && <circle cx={0} cy={0} r={22 * s} fill="none" stroke="#ffd700" strokeWidth={2} opacity={0.5} style={{ animation: "pulse-glow 1.5s infinite" }} />}
      {/* Building */}
      <rect x={-12 * s} y={-8 * s} width={24 * s} height={16 * s} fill={reached ? "#c8a24e" : "#5a5a5a"} stroke={reached ? "#8b6508" : "#3a3a3a"} strokeWidth={1.5} rx={1} />
      {/* Roof */}
      <polygon points={`${-14 * s},${-8 * s} 0,${-20 * s} ${14 * s},${-8 * s}`} fill={reached ? "#8b3a3a" : "#4a4a4a"} stroke={reached ? "#6e2222" : "#333"} strokeWidth={1} />
      {/* Door */}
      {reached && <rect x={-3 * s} y={0} width={6 * s} height={8 * s} fill="#5a3a1e" rx={1} />}
      {/* Window */}
      {reached && <>
        <rect x={-9 * s} y={-4 * s} width={4 * s} height={4 * s} fill="#ffeebb" opacity={0.8} />
        <rect x={5 * s} y={-4 * s} width={4 * s} height={4 * s} fill="#ffeebb" opacity={0.8} />
      </>}
      {/* Flag on active */}
      {active && (
        <g style={{ animation: "flag-wave 1s ease-in-out infinite" }}>
          <line x1={12 * s} y1={-20 * s} x2={12 * s} y2={-30 * s} stroke="#5a3a1e" strokeWidth={1.5} />
          <polygon points={`${12 * s},${-30 * s} ${22 * s},${-27 * s} ${12 * s},${-24 * s}`} fill="#ffd700" />
        </g>
      )}
      <text x={0} y={14 * s + 10} textAnchor="middle" fontSize={5} fill={reached ? "#ffd700" : "#777"} fontFamily="'Press Start 2P',monospace">{label}</text>
    </g>
  );
}

function GhostMarker({ x, y }: { x: number; y: number }) {
  return (
    <g opacity={0.35}>
      <circle cx={x} cy={y} r={10} fill="none" stroke="#ccc" strokeWidth={1.5} strokeDasharray="3,3" />
      <text x={x} y={y + 3} textAnchor="middle" fontSize={7} fill="#aaa" fontFamily="'Press Start 2P',monospace">?</text>
      <text x={x} y={y + 16} textAnchor="middle" fontSize={4} fill="#999" fontFamily="'Press Start 2P',monospace">PREV</text>
    </g>
  );
}

function Waterfall({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 4} y={y} width={8} height={30} fill="#7ac5f0" opacity={0.5} rx={2} />
      {[0, 8, 16, 24].map(dy => (
        <ellipse key={dy} cx={x} cy={y + dy + 3} rx={5} ry={2} fill="white" opacity={0.3 + (dy % 16 === 0 ? 0.2 : 0)}>
          <animate attributeName="opacity" values="0.2;0.5;0.2" dur={`${0.8 + dy * 0.05}s`} repeatCount="indefinite" />
        </ellipse>
      ))}
      <ellipse cx={x} cy={y + 32} rx={10} ry={4} fill="#5BB5F5" opacity={0.4} />
    </g>
  );
}

function Castle({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      {/* Base */}
      <rect x={-25} y={-20} width={50} height={30} fill="#c8a24e" stroke="#8b6508" strokeWidth={2} />
      {/* Left tower */}
      <rect x={-30} y={-40} width={16} height={50} fill="#c8a24e" stroke="#8b6508" strokeWidth={1.5} />
      <polygon points="-30,-40 -22,-52 -14,-40" fill="#8b3a3a" stroke="#6e2222" strokeWidth={1} />
      {/* Right tower */}
      <rect x={14} y={-40} width={16} height={50} fill="#c8a24e" stroke="#8b6508" strokeWidth={1.5} />
      <polygon points="14,-40 22,-52 30,-40" fill="#8b3a3a" stroke="#6e2222" strokeWidth={1} />
      {/* Center tower */}
      <rect x={-10} y={-50} width={20} height={40} fill="#d4b058" stroke="#8b6508" strokeWidth={1.5} />
      <polygon points="-10,-50 0,-62 10,-50" fill="#c04040" stroke="#8b2222" strokeWidth={1} />
      {/* Flag */}
      <line x1={0} y1={-62} x2={0} y2={-75} stroke="#5a3a1e" strokeWidth={2} />
      <polygon points="0,-75 16,-71 0,-67" fill="#ffd700" style={{ animation: "flag-wave 1s ease-in-out infinite" }} />
      {/* Windows */}
      {[[-22, -32], [-22, -20], [18, -32], [18, -20], [-4, -40], [4, -40]].map(([wx, wy], i) => (
        <rect key={i} x={wx} y={wy} width={4} height={5} fill="#ffeebb" opacity={0.9} rx={0.5} />
      ))}
      {/* Gate */}
      <rect x={-6} y={-6} width={12} height={16} fill="#5a3a1e" rx={6} />
      {/* Crenellations */}
      {[-28, -22, -16, 16, 22, 28].map((cx, i) => (
        <rect key={i} x={cx - 2} y={-44} width={4} height={5} fill="#c8a24e" stroke="#8b6508" strokeWidth={0.5} />
      ))}
      <text x={0} y={22} textAnchor="middle" fontSize={6} fill="#ffd700" fontFamily="'Press Start 2P',monospace">GOAL CASTLE</text>
    </g>
  );
}

export function WorldScreen() {
  const { navigate, state, tilesGained, clearTilesGained } = useJourney();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showToast, setShowToast] = useState(tilesGained > 0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tile = state.journey.currentTile;
  const prevTile = state.journey.previousTile;
  const total = state.journey.totalTiles;

  /* Animated walk: starts at prevTile, steps to currentTile one at a time */
  const [animTile, setAnimTile] = useState(tilesGained > 0 ? prevTile : tile);
  useEffect(() => {
    if (animTile < tile) {
      const t = setTimeout(() => setAnimTile(v => Math.min(v + 1, tile)), 650);
      return () => clearTimeout(t);
    }
  }, [animTile, tile]);

  /* Dismiss toast */
  useEffect(() => {
    if (showToast) { const t = setTimeout(() => { setShowToast(false); clearTilesGained(); }, 4500); return () => clearTimeout(t); }
  }, [showToast, clearTilesGained]);

  /* Follow hero with camera */
  const heroWp = WP[Math.min(animTile, WP.length - 1)];
  useEffect(() => {
    if (!scrollRef.current) return;
    const ch = scrollRef.current.clientHeight;
    scrollRef.current.scrollTo({ top: Math.max(0, heroWp.y - ch / 2), behavior: "smooth" });
  }, [heroWp.y]);

  /* Deterministic terrain */
  const terrain = useMemo(() => {
    const rng = seeded(42);
    const trees: { x: number; y: number; type: "pine" | "oak" | "cherry"; scale: number; shade: number }[] = [];
    const rocks: { x: number; y: number; w: number }[] = [];
    const bushes: { x: number; y: number }[] = [];
    const flowers: { x: number; y: number; c: string }[] = [];
    const grassTufts: { x: number; y: number }[] = [];
    const flowerColors = ["#ff69b4", "#ffeb3b", "#ff4444", "#ffffff", "#ff9800", "#e040fb", "#69f0ae"];

    for (let i = 0; i < 120; i++) {
      const x = rng() * (MAP_W - 40) + 20;
      const y = rng() * MAP_H;
      const type = y > 1100 ? (rng() > 0.6 ? "cherry" : "oak") : y > 600 ? (rng() > 0.3 ? "pine" : "oak") : "pine";
      trees.push({ x, y, type, scale: 0.7 + rng() * 0.6, shade: Math.floor(rng() * 3) });
    }
    for (let i = 0; i < 30; i++) rocks.push({ x: rng() * (MAP_W - 20) + 10, y: rng() * MAP_H, w: 4 + rng() * 8 });
    for (let i = 0; i < 40; i++) bushes.push({ x: rng() * (MAP_W - 20) + 10, y: 700 + rng() * 900 });
    for (let i = 0; i < 80; i++) flowers.push({ x: rng() * (MAP_W - 10) + 5, y: 1100 + rng() * 500, c: flowerColors[Math.floor(rng() * flowerColors.length)] });
    for (let i = 0; i < 60; i++) grassTufts.push({ x: rng() * (MAP_W - 10), y: 800 + rng() * 800 });
    return { trees, rocks, bushes, flowers, grassTufts };
  }, []);

  /* Build path string */
  const pathD = WP.map((w, i) => `${i === 0 ? "M" : "L"}${w.x},${w.y}`).join(" ");
  const progressD = WP.slice(0, animTile + 1).map((w, i) => `${i === 0 ? "M" : "L"}${w.x},${w.y}`).join(" ");
  const recentD = tilesGained > 0 && prevTile < animTile
    ? WP.slice(prevTile, animTile + 1).map((w, i) => `${i === 0 ? "M" : "L"}${w.x},${w.y}`).join(" ")
    : "";

  return (
    <div className="relative flex h-full flex-col">
      {/* HUD */}
      <div className="z-20 flex items-center justify-between" style={{ backgroundColor: "rgba(42,26,14,0.96)", padding: "5px 8px", borderBottom: "2px solid #8b5e3c" }}>
        <div style={{ fontSize: 6, color: "#fff8e7" }}>
          <span style={{ color: "#ffd700" }}>TILE {animTile}</span>
          <span style={{ color: "#8b7355" }}> / {total}</span>
        </div>
        <div style={{ flex: 1, margin: "0 8px", height: 8, backgroundColor: "#2a1a0e", border: "1px solid #5a3a1e", position: "relative", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(animTile / total) * 100}%`, background: "linear-gradient(90deg, #2d7a2d, #4CAF50, #66BB6A)", transition: "width 0.6s ease", boxShadow: "0 0 6px rgba(76,175,80,0.6)" }} />
          {/* Shine effect */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(180deg, rgba(255,255,255,0.2), transparent)" }} />
        </div>
        <div className="flex gap-1">
          <button type="button" onClick={() => navigate("title")} style={{ backgroundColor: "rgba(42,26,14,0.92)", padding: "4px 8px", border: "2px solid #8b5e3c", fontSize: 6, color: "#a0d8a0", cursor: "pointer", fontFamily: "'Press Start 2P',monospace" }}>HOME</button>
          <button type="button" onClick={() => setMenuOpen(!menuOpen)} style={{ backgroundColor: "rgba(42,26,14,0.92)", padding: "4px 8px", border: "2px solid #8b5e3c", fontSize: 6, color: "#ffd700", cursor: "pointer", fontFamily: "'Press Start 2P',monospace" }}>MENU</button>
        </div>
      </div>

      {/* Welcome back toast */}
      {showToast && (
        <div className="absolute left-3 right-3 z-30" style={{ top: 42, animation: "toast-in 0.4s ease-out" }}>
          <div className="pixel-border" style={{ backgroundColor: "rgba(42,26,14,0.96)", padding: "8px 12px", textAlign: "center" }}>
            <p style={{ fontSize: 7, color: "#ffd700", marginBottom: 3 }}>WELCOME BACK, TRAVELER!</p>
            <p style={{ fontSize: 5, color: "#a0d8a0" }}>You journeyed {tilesGained} tile{tilesGained !== 1 ? "s" : ""} while you were away</p>
            <div style={{ marginTop: 4, height: 3, background: "linear-gradient(90deg, transparent, #ffd700, transparent)" }} />
          </div>
        </div>
      )}

      {/* Scrollable world map */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: "none" }}>
        <svg width={MAP_W} height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={{ display: "block", width: "100%", height: "auto" }}>
          <defs>
            <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a0620" />
              <stop offset="8%" stopColor="#1a1050" />
              <stop offset="18%" stopColor="#4A3080" />
              <stop offset="30%" stopColor="#5BA3D9" />
              <stop offset="50%" stopColor="#87CEEB" />
              <stop offset="100%" stopColor="#90d890" />
            </linearGradient>
            <linearGradient id="meadowG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3a7a3a" /><stop offset="100%" stopColor="#4a9a4a" />
            </linearGradient>
            <linearGradient id="forestG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a4a1a" /><stop offset="100%" stopColor="#2d5a2d" />
            </linearGradient>
            <linearGradient id="hillG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5a7a3a" /><stop offset="100%" stopColor="#6a8a4a" />
            </linearGradient>
            <linearGradient id="mountainG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5a5a5a" /><stop offset="100%" stopColor="#6a6a5a" />
            </linearGradient>
            <radialGradient id="heroGlow">
              <stop offset="0%" stopColor="#ffd700" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ffd700" stopOpacity="0" />
            </radialGradient>
            <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>

          {/* Full sky */}
          <rect width={MAP_W} height={MAP_H} fill="url(#skyG)" />

          {/* Stars at peak biome */}
          {Array.from({ length: 30 }, (_, i) => {
            const rng = seeded(i + 100);
            return <circle key={`star${i}`} cx={rng() * MAP_W} cy={rng() * 200} r={0.8 + rng()} fill="white" opacity={0.3 + rng() * 0.5}>
              <animate attributeName="opacity" values={`${0.2 + rng() * 0.3};${0.6 + rng() * 0.4};${0.2 + rng() * 0.3}`} dur={`${2 + rng() * 3}s`} repeatCount="indefinite" />
            </circle>;
          })}

          {/* Biome ground layers */}
          <rect x={0} y={1150} width={MAP_W} height={500} fill="url(#meadowG)" />
          <rect x={0} y={850} width={MAP_W} height={300} fill="url(#forestG)" />
          <rect x={0} y={600} width={MAP_W} height={250} fill="url(#hillG)" />
          <rect x={0} y={300} width={MAP_W} height={300} fill="url(#mountainG)" opacity={0.6} />

          {/* Mountain ranges (background) */}
          <polygon points="0,350 70,180 140,350" fill="#6a5a8a" opacity={0.5} />
          <polygon points="80,350 170,120 260,350" fill="#7E57C2" opacity={0.45} />
          <polygon points="200,350 300,150 400,350" fill="#6a5a8a" opacity={0.5} />
          <polygon points="300,350 380,200 430,350" fill="#7E57C2" opacity={0.4} />
          {/* Closer mountains */}
          <polygon points="0,450 90,280 180,450" fill="#5a6a5a" opacity={0.35} />
          <polygon points="180,450 280,300 380,450" fill="#5a6a5a" opacity={0.3} />
          <polygon points="350,450 410,320 430,450" fill="#5a6a5a" opacity={0.35} />
          {/* Snow caps */}
          <polygon points="70,180 60,210 80,210" fill="white" opacity={0.75} />
          <polygon points="170,120 158,160 182,160" fill="white" opacity={0.8} />
          <polygon points="300,150 288,185 312,185" fill="white" opacity={0.75} />

          {/* Rivers with shimmer */}
          <path d="M0,960 Q80,940 180,970 Q280,1000 360,960 Q400,945 430,955" stroke="#5BB5F5" strokeWidth={8} fill="none" opacity={0.55} strokeLinecap="round">
            <animate attributeName="opacity" values="0.45;0.6;0.45" dur="4s" repeatCount="indefinite" />
          </path>
          <path d="M0,960 Q80,940 180,970 Q280,1000 360,960 Q400,945 430,955" stroke="#88d8ff" strokeWidth={3} fill="none" opacity={0.3} strokeLinecap="round" />

          <path d="M0,1180 Q100,1160 220,1190 Q320,1210 430,1170" stroke="#5BB5F5" strokeWidth={7} fill="none" opacity={0.5} strokeLinecap="round">
            <animate attributeName="opacity" values="0.4;0.55;0.4" dur="3.5s" repeatCount="indefinite" />
          </path>

          {/* Bridges */}
          <rect x={285} y={1158} width={40} height={10} fill="#8b5e3c" stroke="#5a3a1e" strokeWidth={1.5} rx={2} />
          <rect x={286} y={1156} width={2} height={14} fill="#5a3a1e" />
          <rect x={323} y={1156} width={2} height={14} fill="#5a3a1e" />

          <rect x={290} y={948} width={35} height={10} fill="#8b5e3c" stroke="#5a3a1e" strokeWidth={1.5} rx={2} />

          {/* Waterfall in mountains */}
          <Waterfall x={60} y={340} />

          {/* Pond in meadow */}
          <ellipse cx={350} cy={1350} rx={25} ry={12} fill="#5BB5F5" opacity={0.4} />
          <ellipse cx={350} cy={1348} rx={20} ry={8} fill="#88d8ff" opacity={0.3} />

          {/* Clouds floating across */}
          {[[30, 80, 28], [200, 50, 22], [350, 100, 18], [100, 250, 25], [300, 400, 20], [50, 550, 22], [380, 700, 16]].map(([cx, cy, w], i) => (
            <g key={`cl${i}`} style={{ animation: `float-cloud ${14 + i * 3}s linear infinite` }} opacity={0.8 - i * 0.05}>
              <ellipse cx={cx} cy={cy} rx={w} ry={w * 0.38} fill="white" />
              <ellipse cx={(cx as number) + (w as number) * 0.45} cy={(cy as number) - 3} rx={(w as number) * 0.55} ry={(w as number) * 0.28} fill="white" />
            </g>
          ))}

          {/* Grass tufts */}
          {terrain.grassTufts.map((g, i) => (
            <g key={`gr${i}`}>
              <line x1={g.x} y1={g.y} x2={g.x - 2} y2={g.y - 5} stroke="#5aaa5a" strokeWidth={1} opacity={0.5} />
              <line x1={g.x + 2} y1={g.y} x2={g.x + 4} y2={g.y - 4} stroke="#4a9a4a" strokeWidth={1} opacity={0.5} />
            </g>
          ))}

          {/* Flowers */}
          {terrain.flowers.map((f, i) => (
            <g key={`fl${i}`}>
              <circle cx={f.x} cy={f.y} r={2} fill={f.c} opacity={0.75} />
              <circle cx={f.x} cy={f.y} r={0.8} fill="white" opacity={0.5} />
            </g>
          ))}

          {/* Rocks */}
          {terrain.rocks.map((r, i) => <Rock key={`rk${i}`} x={r.x} y={r.y} w={r.w} />)}

          {/* Bushes */}
          {terrain.bushes.map((b, i) => <Bush key={`bu${i}`} x={b.x} y={b.y} />)}

          {/* Trees */}
          {terrain.trees.map((t, i) =>
            t.type === "pine" ? <PineTree key={`t${i}`} x={t.x} y={t.y} scale={t.scale} shade={t.shade} /> :
            t.type === "cherry" ? <CherryTree key={`t${i}`} x={t.x} y={t.y} /> :
            <OakTree key={`t${i}`} x={t.x} y={t.y} scale={t.scale} />
          )}

          {/* The path - dirt road */}
          <path d={pathD} stroke="#6b4226" strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.5} />
          <path d={pathD} stroke="#c8a24e" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.4} strokeDasharray="2,8" />

          {/* Progress glow */}
          {animTile > 0 && (
            <path d={progressD} stroke="#ffd700" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.7} filter="url(#glow)" />
          )}

          {/* Recently traveled section */}
          {recentD && (
            <path d={recentD} stroke="#7CFC00" strokeWidth={3} fill="none" strokeLinecap="round" strokeDasharray="5,4" opacity={0.65} filter="url(#glow)" />
          )}

          {/* Ghost marker */}
          {tilesGained > 0 && prevTile < animTile && <GhostMarker x={WP[prevTile].x} y={WP[prevTile].y} />}

          {/* Village waypoints */}
          {WP.slice(0, -1).map((w, i) => (
            <Village key={i} x={w.x} y={w.y} label={w.label} active={i === animTile} reached={i <= animTile} size={i === 0 || i === 6 ? "lg" : "sm"} />
          ))}

          {/* Destination castle */}
          <Castle x={WP[14].x} y={WP[14].y} />

          {/* Hero sprite with glow + sparkles */}
          <g style={{ animation: "hero-bob 0.6s ease-in-out infinite" }}>
            <ellipse cx={heroWp.x} cy={heroWp.y + 14} rx={12} ry={4} fill="url(#heroGlow)" />
            {[0, 1, 2, 3, 4].map(i => (
              <circle key={i} cx={heroWp.x + (i - 2) * 7} cy={heroWp.y - 10} r={1.5} fill="#ffd700"
                style={{ animation: `sparkle ${1.2 + i * 0.3}s ease-in-out infinite`, animationDelay: `${i * 0.25}s` }} />
            ))}
            {/* Shadow */}
            <ellipse cx={heroWp.x} cy={heroWp.y + 12} rx={6} ry={2.5} fill="rgba(0,0,0,0.25)" />
            {/* Head */}
            <circle cx={heroWp.x} cy={heroWp.y - 8} r={5} fill="#ffd700" stroke="#b8860b" strokeWidth={0.8} />
            {/* Eyes */}
            <circle cx={heroWp.x - 2} cy={heroWp.y - 9} r={0.8} fill="#2a1a0e" />
            <circle cx={heroWp.x + 2} cy={heroWp.y - 9} r={0.8} fill="#2a1a0e" />
            {/* Body */}
            <rect x={heroWp.x - 5} y={heroWp.y - 3} width={10} height={10} fill="#4169E1" stroke="#2a3a8a" strokeWidth={0.8} rx={1} />
            {/* Belt */}
            <rect x={heroWp.x - 5} y={heroWp.y + 2} width={10} height={2} fill="#8b6508" />
            {/* Legs */}
            <rect x={heroWp.x - 5} y={heroWp.y + 7} width={4} height={5} fill="#3a2a1e" rx={0.5} />
            <rect x={heroWp.x + 1} y={heroWp.y + 7} width={4} height={5} fill="#3a2a1e" rx={0.5} />
            {/* Sword */}
            <rect x={heroWp.x + 6} y={heroWp.y - 6} width={2} height={12} fill="#c0c0c0" rx={0.5} />
            <rect x={heroWp.x + 5} y={heroWp.y - 1} width={4} height={2} fill="#8b6508" rx={0.5} />
          </g>

          {/* Fireflies in forest zone */}
          {Array.from({ length: 15 }, (_, i) => {
            const rng = seeded(i + 200);
            const fx = 20 + rng() * (MAP_W - 40);
            const fy = 860 + rng() * 250;
            return <circle key={`ff${i}`} cx={fx} cy={fy} r={1.2} fill="#aaff44" opacity={0.3}>
              <animate attributeName="opacity" values="0;0.7;0" dur={`${2 + rng() * 3}s`} repeatCount="indefinite" begin={`${rng() * 3}s`} />
            </circle>;
          })}
        </svg>
      </div>

      {/* Bottom bar */}
      <div className="z-20 flex items-center justify-between" style={{ backgroundColor: "rgba(42,26,14,0.96)", padding: "6px 8px", borderTop: "2px solid #8b5e3c" }}>
        <div>
          <p style={{ fontSize: 6, color: "#ffd700" }}>{state.goal?.label ?? "No goal"}</p>
          <p style={{ fontSize: 5, color: "#a0d8a0", marginTop: 2 }}>Streak: {state.journey.dayStreak} days</p>
        </div>
        <RpgButton variant="primary" onClick={() => navigate("decision")} style={{ fontSize: 6 }}>LOG SPENDING</RpgButton>
      </div>

      <GameMenu open={menuOpen} onClose={() => setMenuOpen(false)} currentScreen="world" />
    </div>
  );
}
