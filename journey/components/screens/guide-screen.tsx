"use client";
import { useState, useRef, useEffect } from "react";
import { useJourney } from "@/store/journey-store";
import { RpgPanel, RpgButton } from "@/components/terrain/rpg-panel";
import { GameMenu } from "@/components/terrain/game-menu";
import { summarizeBankData } from "@/data/mock-bank";

export function GuideScreen() {
  const { navigate, state, setState } = useJourney();
  const [menuOpen, setMenuOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const msgs = state.chatHistory;

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg = { id: `u${Date.now()}`, role: "user" as const, text: text.trim(), ts: new Date().toISOString() };
    setState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, userMsg] }));
    setInput("");
    setLoading(true);

    let reply: string;
    try {
      const bankSummary = summarizeBankData(state.bankAccount);
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
          bankData: bankSummary,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        reply = data.reply;
      } else {
        throw new Error("API error");
      }
    } catch {
      reply = "The crystal ball is cloudy... Try again, brave traveler!";
    }

    const guideMsg = { id: `g${Date.now()}`, role: "guide" as const, text: reply, ts: new Date().toISOString() };
    setState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, guideMsg] }));
    setLoading(false);
  };

  const QUICK = ["How am I doing?", "Analyze my spending", "What should I cut?", "ETA to my goal?", "Tips to save more"];

  return (
    <div className="relative flex h-full flex-col" style={{ backgroundColor: "#1a1a0e" }}>
      <div className="flex items-center justify-between" style={{ backgroundColor: "rgba(42,26,14,0.95)", padding: "6px 10px", borderBottom: "2px solid #8b5e3c" }}>
        <RpgButton variant="secondary" onClick={() => navigate("title")} style={{ fontSize: 6 }}>HOME</RpgButton>
        <p style={{ fontSize: 7, color: "#ffd700", fontFamily: "'Press Start 2P',monospace" }}>GUIDE FAIRY</p>
        <RpgButton variant="secondary" onClick={() => setMenuOpen(true)} style={{ fontSize: 6 }}>MENU</RpgButton>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {msgs.map(m => (
          <div key={m.id} className={`mb-2 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "guide" && (
              <div style={{ width: 20, height: 20, borderRadius: 4, background: "linear-gradient(135deg,#ffd700,#ffaa00)", border: "1px solid #8b6508", flexShrink: 0, marginRight: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 8 }}>*</span>
              </div>
            )}
            <div style={{ backgroundColor: m.role === "guide" ? "rgba(58,110,58,0.7)" : "rgba(100,80,50,0.7)", border: `1px solid ${m.role === "guide" ? "#4a8e4a" : "#8b6508"}`, padding: "6px 8px", maxWidth: "80%", fontSize: 6, lineHeight: 1.8, color: "#fff8e7", fontFamily: "'Press Start 2P',monospace" }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="mb-2 flex justify-start">
            <div style={{ width: 20, height: 20, borderRadius: 4, background: "linear-gradient(135deg,#ffd700,#ffaa00)", border: "1px solid #8b6508", flexShrink: 0, marginRight: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 8 }}>*</span>
            </div>
            <div style={{ backgroundColor: "rgba(58,110,58,0.7)", border: "1px solid #4a8e4a", padding: "6px 8px", fontSize: 6, color: "#ffd700", fontFamily: "'Press Start 2P',monospace", animation: "hero-bob 0.6s ease-in-out infinite" }}>
              Consulting the stars...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      {/* Quick prompts */}
      <div className="flex gap-1 overflow-x-auto px-2 py-1" style={{ backgroundColor: "rgba(42,26,14,0.5)", borderTop: "1px solid #3a2a1e" }}>
        {QUICK.map(p => (
          <button type="button" key={p} onClick={() => send(p)}
            style={{ flexShrink: 0, fontSize: 4.5, fontFamily: "'Press Start 2P',monospace", color: "#ffd700", backgroundColor: "rgba(139,94,60,0.4)", border: "1px solid #8b5e3c", padding: "3px 5px", cursor: "pointer", whiteSpace: "nowrap" }}>
            {p}
          </button>
        ))}
      </div>
      <div className="flex gap-1 p-2" style={{ borderTop: "2px solid #5a3a1e" }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send(input)} placeholder="Ask anything..."
          style={{ flex: 1, backgroundColor: "rgba(42,26,14,0.8)", border: "2px solid #5a3a1e", padding: "6px 8px", fontSize: 6, color: "#fff8e7", fontFamily: "'Press Start 2P',monospace", outline: "none" }} />
        <RpgButton variant="primary" onClick={() => send(input)} style={{ fontSize: 6 }}>{loading ? "..." : "SEND"}</RpgButton>
      </div>
      <GameMenu open={menuOpen} onClose={() => setMenuOpen(false)} currentScreen="guide" />
    </div>
  );
}
