"use client";
import { useState, useRef, useEffect } from "react";
import { useJourney } from "@/store/journey-store";
import { RpgPanel, RpgButton } from "@/components/rpg/rpg-panel";
import { GameMenu } from "@/components/rpg/game-menu";

export function GuideScreen() {
  const { navigate, state, setState } = useJourney();
  const [menuOpen, setMenuOpen] = useState(false);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const msgs = state.chatHistory;

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  const send = (text: string) => {
    if (!text.trim()) return;
    const replies = [
      "A wise traveler considers all paths before spending.",
      "Your savings shield grows stronger each day!",
      "The mountain of debt can be conquered one step at a time.",
      "Remember: needs fuel the journey, wants slow it down.",
    ];
    setState(prev => ({
      ...prev,
      chatHistory: [
        ...prev.chatHistory,
        { id: `u${Date.now()}`, role: "user" as const, text: text.trim(), ts: new Date().toISOString() },
        { id: `g${Date.now()}`, role: "guide" as const, text: replies[Math.floor(Math.random() * replies.length)], ts: new Date().toISOString() },
      ],
    }));
    setInput("");
  };

  return (
    <div className="relative flex h-full flex-col" style={{ backgroundColor: "#1a1a0e" }}>
      <div className="flex items-center justify-between" style={{ backgroundColor: "rgba(42,26,14,0.95)", padding: "6px 10px", borderBottom: "2px solid #8b5e3c" }}>
        <RpgButton variant="secondary" onClick={() => navigate("title")} style={{ fontSize: 6 }}>HOME</RpgButton>
        <p style={{ fontSize: 7, color: "#ffd700" }}>GUIDE FAIRY</p>
        <RpgButton variant="secondary" onClick={() => setMenuOpen(true)} style={{ fontSize: 6 }}>MENU</RpgButton>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {msgs.map(m => (
          <div key={m.id} className={`mb-2 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div style={{ backgroundColor: m.role === "guide" ? "rgba(58,110,58,0.7)" : "rgba(100,80,50,0.7)", border: `1px solid ${m.role === "guide" ? "#4a8e4a" : "#8b6508"}`, padding: "6px 8px", maxWidth: "80%", fontSize: 7, lineHeight: 1.6, color: "#fff8e7" }}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="flex gap-1 p-2" style={{ borderTop: "2px solid #5a3a1e" }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send(input)} placeholder="Ask the Guide..."
          style={{ flex: 1, backgroundColor: "rgba(42,26,14,0.8)", border: "2px solid #5a3a1e", padding: "6px 8px", fontSize: 7, color: "#fff8e7", fontFamily: "'Press Start 2P',monospace", outline: "none" }} />
        <RpgButton variant="primary" onClick={() => send(input)} style={{ fontSize: 6 }}>SEND</RpgButton>
      </div>
      <GameMenu open={menuOpen} onClose={() => setMenuOpen(false)} currentScreen="guide" />
    </div>
  );
}
