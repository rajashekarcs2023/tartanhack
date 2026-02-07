"use client";
import { useState } from "react";
import { useJourney } from "@/store/journey-store";
import { RpgPanel, RpgButton } from "@/components/rpg/rpg-panel";

const CLASSES = [
  { id: "warrior", label: "WARRIOR", desc: "Disciplined saver, strong against impulse spending", color: "#4169E1", icon: "+" },
  { id: "mage", label: "MAGE", desc: "Strategic planner, maximizes investment growth", color: "#9b59b6", icon: "*" },
  { id: "ranger", label: "RANGER", desc: "Balanced approach, steady income tracker", color: "#2ecc71", icon: ">" },
  { id: "healer", label: "HEALER", desc: "Debt recovery specialist, restores financial health", color: "#e74c3c", icon: "+" },
];

function ClassSprite({ classId, selected }: { classId: string; selected: boolean }) {
  const cls = CLASSES.find(c => c.id === classId)!;
  return (
    <div style={{ width: 36, height: 46, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#ffd700", border: selected ? "2px solid #fff" : "1px solid #b8860b" }} />
      <div style={{ width: 16, height: 16, backgroundColor: cls.color, marginTop: 1, borderRadius: 2, border: selected ? "2px solid #fff" : "1px solid rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 7, color: "white" }}>{cls.icon}</span>
      </div>
      <div style={{ display: "flex", gap: 2, marginTop: 1 }}>
        <div style={{ width: 6, height: 8, backgroundColor: "#3a2a1e", borderRadius: "0 0 2px 2px" }} />
        <div style={{ width: 6, height: 8, backgroundColor: "#3a2a1e", borderRadius: "0 0 2px 2px" }} />
      </div>
    </div>
  );
}

export function SetupScreen() {
  const { navigate, setState } = useJourney();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [selectedClass, setSelectedClass] = useState("warrior");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [payCadence, setPayCadence] = useState<"biweekly" | "monthly">("monthly");
  const [goalLabel, setGoalLabel] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("2026-12-31");
  const [safetyBuffer, setSafetyBuffer] = useState("200");
  const [commitments, setCommitments] = useState([
    { label: "Rent", amount: "1200" },
    { label: "Utilities", amount: "150" },
  ]);
  const [newCommLabel, setNewCommLabel] = useState("");
  const [newCommAmt, setNewCommAmt] = useState("");
  const [useDemoData, setUseDemoData] = useState(false);

  const addCommitment = () => {
    if (!newCommLabel || !newCommAmt) return;
    setCommitments(prev => [...prev, { label: newCommLabel, amount: newCommAmt }]);
    setNewCommLabel(""); setNewCommAmt("");
  };

  const removeCommitment = (i: number) => setCommitments(prev => prev.filter((_, idx) => idx !== i));

  const finish = () => {
    const totalCommit = commitments.reduce((s, c) => s + (Number(c.amount) || 0), 0);
    const income = Number(monthlyIncome) || 3200;
    const buffer = Number(safetyBuffer) || 200;
    const sts = income - totalCommit - buffer;

    setState(prev => ({
      ...prev,
      profile: { id: "u1", name: name || "Hero", avatarClass: selectedClass, createdAt: new Date().toISOString() },
      goal: { id: "g1", label: goalLabel || "Savings Goal", targetAmount: Number(goalAmount) || 5000, currentAmount: 0, deadline: goalDeadline },
      commitments: commitments.map((c, i) => ({
        id: `c${i}`, label: c.label, category: "fixed", amountPerMonth: Number(c.amount) || 0, isActive: true, createdAt: new Date().toISOString(),
      })),
      incomeLog: [{ id: "i1", amount: income, source: `${payCadence === "biweekly" ? "Bi-weekly" : "Monthly"} Income`, date: new Date().toISOString() }],
      journey: {
        ...prev.journey,
        currentTile: 1,
        previousTile: 0,
        lastVisitTimestamp: new Date().toISOString(),
        savingsToTarget: 0,
        dayStreak: 0,
      },
      chatHistory: [{ id: `m${Date.now()}`, role: "guide" as const, text: `Your journey begins, ${name || "Hero"}! You have $${Math.max(0, sts).toFixed(0)} safe to spend. ${commitments[0]?.label ? `Next checkpoint: ${commitments[0].label}.` : "Set your sights on the horizon!"}`, ts: new Date().toISOString() }],
    }));
    navigate("world");
  };

  const loadDemo = () => {
    navigate("world");
  };

  const inputStyle = { backgroundColor: "rgba(42,26,14,0.8)", border: "2px solid #5a3a1e", padding: "8px", fontSize: 8, color: "#fff8e7", fontFamily: "'Press Start 2P',monospace", width: "100%", outline: "none" } as const;
  const TOTAL_STEPS = 6;

  return (
    <div className="flex h-full flex-col" style={{ background: "linear-gradient(180deg, #2d5a1e 0%, #1a3a0e 100%)" }}>
      {/* Header */}
      <div style={{ backgroundColor: "rgba(42,26,14,0.95)", padding: "8px 12px", borderBottom: "2px solid #8b5e3c", textAlign: "center" }}>
        <p style={{ fontSize: 8, color: "#ffd700", letterSpacing: 2 }}>CREATE YOUR HERO</p>
        <div className="mt-2 flex justify-center gap-1">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} style={{ width: 16, height: 4, backgroundColor: i <= step ? "#ffd700" : "#3a3a3a", transition: "background-color 0.3s" }} />
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto p-4">
        {/* Step 0: Name */}
        {step === 0 && (
          <RpgPanel className="w-full" style={{ animation: "walk-in 0.3s ease-out" }}>
            <p style={{ fontSize: 7, color: "#ffd700", textAlign: "center", marginBottom: 10 }}>WHAT IS YOUR NAME, TRAVELER?</p>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter name..." style={inputStyle} />
            <div className="mt-3 flex items-center gap-2">
              <input type="checkbox" checked={useDemoData} onChange={e => setUseDemoData(e.target.checked)} id="demo" style={{ accentColor: "#ffd700" }} />
              <label htmlFor="demo" style={{ fontSize: 5, color: "#8b7355", cursor: "pointer" }}>USE DEMO DATA</label>
            </div>
            <div className="mt-3 flex gap-2">
              {useDemoData ? (
                <RpgButton variant="primary" className="w-full text-center" onClick={loadDemo}>BEGIN WITH DEMO</RpgButton>
              ) : (
                <RpgButton variant="primary" className="w-full text-center" onClick={() => setStep(1)}>NEXT</RpgButton>
              )}
            </div>
          </RpgPanel>
        )}

        {/* Step 1: Class */}
        {step === 1 && (
          <RpgPanel className="w-full" style={{ animation: "walk-in 0.3s ease-out" }}>
            <p style={{ fontSize: 7, color: "#ffd700", textAlign: "center", marginBottom: 10 }}>CHOOSE YOUR CLASS</p>
            <div className="grid grid-cols-2 gap-3">
              {CLASSES.map(cls => (
                <button key={cls.id} type="button" onClick={() => setSelectedClass(cls.id)}
                  className="pixel-border flex flex-col items-center gap-1 p-2 transition-all"
                  style={{ backgroundColor: selectedClass === cls.id ? "rgba(200,162,78,0.2)" : "rgba(42,26,14,0.5)", borderColor: selectedClass === cls.id ? "#ffd700" : "#5a3a1e", cursor: "pointer" }}>
                  <ClassSprite classId={cls.id} selected={selectedClass === cls.id} />
                  <span style={{ fontSize: 6, color: selectedClass === cls.id ? "#ffd700" : "#a0d8a0" }}>{cls.label}</span>
                  <span style={{ fontSize: 4, color: "#8b7355", textAlign: "center", lineHeight: 1.6 }}>{cls.desc}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <RpgButton variant="danger" className="flex-1 text-center" onClick={() => setStep(0)}>BACK</RpgButton>
              <RpgButton variant="primary" className="flex-1 text-center" onClick={() => setStep(2)}>NEXT</RpgButton>
            </div>
          </RpgPanel>
        )}

        {/* Step 2: Income + Cadence */}
        {step === 2 && (
          <RpgPanel className="w-full" style={{ animation: "walk-in 0.3s ease-out" }}>
            <p style={{ fontSize: 7, color: "#ffd700", textAlign: "center", marginBottom: 10 }}>YOUR INCOME</p>
            <p style={{ fontSize: 5, color: "#8b7355", textAlign: "center", marginBottom: 8 }}>This helps the Guide calculate your route</p>
            <input value={monthlyIncome} onChange={e => setMonthlyIncome(e.target.value)} placeholder="Monthly income ($)" type="number" style={inputStyle} />
            <p style={{ fontSize: 6, color: "#a0d8a0", marginTop: 8, marginBottom: 4 }}>PAY CADENCE</p>
            <div className="flex gap-2">
              {(["biweekly", "monthly"] as const).map(c => (
                <RpgButton key={c} variant={payCadence === c ? "primary" : "secondary"} className="flex-1 text-center" onClick={() => setPayCadence(c)}>
                  {c.toUpperCase()}
                </RpgButton>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <RpgButton variant="danger" className="flex-1 text-center" onClick={() => setStep(1)}>BACK</RpgButton>
              <RpgButton variant="primary" className="flex-1 text-center" onClick={() => setStep(3)}>NEXT</RpgButton>
            </div>
          </RpgPanel>
        )}

        {/* Step 3: Commitments */}
        {step === 3 && (
          <RpgPanel className="w-full" style={{ animation: "walk-in 0.3s ease-out" }}>
            <p style={{ fontSize: 7, color: "#ffd700", textAlign: "center", marginBottom: 10 }}>FIXED COMMITMENTS</p>
            <p style={{ fontSize: 5, color: "#8b7355", textAlign: "center", marginBottom: 8 }}>Rent, utilities, subscriptions -- the paths you must walk</p>
            <div className="flex flex-col gap-2 mb-3">
              {commitments.map((c, i) => (
                <div key={i} className="flex items-center gap-2" style={{ backgroundColor: "rgba(58,110,58,0.2)", border: "1px solid #3a6e3a", padding: "4px 6px" }}>
                  <span style={{ flex: 1, fontSize: 6, color: "#a0d8a0" }}>{c.label}</span>
                  <span style={{ fontSize: 6, color: "#ffd700" }}>${c.amount}</span>
                  <button type="button" onClick={() => removeCommitment(i)} style={{ fontSize: 8, color: "#ff6666", background: "none", border: "none", cursor: "pointer", fontFamily: "'Press Start 2P',monospace", padding: "0 4px" }}>x</button>
                </div>
              ))}
            </div>
            <div className="flex gap-1 mb-3">
              <input value={newCommLabel} onChange={e => setNewCommLabel(e.target.value)} placeholder="Label" style={{ ...inputStyle, flex: 2 }} />
              <input value={newCommAmt} onChange={e => setNewCommAmt(e.target.value)} placeholder="$" type="number" style={{ ...inputStyle, flex: 1 }} />
              <RpgButton variant="secondary" onClick={addCommitment} style={{ fontSize: 6 }}>+</RpgButton>
            </div>
            <div className="flex gap-2">
              <RpgButton variant="danger" className="flex-1 text-center" onClick={() => setStep(2)}>BACK</RpgButton>
              <RpgButton variant="primary" className="flex-1 text-center" onClick={() => setStep(4)}>NEXT</RpgButton>
            </div>
          </RpgPanel>
        )}

        {/* Step 4: Goal + Deadline */}
        {step === 4 && (
          <RpgPanel className="w-full" style={{ animation: "walk-in 0.3s ease-out" }}>
            <p style={{ fontSize: 7, color: "#ffd700", textAlign: "center", marginBottom: 10 }}>WHAT QUEST DRIVES YOU?</p>
            <p style={{ fontSize: 5, color: "#8b7355", textAlign: "center", marginBottom: 8 }}>Save $____ by ____ (date)</p>
            <input value={goalLabel} onChange={e => setGoalLabel(e.target.value)} placeholder="e.g. Emergency Fund, Vacation" style={inputStyle} />
            <div className="mt-2" />
            <input value={goalAmount} onChange={e => setGoalAmount(e.target.value)} placeholder="Target amount ($)" type="number" style={inputStyle} />
            <div className="mt-2" />
            <input value={goalDeadline} onChange={e => setGoalDeadline(e.target.value)} type="date" style={inputStyle} />
            <div className="mt-3 flex gap-2">
              <RpgButton variant="danger" className="flex-1 text-center" onClick={() => setStep(3)}>BACK</RpgButton>
              <RpgButton variant="primary" className="flex-1 text-center" onClick={() => setStep(5)}>NEXT</RpgButton>
            </div>
          </RpgPanel>
        )}

        {/* Step 5: Safety Buffer + Confirm */}
        {step === 5 && (
          <RpgPanel className="w-full" style={{ animation: "walk-in 0.3s ease-out" }}>
            <p style={{ fontSize: 7, color: "#ffd700", textAlign: "center", marginBottom: 10 }}>SAFETY BUFFER</p>
            <p style={{ fontSize: 5, color: "#8b7355", textAlign: "center", marginBottom: 8, lineHeight: 1.8 }}>The gap between the edge of the path and the cliff. How much do you want to always keep safe?</p>
            <input value={safetyBuffer} onChange={e => setSafetyBuffer(e.target.value)} placeholder="Default: $200" type="number" style={inputStyle} />
            <div className="mt-4 mb-2 pixel-border p-2" style={{ backgroundColor: "rgba(58,110,58,0.2)" }}>
              <p style={{ fontSize: 5, color: "#a0d8a0", textAlign: "center" }}>QUEST SUMMARY</p>
              <div className="mt-2 flex flex-col gap-1">
                <div className="flex justify-between"><span style={{ fontSize: 5, color: "#8b7355" }}>Name:</span><span style={{ fontSize: 5, color: "#ffd700" }}>{name || "Hero"}</span></div>
                <div className="flex justify-between"><span style={{ fontSize: 5, color: "#8b7355" }}>Class:</span><span style={{ fontSize: 5, color: "#ffd700" }}>{selectedClass.toUpperCase()}</span></div>
                <div className="flex justify-between"><span style={{ fontSize: 5, color: "#8b7355" }}>Income:</span><span style={{ fontSize: 5, color: "#ffd700" }}>${monthlyIncome || "?"}/{payCadence === "biweekly" ? "2wk" : "mo"}</span></div>
                <div className="flex justify-between"><span style={{ fontSize: 5, color: "#8b7355" }}>Goal:</span><span style={{ fontSize: 5, color: "#ffd700" }}>${goalAmount || "?"} by {goalDeadline}</span></div>
                <div className="flex justify-between"><span style={{ fontSize: 5, color: "#8b7355" }}>Commitments:</span><span style={{ fontSize: 5, color: "#ffd700" }}>{commitments.length} items</span></div>
                <div className="flex justify-between"><span style={{ fontSize: 5, color: "#8b7355" }}>Buffer:</span><span style={{ fontSize: 5, color: "#ffd700" }}>${safetyBuffer || "200"}</span></div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <RpgButton variant="danger" className="flex-1 text-center" onClick={() => setStep(4)}>BACK</RpgButton>
              <RpgButton variant="primary" className="flex-1 text-center" onClick={finish}>BEGIN JOURNEY</RpgButton>
            </div>
          </RpgPanel>
        )}
      </div>

      <RpgButton variant="danger" className="mx-4 mb-4 w-auto text-center" onClick={() => navigate("title")}>CANCEL</RpgButton>
    </div>
  );
}
