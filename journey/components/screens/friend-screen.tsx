"use client";
import { useState, useMemo } from "react";
import { useJourney } from "@/store/journey-store";
import { RpgPanel, RpgButton } from "@/components/terrain/rpg-panel";
import { GameMenu } from "@/components/terrain/game-menu";

/* Simulated companion progress for demo */
const DEMO_COMPANIONS = [
  { id: "dc1", name: "Luna", avatarColor: "#9C27B0", level: 3, tile: 7, totalTiles: 15, streak: 12, goal: "Vacation Fund", savedPct: 45, lastActive: "2h ago" },
  { id: "dc2", name: "Kai", avatarColor: "#FF5722", level: 2, tile: 4, totalTiles: 15, streak: 5, goal: "Emergency Fund", savedPct: 28, lastActive: "5h ago" },
  { id: "dc3", name: "Maya", avatarColor: "#00BCD4", level: 5, tile: 12, totalTiles: 15, streak: 30, goal: "New Car", savedPct: 72, lastActive: "1h ago" },
  { id: "dc4", name: "Riku", avatarColor: "#4CAF50", level: 1, tile: 2, totalTiles: 15, streak: 3, goal: "Laptop Fund", savedPct: 15, lastActive: "12h ago" },
];

export function FriendScreen() {
  const { navigate, state, setState } = useJourney();
  const [menuOpen, setMenuOpen] = useState(false);
  const [code, setCode] = useState("");
  const [cheered, setCheered] = useState<string | null>(null);
  const [tab, setTab] = useState<"companions" | "leaderboard">("companions");
  const [viewRoute, setViewRoute] = useState<typeof DEMO_COMPANIONS[0] | null>(null);

  const guildCode = useMemo(() => {
    const base = (state.profile?.name ?? "HERO").toUpperCase().slice(0, 4);
    const num = String(Math.abs(base.charCodeAt(0) * 137 + 4219) % 9000 + 1000);
    return `${base}-${num}`;
  }, [state.profile?.name]);

  const addFriend = () => {
    if (!code.trim()) return;
    setState(prev => ({
      ...prev,
      friends: [...prev.friends, { id: `f${Date.now()}`, name: code.trim(), joinedAt: new Date().toISOString(), lastCheerAt: null }],
    }));
    setCode("");
  };

  const cheer = (fId: string) => {
    setCheered(fId);
    setState(prev => ({
      ...prev,
      friends: prev.friends.map(f => f.id === fId ? { ...f, lastCheerAt: new Date().toISOString() } : f),
      journey: { ...prev.journey, xp: prev.journey.xp + 5 },
    }));
    setTimeout(() => setCheered(null), 2000);
  };

  /* Combine real friends with demo companions for leaderboard */
  const myProgress = {
    id: "me", name: state.profile?.name ?? "You", avatarColor: "#ffd700",
    level: state.journey.level, tile: state.journey.currentTile, totalTiles: state.journey.totalTiles,
    streak: state.journey.dayStreak, goal: state.goal?.label ?? "Savings", savedPct: state.goal ? Math.round((state.goal.currentAmount / state.goal.targetAmount) * 100) : 0,
    lastActive: "Now",
  };

  const leaderboard = [myProgress, ...DEMO_COMPANIONS].sort((a, b) => b.savedPct - a.savedPct);

  const ProgressBar = ({ pct, color }: { pct: number; color: string }) => (
    <div style={{ width: "100%", height: 6, backgroundColor: "rgba(42,26,14,0.6)", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(100, pct)}%`, height: "100%", backgroundColor: color, borderRadius: 3, transition: "width 0.5s ease" }} />
    </div>
  );

  return (
    <div className="relative flex h-full flex-col" style={{ background: "linear-gradient(180deg, #2d5a1e 0%, #1a3a0e 100%)" }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ backgroundColor: "rgba(42,26,14,0.95)", padding: "6px 10px", borderBottom: "2px solid #8b5e3c" }}>
        <RpgButton variant="secondary" onClick={() => navigate("title")} style={{ fontSize: 6 }}>HOME</RpgButton>
        <p style={{ fontSize: 7, color: "#ffd700", fontFamily: "'Press Start 2P',monospace" }}>GUILD HALL</p>
        <RpgButton variant="secondary" onClick={() => setMenuOpen(true)} style={{ fontSize: 6 }}>MENU</RpgButton>
      </div>

      {/* Tabs */}
      <div className="flex" style={{ backgroundColor: "rgba(42,26,14,0.7)" }}>
        {(["companions", "leaderboard"] as const).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            style={{ flex: 1, padding: "6px 0", fontSize: 5.5, fontFamily: "'Press Start 2P',monospace", color: tab === t ? "#ffd700" : "#8b7355", backgroundColor: tab === t ? "rgba(139,94,60,0.3)" : "transparent", border: "none", borderBottom: tab === t ? "2px solid #ffd700" : "2px solid transparent", cursor: "pointer" }}>
            {t === "companions" ? "COMPANIONS" : "LEADERBOARD"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {tab === "companions" && (
          <>
            {/* Guild banner */}
            <div className="pixel-border mb-3 flex flex-col items-center p-3" style={{ backgroundColor: "rgba(42,26,14,0.85)", textAlign: "center" }}>
              <div style={{ width: 30, height: 24, backgroundColor: "#8b3a3a", border: "2px solid #6e2222", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: "#ffd700" }}>*</span>
              </div>
              <p style={{ fontSize: 6, color: "#ffd700", fontFamily: "'Press Start 2P',monospace" }}>COMPANIONS GUILD</p>
              <p style={{ fontSize: 4.5, color: "#8b7355", marginTop: 2, fontFamily: "'Press Start 2P',monospace" }}>{state.friends.length + DEMO_COMPANIONS.length} travelers on their quests</p>
            </div>

            {/* Add companion */}
            <RpgPanel className="mb-3">
              <p style={{ fontSize: 6, color: "#ffd700", marginBottom: 6, fontFamily: "'Press Start 2P',monospace" }}>RECRUIT COMPANION</p>
              <div className="flex gap-2">
                <input value={code} onChange={e => setCode(e.target.value)} placeholder="Friend name or code..."
                  style={{ flex: 1, backgroundColor: "rgba(42,26,14,0.8)", border: "2px solid #5a3a1e", padding: "6px 8px", fontSize: 6, color: "#fff8e7", fontFamily: "'Press Start 2P',monospace", outline: "none" }} />
                <RpgButton variant="primary" onClick={addFriend} style={{ fontSize: 6 }}>ADD</RpgButton>
              </div>
            </RpgPanel>

            {/* Demo companions with progress */}
            {DEMO_COMPANIONS.map(c => (
              <RpgPanel key={c.id} className="mb-2">
                <div className="flex items-center gap-3">
                  <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: c.avatarColor, border: "2px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 10, color: "#fff" }}>{c.name[0]}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center justify-between">
                      <p style={{ fontSize: 6, color: "#ffd700", fontFamily: "'Press Start 2P',monospace" }}>{c.name}</p>
                      <span style={{ fontSize: 4.5, color: "#8b7355", fontFamily: "'Press Start 2P',monospace" }}>Lv{c.level}</span>
                    </div>
                    <p style={{ fontSize: 4, color: "#4fc3f7", fontFamily: "'Press Start 2P',monospace", marginTop: 1 }}>{c.goal} — {c.savedPct}%</p>
                    <div style={{ marginTop: 3 }}>
                      <ProgressBar pct={c.savedPct} color={c.avatarColor} />
                    </div>
                    <div className="flex items-center justify-between" style={{ marginTop: 3 }}>
                      <span style={{ fontSize: 4, color: "#8b7355", fontFamily: "'Press Start 2P',monospace" }}>Tile {c.tile}/{c.totalTiles} | {c.streak}d streak</span>
                      <span style={{ fontSize: 3.5, color: "#666", fontFamily: "'Press Start 2P',monospace" }}>{c.lastActive}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={() => cheer(c.id)}
                    style={{ flex: 1, padding: "4px 0", fontSize: 5, fontFamily: "'Press Start 2P',monospace", color: "#fff8e7", backgroundColor: cheered === c.id ? "#2d7a2d" : "#4a6a2a", border: `1px solid ${cheered === c.id ? "#4CAF50" : "#6a9a3a"}`, cursor: "pointer", textAlign: "center" }}>
                    {cheered === c.id ? "CHEERED! +5XP" : "CHEER ON"}
                  </button>
                  <button type="button" onClick={() => setViewRoute(c)}
                    style={{ flex: 1, padding: "4px 0", fontSize: 5, fontFamily: "'Press Start 2P',monospace", color: "#fff8e7", backgroundColor: "#2d5a8a", border: "1px solid #4080c0", cursor: "pointer", textAlign: "center" }}>
                    VIEW ROUTE
                  </button>
                </div>
              </RpgPanel>
            ))}

            {/* Real friends */}
            {state.friends.map(f => (
              <RpgPanel key={f.id} className="mb-2">
                <div className="flex items-center gap-3">
                  <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "#4169E1", border: "2px solid #2a3a8a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 10, color: "#ffd700" }}>{f.name[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <p style={{ fontSize: 6, color: "#ffd700", fontFamily: "'Press Start 2P',monospace" }}>{f.name}</p>
                    <p style={{ fontSize: 4, color: "#8b7355", fontFamily: "'Press Start 2P',monospace" }}>Joined {new Date(f.joinedAt).toLocaleDateString()}</p>
                    {f.lastCheerAt && <p style={{ fontSize: 4, color: "#a0d8a0", fontFamily: "'Press Start 2P',monospace" }}>Cheered {new Date(f.lastCheerAt).toLocaleDateString()}</p>}
                  </div>
                  <RpgButton variant={cheered === f.id ? "primary" : "secondary"} onClick={() => cheer(f.id)} style={{ fontSize: 5 }}>
                    {cheered === f.id ? "SENT!" : "CHEER"}
                  </RpgButton>
                </div>
              </RpgPanel>
            ))}

            {/* Guild code */}
            <RpgPanel className="mt-3">
              <p style={{ fontSize: 6, color: "#ffd700", marginBottom: 4, fontFamily: "'Press Start 2P',monospace" }}>YOUR GUILD CODE</p>
              <div className="flex items-center justify-between" style={{ backgroundColor: "rgba(58,110,58,0.3)", border: "1px solid #3a6e3a", padding: "6px 8px" }}>
                <span style={{ fontSize: 7, color: "#a0d8a0", letterSpacing: 2, fontFamily: "'Press Start 2P',monospace" }}>{guildCode}</span>
                <RpgButton variant="secondary" style={{ fontSize: 5, padding: "2px 6px" }}>COPY</RpgButton>
              </div>
              <p style={{ fontSize: 4, color: "#8b7355", marginTop: 4, fontFamily: "'Press Start 2P',monospace", lineHeight: 1.6 }}>Share this code with friends so they can join your guild!</p>
            </RpgPanel>
          </>
        )}

        {/* ── Leaderboard tab ── */}
        {tab === "leaderboard" && (
          <>
            <RpgPanel className="mb-3" style={{ textAlign: "center" }}>
              <p style={{ fontSize: 7, color: "#ffd700", fontFamily: "'Press Start 2P',monospace", marginBottom: 4 }}>GUILD RANKINGS</p>
              <p style={{ fontSize: 4.5, color: "#8b7355", fontFamily: "'Press Start 2P',monospace", lineHeight: 1.8 }}>Ranked by savings progress. Keep saving to climb!</p>
            </RpgPanel>

            {leaderboard.map((p, rank) => {
              const isMe = p.id === "me";
              return (
                <RpgPanel key={p.id} className="mb-2" style={isMe ? { border: "2px solid #ffd700" } : undefined}>
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <div style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: rank === 0 ? "#ffd700" : rank === 1 ? "#c0c0c0" : rank === 2 ? "#cd7f32" : "#5a3a1e", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 8, color: rank < 3 ? "#1a1a0e" : "#8b7355", fontFamily: "'Press Start 2P',monospace" }}>{rank + 1}</span>
                    </div>
                    {/* Avatar */}
                    <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: p.avatarColor, border: isMe ? "2px solid #ffd700" : "2px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 9, color: isMe ? "#1a1a0e" : "#fff" }}>{p.name[0]}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center justify-between">
                        <p style={{ fontSize: 5.5, color: isMe ? "#ffd700" : "#fff8e7", fontFamily: "'Press Start 2P',monospace" }}>{isMe ? `${p.name} (YOU)` : p.name}</p>
                        <span style={{ fontSize: 5, color: "#4fc3f7", fontFamily: "'Press Start 2P',monospace" }}>{p.savedPct}%</span>
                      </div>
                      <div style={{ marginTop: 3 }}>
                        <ProgressBar pct={p.savedPct} color={p.avatarColor} />
                      </div>
                      <div className="flex gap-2" style={{ marginTop: 2 }}>
                        <span style={{ fontSize: 4, color: "#8b7355", fontFamily: "'Press Start 2P',monospace" }}>Lv{p.level}</span>
                        <span style={{ fontSize: 4, color: "#8b7355", fontFamily: "'Press Start 2P',monospace" }}>{p.streak}d streak</span>
                        <span style={{ fontSize: 4, color: "#a0d8a0", fontFamily: "'Press Start 2P',monospace" }}>Tile {p.tile}/{p.totalTiles}</span>
                      </div>
                    </div>
                  </div>
                </RpgPanel>
              );
            })}
          </>
        )}
      </div>

      {/* ── Route Overlay ── */}
      {viewRoute && (
        <div className="absolute inset-0 z-40 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.75)" }} onClick={() => setViewRoute(null)}>
          <div className="pixel-border mx-4 w-full" style={{ backgroundColor: "rgba(42,26,14,0.98)", padding: "14px 16px", maxWidth: 370 }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: viewRoute.avatarColor, border: "2px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 14, color: "#fff" }}>{viewRoute.name[0]}</span>
              </div>
              <div>
                <p style={{ fontSize: 7, color: "#ffd700", fontFamily: "'Press Start 2P',monospace" }}>{viewRoute.name}&apos;s Quest</p>
                <p style={{ fontSize: 4.5, color: "#8b7355", fontFamily: "'Press Start 2P',monospace" }}>{viewRoute.goal} — Lv{viewRoute.level}</p>
              </div>
            </div>

            {/* Mini route map */}
            <div style={{ backgroundColor: "rgba(26,58,14,0.4)", border: "1px solid #3a6e3a", borderRadius: 4, padding: "10px 12px", marginBottom: 10 }}>
              <svg width="100%" height={60} viewBox="0 0 300 50">
                {/* Path */}
                <line x1={10} y1={25} x2={290} y2={25} stroke="#5a3a1e" strokeWidth={4} strokeLinecap="round" />
                {/* Progress */}
                <line x1={10} y1={25} x2={10 + (280 * viewRoute.tile / viewRoute.totalTiles)} y2={25} stroke={viewRoute.avatarColor} strokeWidth={4} strokeLinecap="round" />
                {/* Tile markers */}
                {Array.from({ length: viewRoute.totalTiles + 1 }, (_, i) => {
                  const x = 10 + (280 * i / viewRoute.totalTiles);
                  const reached = i <= viewRoute.tile;
                  return (
                    <g key={i}>
                      <circle cx={x} cy={25} r={reached ? 5 : 3} fill={reached ? viewRoute.avatarColor : "#3a3a3a"} stroke={reached ? "#fff" : "#555"} strokeWidth={1} />
                      {i === viewRoute.tile && (
                        <circle cx={x} cy={25} r={8} fill="none" stroke={viewRoute.avatarColor} strokeWidth={1.5} opacity={0.5}>
                          <animate attributeName="r" values="8;12;8" dur="1.5s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.5;0.2;0.5" dur="1.5s" repeatCount="indefinite" />
                        </circle>
                      )}
                    </g>
                  );
                })}
                {/* Castle at end */}
                <text x={290} y={12} textAnchor="middle" fontSize={8} fill="#ffd700">*</text>
                {/* Start label */}
                <text x={10} y={45} textAnchor="middle" fontSize={4} fill="#8b7355" fontFamily="'Press Start 2P',monospace">START</text>
                <text x={290} y={45} textAnchor="middle" fontSize={4} fill="#ffd700" fontFamily="'Press Start 2P',monospace">GOAL</text>
              </svg>
            </div>

            {/* Stats grid */}
            <div className="flex gap-2 mb-3">
              {[
                { label: "TILE", value: `${viewRoute.tile}/${viewRoute.totalTiles}`, color: viewRoute.avatarColor },
                { label: "SAVED", value: `${viewRoute.savedPct}%`, color: "#4CAF50" },
                { label: "STREAK", value: `${viewRoute.streak}d`, color: "#ff9944" },
                { label: "LEVEL", value: `${viewRoute.level}`, color: "#ffd700" },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, textAlign: "center", padding: "6px 2px", backgroundColor: "rgba(26,26,14,0.5)", border: "1px solid #5a3a1e", borderRadius: 2 }}>
                  <p style={{ fontSize: 4, color: "#8b7355", fontFamily: "'Press Start 2P',monospace" }}>{s.label}</p>
                  <p style={{ fontSize: 7, color: s.color, fontFamily: "'Press Start 2P',monospace", marginTop: 2 }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Comparison */}
            <div style={{ padding: "6px 8px", backgroundColor: "rgba(79,195,247,0.1)", border: "1px solid rgba(79,195,247,0.3)", borderRadius: 2, marginBottom: 10 }}>
              <p style={{ fontSize: 4.5, color: "#4fc3f7", fontFamily: "'Press Start 2P',monospace", marginBottom: 4 }}>VS YOUR PROGRESS</p>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 4, color: "#ffd700", fontFamily: "'Press Start 2P',monospace", minWidth: 30 }}>YOU</span>
                <div style={{ flex: 1, height: 6, backgroundColor: "#1a0a06", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${myProgress.savedPct}%`, backgroundColor: "#ffd700", borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 4, color: "#ffd700", fontFamily: "'Press Start 2P',monospace" }}>{myProgress.savedPct}%</span>
              </div>
              <div className="flex items-center gap-2" style={{ marginTop: 3 }}>
                <span style={{ fontSize: 4, color: viewRoute.avatarColor, fontFamily: "'Press Start 2P',monospace", minWidth: 30 }}>{viewRoute.name.slice(0, 4).toUpperCase()}</span>
                <div style={{ flex: 1, height: 6, backgroundColor: "#1a0a06", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${viewRoute.savedPct}%`, backgroundColor: viewRoute.avatarColor, borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 4, color: viewRoute.avatarColor, fontFamily: "'Press Start 2P',monospace" }}>{viewRoute.savedPct}%</span>
              </div>
              <p style={{ fontSize: 4, color: "#a0d8a0", fontFamily: "'Press Start 2P',monospace", marginTop: 4, textAlign: "center" }}>
                {myProgress.savedPct > viewRoute.savedPct ? "You're ahead! Keep it up!" : myProgress.savedPct === viewRoute.savedPct ? "Neck and neck!" : `${viewRoute.name} is ahead — save more to catch up!`}
              </p>
            </div>

            <button type="button" onClick={() => setViewRoute(null)}
              style={{ width: "100%", padding: "7px 0", fontSize: 6, fontFamily: "'Press Start 2P',monospace", color: "#fff8e7", backgroundColor: "#5a3a1e", border: "2px solid #8b5e3c", cursor: "pointer", textAlign: "center" }}>
              CLOSE
            </button>
          </div>
        </div>
      )}

      <GameMenu open={menuOpen} onClose={() => setMenuOpen(false)} currentScreen="friend" />
    </div>
  );
}
