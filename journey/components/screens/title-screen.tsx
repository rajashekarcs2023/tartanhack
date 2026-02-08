"use client";
import { useState, useRef, useEffect } from "react";
import { useJourneyStore } from "@/store/journey-store";
import { RpgPanel, RpgButton } from "@/components/terrain/rpg-panel";
import { GameMenu } from "@/components/terrain/game-menu";
import type { AppState } from "@/types/journey";
import { summarizeBankData, MOCK_BANK_ACCOUNT } from "@/data/mock-bank";

function getSpeechRecognition(): (new () => SpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as Record<string, unknown>).SpeechRecognition as (new () => SpeechRecognition) | null
    ?? (window as unknown as Record<string, unknown>).webkitSpeechRecognition as (new () => SpeechRecognition) | null
    ?? null;
}

interface AIPlan {
  goalLabel: string;
  goalAmount: number;
  deadline: string;
  monthlyIncome: number;
  safetyBuffer: number;
  commitments: { label: string; amount: number }[];
  savingsPlan: string;
  dailySavingsTarget: number;
  tips: string[];
  motivation: string;
}

export function TitleScreen() {
  const navigate = useJourneyStore((s) => s.navigate);
  const state = useJourneyStore((s) => s.state);
  const setState = useJourneyStore((s) => s.setState);
  const [menuOpen, setMenuOpen] = useState(false);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [aiPlan, setAiPlan] = useState<AIPlan | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [state.chatHistory.length]);

  /* Detect if a message is a goal/plan request */
  const isGoalMessage = (text: string): boolean => {
    const lower = text.toLowerCase();
    return lower.includes("save") || lower.includes("goal") || lower.includes("want to")
      || lower.includes("i need") || lower.includes("plan") || lower.includes("budget")
      || lower.includes("buy") || lower.includes("afford") || lower.includes("earn")
      || lower.includes("pay off") || lower.includes("debt") || lower.includes("emergency")
      || lower.includes("vacation") || lower.includes("car") || lower.includes("house")
      || lower.includes("fund") || lower.includes("month") || !!lower.match(/\$[\d,]+/);
  };

  /* Agentic: parse goal via AI and create plan */
  const createPlanFromMessage = async (text: string) => {
    setPlanning(true);
    const userMsg = { id: `u${Date.now()}`, role: "user" as const, text: text.trim(), ts: new Date().toISOString() };
    setState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, userMsg] }));
    setInput("");

    const thinkMsg = { id: `g-think${Date.now()}`, role: "guide" as const, text: "Consulting the stars to forge your quest... One moment, brave traveler!", ts: new Date().toISOString() };
    setState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, thinkMsg] }));

    try {
      const res = await fetch("/api/plan-goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          bankData: summarizeBankData(state.bankAccount),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.plan) {
          setAiPlan(data.plan);
          const planMsg = {
            id: `g-plan${Date.now()}`, role: "guide" as const,
            text: `Quest forged! ${data.plan.motivation} Goal: ${data.plan.goalLabel} — $${data.plan.goalAmount} by ${data.plan.deadline}. Save ~$${data.plan.dailySavingsTarget}/day. Accept this quest?`,
            ts: new Date().toISOString(),
          };
          setState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, planMsg] }));
          setPlanning(false);
          return;
        }
      }
      throw new Error("Plan failed");
    } catch {
      const fallbackMsg = { id: `g-err${Date.now()}`, role: "guide" as const, text: "The crystal ball is hazy... Try telling me your goal more clearly, like 'I want to save $5000 for an emergency fund in 6 months'", ts: new Date().toISOString() };
      setState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, fallbackMsg] }));
    }
    setPlanning(false);
  };

  /* Accept the AI plan and begin journey */
  const acceptPlan = () => {
    if (!aiPlan) return;
    const totalCommit = aiPlan.commitments.reduce((s, c) => s + c.amount, 0);
    const sts = aiPlan.monthlyIncome - totalCommit - aiPlan.safetyBuffer;

    setState(prev => ({
      ...prev,
      profile: { id: "u1", name: "Traveler", avatarClass: "warrior", createdAt: new Date().toISOString() },
      goal: { id: "g1", label: aiPlan.goalLabel, targetAmount: aiPlan.goalAmount, currentAmount: 0, deadline: aiPlan.deadline },
      commitments: aiPlan.commitments.map((c, i) => ({
        id: `c${i}`, label: c.label, category: "fixed", amountPerMonth: c.amount, isActive: true, createdAt: new Date().toISOString(),
      })),
      incomeLog: [{ id: "i1", amount: aiPlan.monthlyIncome, source: "Monthly Income", date: new Date().toISOString() }],
      journey: {
        ...prev.journey,
        currentTile: 0, previousTile: 0,
        lastVisitTimestamp: new Date().toISOString(),
        savingsToTarget: 0, dayStreak: 0,
        xp: 0, level: 1, goldCoins: 0,
        demons: prev.journey.demons.map(d => ({ ...d, defeated: false, hp: d.maxHp })),
        pendingBattle: null, battleLog: [],
      },
      chatHistory: [
        ...prev.chatHistory,
        { id: `g-accept${Date.now()}`, role: "guide" as const, text: `Quest accepted! Your ${aiPlan.goalLabel} journey begins! You have $${Math.max(0, sts).toFixed(0)} safe to spend. ${aiPlan.tips[0] ?? "Save wisely!"} Onward, hero!`, ts: new Date().toISOString() },
      ],
      bankAccount: prev.bankAccount,
    }));
    setAiPlan(null);
    navigate("world");
  };

  /* Regular chat (non-goal messages) */
  const sendMessage = async (text: string) => {
    if (!text.trim() || planning) return;

    // If it looks like a goal, use the agentic planner
    if (isGoalMessage(text)) {
      await createPlanFromMessage(text);
      return;
    }

    const userMsg = { id: `u${Date.now()}`, role: "user" as const, text: text.trim(), ts: new Date().toISOString() };
    setState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, userMsg] }));
    setInput("");

    let replyText: string;
    try {
      const res = await fetch("/api/guide-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          currentTile: state.journey.currentTile,
          totalTiles: state.journey.totalTiles,
          dayStreak: state.journey.dayStreak,
          savedAmount: state.goal?.currentAmount ?? 0,
          goalAmount: state.goal?.targetAmount ?? 5000,
          goalLabel: state.goal?.label ?? "Savings Goal",
          commitments: state.commitments.map(c => c.label).join(", ") || "None",
          level: state.journey.level,
          goldCoins: state.journey.goldCoins,
          bankData: summarizeBankData(state.bankAccount),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        replyText = data.reply;
      } else {
        throw new Error("API error");
      }
    } catch {
      replyText = getGuideReply(text.trim(), state);
    }

    const guideMsg = { id: `g${Date.now()}`, role: "guide" as const, text: replyText, ts: new Date().toISOString() };
    setState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, guideMsg] }));
  };

  const startMic = () => {
    const SR = getSpeechRecognition();
    if (!SR) return;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      sendMessage(transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  };

  const QUICK_PROMPTS = ["Save for emergency fund", "How am I doing?", "Plan a vacation fund", "Explain my route"];

  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: "#1a1a0e" }}>
      {/* Pixel landscape header */}
      <div className="relative" style={{ height: 120, background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 40%, #0f3460 65%, #2d5a1e 80%, #2d5a1e 100%)", overflow: "hidden" }}>
        {[{t:12,l:30},{t:8,l:100},{t:20,l:200},{t:15,l:300},{t:25,l:370},{t:5,l:160},{t:30,l:260}].map((s,i) => (
          <div key={i} style={{ position:"absolute", top:s.t, left:s.l, width:2, height:2, backgroundColor:"#fff", opacity:0.5+i*0.07, animation:`twinkle ${2+i*0.4}s ease-in-out infinite` }} />
        ))}
        <svg viewBox="0 0 430 50" style={{ position:"absolute", bottom:45, width:"100%" }} preserveAspectRatio="none">
          <polygon points="0,50 60,10 120,50" fill="#2a4a2a" opacity="0.8"/>
          <polygon points="90,50 160,5 230,50" fill="#1e3a1e" opacity="0.7"/>
          <polygon points="200,50 270,12 340,50" fill="#2a4a2a" opacity="0.8"/>
          <polygon points="310,50 380,8 430,50" fill="#1e3a1e" opacity="0.7"/>
        </svg>
        {[30,80,150,220,290,360,400].map((x,i) => (
          <div key={i} style={{ position:"absolute", bottom:30, left:x }}>
            <div style={{ width:10, height:14, backgroundColor:i%2===0?"#1e6e1e":"#2d7a2d", borderRadius:"50% 50% 0 0", margin:"0 auto" }} />
            <div style={{ width:3, height:6, backgroundColor:"#5a3a1e", margin:"0 auto" }} />
          </div>
        ))}
        <div style={{ position:"absolute", bottom:0, width:"100%", height:30, backgroundColor:"#2d5a1e" }} />
        <div style={{ position:"absolute", bottom:28, left:"50%", transform:"translateX(-50%)", animation:"hero-bob 0.6s ease-in-out infinite" }}>
          <div style={{ width:8, height:8, borderRadius:"50%", backgroundColor:"#ffd700", margin:"0 auto", border:"1px solid #b8860b" }} />
          <div style={{ width:10, height:10, backgroundColor:"#4169E1", margin:"0 auto", borderRadius:2 }} />
        </div>
        <div style={{ position:"absolute", top:14, width:"100%", textAlign:"center" }}>
          <h1 style={{ fontSize:18, color:"#ffd700", fontFamily:"'Press Start 2P',monospace", letterSpacing:4, textShadow:"2px 2px 0 #8b6508, 3px 3px 0 rgba(0,0,0,0.5)" }}>JOURNEY</h1>
          <p style={{ fontSize:4.5, color:"#a0d8a0", fontFamily:"'Press Start 2P',monospace", marginTop:4, letterSpacing:1 }}>Tell me your goal — I{"'"}ll forge your quest</p>
        </div>
      </div>

      {/* Menu bar */}
      <div className="flex items-center justify-between" style={{ backgroundColor:"rgba(42,26,14,0.96)", padding:"4px 8px", borderBottom:"2px solid #8b5e3c" }}>
        <div className="flex gap-2">
          <RpgButton variant="secondary" onClick={() => navigate("world")} style={{ fontSize:5, padding:"3px 6px" }}>MY ROUTE</RpgButton>
          <RpgButton variant="secondary" onClick={() => navigate("decision")} style={{ fontSize:5, padding:"3px 6px" }}>LOG</RpgButton>
          <RpgButton variant="secondary" onClick={() => navigate("bank")} style={{ fontSize:5, padding:"3px 6px" }}>BANK</RpgButton>
        </div>
        <RpgButton variant="primary" onClick={() => setMenuOpen(true)} style={{ fontSize:5, padding:"3px 8px" }}>MENU</RpgButton>
      </div>

      {/* Chat window */}
      <div className="flex flex-1 flex-col" style={{ minHeight:0 }}>
        <div className="flex-1 overflow-y-auto px-3 py-2" style={{ backgroundColor:"rgba(26,26,14,0.6)" }}>
          {state.chatHistory.map(msg => (
            <div key={msg.id} className={`mb-2 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "guide" && (
                <div style={{ width:20, height:20, borderRadius:4, background:"linear-gradient(135deg,#ffd700,#ffaa00)", border:"1px solid #8b6508", flexShrink:0, marginRight:4, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontSize:8 }}>{"*"}</span>
                </div>
              )}
              <RpgPanel style={{ maxWidth:"80%", padding:6 }}>
                <p style={{ fontSize:5.5, color: msg.role === "guide" ? "#fff8e7" : "#a0d8a0", fontFamily:"'Press Start 2P',monospace", lineHeight:1.8 }}>{msg.text}</p>
              </RpgPanel>
            </div>
          ))}
          {planning && (
            <div className="mb-2 flex justify-start">
              <div style={{ width:20, height:20, borderRadius:4, background:"linear-gradient(135deg,#ffd700,#ffaa00)", border:"1px solid #8b6508", flexShrink:0, marginRight:4, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:8 }}>{"*"}</span>
              </div>
              <RpgPanel style={{ padding:6 }}>
                <p style={{ fontSize:5.5, color:"#ffd700", fontFamily:"'Press Start 2P',monospace", animation:"hero-bob 0.6s ease-in-out infinite" }}>Forging your quest plan...</p>
              </RpgPanel>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* AI Plan accept/reject bar */}
        {aiPlan && !planning && (
          <div style={{ backgroundColor:"rgba(45,90,45,0.95)", borderTop:"2px solid #4a8a4a", padding:"8px 12px" }}>
            <div style={{ marginBottom:6 }}>
              <p style={{ fontSize:6, color:"#ffd700", fontFamily:"'Press Start 2P',monospace", marginBottom:4 }}>QUEST: {aiPlan.goalLabel}</p>
              <div className="flex gap-3" style={{ marginBottom:4 }}>
                <span style={{ fontSize:5, color:"#a0d8a0", fontFamily:"'Press Start 2P',monospace" }}>Target: ${aiPlan.goalAmount.toLocaleString()}</span>
                <span style={{ fontSize:5, color:"#4fc3f7", fontFamily:"'Press Start 2P',monospace" }}>By: {aiPlan.deadline}</span>
              </div>
              <p style={{ fontSize:4.5, color:"#fff8e7", fontFamily:"'Press Start 2P',monospace", lineHeight:1.8 }}>{aiPlan.savingsPlan}</p>
              {aiPlan.tips.map((tip, i) => (
                <p key={i} style={{ fontSize:4, color:"#a0d8a0", fontFamily:"'Press Start 2P',monospace", lineHeight:1.6, marginTop:2 }}>{">"} {tip}</p>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={acceptPlan}
                style={{ flex:1, padding:"7px 0", fontSize:6, fontFamily:"'Press Start 2P',monospace", color:"#fff8e7", backgroundColor:"#2d7a2d", border:"2px solid #4CAF50", cursor:"pointer", textAlign:"center" }}>
                ACCEPT QUEST
              </button>
              <button type="button" onClick={() => setAiPlan(null)}
                style={{ flex:1, padding:"7px 0", fontSize:6, fontFamily:"'Press Start 2P',monospace", color:"#fff8e7", backgroundColor:"#5a3a1e", border:"2px solid #8b5e3c", cursor:"pointer", textAlign:"center" }}>
                MODIFY
              </button>
            </div>
          </div>
        )}

        {/* Quick prompts */}
        <div className="flex gap-1 overflow-x-auto px-3 py-1" style={{ backgroundColor:"rgba(42,26,14,0.5)" }}>
          {QUICK_PROMPTS.map(p => (
            <button type="button" key={p} onClick={() => sendMessage(p)}
              style={{ flexShrink:0, fontSize:4.5, fontFamily:"'Press Start 2P',monospace", color:"#ffd700", backgroundColor:"rgba(139,94,60,0.4)", border:"1px solid #8b5e3c", padding:"3px 6px", cursor:"pointer", whiteSpace:"nowrap" }}>
              {p}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor:"rgba(42,26,14,0.96)", borderTop:"2px solid #8b5e3c" }}>
          <button type="button" onClick={startMic}
            style={{ width:30, height:30, borderRadius:"50%", backgroundColor: listening ? "#c04040" : "#2a4a2a", border:`2px solid ${listening ? "#ff6060" : "#5a8a5a"}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, animation: listening ? "pulse 1s ease-in-out infinite" : "none" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={listening ? "#fff" : "#a0d8a0"} strokeWidth="2.5">
              <rect x="9" y="2" width="6" height="12" rx="3" />
              <path d="M5 10a7 7 0 0 0 14 0" />
              <line x1="12" y1="17" x2="12" y2="22" />
            </svg>
          </button>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") sendMessage(input); }}
            placeholder={listening ? "Listening..." : "Say your goal or ask anything..."}
            style={{ flex:1, backgroundColor:"rgba(26,26,14,0.8)", border:"2px solid #8b5e3c", color:"#fff8e7", fontFamily:"'Press Start 2P',monospace", fontSize:5.5, padding:"6px 8px", outline:"none" }}
          />
          <RpgButton variant="primary" onClick={() => sendMessage(input)} style={{ fontSize:6, padding:"4px 8px" }}>{planning ? "..." : "SEND"}</RpgButton>
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="flex gap-2 px-3 py-2" style={{ backgroundColor:"rgba(42,26,14,0.96)", borderTop:"2px solid #8b5e3c" }}>
        <RpgButton variant="primary" className="flex-1 text-center" onClick={() => navigate("setup")} style={{ fontSize:6, padding:"7px 0" }}>MANUAL SETUP</RpgButton>
        <RpgButton variant="secondary" className="flex-1 text-center" onClick={() => navigate("world")} style={{ fontSize:6, padding:"7px 0" }}>VIEW MAP</RpgButton>
      </div>

      <GameMenu open={menuOpen} onClose={() => setMenuOpen(false)} currentScreen="title" />
    </div>
  );
}

function getGuideReply(text: string, state: AppState): string {
  const lower = text.toLowerCase();
  const saved = state.goal?.currentAmount ?? 0;
  const target = state.goal?.targetAmount ?? 5000;
  const pct = Math.round((saved / target) * 100);
  const tile = state.journey.currentTile;
  const total = state.journey.totalTiles;

  if (lower.includes("how") && lower.includes("doing")) {
    return `You've saved $${saved} of $${target} (${pct}%). You're on tile ${tile} of ${total}. Keep going, traveler!`;
  }
  if (lower.includes("focus")) {
    const active = state.commitments.filter(c => c.isActive);
    return active.length > 0
      ? `Focus on your commitments: ${active.map(c => c.label).join(", ")}. They save you $${active.reduce((s, c) => s + c.amountPerMonth, 0)}/mo!`
      : "Start by adding some commitments to strengthen your journey!";
  }
  if (lower.includes("route") || lower.includes("explain")) {
    return `Your route has ${total} tiles. You're at tile ${tile}. Each day you stay on track, you move forward. Spending wisely keeps you on the golden path!`;
  }
  return `That's a great question! You're ${pct}% toward ${state.goal?.label ?? "your goal"}. Tile ${tile}/${total}. Stay on the path!`;
}
