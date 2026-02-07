"use client";
import { useState } from "react";
import { useJourney } from "@/store/journey-store";
import { RpgPanel, RpgButton } from "@/components/rpg/rpg-panel";
import { GameMenu } from "@/components/rpg/game-menu";

export function InventoryScreen() {
  const { navigate, state, setState } = useJourney();
  const [menuOpen, setMenuOpen] = useState(false);
  const [tab, setTab] = useState<"overview" | "commitments" | "log">("overview");
  const [incomeAmt, setIncomeAmt] = useState("");
  const [incomeSrc, setIncomeSrc] = useState("");
  const [savingsAmt, setSavingsAmt] = useState("");

  const goal = state.goal;
  const pct = goal ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0;
  const totalIncome = state.incomeLog.reduce((s, i) => s + i.amount, 0);

  const logIncome = () => {
    if (!incomeAmt) return;
    setState(prev => ({
      ...prev,
      incomeLog: [...prev.incomeLog, { id: `i${Date.now()}`, amount: Number(incomeAmt), source: incomeSrc || "Income", date: new Date().toISOString() }],
    }));
    setIncomeAmt(""); setIncomeSrc("");
  };

  const addSavings = () => {
    if (!savingsAmt || !goal) return;
    const amt = Number(savingsAmt);
    setState(prev => ({
      ...prev,
      goal: prev.goal ? { ...prev.goal, currentAmount: Math.min(prev.goal.currentAmount + amt, prev.goal.targetAmount) } : prev.goal,
      journey: { ...prev.journey, currentTile: Math.min(prev.journey.currentTile + 1, prev.journey.totalTiles) },
    }));
    setSavingsAmt("");
  };

  const inputStyle = { backgroundColor: "rgba(42,26,14,0.8)", border: "2px solid #5a3a1e", padding: "6px 8px", fontSize: 7, color: "#fff8e7", fontFamily: "'Press Start 2P',monospace", width: "100%", outline: "none" };

  return (
    <div className="relative flex h-full flex-col" style={{ background: "linear-gradient(180deg, #2d5a1e 0%, #1a3a0e 100%)" }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ backgroundColor: "rgba(42,26,14,0.95)", padding: "6px 10px", borderBottom: "2px solid #8b5e3c" }}>
        <RpgButton variant="secondary" onClick={() => navigate("title")} style={{ fontSize: 6 }}>HOME</RpgButton>
        <p style={{ fontSize: 7, color: "#ffd700" }}>ROUTE STATS</p>
        <RpgButton variant="secondary" onClick={() => setMenuOpen(true)} style={{ fontSize: 6 }}>MENU</RpgButton>
      </div>

      {/* Tab bar */}
      <div className="flex" style={{ backgroundColor: "rgba(42,26,14,0.8)", borderBottom: "2px solid #5a3a1e" }}>
        {(["overview", "commitments", "log"] as const).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            style={{ flex: 1, padding: "6px", fontSize: 5, color: tab === t ? "#ffd700" : "#8b7355", backgroundColor: tab === t ? "rgba(139,94,60,0.3)" : "transparent", borderBottom: tab === t ? "2px solid #ffd700" : "2px solid transparent", cursor: "pointer", fontFamily: "'Press Start 2P',monospace" }}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {tab === "overview" && (
          <>
            {/* HP-bar style goal progress */}
            <RpgPanel className="mb-3">
              <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 6, color: "#a0d8a0" }}>QUEST</span>
                <span style={{ fontSize: 6, color: "#ffd700" }}>{goal?.label ?? "None"}</span>
              </div>
              <div style={{ position: "relative", height: 14, backgroundColor: "#2a1a0e", border: "2px solid #5a3a1e" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: pct > 60 ? "linear-gradient(90deg, #2d7a2d, #4CAF50)" : pct > 30 ? "linear-gradient(90deg, #c8a24e, #ffd700)" : "linear-gradient(90deg, #8b3a3a, #ff6666)", transition: "width 0.5s", boxShadow: "0 0 6px rgba(76,175,80,0.5)" }} />
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(180deg, rgba(255,255,255,0.15), transparent)" }} />
                <span style={{ position: "absolute", right: 4, top: 1, fontSize: 6, color: "#fff8e7" }}>{pct}%</span>
              </div>
              <p style={{ fontSize: 5, color: "#8b7355", marginTop: 4 }}>${goal?.currentAmount ?? 0} / ${goal?.targetAmount ?? 0}</p>
            </RpgPanel>

            {/* Stats grid */}
            <div className="mb-3 grid grid-cols-2 gap-2">
              {[
                { label: "TILE", value: `${state.journey.currentTile}/${state.journey.totalTiles}`, color: "#ffd700" },
                { label: "STREAK", value: `${state.journey.dayStreak}d`, color: "#ff9800" },
                { label: "INCOME", value: `$${totalIncome}`, color: "#4CAF50" },
                { label: "PLEDGES", value: `${state.commitments.filter(c => c.isActive).length}`, color: "#9b59b6" },
              ].map(s => (
                <div key={s.label} className="pixel-border flex flex-col items-center p-2" style={{ backgroundColor: "rgba(42,26,14,0.7)" }}>
                  <span style={{ fontSize: 5, color: "#8b7355" }}>{s.label}</span>
                  <span style={{ fontSize: 10, color: s.color, marginTop: 2 }}>{s.value}</span>
                </div>
              ))}
            </div>

            {/* Quick add savings */}
            <RpgPanel>
              <p style={{ fontSize: 6, color: "#ffd700", marginBottom: 6 }}>ADD TO SAVINGS</p>
              <div className="flex gap-2">
                <input value={savingsAmt} onChange={e => setSavingsAmt(e.target.value)} placeholder="Amount ($)" type="number" style={inputStyle} />
                <RpgButton variant="primary" onClick={addSavings} style={{ fontSize: 6, whiteSpace: "nowrap" }}>SAVE</RpgButton>
              </div>
            </RpgPanel>
          </>
        )}

        {tab === "commitments" && (
          <>
            {state.commitments.length === 0 ? (
              <RpgPanel><p style={{ fontSize: 6, color: "#8b7355", textAlign: "center" }}>No commitments yet. Make a pledge to strengthen your journey!</p></RpgPanel>
            ) : state.commitments.map(c => (
              <RpgPanel key={c.id} className="mb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p style={{ fontSize: 7, color: "#fff8e7" }}>{c.label}</p>
                    <p style={{ fontSize: 5, color: "#a0d8a0" }}>Saves ~${c.amountPerMonth}/mo</p>
                    <p style={{ fontSize: 4, color: "#8b7355" }}>{c.category}</p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: c.isActive ? "#4CAF50" : "#8b3a3a", boxShadow: c.isActive ? "0 0 6px rgba(76,175,80,0.5)" : "none" }} />
                    <span style={{ fontSize: 4, color: c.isActive ? "#a0d8a0" : "#ff6666" }}>{c.isActive ? "ON" : "OFF"}</span>
                  </div>
                </div>
              </RpgPanel>
            ))}
          </>
        )}

        {tab === "log" && (
          <>
            <RpgPanel className="mb-3">
              <p style={{ fontSize: 6, color: "#ffd700", marginBottom: 6 }}>LOG INCOME</p>
              <input value={incomeSrc} onChange={e => setIncomeSrc(e.target.value)} placeholder="Source (e.g. Salary)" style={{ ...inputStyle, marginBottom: 6 }} />
              <div className="flex gap-2">
                <input value={incomeAmt} onChange={e => setIncomeAmt(e.target.value)} placeholder="Amount ($)" type="number" style={inputStyle} />
                <RpgButton variant="primary" onClick={logIncome} style={{ fontSize: 6 }}>LOG</RpgButton>
              </div>
            </RpgPanel>

            <p style={{ fontSize: 6, color: "#ffd700", marginBottom: 6 }}>INCOME HISTORY</p>
            {state.incomeLog.length === 0 ? (
              <RpgPanel><p style={{ fontSize: 6, color: "#8b7355", textAlign: "center" }}>No income logged yet.</p></RpgPanel>
            ) : state.incomeLog.map(inc => (
              <RpgPanel key={inc.id} className="mb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p style={{ fontSize: 7, color: "#4CAF50" }}>${inc.amount}</p>
                    <p style={{ fontSize: 5, color: "#8b7355" }}>{inc.source}</p>
                  </div>
                  <p style={{ fontSize: 4, color: "#666" }}>{new Date(inc.date).toLocaleDateString()}</p>
                </div>
              </RpgPanel>
            ))}
          </>
        )}
      </div>
      <GameMenu open={menuOpen} onClose={() => setMenuOpen(false)} currentScreen="inventory" />
    </div>
  );
}
