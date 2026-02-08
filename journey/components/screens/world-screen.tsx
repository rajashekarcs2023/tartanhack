"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useJourney } from "@/store/journey-store";
import { RpgButton } from "@/components/terrain/rpg-panel";
import { GameMenu } from "@/components/terrain/game-menu";
import type { DemonEncounter } from "@/types/journey";

/* ── 15 waypoints winding through 5 biomes ── */
const WP = [
  { x: 200, y: 1800, label: "Start Village", biome: "meadow" },
  { x: 320, y: 1660, label: "First Savings", biome: "meadow" },
  { x: 110, y: 1530, label: "Budget Inn", biome: "meadow" },
  { x: 310, y: 1390, label: "Commitment Bridge", biome: "forest" },
  { x: 130, y: 1260, label: "Forest Shrine", biome: "forest" },
  { x: 330, y: 1120, label: "River Crossing", biome: "forest" },
  { x: 150, y: 980, label: "Halfway Rest", biome: "hills" },
  { x: 340, y: 850, label: "Hilltop View", biome: "hills" },
  { x: 120, y: 720, label: "Wind Pass", biome: "hills" },
  { x: 310, y: 590, label: "Mountain Gate", biome: "mountain" },
  { x: 140, y: 470, label: "Frost Camp", biome: "mountain" },
  { x: 300, y: 350, label: "Eagle Ridge", biome: "mountain" },
  { x: 180, y: 240, label: "Summit Trail", biome: "peak" },
  { x: 290, y: 140, label: "Golden Gate", biome: "peak" },
  { x: 215, y: 60, label: "Goal Castle", biome: "peak" },
];
const MAP_W = 430;
const MAP_H = 1950;

function seeded(seed: number) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

/* ── ETA calculator (dynamic based on real goal data) ── */
function calcETA(
  currentTile: number, totalTiles: number, dayStreak: number,
  savedAmount: number, goalAmount: number, deadline: string | undefined,
): { daysLeft: number; arrivalDate: string; onTrack: boolean } {
  const tilesLeft = totalTiles - currentTile;
  if (tilesLeft <= 0 || savedAmount >= goalAmount) return { daysLeft: 0, arrivalDate: "Arrived!", onTrack: true };

  // If there's a deadline, use it
  if (deadline) {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const msLeft = deadlineDate.getTime() - now.getTime();
    const daysToDeadline = Math.max(1, Math.ceil(msLeft / 86400000));
    const remaining = goalAmount - savedAmount;
    const dailyNeeded = remaining / daysToDeadline;
    // Estimate days based on savings velocity (streak boosts pace)
    const streakBoost = Math.min(dayStreak * 0.05, 0.5); // up to 50% boost
    const effectiveDays = Math.ceil(daysToDeadline * (1 - streakBoost));
    const arrivalDate = deadlineDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const pctSaved = savedAmount / goalAmount;
    const pctTime = 1 - (msLeft / (deadlineDate.getTime() - new Date(2026, 0, 15).getTime() || msLeft));
    const onTrack = pctSaved >= pctTime * 0.8; // within 80% of expected pace
    return { daysLeft: effectiveDays, arrivalDate, onTrack };
  }

  // No deadline: estimate from tile progress rate
  const pctDone = goalAmount > 0 ? savedAmount / goalAmount : currentTile / totalTiles;
  const avgTilesPerDay = dayStreak > 0 ? Math.max(0.15, Math.min(1, pctDone * 1.5 + 0.1)) : 0.1;
  const daysLeft = Math.ceil(tilesLeft / avgTilesPerDay);
  const arrival = new Date();
  arrival.setDate(arrival.getDate() + daysLeft);
  const arrivalDate = arrival.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return { daysLeft, arrivalDate, onTrack: dayStreak >= 3 };
}

/* ── Demon SVG sprite ── */
function DemonSprite({ x, y, demon, onClick }: { x: number; y: number; demon: DemonEncounter; onClick: () => void }) {
  if (demon.defeated) {
    return (
      <g transform={`translate(${x},${y})`} opacity={0.25}>
        <circle cx={0} cy={0} r={12} fill="none" stroke="#555" strokeWidth={1} strokeDasharray="3,3" />
        <text x={0} y={5} textAnchor="middle" fontSize={12} fill="#666">&#9760;</text>
        <text x={0} y={18} textAnchor="middle" fontSize={3.5} fill="#555" fontFamily="'Press Start 2P',monospace">SLAIN</text>
      </g>
    );
  }
  const colors: Record<string, { body: string; glow: string; eye: string }> = {
    shadow: { body: "#2a1a3a", glow: "#8a4abf", eye: "#ff00ff" },
    flame: { body: "#5a1a0a", glow: "#ff4400", eye: "#ffaa00" },
    ice: { body: "#1a3a5a", glow: "#44bbff", eye: "#88eeff" },
    skull: { body: "#3a2a1a", glow: "#aabb55", eye: "#ff3333" },
    dragon: { body: "#2a0a2a", glow: "#ff2266", eye: "#ff0044" },
  };
  const c = colors[demon.sprite] ?? colors.shadow;
  return (
    <g transform={`translate(${x},${y})`} style={{ cursor: "pointer", animation: "demon-hover 2s ease-in-out infinite" }} onClick={onClick}>
      <circle cx={0} cy={0} r={20} fill="none" stroke={c.glow} strokeWidth={1.5} opacity={0.4} style={{ animation: "demon-pulse 1.5s ease-in-out infinite" }} />
      <circle cx={0} cy={-2} r={16} fill={c.glow} opacity={0.06} />
      <ellipse cx={0} cy={2} rx={12} ry={10} fill={c.body} stroke={c.glow} strokeWidth={1} />
      <polygon points="-6,-8 -10,-18 -2,-10" fill={c.body} stroke={c.glow} strokeWidth={0.5} />
      <polygon points="6,-8 10,-18 2,-10" fill={c.body} stroke={c.glow} strokeWidth={0.5} />
      <circle cx={-4} cy={-1} r={2.5} fill={c.eye}>
        <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <circle cx={4} cy={-1} r={2.5} fill={c.eye}>
        <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite" begin="0.3s" />
      </circle>
      <circle cx={-4} cy={-1} r={1} fill="white" opacity={0.9} />
      <circle cx={4} cy={-1} r={1} fill="white" opacity={0.9} />
      <path d="M-5,5 Q0,9 5,5" stroke={c.eye} strokeWidth={1} fill="none" />
      <rect x={-3} y={5} width={2} height={2} fill="white" opacity={0.8} />
      <rect x={1} y={5} width={2} height={2} fill="white" opacity={0.8} />
      {[0, 1, 2].map(i => (
        <circle key={i} cx={(i - 1) * 8} cy={-14 - i * 2} r={1} fill={c.glow} opacity={0.5}>
          <animate attributeName="cy" values={`${-14 - i * 2};${-20 - i * 2};${-14 - i * 2}`} dur={`${1.5 + i * 0.4}s`} repeatCount="indefinite" />
        </circle>
      ))}
      <rect x={-14} y={14} width={28} height={4} fill="#1a0a0a" stroke="#333" strokeWidth={0.5} rx={1} />
      <rect x={-14} y={14} width={28 * (demon.hp / demon.maxHp)} height={4} fill="#cc3333" rx={1} />
      <text x={0} y={24} textAnchor="middle" fontSize={3.5} fill={c.glow} fontFamily="'Press Start 2P',monospace">{demon.name}</text>
    </g>
  );
}

/* ── Terrain sub-components ── */
function PineTree({ x, y, scale = 1, shade = 0 }: { x: number; y: number; scale?: number; shade?: number }) {
  const g = shade === 0 ? "#1a6e1a" : shade === 1 ? "#0f5f0f" : "#2a8a2a";
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} style={{ animation: `sway ${2.5 + shade * 0.5}s ease-in-out infinite` }}>
      <polygon points="0,-28 -10,-6 10,-6" fill={g} stroke="#0a4a0a" strokeWidth={0.5} />
      <polygon points="0,-20 -8,0 8,0" fill={g} opacity={0.8} />
      <polygon points="0,-14 -6,4 6,4" fill={g} opacity={0.6} />
      <rect x={-2} y={2} width={4} height={8} fill="#5a3a1e" />
    </g>
  );
}

