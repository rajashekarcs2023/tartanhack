"use client";
import { useState } from "react";
import { useJourney } from "@/store/journey-store";
import { RpgPanel, RpgButton } from "@/components/rpg/rpg-panel";
import { GameMenu } from "@/components/rpg/game-menu";

type Verdict = "SAFE" | "DETOUR" | "WRONG_TURN";

interface SpendResult {
  verdict: Verdict;
  tileDelta: number;
  daysDelta: number;
  reason: string;
}

const VERDICT_STYLE: Record<Verdict, { bg: string; border: string; color: string; label: string }> = {
  SAFE: { bg: "rgba(58,110,58,0.4)", border: "#4a8e4a", color: "#a0d8a0", label: "SAFE PATH" },
  DETOUR: { bg: "rgba(200,162,78,0.25)", border: "#c8a24e", color: "#ffd700", label: "DETOUR" },
  WRONG_TURN: { bg: "rgba(139,58,58,0.35)", border: "#8b3a3a", color: "#ff6666", label: "WRONG TURN" },
};

export function DecisionScreen() {
  const { navigate, state, setState } = useJourney();
  const [menuOpen, setMenuOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("other");
  const [result, setResult] = useState<SpendResult | null>(null);
  const [previewing, setPreviewing] = useState(false);

  const totalCommit = state.commitments.reduce((s, c) => s + c.amountPerMonth, 0);
  const income = state.incomeLog[0]?.amount ?? 3200;
  const buffer = 200;
  const safeToSpend = Math.max(0, income - totalCommit - buffer);

  const stsLevel = safeToSpend > 300 ? "green" : safeToSpend > 100 ? "yellow" : "red";
  const stsColor = stsLevel === "green" ? "#4CAF50" : stsLevel === "yellow" ? "#ffd700" : "#ff6666";

  const handlePreview = async () => {
    if (!amount) return;
    setPreviewing(true);
    await new Promise(r => setTimeout(r, 600));
    const amt = Number(amount);
    let verdict: Verdict = "SAFE";
    let tileDelta = 0;
    let daysDelta = 0;
    let reason = "";

    if (amt > safeToSpend * 0.8) {
      verdict = "WRONG_TURN";
      tileDelta = -3;
      daysDelta = 12;
      reason = `This $${amt} purchase risks breaking your safety buffer before your next commitment.`;
    } else if (amt > safeToSpend * 0.4) {
      verdict = "DETOUR";
      tileDelta = -1;
      daysDelta = Math.ceil(amt / 30);
      reason = `This delays your goal by ~${daysDelta} days. You'll lose a tile on the map.`;
    } else {
      verdict = "SAFE";
      tileDelta = 0;
      daysDelta = Math.ceil(amt / 50);
      reason = `Affordable! Minor delay of ~${daysDelta} days. Your path stays clear.`;
    }

    setResult({ verdict, tileDelta, daysDelta, reason });
    setPreviewing(false);
  };

  const handleCommit = () => {
    if (!result) return;
    const td = result.tileDelta;
    setState(prev => ({
      ...prev,
      journey: {
        ...prev.journey,
        previousTile: prev.journey.currentTile,
        currentTile: Math.max(0, Math.min(prev.journey.totalTiles, prev.journey.currentTile + td)),
        lastVisitTimestamp: new Date().toISOString(),
      },
    }));
    navigate("world");
  };

  const handleCancel = () => {
    setResult(null);
    setLabel("");
    setAmount("");
    setCategory("other");
  };

  const vs = result ? VERDICT_STYLE[result.verdict] : null;
  const inputStyle = { backgroundColor: "rgba(42,26,14,0.8)", border: "2px solid #5a3a1e", padding: "8px", fontSize: 8, color: "#fff8e7", fontFamily: "'Press Start 2P',monospace", width: "100%", outline: "none" } as const;

  const CATEGORIES = ["food", "shopping", "transport", "subscription", "other"];

  return (
    <div className="relative flex h-full flex-col" style={{ background: "linear-gradient(180deg, #2d5a1e 0%, #1a3a0e 100%)" }}>
      <div className="flex items-center justify-between" style={{ backgroundColor: "rgba(42,26,14,0.95)", padding: "6px 10px", borderBottom: "2px solid #8b5e3c" }}>
        <RpgButton variant="secondary" onClick={() => navigate("title")} style={{ fontSize: 6 }}>HOME</RpgButton>
        <p style={{ fontSize: 7, color: "#ffd700" }}>SPENDING DECISION</p>
        <RpgButton variant="secondary" onClick={() => setMenuOpen(true)} style={{ fontSize: 6 }}>MENU</RpgButton>
      </div>

      {/* Safe-to-Spend bar */}
      <div style={{ backgroundColor: "rgba(42,26,14,0.7)", padding: "6px 10px", borderBottom: "1px solid #5a3a1e" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 3 }}>
          <span style={{ fontSize: 5, color: "#8b7355" }}>SAFE TO SPEND</span>
          <span style={{ fontSize: 7, color: stsColor }}>${safeToSpend.toFixed(0)}</span>
        </div>
        <div style={{ height: 6, backgroundColor: "#2a1a0e", border: "1px solid #5a3a1e", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(100, (safeToSpend / income) * 100)}%`, backgroundColor: stsColor, transition: "width 0.3s" }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {!result ? (
          <>
            <RpgPanel className="mb-3">
              <p style={{ fontSize: 6, color: "#ffd700", marginBottom: 8, textAlign: "center" }}>LOG A PURCHASE</p>
              <div className="flex flex-col gap-3">
                <div>
                  <p style={{ fontSize: 5, color: "#8b7355", marginBottom: 3 }}>WHAT?</p>
                  <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Coffee, groceries, etc." style={inputStyle} />
                </div>
                <div>
                  <p style={{ fontSize: 5, color: "#8b7355", marginBottom: 3 }}>HOW MUCH?</p>
                  <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="$" type="number" style={inputStyle} />
                </div>
                <div>
                  <p style={{ fontSize: 5, color: "#8b7355", marginBottom: 3 }}>CATEGORY</p>
                  <div className="flex flex-wrap gap-1">
                    {CATEGORIES.map(c => (
                      <button key={c} type="button" onClick={() => setCategory(c)}
                        style={{ padding: "4px 6px", fontSize: 5, color: category === c ? "#ffd700" : "#8b7355", backgroundColor: category === c ? "rgba(200,162,78,0.2)" : "rgba(42,26,14,0.5)", border: `1px solid ${category === c ? "#ffd700" : "#5a3a1e"}`, cursor: "pointer", fontFamily: "'Press Start 2P',monospace" }}>
                        {c.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <RpgButton variant="primary" className="w-full text-center" onClick={handlePreview} disabled={previewing}>
                  {previewing ? "CHECKING..." : "PREVIEW IMPACT"}
                </RpgButton>
              </div>
            </RpgPanel>

            {/* Quick amounts */}
            <p style={{ fontSize: 5, color: "#8b7355", marginBottom: 4 }}>QUICK AMOUNTS</p>
            <div className="flex flex-wrap gap-2">
              {[5, 10, 20, 50, 100, 200].map(a => (
                <RpgButton key={a} variant="secondary" onClick={() => setAmount(String(a))} style={{ fontSize: 5, padding: "4px 8px" }}>
                  ${a}
                </RpgButton>
              ))}
            </div>
          </>
        ) : (
          /* Verdict Result */
          <div style={{ animation: "walk-in 0.3s ease-out" }}>
            <RpgPanel>
              <div style={{ backgroundColor: vs!.bg, border: `2px solid ${vs!.border}`, padding: 10, marginBottom: 8, textAlign: "center" }}>
                <p style={{ fontSize: 10, color: vs!.color, marginBottom: 4, letterSpacing: 2 }}>{vs!.label}</p>
                {result.verdict === "SAFE" && (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 4px" }}>
                    <path d="M20 6L9 17l-5-5" stroke={vs!.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {result.verdict === "DETOUR" && (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 4px" }}>
                    <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke={vs!.color} strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
                {result.verdict === "WRONG_TURN" && (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 4px" }}>
                    <path d="M18 6L6 18M6 6l12 12" stroke={vs!.color} strokeWidth="3" strokeLinecap="round" />
                  </svg>
                )}
              </div>

              <p style={{ fontSize: 6, color: "#fff8e7", lineHeight: 2, marginBottom: 8 }}>{result.reason}</p>

              {/* Impact preview */}
              <div className="pixel-border mb-3 p-2" style={{ backgroundColor: "rgba(42,26,14,0.5)" }}>
                <p style={{ fontSize: 5, color: "#8b7355", marginBottom: 4 }}>ROUTE IMPACT</p>
                <div className="flex justify-between mb-1">
                  <span style={{ fontSize: 5, color: "#a0d8a0" }}>Tile shift:</span>
                  <span style={{ fontSize: 6, color: result.tileDelta < 0 ? "#ff6666" : "#4CAF50" }}>{result.tileDelta > 0 ? `+${result.tileDelta}` : result.tileDelta} tiles</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span style={{ fontSize: 5, color: "#a0d8a0" }}>Goal delay:</span>
                  <span style={{ fontSize: 6, color: result.daysDelta > 5 ? "#ff6666" : "#ffd700" }}>~{result.daysDelta} days</span>
                </div>

                {/* Mini route preview */}
                <div style={{ marginTop: 6, height: 20, position: "relative" }}>
                  <div style={{ position: "absolute", top: 8, left: 0, right: 0, height: 4, backgroundColor: "#5a3a1e", borderRadius: 2 }} />
                  {/* Current position */}
                  <div style={{ position: "absolute", top: 4, left: `${(state.journey.currentTile / state.journey.totalTiles) * 90}%`, width: 12, height: 12, borderRadius: "50%", backgroundColor: "#4169E1", border: "2px solid #ffd700", zIndex: 2 }} />
                  {/* Projected position */}
                  {result.tileDelta !== 0 && (
                    <div style={{ position: "absolute", top: 4, left: `${(Math.max(0, state.journey.currentTile + result.tileDelta) / state.journey.totalTiles) * 90}%`, width: 12, height: 12, borderRadius: "50%", backgroundColor: result.tileDelta < 0 ? "#8b3a3a" : "#3a8b3a", border: `2px dashed ${result.tileDelta < 0 ? "#ff6666" : "#4CAF50"}`, opacity: 0.7, zIndex: 1 }} />
                  )}
                  {/* Goal */}
                  <div style={{ position: "absolute", top: 2, right: 0, width: 16, height: 16 }}>
                    <svg width="16" height="16" viewBox="0 0 16 16"><polygon points="8,0 10,5 16,5 11,8 13,14 8,10 3,14 5,8 0,5 6,5" fill="#ffd700" /></svg>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <RpgButton variant="danger" className="flex-1 text-center" onClick={handleCancel}>CANCEL</RpgButton>
                <RpgButton variant={result.verdict === "WRONG_TURN" ? "danger" : "primary"} className="flex-1 text-center" onClick={handleCommit}>
                  {result.verdict === "WRONG_TURN" ? "PROCEED ANYWAY" : "CONFIRM"}
                </RpgButton>
              </div>
            </RpgPanel>
          </div>
        )}
      </div>

      <GameMenu open={menuOpen} onClose={() => setMenuOpen(false)} currentScreen="decision" />
    </div>
  );
}
