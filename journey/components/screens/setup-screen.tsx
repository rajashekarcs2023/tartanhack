"use client";
import { useState } from "react";
import { useJourneyStore } from "@/store/journey-store";
import { RpgPanel, RpgButton } from "@/components/terrain/rpg-panel";
import { MOCK_BANK_ACCOUNT } from "@/data/mock-bank";

export function SetupScreen() {
  const navigate = useJourneyStore((s) => s.navigate);
  const setState = useJourneyStore((s) => s.setState);

  const [monthlyIncome, setMonthlyIncome] = useState("3200");
  const [payCadence, setPayCadence] = useState<"biweekly" | "monthly">("monthly");
  const [goalLabel, setGoalLabel] = useState("Emergency Fund");
  const [goalAmount, setGoalAmount] = useState("5000");
  const [goalDeadline, setGoalDeadline] = useState("2026-12-31");
  const [safetyBuffer, setSafetyBuffer] = useState("200");
  const [commitments, setCommitments] = useState([
    { label: "Rent", amount: "1200" },
    { label: "Utilities", amount: "150" },
    { label: "Subscriptions", amount: "45" },
  ]);
  const [newCommLabel, setNewCommLabel] = useState("");
  const [newCommAmt, setNewCommAmt] = useState("");
  const [useDemoData, setUseDemoData] = useState(false);

  const addCommitment = () => {
    if (!newCommLabel || !newCommAmt) return;
    setCommitments(prev => [...prev, { label: newCommLabel, amount: newCommAmt }]);
    setNewCommLabel("");
    setNewCommAmt("");
  };

  const removeCommitment = (i: number) => setCommitments(prev => prev.filter((_, idx) => idx !== i));

  const beginJourney = () => {
    if (useDemoData) {
      navigate("world");
      return;
    }

    const totalCommit = commitments.reduce((s, c) => s + (Number(c.amount) || 0), 0);
    const income = Number(monthlyIncome) || 3200;
    const buffer = Number(safetyBuffer) || 200;
    const sts = income - totalCommit - buffer;

    setState(prev => ({
      ...prev,
      profile: { id: "u1", name: "Traveler", avatarClass: "warrior", createdAt: "2026-02-07T12:00:00.000Z" },
      goal: { id: "g1", label: goalLabel || "Savings Goal", targetAmount: Number(goalAmount) || 5000, currentAmount: 0, deadline: goalDeadline },
      commitments: commitments.map((c, i) => ({
        id: `c${i}`, label: c.label, category: "fixed", amountPerMonth: Number(c.amount) || 0, isActive: true, createdAt: "2026-02-07T12:00:00.000Z",
      })),
      incomeLog: [{ id: "i1", amount: income, source: `${payCadence === "biweekly" ? "Bi-weekly" : "Monthly"} Income`, date: "2026-02-07T12:00:00.000Z" }],
      journey: {
        ...prev.journey,
        currentTile: 0,
        previousTile: 0,
        lastVisitTimestamp: new Date().toISOString(),
        savingsToTarget: 0,
        dayStreak: 0,
        xp: 0,
        level: 1,
        goldCoins: 0,
        demons: prev.journey.demons.map(d => ({ ...d, defeated: false, hp: d.maxHp })),
        pendingBattle: null,
        battleLog: [],
      },
      chatHistory: [{
        id: "m-start", role: "guide" as const,
        text: `Your journey begins! You have $${Math.max(0, sts).toFixed(0)} safe to spend this month. ${commitments[0]?.label ? `Next checkpoint: ${commitments[0].label}.` : "Set your sights on the horizon!"}`,
        ts: "2026-02-07T12:00:00.000Z",
      }],
    }));
    navigate("world");
  };

  const inputStyle = {
    backgroundColor: "rgba(42,26,14,0.8)", border: "2px solid #5a3a1e",
    padding: "8px", fontSize: 8, color: "#fff8e7",
    fontFamily: "'Press Start 2P',monospace", width: "100%", outline: "none",
  } as const;

  return (
    <div className="flex h-full flex-col" style={{ background: "linear-gradient(180deg, #2d5a1e 0%, #1a3a0e 100%)" }}>
      {/* Header */}
      <div style={{ backgroundColor: "rgba(42,26,14,0.95)", padding: "10px 12px", borderBottom: "2px solid #8b5e3c", textAlign: "center" }}>
        <p style={{ fontSize: 8, color: "#ffd700", letterSpacing: 2, fontFamily: "'Press Start 2P',monospace" }}>NEW ADVENTURE</p>
        <p style={{ fontSize: 5, color: "#8b7355", marginTop: 4, fontFamily: "'Press Start 2P',monospace" }}>Set up your save file</p>
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto p-3" style={{ minHeight: 0 }}>
        {/* Monthly Income */}
        <RpgPanel className="mb-3">
          <p style={{ fontSize: 6, color: "#ffd700", marginBottom: 6, fontFamily: "'Press Start 2P',monospace" }}>MONTHLY INCOME</p>
          <input value={monthlyIncome} onChange={e => setMonthlyIncome(e.target.value)} placeholder="$3200" type="number" style={inputStyle} />
          <p style={{ fontSize: 6, color: "#a0d8a0", marginTop: 8, marginBottom: 4, fontFamily: "'Press Start 2P',monospace" }}>PAY CADENCE</p>
          <div className="flex gap-2">
            {(["biweekly", "monthly"] as const).map(c => (
              <RpgButton key={c} variant={payCadence === c ? "primary" : "secondary"} className="flex-1 text-center" onClick={() => setPayCadence(c)}>
                {c === "biweekly" ? "BI-WEEKLY" : "MONTHLY"}
              </RpgButton>
            ))}
          </div>
        </RpgPanel>

        {/* Fixed Commitments */}
        <RpgPanel className="mb-3">
          <p style={{ fontSize: 6, color: "#ffd700", marginBottom: 6, fontFamily: "'Press Start 2P',monospace" }}>FIXED COMMITMENTS</p>
          <p style={{ fontSize: 4, color: "#8b7355", marginBottom: 6, lineHeight: 1.8, fontFamily: "'Press Start 2P',monospace" }}>Rent, utilities, subscriptions</p>
          <div className="flex flex-col gap-2 mb-3">
            {commitments.map((c, i) => (
              <div key={i} className="flex items-center gap-2" style={{ backgroundColor: "rgba(58,110,58,0.2)", border: "1px solid #3a6e3a", padding: "4px 6px" }}>
                <span style={{ flex: 1, fontSize: 6, color: "#a0d8a0", fontFamily: "'Press Start 2P',monospace" }}>{c.label}</span>
                <span style={{ fontSize: 6, color: "#ffd700", fontFamily: "'Press Start 2P',monospace" }}>${c.amount}</span>
                <button type="button" onClick={() => removeCommitment(i)} style={{ fontSize: 8, color: "#ff6666", background: "none", border: "none", cursor: "pointer", fontFamily: "'Press Start 2P',monospace", padding: "0 4px" }}>x</button>
              </div>
            ))}
          </div>
          <div className="flex gap-1">
            <input value={newCommLabel} onChange={e => setNewCommLabel(e.target.value)} placeholder="Label" style={{ ...inputStyle, flex: 2 }} />
            <input value={newCommAmt} onChange={e => setNewCommAmt(e.target.value)} placeholder="$" type="number" style={{ ...inputStyle, flex: 1 }} />
            <RpgButton variant="secondary" onClick={addCommitment} style={{ fontSize: 6 }}>+</RpgButton>
          </div>
        </RpgPanel>

        {/* Safety Buffer */}
        <RpgPanel className="mb-3">
          <p style={{ fontSize: 6, color: "#ffd700", marginBottom: 6, fontFamily: "'Press Start 2P',monospace" }}>SAFETY BUFFER</p>
          <p style={{ fontSize: 4, color: "#8b7355", marginBottom: 6, lineHeight: 1.8, fontFamily: "'Press Start 2P',monospace" }}>Keep this amount safe at all times</p>
          <input value={safetyBuffer} onChange={e => setSafetyBuffer(e.target.value)} placeholder="$200" type="number" style={inputStyle} />
        </RpgPanel>

        {/* Goal */}
        <RpgPanel className="mb-3">
          <p style={{ fontSize: 6, color: "#ffd700", marginBottom: 6, fontFamily: "'Press Start 2P',monospace" }}>PRIMARY GOAL</p>
          <p style={{ fontSize: 4, color: "#8b7355", marginBottom: 6, lineHeight: 1.8, fontFamily: "'Press Start 2P',monospace" }}>Save $____ by ____ (date)</p>
          <input value={goalLabel} onChange={e => setGoalLabel(e.target.value)} placeholder="e.g. Emergency Fund" style={{ ...inputStyle, marginBottom: 6 }} />
          <input value={goalAmount} onChange={e => setGoalAmount(e.target.value)} placeholder="Target amount ($)" type="number" style={{ ...inputStyle, marginBottom: 6 }} />
          <input value={goalDeadline} onChange={e => setGoalDeadline(e.target.value)} type="date" style={inputStyle} />
        </RpgPanel>

        {/* Use Demo Data toggle */}
        <div className="flex items-center gap-2 mb-3 px-1">
          <input type="checkbox" checked={useDemoData} onChange={e => setUseDemoData(e.target.checked)} id="demo" style={{ accentColor: "#ffd700" }} />
          <label htmlFor="demo" style={{ fontSize: 5, color: "#8b7355", cursor: "pointer", fontFamily: "'Press Start 2P',monospace" }}>USE DEMO DATA</label>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="flex gap-2 p-3" style={{ backgroundColor: "rgba(42,26,14,0.95)", borderTop: "2px solid #8b5e3c" }}>
        <RpgButton variant="danger" className="flex-1 text-center" onClick={() => navigate("title")}>CANCEL</RpgButton>
        <RpgButton variant="primary" className="flex-1 text-center" onClick={beginJourney}>BEGIN JOURNEY</RpgButton>
      </div>
    </div>
  );
}