function OakTree({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} style={{ animation: "sway 3s ease-in-out infinite" }}>
      <ellipse cx={0} cy={-18} rx={12} ry={12} fill="#2d7a2d" />
      <ellipse cx={6} cy={-20} rx={9} ry={9} fill="#3a9a3a" opacity={0.7} />
      <ellipse cx={-5} cy={-15} rx={8} ry={8} fill="#1e6e1e" opacity={0.6} />
      <rect x={-2.5} y={-6} width={5} height={12} fill="#6b4226" />
    </g>
  );
}

function CherryTree({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`} style={{ animation: "sway 3.5s ease-in-out infinite" }}>
      <ellipse cx={0} cy={-16} rx={11} ry={11} fill="#e8a0b0" />
      <ellipse cx={5} cy={-18} rx={8} ry={8} fill="#f0b8c8" opacity={0.7} />
      <rect x={-1.5} y={-5} width={3} height={10} fill="#6b4226" />
      {[[-7, -20], [3, -22], [8, -16], [-4, -13]].map(([fx, fy], i) => (
        <circle key={i} cx={fx} cy={fy} r={1.5} fill="#ff69b4" opacity={0.7} />
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
      <ellipse cx={x} cy={y} rx={7} ry={5} fill="#3a8a3a" />
      <ellipse cx={x + 5} cy={y - 1} rx={6} ry={4} fill="#4a9a4a" opacity={0.8} />
    </g>
  );
}

function Waypoint({ x, y, label, active, reached, index }: { x: number; y: number; label: string; active: boolean; reached: boolean; index: number }) {
  const s = (index === 0 || index === 7) ? 1.4 : 1;
  return (
    <g transform={`translate(${x},${y})`}>
      {active && (
        <circle cx={0} cy={0} r={24 * s} fill="none" stroke="#ffd700" strokeWidth={2} opacity={0.4}>
          <animate attributeName="r" values={`${20*s};${26*s};${20*s}`} dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0.5;0.2" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
      <ellipse cx={0} cy={6 * s} rx={16 * s} ry={5 * s} fill={reached ? "#5a4a2a" : "#3a3a3a"} opacity={0.5} />
      <rect x={-12 * s} y={-10 * s} width={24 * s} height={18 * s} fill={reached ? "#c8a24e" : "#4a4a4a"} stroke={reached ? "#8b6508" : "#333"} strokeWidth={1.5} rx={1} />
      <polygon points={`${-15 * s},${-10 * s} 0,${-24 * s} ${15 * s},${-10 * s}`} fill={reached ? "#8b3a3a" : "#3a3a3a"} stroke={reached ? "#6e2222" : "#2a2a2a"} strokeWidth={1} />
      {reached && <rect x={-3 * s} y={0} width={6 * s} height={8 * s} fill="#5a3a1e" rx={3 * s} />}
      {reached && <>
        <rect x={-10 * s} y={-5 * s} width={5 * s} height={5 * s} fill="#ffeebb" opacity={0.9} rx={0.5} />
        <rect x={5 * s} y={-5 * s} width={5 * s} height={5 * s} fill="#ffeebb" opacity={0.9} rx={0.5} />
      </>}
      {active && (
        <g>
          <line x1={13 * s} y1={-24 * s} x2={13 * s} y2={-36 * s} stroke="#5a3a1e" strokeWidth={1.5} />
          <polygon points={`${13 * s},${-36 * s} ${24 * s},${-33 * s} ${13 * s},${-30 * s}`} fill="#ffd700" style={{ animation: "flag-wave 1s ease-in-out infinite" }} />
        </g>
      )}
      <circle cx={-14 * s} cy={-14 * s} r={6} fill={reached ? "#2d5a2d" : "#3a3a3a"} stroke={reached ? "#4a8a4a" : "#555"} strokeWidth={1} />
      <text x={-14 * s} y={-12 * s} textAnchor="middle" fontSize={4} fill={reached ? "#a0d8a0" : "#777"} fontFamily="'Press Start 2P',monospace">{index}</text>
      <text x={0} y={16 * s + 8} textAnchor="middle" fontSize={4.5} fill={reached ? "#ffd700" : "#666"} fontFamily="'Press Start 2P',monospace">{label}</text>
    </g>
  );
}

function Waterfall({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 4} y={y} width={8} height={30} fill="#7ac5f0" opacity={0.5} rx={2} />
      {[0, 8, 16, 24].map(dy => (
        <ellipse key={dy} cx={x} cy={y + dy + 3} rx={5} ry={2} fill="white" opacity={0.3}>
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
      <circle cx={0} cy={-20} r={45} fill="#ffd700" opacity={0.03}>
        <animate attributeName="opacity" values="0.02;0.06;0.02" dur="4s" repeatCount="indefinite" />
      </circle>
      <rect x={-28} y={-20} width={56} height={32} fill="#c8a24e" stroke="#8b6508" strokeWidth={2} />
      <rect x={-34} y={-46} width={16} height={56} fill="#c8a24e" stroke="#8b6508" strokeWidth={1.5} />
      <polygon points="-34,-46 -26,-58 -18,-46" fill="#8b3a3a" stroke="#6e2222" strokeWidth={1} />
      <rect x={18} y={-46} width={16} height={56} fill="#c8a24e" stroke="#8b6508" strokeWidth={1.5} />
      <polygon points="18,-46 26,-58 34,-46" fill="#8b3a3a" stroke="#6e2222" strokeWidth={1} />
      <rect x={-10} y={-56} width={20} height={46} fill="#d4b058" stroke="#8b6508" strokeWidth={1.5} />
      <polygon points="-10,-56 0,-68 10,-56" fill="#c04040" stroke="#8b2222" strokeWidth={1} />
      <line x1={0} y1={-68} x2={0} y2={-80} stroke="#5a3a1e" strokeWidth={2} />
      <polygon points="0,-80 16,-76 0,-72" fill="#ffd700" style={{ animation: "flag-wave 1s ease-in-out infinite" }} />
      {[[-26, -36], [-26, -22], [22, -36], [22, -22], [-4, -46], [4, -46]].map(([wx, wy], i) => (
        <rect key={i} x={wx} y={wy} width={4} height={5} fill="#ffeebb" opacity={0.9} rx={0.5} />
      ))}
      <rect x={-6} y={-4} width={12} height={16} fill="#5a3a1e" rx={6} />
      {[-32, -26, -20, 20, 26, 32].map((cx, i) => (
        <rect key={i} x={cx - 2} y={-50} width={4} height={5} fill="#c8a24e" stroke="#8b6508" strokeWidth={0.5} />
      ))}
      <rect x={-36} y={16} width={72} height={13} fill="rgba(42,26,14,0.85)" rx={2} />
      <text x={0} y={25} textAnchor="middle" fontSize={5.5} fill="#ffd700" fontFamily="'Press Start 2P',monospace">GOAL CASTLE</text>
    </g>
  );
}

/* ── Battle Overlay ── */
function BattleOverlay({ demon, onAttack, heroHp, demonHp, battlePhase, slashAnim, battleMsg }: {
  demon: DemonEncounter; onAttack: () => void;
  heroHp: number; demonHp: number; battlePhase: string; slashAnim: boolean; battleMsg: string;
}) {
  const themes: Record<string, { bg: string; accent: string }> = {
    shadow: { bg: "linear-gradient(180deg, #0a0020, #1a0a3a)", accent: "#8a4abf" },
    flame: { bg: "linear-gradient(180deg, #1a0500, #3a0a00)", accent: "#ff4400" },
    ice: { bg: "linear-gradient(180deg, #001020, #0a1a3a)", accent: "#44bbff" },
    skull: { bg: "linear-gradient(180deg, #0a0a00, #1a1a0a)", accent: "#aabb55" },
    dragon: { bg: "linear-gradient(180deg, #0a0010, #2a0020)", accent: "#ff2266" },
  };
  const theme = themes[demon.sprite] ?? themes.shadow;

  return (
    <div className="absolute inset-0 z-40 flex flex-col" style={{ background: theme.bg, animation: "walk-in 0.3s ease-out" }}>
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {slashAnim && <div className="absolute inset-0" style={{ backgroundColor: "white", animation: "battle-flash 0.3s ease-out", zIndex: 10 }} />}
        <div className="absolute bottom-0 left-0 right-0" style={{ height: "30%", background: `linear-gradient(180deg, ${theme.accent}22, #0a0a0a)` }} />
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="absolute" style={{
            width: 3, height: 3, borderRadius: "50%", backgroundColor: theme.accent, opacity: 0.3,
            left: `${10 + (i * 11) % 80}%`, top: `${20 + (i * 13) % 50}%`,
            animation: `sparkle ${2 + i * 0.3}s ease-in-out infinite`, animationDelay: `${i * 0.2}s`,
          }} />
        ))}
        <div className="flex items-end justify-between w-full px-6" style={{ paddingBottom: "12%" }}>
          {/* Hero side */}
          <div className="flex flex-col items-center" style={{ animation: slashAnim ? "none" : "hero-bob 0.8s ease-in-out infinite" }}>
            <svg width={70} height={90} viewBox="0 0 40 50">
              <circle cx={20} cy={10} r={7} fill="#ffd700" stroke="#b8860b" strokeWidth={1} />
              <circle cx={17} cy={9} r={1.2} fill="#2a1a0e" />
              <circle cx={23} cy={9} r={1.2} fill="#2a1a0e" />
              <rect x={13} y={17} width={14} height={16} fill="#4169E1" stroke="#2a3a8a" strokeWidth={1} rx={2} />
              <rect x={13} y={27} width={14} height={3} fill="#8b6508" />
              <rect x={13} y={33} width={5} height={8} fill="#3a2a1e" rx={1} />
              <rect x={22} y={33} width={5} height={8} fill="#3a2a1e" rx={1} />
              <rect x={28} y={12} width={3} height={18} fill="#c0c0c0" rx={1} />
              <rect x={27} y={18} width={5} height={3} fill="#8b6508" rx={1} />
              <polygon points="29,10 31,4 27,4" fill="#c0c0c0" />
            </svg>
            <p style={{ fontSize: 5, color: "#ffd700", fontFamily: "'Press Start 2P',monospace" }}>HERO</p>
            <div style={{ width: 56, height: 6, backgroundColor: "#1a0a0a", border: "1px solid #4a8a4a", marginTop: 2, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${heroHp}%`, backgroundColor: heroHp > 50 ? "#4CAF50" : heroHp > 25 ? "#ff9800" : "#ff4444", transition: "width 0.3s" }} />
            </div>
            <p style={{ fontSize: 4, color: "#a0d8a0", fontFamily: "'Press Start 2P',monospace" }}>HP {heroHp}%</p>
          </div>
          <div style={{ fontSize: 10, color: theme.accent, fontFamily: "'Press Start 2P',monospace", textShadow: `0 0 10px ${theme.accent}`, marginBottom: 30 }}>VS</div>
          {/* Demon side */}
          <div className="flex flex-col items-center" style={{ animation: slashAnim ? "shake 0.4s ease-in-out" : "demon-hover 2s ease-in-out infinite" }}>
            <svg width={80} height={100} viewBox="-25 -30 50 60">
              <circle cx={0} cy={0} r={22} fill={theme.accent} opacity={0.06} />
              <ellipse cx={0} cy={4} rx={16} ry={14} fill={`${theme.accent}33`} stroke={theme.accent} strokeWidth={1.5} />
              <polygon points="-8,-10 -14,-24 -2,-12" fill={`${theme.accent}66`} stroke={theme.accent} strokeWidth={0.5} />
              <polygon points="8,-10 14,-24 2,-12" fill={`${theme.accent}66`} stroke={theme.accent} strokeWidth={0.5} />
              <circle cx={-5} cy={-1} r={3.5} fill={theme.accent}><animate attributeName="opacity" values="0.7;1;0.7" dur="1.2s" repeatCount="indefinite" /></circle>
              <circle cx={5} cy={-1} r={3.5} fill={theme.accent}><animate attributeName="opacity" values="0.7;1;0.7" dur="1.2s" repeatCount="indefinite" begin="0.3s" /></circle>
              <circle cx={-5} cy={-1} r={1.5} fill="white" opacity={0.9} />
              <circle cx={5} cy={-1} r={1.5} fill="white" opacity={0.9} />
              <path d="M-7,8 Q0,14 7,8" stroke={theme.accent} strokeWidth={1.5} fill="none" />
            </svg>
            <p style={{ fontSize: 4.5, color: theme.accent, fontFamily: "'Press Start 2P',monospace" }}>{demon.name}</p>
            <div style={{ width: 64, height: 6, backgroundColor: "#1a0a0a", border: `1px solid ${theme.accent}`, marginTop: 2, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(demonHp / demon.maxHp) * 100}%`, backgroundColor: "#cc3333", transition: "width 0.3s" }} />
            </div>
            <p style={{ fontSize: 4, color: "#ff6666", fontFamily: "'Press Start 2P',monospace" }}>HP {demonHp}/{demon.maxHp}</p>
          </div>
        </div>
      </div>
      {/* Battle dialogue box */}
      <div className="pixel-border" style={{ backgroundColor: "rgba(42,26,14,0.96)", padding: "8px 10px", minHeight: 90 }}>
        <p style={{ fontSize: 5.5, color: "#fff8e7", fontFamily: "'Press Start 2P',monospace", lineHeight: 1.8, marginBottom: 8, minHeight: 24 }}>{battleMsg}</p>
        {battlePhase === "choose" && (
          <div className="flex gap-2">
            <button type="button" onClick={onAttack} style={{ flex: 1, padding: "7px 0", fontSize: 6, fontFamily: "'Press Start 2P',monospace", color: "#fff8e7", backgroundColor: "#8b3a3a", border: "2px solid #c04040", cursor: "pointer", boxShadow: "inset 1px 1px 0 #d06060, inset -1px -1px 0 #6a2222", textAlign: "center", animation: "pulse-glow 1.5s ease-in-out infinite" }}>ATTACK</button>
          </div>
        )}
        {battlePhase === "won" && (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 7, color: "#ffd700", fontFamily: "'Press Start 2P',monospace", marginBottom: 4, animation: "hero-bob 0.6s ease-in-out infinite" }}>VICTORY!</p>
            <p style={{ fontSize: 5, color: "#a0d8a0", fontFamily: "'Press Start 2P',monospace", marginBottom: 6 }}>Reward: {demon.reward}</p>
            <button type="button" onClick={onAttack} style={{ padding: "7px 20px", fontSize: 6, fontFamily: "'Press Start 2P',monospace", color: "#fff8e7", backgroundColor: "#2d5a2d", border: "2px solid #4a8a4a", cursor: "pointer" }}>COLLECT REWARD</button>
          </div>
        )}
        {battlePhase === "attacking" && (
          <p style={{ fontSize: 6, color: "#ffd700", textAlign: "center", fontFamily: "'Press Start 2P',monospace", animation: "hero-bob 0.4s ease-in-out infinite" }}>...</p>
        )}
      </div>
    </div>
  );
}

/* ── Main World Screen ── */
export function WorldScreen() {
  const { navigate, state, tilesGained, clearTilesGained, defeatDemon, startBattle, addSavings, spendPenalty, clearSpendPenalty } = useJourney();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showToast, setShowToast] = useState(tilesGained > 0);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveAmount, setSaveAmount] = useState("");
  const [saveResult, setSaveResult] = useState<{ tilesAdvanced: number; leveledUp: boolean; newLevel: number; demonTriggered: boolean } | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpLevel, setLevelUpLevel] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [movingText, setMovingText] = useState("");
  const [penaltyToast, setPenaltyToast] = useState<{ verdict: string; tileDelta: number; reason: string } | null>(null);
  const [screenShake, setScreenShake] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tile = state.journey.currentTile;
  const prevTile = state.journey.previousTile;
  const total = state.journey.totalTiles;

  /* Spend penalty detection — show red hit feedback when returning from bad spend */
  useEffect(() => {
    if (spendPenalty) {
      // Start animTile at the OLD position (prevTile) so we see backward walk
      setAnimTile(prevTile);
      setPenaltyToast({ verdict: spendPenalty.verdict, tileDelta: spendPenalty.tileDelta, reason: spendPenalty.reason });
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 2000);
      clearSpendPenalty();
      const dismiss = setTimeout(() => setPenaltyToast(null), 12000);
      return () => clearTimeout(dismiss);
    }
  }, [spendPenalty, clearSpendPenalty, prevTile]);

  /* ETA calculation (dynamic based on actual goal data) */
  const savedAmount = state.goal?.currentAmount ?? 0;
  const goalAmount = state.goal?.targetAmount ?? 5000;
  const goalDeadline = state.goal?.deadline;
  const eta = useMemo(() => calcETA(tile, total, state.journey.dayStreak, savedAmount, goalAmount, goalDeadline), [tile, total, state.journey.dayStreak, savedAmount, goalAmount, goalDeadline]);

  /* Battle state */
  const [battlePhase, setBattlePhase] = useState<"choose" | "attacking" | "won">("choose");
  const [demonHp, setDemonHp] = useState(0);
  const [heroHp, setHeroHp] = useState(100);
  const [slashAnim, setSlashAnim] = useState(false);
  const [battleMsg, setBattleMsg] = useState("");
  const activeBattle = state.journey.pendingBattle;

  useEffect(() => {
    if (activeBattle) {
      setDemonHp(activeBattle.hp);
      setHeroHp(100);
      setBattlePhase("choose");
      setBattleMsg(`A wild ${activeBattle.name} blocks your path! Your saving streak powers your sword!`);
    }
  }, [activeBattle]);

  /* Handle saving money — advances tiles and may trigger demons */
  const handleSave = () => {
    const amt = Number(saveAmount);
    if (!amt || amt <= 0) return;
    const result = addSavings(amt);
    setSaveResult({ tilesAdvanced: result.tilesAdvanced, leveledUp: result.leveledUp, newLevel: result.newLevel, demonTriggered: !!result.demonTriggered });
    setSaveAmount("");
    if (result.leveledUp) {
      setLevelUpLevel(result.newLevel);
      setTimeout(() => setShowLevelUp(true), 800);
      setTimeout(() => setShowLevelUp(false), 3500);
    }
    // Show result for 3 seconds then close
    setTimeout(() => { setSaveResult(null); setShowSaveModal(false); }, result.demonTriggered ? 1500 : 3000);
  };

  const handleAttack = useCallback(async () => {
    if (!activeBattle) return;
    if (battlePhase === "won") { defeatDemon(activeBattle.id); return; }
    setBattlePhase("attacking");
    setSlashAnim(true);

    let heroDmg = 25 + Math.floor(Math.random() * 30);
    let demonDmg = 5 + Math.floor(Math.random() * 10);
    let newHp = Math.max(0, demonHp - heroDmg);
    let msg = "";

    try {
      const res = await fetch("/api/battle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          demonName: activeBattle.name,
          demonHp, demonMaxHp: activeBattle.maxHp,
          heroLevel: state.journey.level,
          dayStreak: state.journey.dayStreak,
          action: "attack",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        heroDmg = data.heroDmg;
        demonDmg = data.demonDmg;
        newHp = data.newDemonHp;
        msg = data.message;
      }
    } catch { /* fallback to local values */ }

    setTimeout(() => {
      setSlashAnim(false);
      setDemonHp(newHp);
      setHeroHp(prev => Math.max(10, prev - demonDmg));
      if (newHp <= 0) {
        setBattlePhase("won");
        setBattleMsg(msg || `You dealt ${heroDmg} damage! ${activeBattle.name} is defeated! Collect your reward!`);
      } else {
        setBattleMsg(msg || `You slash for ${heroDmg} DMG! ${activeBattle.name} strikes back for ${demonDmg} DMG!`);
        setBattlePhase("choose");
      }
    }, 500);
  }, [activeBattle, battlePhase, demonHp, defeatDemon, state.journey.level, state.journey.dayStreak]);


  const handleDemonClick = useCallback((demon: DemonEncounter) => {
    if (!demon.defeated && demon.tile <= tile + 1) { startBattle(demon); }
  }, [startBattle, tile]);

  /* Animated walk — slow enough to see hero moving tile by tile (forward AND backward) */
  const [animTile, setAnimTile] = useState(tilesGained > 0 ? prevTile : tile);
  useEffect(() => {
    if (animTile < tile) {
      // Forward walk
      setIsMoving(true);
      setMovingText(`Moving forward... ${tile - animTile} tile${tile - animTile > 1 ? "s" : ""} to go`);
      const t = setTimeout(() => setAnimTile(v => {
        const next = Math.min(v + 1, tile);
        if (next >= tile) { setIsMoving(false); setMovingText(""); }
        return next;
      }), 1000);
      return () => clearTimeout(t);
    } else if (animTile > tile) {
      // Backward walk (spending penalty)
      setIsMoving(true);
      setMovingText(`Pushed back! ${animTile - tile} tile${animTile - tile > 1 ? "s" : ""} lost...`);
      const t = setTimeout(() => setAnimTile(v => {
        const next = Math.max(v - 1, tile);
        if (next <= tile) { setIsMoving(false); setMovingText(""); }
        return next;
      }), 1000);
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
    for (let i = 0; i < 130; i++) {
      const x = rng() * (MAP_W - 40) + 20;
      const y = rng() * MAP_H;
      const type = y > 1300 ? (rng() > 0.5 ? "cherry" : "oak") : y > 700 ? (rng() > 0.3 ? "pine" : "oak") : "pine";
      trees.push({ x, y, type, scale: 0.7 + rng() * 0.6, shade: Math.floor(rng() * 3) });
    }
    for (let i = 0; i < 35; i++) rocks.push({ x: rng() * (MAP_W - 20) + 10, y: rng() * MAP_H, w: 4 + rng() * 8 });
    for (let i = 0; i < 45; i++) bushes.push({ x: rng() * (MAP_W - 20) + 10, y: 800 + rng() * 1000 });
    for (let i = 0; i < 90; i++) flowers.push({ x: rng() * (MAP_W - 10) + 5, y: 1300 + rng() * 600, c: flowerColors[Math.floor(rng() * flowerColors.length)] });
    for (let i = 0; i < 70; i++) grassTufts.push({ x: rng() * (MAP_W - 10), y: 900 + rng() * 900 });
    return { trees, rocks, bushes, flowers, grassTufts };
  }, []);

  /* Build path */
  const pathD = WP.map((w, i) => `${i === 0 ? "M" : "L"}${w.x},${w.y}`).join(" ");
  const progressD = WP.slice(0, animTile + 1).map((w, i) => `${i === 0 ? "M" : "L"}${w.x},${w.y}`).join(" ");
  const recentD = tilesGained > 0 && prevTile < animTile
    ? WP.slice(prevTile, animTile + 1).map((w, i) => `${i === 0 ? "M" : "L"}${w.x},${w.y}`).join(" ") : "";

  const nextDemon = state.journey.demons.find(d => !d.defeated && d.tile >= tile);

  return (
    <div className="relative flex h-full flex-col" style={screenShake ? { animation: "shake 0.3s ease-in-out 6" } : undefined}>
      {/* ── Spend Penalty Toast (full overlay) ── */}
      {penaltyToast && (
        <>
          {/* Red/yellow vignette overlay */}
          <div className="absolute inset-0 z-40 pointer-events-none" style={{
            background: penaltyToast.verdict === "WRONG_TURN"
              ? "radial-gradient(ellipse at center, transparent 30%, rgba(139,0,0,0.5) 100%)"
              : "radial-gradient(ellipse at center, transparent 40%, rgba(140,100,0,0.35) 100%)",
            animation: "penalty-pulse 1.5s ease-in-out infinite",
          }} />
          {/* Toast card */}
          <div className="absolute left-2 right-2 z-50" style={{ top: 50, animation: "toast-in 0.4s ease-out" }}>
            <div className="pixel-border" style={{
              backgroundColor: penaltyToast.verdict === "WRONG_TURN" ? "rgba(80,10,10,0.98)" : "rgba(80,60,10,0.97)",
              padding: "16px 16px 12px",
              textAlign: "center",
              border: `3px solid ${penaltyToast.verdict === "WRONG_TURN" ? "#ff2222" : "#ffaa00"}`,
              boxShadow: penaltyToast.verdict === "WRONG_TURN"
                ? "0 0 30px rgba(255,0,0,0.5), inset 0 0 20px rgba(255,0,0,0.15)"
                : "0 0 20px rgba(255,170,0,0.4), inset 0 0 15px rgba(255,170,0,0.1)",
            }}>
              {/* Icon */}
              <div style={{ marginBottom: 6 }}>
                {penaltyToast.verdict === "WRONG_TURN" ? (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto", animation: "shake 0.5s ease-in-out infinite" }}>
                    <path d="M12 2C8 2 5 5 5 8c0 1.5.5 3 2 4l1 1v2h8v-2l1-1c1.5-1 2-2.5 2-4 0-3-3-6-7-6z" fill="#ff4444" opacity="0.3"/>
                    <circle cx="9" cy="9" r="1.5" fill="#111"/>
                    <circle cx="15" cy="9" r="1.5" fill="#111"/>
                    <path d="M8 14h8M9 17h6" stroke="#ff4444" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M18 6L6 18M6 6l12 12" stroke="#ff2222" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
                  </svg>
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto" }}>
                    <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#ffaa00" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                )}
              </div>
              {/* Title */}
              <p style={{
                fontSize: 12, letterSpacing: 3,
                color: penaltyToast.verdict === "WRONG_TURN" ? "#ff2222" : "#ffaa00",
                fontFamily: "'Press Start 2P',monospace",
                marginBottom: 6,
                textShadow: penaltyToast.verdict === "WRONG_TURN" ? "0 0 10px rgba(255,0,0,0.8)" : "0 0 8px rgba(255,170,0,0.6)",
                animation: "shake 0.6s ease-in-out",
              }}>
                {penaltyToast.verdict === "WRONG_TURN" ? "WRONG TURN!" : "DETOUR!"}
              </p>
              {/* Tile loss */}
              <p style={{
                fontSize: 9, color: "#ff4444",
                fontFamily: "'Press Start 2P',monospace",
                marginBottom: 8,
                textShadow: "0 0 6px rgba(255,0,0,0.5)",
              }}>
                {penaltyToast.tileDelta} tile{penaltyToast.tileDelta < -1 ? "s" : ""}! You took a hit!
              </p>
              {/* Reason */}
              <p style={{
                fontSize: 6, color: "#fff8e7",
                fontFamily: "'Press Start 2P',monospace",
                lineHeight: 2, marginBottom: 8,
                opacity: 0.9,
              }}>
                {penaltyToast.reason}
              </p>
              {/* Separator */}
              <div style={{
                height: 2, marginBottom: 8,
                background: penaltyToast.verdict === "WRONG_TURN"
                  ? "linear-gradient(90deg, transparent, #ff2222, transparent)"
                  : "linear-gradient(90deg, transparent, #ffaa00, transparent)",
              }} />
              {/* Tip */}
              <p style={{ fontSize: 5, color: "#ff9999", fontFamily: "'Press Start 2P',monospace", lineHeight: 1.8 }}>
                {penaltyToast.verdict === "WRONG_TURN"
                  ? "Save more to regain lost ground!"
                  : "Stay on the path to avoid further setbacks!"}
              </p>
              <button type="button" onClick={() => setPenaltyToast(null)} style={{
                marginTop: 8, padding: "4px 16px", fontSize: 6,
                fontFamily: "'Press Start 2P',monospace",
                color: "#fff8e7", backgroundColor: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.3)", cursor: "pointer",
              }}>DISMISS</button>
            </div>
          </div>
        </>
      )}

      {/* ── HUD ── */}
      <div className="z-20 flex flex-col" style={{ backgroundColor: "rgba(20,12,6,0.97)", borderBottom: "2px solid #8b5e3c" }}>
        {/* Stats row */}
        <div className="flex items-center justify-between" style={{ padding: "4px 8px" }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 5.5, color: "#ffd700", fontFamily: "'Press Start 2P',monospace" }}>LV{state.journey.level}</span>
            <div style={{ width: 1, height: 10, backgroundColor: "#5a3a1e" }} />
            <span style={{ fontSize: 5, color: "#a0d8a0", fontFamily: "'Press Start 2P',monospace" }}>XP {state.journey.xp}</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 5, color: "#ffd700", fontFamily: "'Press Start 2P',monospace" }}>{state.journey.goldCoins}G</span>
            <div style={{ width: 1, height: 10, backgroundColor: "#5a3a1e" }} />
            <span style={{ fontSize: 5, color: "#ff9944", fontFamily: "'Press Start 2P',monospace" }}>{state.journey.dayStreak}d</span>
          </div>
        </div>
        {/* ETA bar - dynamic */}
        <div style={{ padding: "0 8px 2px" }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 2 }}>
            <span style={{ fontSize: 4.5, color: "#8b7355", fontFamily: "'Press Start 2P',monospace" }}>
              ${savedAmount}/${goalAmount} SAVED
            </span>
            <span style={{ fontSize: 5.5, color: eta.daysLeft === 0 ? "#4CAF50" : eta.onTrack ? "#4fc3f7" : "#ff6666", fontFamily: "'Press Start 2P',monospace" }}>
              {eta.daysLeft === 0 ? "ARRIVED!" : `~${eta.daysLeft}d · ${eta.arrivalDate}`}
            </span>
          </div>
          {eta.daysLeft > 0 && (
            <div style={{ height: 4, backgroundColor: "#1a0a06", border: "1px solid #5a3a1e", borderRadius: 2, overflow: "hidden", marginBottom: 2 }}>
              <div style={{ height: "100%", width: `${Math.min(100, (savedAmount / goalAmount) * 100)}%`, background: eta.onTrack ? "linear-gradient(90deg, #1a6a6a, #4fc3f7)" : "linear-gradient(90deg, #8b3a3a, #ff6666)", transition: "width 0.6s", borderRadius: 2 }} />
            </div>
          )}
        </div>
        {/* Progress bar + nav */}
        <div className="flex items-center" style={{ padding: "0 8px 4px" }}>
          <span style={{ fontSize: 5, color: "#ffd700", fontFamily: "'Press Start 2P',monospace", minWidth: 32 }}>{animTile}/{total}</span>
          <div style={{ flex: 1, margin: "0 6px", height: 10, backgroundColor: "#1a0a06", border: "1px solid #5a3a1e", borderRadius: 3, position: "relative", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(animTile / total) * 100}%`, background: "linear-gradient(90deg, #1a6a1a, #2d8a2d, #4CAF50, #66BB6A)", transition: "width 0.6s ease", borderRadius: 2 }} />
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(180deg, rgba(255,255,255,0.15), transparent)", borderRadius: 2 }} />
            {state.journey.demons.filter(d => !d.defeated).map(d => (
              <div key={d.id} style={{ position: "absolute", top: 0, bottom: 0, left: `${(d.tile / total) * 100}%`, width: 2, backgroundColor: "#ff4444", opacity: 0.7 }} />
            ))}
          </div>
          <div className="flex gap-1">
            <button type="button" onClick={() => navigate("title")} style={{ backgroundColor: "rgba(42,26,14,0.92)", padding: "3px 5px", border: "2px solid #8b5e3c", fontSize: 5, color: "#a0d8a0", cursor: "pointer", fontFamily: "'Press Start 2P',monospace" }}>HOME</button>
            <button type="button" onClick={() => setMenuOpen(!menuOpen)} style={{ backgroundColor: "rgba(42,26,14,0.92)", padding: "3px 5px", border: "2px solid #8b5e3c", fontSize: 5, color: "#ffd700", cursor: "pointer", fontFamily: "'Press Start 2P',monospace" }}>MENU</button>
          </div>
        </div>
      </div>

      {/* Welcome back toast */}
      {showToast && (
        <div className="absolute left-3 right-3 z-30" style={{ top: 60, animation: "toast-in 0.4s ease-out" }}>
          <div className="pixel-border" style={{ backgroundColor: "rgba(42,26,14,0.97)", padding: "10px 14px", textAlign: "center" }}>
            <p style={{ fontSize: 7, color: "#ffd700", marginBottom: 4, fontFamily: "'Press Start 2P',monospace" }}>WELCOME BACK!</p>
            <p style={{ fontSize: 5, color: "#a0d8a0", fontFamily: "'Press Start 2P',monospace" }}>You advanced {tilesGained} tile{tilesGained !== 1 ? "s" : ""} for saving!</p>
            {nextDemon && <p style={{ fontSize: 5, color: "#ff6666", marginTop: 4, fontFamily: "'Press Start 2P',monospace" }}>{nextDemon.name} awaits at tile {nextDemon.tile}!</p>}
            <div style={{ marginTop: 5, height: 3, background: "linear-gradient(90deg, transparent, #ffd700, transparent)" }} />
          </div>
        </div>
      )}

      {/* Moving indicator */}
      {isMoving && (
        <div className="absolute left-3 right-3 z-30" style={{ top: 60, animation: "toast-in 0.3s ease-out" }}>
          <div className="pixel-border" style={{ backgroundColor: "rgba(42,26,14,0.97)", padding: "8px 12px", textAlign: "center" }}>
            <p style={{ fontSize: 6, color: "#ffd700", fontFamily: "'Press Start 2P',monospace", animation: "hero-bob 0.4s ease-in-out infinite" }}>
              {movingText}
            </p>
            <div style={{ marginTop: 4, height: 4, backgroundColor: "#1a0a06", border: "1px solid #5a3a1e", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${((animTile - prevTile) / Math.max(1, tile - prevTile)) * 100}%`, backgroundColor: "#ffd700", borderRadius: 2, transition: "width 0.8s ease" }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Scrollable world map ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: "none" }}>
        <svg width={MAP_W} height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={{ display: "block", width: "100%", height: "auto" }}>
          <defs>
            <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#050210" />
              <stop offset="6%" stopColor="#0a0620" />
              <stop offset="14%" stopColor="#1a1050" />
              <stop offset="24%" stopColor="#3a2070" />
              <stop offset="35%" stopColor="#5BA3D9" />
              <stop offset="50%" stopColor="#87CEEB" />
              <stop offset="70%" stopColor="#78c878" />
              <stop offset="100%" stopColor="#4a9a4a" />
            </linearGradient>
            <linearGradient id="meadowG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3a7a3a" /><stop offset="100%" stopColor="#4a9a4a" /></linearGradient>
            <linearGradient id="forestG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1a4a1a" /><stop offset="100%" stopColor="#2d5a2d" /></linearGradient>
            <linearGradient id="hillG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5a7a3a" /><stop offset="100%" stopColor="#6a8a4a" /></linearGradient>
            <linearGradient id="mountainG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5a5a6a" /><stop offset="100%" stopColor="#6a6a5a" /></linearGradient>
            <radialGradient id="heroGlow"><stop offset="0%" stopColor="#ffd700" stopOpacity="0.4" /><stop offset="100%" stopColor="#ffd700" stopOpacity="0" /></radialGradient>
            <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>

          {/* Sky */}
          <rect width={MAP_W} height={MAP_H} fill="url(#skyG)" />

          {/* Stars */}
          {Array.from({ length: 40 }, (_, i) => {
            const rng = seeded(i + 100);
            return <circle key={`star${i}`} cx={rng() * MAP_W} cy={rng() * 280} r={0.6 + rng() * 0.8} fill="white" opacity={0.3 + rng() * 0.5}>
              <animate attributeName="opacity" values={`${0.2 + rng() * 0.3};${0.6 + rng() * 0.4};${0.2 + rng() * 0.3}`} dur={`${2 + rng() * 3}s`} repeatCount="indefinite" />
            </circle>;
          })}

          {/* Biome layers */}
          <rect x={0} y={1350} width={MAP_W} height={600} fill="url(#meadowG)" />
          <rect x={0} y={1000} width={MAP_W} height={350} fill="url(#forestG)" />
          <rect x={0} y={700} width={MAP_W} height={300} fill="url(#hillG)" />
          <rect x={0} y={350} width={MAP_W} height={350} fill="url(#mountainG)" opacity={0.6} />

          {/* Mountain ranges */}
          <polygon points="0,400 80,200 160,400" fill="#6a5a8a" opacity={0.5} />
          <polygon points="100,400 200,130 300,400" fill="#7E57C2" opacity={0.45} />
          <polygon points="220,400 330,170 430,400" fill="#6a5a8a" opacity={0.5} />
          <polygon points="0,500 100,320 200,500" fill="#5a6a5a" opacity={0.3} />
          <polygon points="200,500 310,340 430,500" fill="#5a6a5a" opacity={0.3} />
          {/* Snow caps */}
          <polygon points="80,200 68,235 92,235" fill="white" opacity={0.75} />
          <polygon points="200,130 186,170 214,170" fill="white" opacity={0.8} />
          <polygon points="330,170 318,205 342,205" fill="white" opacity={0.75} />

          {/* Rivers */}
          <path d="M0,1120 Q100,1100 220,1130 Q340,1160 430,1120" stroke="#5BB5F5" strokeWidth={8} fill="none" opacity={0.5} strokeLinecap="round">
            <animate attributeName="opacity" values="0.4;0.6;0.4" dur="4s" repeatCount="indefinite" />
          </path>
          <path d="M0,1120 Q100,1100 220,1130 Q340,1160 430,1120" stroke="#88d8ff" strokeWidth={3} fill="none" opacity={0.3} strokeLinecap="round" />
          <path d="M0,1400 Q120,1380 240,1410 Q360,1430 430,1390" stroke="#5BB5F5" strokeWidth={7} fill="none" opacity={0.45} strokeLinecap="round">
            <animate attributeName="opacity" values="0.35;0.5;0.35" dur="3.5s" repeatCount="indefinite" />
          </path>

          {/* Bridges */}
          <rect x={295} y={1378} width={40} height={10} fill="#8b5e3c" stroke="#5a3a1e" strokeWidth={1.5} rx={2} />
          <rect x={296} y={1376} width={2} height={14} fill="#5a3a1e" />
          <rect x={333} y={1376} width={2} height={14} fill="#5a3a1e" />
          <rect x={300} y={1108} width={35} height={10} fill="#8b5e3c" stroke="#5a3a1e" strokeWidth={1.5} rx={2} />

          {/* Waterfall */}
          <Waterfall x={70} y={400} />

          {/* Pond */}
          <ellipse cx={370} cy={1560} rx={25} ry={12} fill="#5BB5F5" opacity={0.4} />
          <ellipse cx={370} cy={1558} rx={20} ry={8} fill="#88d8ff" opacity={0.3} />

          {/* Clouds */}
          {[[30, 100, 26], [200, 60, 22], [350, 120, 18], [100, 300, 24], [300, 450, 20], [60, 600, 22], [380, 750, 16]].map(([cx, cy, w], i) => (
            <g key={`cl${i}`} style={{ animation: `float-cloud ${14 + i * 3}s linear infinite` }} opacity={0.75 - i * 0.05}>
              <ellipse cx={cx} cy={cy} rx={w} ry={(w as number) * 0.38} fill="white" />
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
            <g key={`fl${i}`}><circle cx={f.x} cy={f.y} r={2} fill={f.c} opacity={0.75} /><circle cx={f.x} cy={f.y} r={0.8} fill="white" opacity={0.5} /></g>
          ))}

          {/* Rocks, Bushes, Trees */}
          {terrain.rocks.map((r, i) => <Rock key={`rk${i}`} x={r.x} y={r.y} w={r.w} />)}
          {terrain.bushes.map((b, i) => <Bush key={`bu${i}`} x={b.x} y={b.y} />)}
          {terrain.trees.map((t, i) =>
            t.type === "pine" ? <PineTree key={`t${i}`} x={t.x} y={t.y} scale={t.scale} shade={t.shade} /> :
            t.type === "cherry" ? <CherryTree key={`t${i}`} x={t.x} y={t.y} /> :
            <OakTree key={`t${i}`} x={t.x} y={t.y} scale={t.scale} />
          )}

          {/* Path - dirt road */}
          <path d={pathD} stroke="#6b4226" strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.45} />
          <path d={pathD} stroke="#c8a24e" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.35} strokeDasharray="2,8" />

          {/* Progress glow */}
          {animTile > 0 && <path d={progressD} stroke="#ffd700" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.7} filter="url(#glow)" />}
          {recentD && <path d={recentD} stroke="#7CFC00" strokeWidth={3} fill="none" strokeLinecap="round" strokeDasharray="5,4" opacity={0.65} filter="url(#glow)" />}

          {/* Ghost marker */}
          {tilesGained > 0 && prevTile < animTile && (
            <g opacity={0.35}>
              <circle cx={WP[prevTile].x} cy={WP[prevTile].y} r={10} fill="none" stroke="#ccc" strokeWidth={1.5} strokeDasharray="3,3" />
              <text x={WP[prevTile].x} y={WP[prevTile].y + 3} textAnchor="middle" fontSize={7} fill="#aaa" fontFamily="'Press Start 2P',monospace">?</text>
            </g>
          )}

          {/* Demon sprites on map */}
          {state.journey.demons.map(d => {
            const dWp = WP[Math.min(d.tile, WP.length - 1)];
            return <DemonSprite key={d.id} x={dWp.x + 35} y={dWp.y - 15} demon={d} onClick={() => handleDemonClick(d)} />;
          })}

          {/* Village waypoints */}
          {WP.slice(0, -1).map((w, i) => (
            <Waypoint key={i} x={w.x} y={w.y} label={w.label} active={i === animTile} reached={i <= animTile} index={i} />
          ))}

          {/* Castle */}
          <Castle x={WP[14].x} y={WP[14].y} />

          {/* Movement trail sparkles */}
          {isMoving && animTile > 0 && animTile < WP.length && (() => {
            const prev = WP[Math.max(0, animTile - 1)];
            const curr = WP[animTile];
            return Array.from({ length: 5 }, (_, i) => {
              const t = i / 4;
              const cx = prev.x + (curr.x - prev.x) * t;
              const cy = prev.y + (curr.y - prev.y) * t;
              return <circle key={`trail${i}`} cx={cx} cy={cy} r={2} fill="#ffd700" opacity={0.6 - i * 0.1}>
                <animate attributeName="opacity" values={`${0.6 - i*0.1};0;${0.6 - i*0.1}`} dur="1s" repeatCount="indefinite" />
                <animate attributeName="r" values="2;4;2" dur="1s" repeatCount="indefinite" />
              </circle>;
            });
          })()}

          {/* Hero sprite */}
          <g style={{ animation: isMoving ? "hero-bob 0.3s ease-in-out infinite" : "hero-bob 0.6s ease-in-out infinite", transition: "all 0.8s ease" }}>
            <ellipse cx={heroWp.x} cy={heroWp.y + 14} rx={12} ry={4} fill="url(#heroGlow)" />
            {[0, 1, 2, 3, 4].map(i => (
              <circle key={i} cx={heroWp.x + (i - 2) * 7} cy={heroWp.y - 10} r={1.5} fill="#ffd700"
                style={{ animation: `sparkle ${1.2 + i * 0.3}s ease-in-out infinite`, animationDelay: `${i * 0.25}s` }} />
            ))}
            <ellipse cx={heroWp.x} cy={heroWp.y + 12} rx={6} ry={2.5} fill="rgba(0,0,0,0.25)" />
            <circle cx={heroWp.x} cy={heroWp.y - 8} r={5} fill="#ffd700" stroke="#b8860b" strokeWidth={0.8} />
            <circle cx={heroWp.x - 2} cy={heroWp.y - 9} r={0.8} fill="#2a1a0e" />
            <circle cx={heroWp.x + 2} cy={heroWp.y - 9} r={0.8} fill="#2a1a0e" />
            <rect x={heroWp.x - 5} y={heroWp.y - 3} width={10} height={10} fill="#4169E1" stroke="#2a3a8a" strokeWidth={0.8} rx={1} />
            <rect x={heroWp.x - 5} y={heroWp.y + 2} width={10} height={2} fill="#8b6508" />
            <rect x={heroWp.x - 5} y={heroWp.y + 7} width={4} height={5} fill="#3a2a1e" rx={0.5} />
            <rect x={heroWp.x + 1} y={heroWp.y + 7} width={4} height={5} fill="#3a2a1e" rx={0.5} />
            <rect x={heroWp.x + 6} y={heroWp.y - 6} width={2} height={12} fill="#c0c0c0" rx={0.5} />
            <rect x={heroWp.x + 5} y={heroWp.y - 1} width={4} height={2} fill="#8b6508" rx={0.5} />
          </g>

          {/* Fireflies */}
          {Array.from({ length: 15 }, (_, i) => {
            const rng = seeded(i + 200);
            return <circle key={`ff${i}`} cx={20 + rng() * (MAP_W - 40)} cy={1010 + rng() * 300} r={1.2} fill="#aaff44" opacity={0.3}>
              <animate attributeName="opacity" values="0;0.7;0" dur={`${2 + rng() * 3}s`} repeatCount="indefinite" begin={`${rng() * 3}s`} />
            </circle>;
          })}
        </svg>
      </div>

      {/* ── JRPG Dialogue Box with ETA ── */}
      <div className="z-20 pixel-border" style={{ backgroundColor: "rgba(42,26,14,0.96)", padding: "6px 10px", borderTop: "3px solid #8b5e3c", minHeight: 100 }}>
        {/* ETA ribbon */}
        <div className="flex items-center justify-between" style={{ marginBottom: 4, padding: "3px 6px", backgroundColor: "rgba(79,195,247,0.1)", border: "1px solid rgba(79,195,247,0.3)", borderRadius: 2 }}>
          <div className="flex items-center gap-1">
            <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#4fc3f7" strokeWidth={2.5}><circle cx={12} cy={12} r={10} /><polyline points="12,6 12,12 16,14" /></svg>
            <span style={{ fontSize: 4.5, color: "#4fc3f7", fontFamily: "'Press Start 2P',monospace" }}>ETA</span>
          </div>
          <span style={{ fontSize: 5, color: eta.daysLeft === 0 ? "#4CAF50" : "#fff8e7", fontFamily: "'Press Start 2P',monospace" }}>
            {eta.daysLeft === 0 ? "GOAL REACHED!" : `${eta.daysLeft} days to ${state.goal?.label ?? "Goal"}`}
          </span>
          <span style={{ fontSize: 4.5, color: "#8b7355", fontFamily: "'Press Start 2P',monospace" }}>{eta.arrivalDate}</span>
        </div>

        {/* Guide message */}
        <div className="flex items-start gap-2" style={{ marginBottom: 6 }}>
          <div style={{ width: 24, height: 24, borderRadius: 4, background: "linear-gradient(135deg, #ffd700, #ffaa00)", border: "2px solid #8b6508", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 10 }}>*</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 5, color: "#8b7355", marginBottom: 1, fontFamily: "'Press Start 2P',monospace" }}>GUIDE FAIRY</p>
            <p style={{ fontSize: 5.5, color: "#fff8e7", lineHeight: 1.6, fontFamily: "'Press Start 2P',monospace" }}>
              {animTile === 0 ? "Your journey begins! Save wisely to advance."
                : animTile >= total - 1 ? "You reached the Goal Castle! Quest complete!"
                : nextDemon && nextDemon.tile <= animTile + 2
                  ? `${nextDemon.name} lurks ahead at tile ${nextDemon.tile}! Save today to power up for battle!`
                  : `${total - animTile} tiles to go. Next: ${WP[Math.min(animTile + 1, WP.length - 1)].label}. Keep saving!`}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowSaveModal(true)}
            style={{ flex: 1, padding: "6px 0", fontSize: 5, fontFamily: "'Press Start 2P',monospace", color: "#fff8e7", backgroundColor: "#2d7a2d", border: "2px solid #4CAF50", cursor: "pointer", boxShadow: "inset 1px 1px 0 #5cb85c, inset -1px -1px 0 #1a5a1a", textAlign: "center" }}>
            ADD SAVINGS
          </button>
          <button type="button" onClick={() => navigate("decision")}
            style={{ flex: 1, padding: "6px 0", fontSize: 5, fontFamily: "'Press Start 2P',monospace", color: "#fff8e7", backgroundColor: "#8b3a3a", border: "2px solid #c04040", cursor: "pointer", boxShadow: "inset 1px 1px 0 #d06060, inset -1px -1px 0 #6a2222", textAlign: "center" }}>
            Log Spend
          </button>
          {nextDemon && nextDemon.tile <= tile + 1 && (
            <button type="button" onClick={() => handleDemonClick(nextDemon)}
              style={{ flex: 1, padding: "6px 0", fontSize: 5, fontFamily: "'Press Start 2P',monospace", color: "#fff8e7", backgroundColor: "#5a1a3a", border: "2px solid #aa3366", cursor: "pointer", boxShadow: "inset 1px 1px 0 #cc4488, inset -1px -1px 0 #3a0a2a", textAlign: "center", animation: "demon-pulse 1.5s ease-in-out infinite" }}>
              BATTLE!
            </button>
          )}
          <button type="button" onClick={() => navigate("guide")}
            style={{ flex: 1, padding: "6px 0", fontSize: 5, fontFamily: "'Press Start 2P',monospace", color: "#fff8e7", backgroundColor: "#4a6a2a", border: "2px solid #6a9a3a", cursor: "pointer", boxShadow: "inset 1px 1px 0 #7aaa4a, inset -1px -1px 0 #3a5a1a", textAlign: "center" }}>
            Guide
          </button>
        </div>
      </div>

      {/* ── Save Modal ── */}
      {showSaveModal && (
        <div className="absolute inset-0 z-30 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} onClick={() => { setShowSaveModal(false); setSaveResult(null); }}>
          <div className="pixel-border mx-6 w-full" style={{ backgroundColor: "rgba(42,26,14,0.98)", padding: "14px 16px", maxWidth: 350 }} onClick={e => e.stopPropagation()}>
            {!saveResult ? (
              <>
                <p style={{ fontSize: 7, color: "#ffd700", fontFamily: "'Press Start 2P',monospace", textAlign: "center", marginBottom: 8 }}>ADD TO SAVINGS</p>
                <p style={{ fontSize: 4.5, color: "#8b7355", fontFamily: "'Press Start 2P',monospace", textAlign: "center", lineHeight: 1.8, marginBottom: 10 }}>
                  Saving money powers your hero forward!{"\n"}Each contribution advances your quest.
                </p>
                <div style={{ marginBottom: 8, padding: "6px 8px", backgroundColor: "rgba(58,110,58,0.2)", border: "1px solid #3a6e3a" }}>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 5, color: "#a0d8a0", fontFamily: "'Press Start 2P',monospace" }}>Goal: {state.goal?.label ?? "Savings"}</span>
                    <span style={{ fontSize: 5, color: "#ffd700", fontFamily: "'Press Start 2P',monospace" }}>${state.goal?.currentAmount ?? 0} / ${state.goal?.targetAmount ?? 5000}</span>
                  </div>
                </div>
                <input value={saveAmount} onChange={e => setSaveAmount(e.target.value)} placeholder="Amount ($)" type="number"
                  style={{ width: "100%", backgroundColor: "rgba(26,26,14,0.8)", border: "2px solid #5a3a1e", padding: "8px", fontSize: 8, color: "#fff8e7", fontFamily: "'Press Start 2P',monospace", outline: "none", marginBottom: 10, textAlign: "center" }} />
                <div className="flex gap-2">
                  {[25, 50, 100, 200].map(amt => (
                    <button key={amt} type="button" onClick={() => setSaveAmount(String(amt))}
                      style={{ flex: 1, padding: "5px 0", fontSize: 5, fontFamily: "'Press Start 2P',monospace", color: "#ffd700", backgroundColor: "rgba(139,94,60,0.4)", border: "1px solid #8b5e3c", cursor: "pointer", textAlign: "center" }}>
                      ${amt}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2" style={{ marginTop: 10 }}>
                  <button type="button" onClick={handleSave}
                    style={{ flex: 1, padding: "8px 0", fontSize: 6, fontFamily: "'Press Start 2P',monospace", color: "#fff8e7", backgroundColor: "#2d7a2d", border: "2px solid #4CAF50", cursor: "pointer", textAlign: "center" }}>
                    SAVE!
                  </button>
                  <button type="button" onClick={() => setShowSaveModal(false)}
                    style={{ flex: 1, padding: "8px 0", fontSize: 6, fontFamily: "'Press Start 2P',monospace", color: "#fff8e7", backgroundColor: "#5a3a1e", border: "2px solid #8b5e3c", cursor: "pointer", textAlign: "center" }}>
                    CANCEL
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 8, color: "#ffd700", fontFamily: "'Press Start 2P',monospace", marginBottom: 6, animation: "hero-bob 0.6s ease-in-out infinite" }}>
                  {saveResult.demonTriggered ? "DEMON AHEAD!" : "QUEST ADVANCED!"}
                </p>
                <p style={{ fontSize: 6, color: "#a0d8a0", fontFamily: "'Press Start 2P',monospace", lineHeight: 1.8, marginBottom: 4 }}>
                  {saveResult.tilesAdvanced > 0 ? `+${saveResult.tilesAdvanced} tile${saveResult.tilesAdvanced > 1 ? "s" : ""} forward!` : "Ready for battle!"}
                </p>
                {saveResult.leveledUp && (
                  <p style={{ fontSize: 7, color: "#ff9800", fontFamily: "'Press Start 2P',monospace", marginTop: 4, animation: "sparkle 0.6s ease-in-out infinite" }}>
                    LEVEL UP! LV{saveResult.newLevel}!
                  </p>
                )}
                {saveResult.demonTriggered && (
                  <p style={{ fontSize: 5, color: "#ff6666", fontFamily: "'Press Start 2P',monospace", marginTop: 6 }}>
                    A demon blocks the path! Prepare for battle!
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Level Up Overlay ── */}
      {showLevelUp && (
        <div className="absolute inset-0 z-35 flex items-center justify-center pointer-events-none" style={{ animation: "walk-in 0.3s ease-out" }}>
          <div style={{ textAlign: "center", animation: "hero-bob 0.5s ease-in-out infinite" }}>
            <p style={{ fontSize: 14, color: "#ffd700", fontFamily: "'Press Start 2P',monospace", textShadow: "2px 2px 0 #8b6508, 0 0 20px rgba(255,215,0,0.5)" }}>LEVEL UP!</p>
            <p style={{ fontSize: 10, color: "#ff9800", fontFamily: "'Press Start 2P',monospace", marginTop: 6 }}>LV {levelUpLevel}</p>
            <p style={{ fontSize: 5, color: "#a0d8a0", fontFamily: "'Press Start 2P',monospace", marginTop: 4 }}>Attack power increased!</p>
          </div>
        </div>
      )}

      {/* Battle overlay */}
      {activeBattle && (
        <BattleOverlay demon={activeBattle} onAttack={handleAttack} heroHp={heroHp} demonHp={demonHp} battlePhase={battlePhase} slashAnim={slashAnim} battleMsg={battleMsg} />
      )}

      <GameMenu open={menuOpen} onClose={() => setMenuOpen(false)} currentScreen="world" />
    </div>
  );
}
