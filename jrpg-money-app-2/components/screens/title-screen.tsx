"use client";
import { useState, useRef, useEffect } from "react";
import { useJourney } from "@/store/journey-store";
import { RpgPanel, RpgButton } from "@/components/rpg/rpg-panel";
import { GameMenu } from "@/components/rpg/game-menu";

/* eslint-disable @typescript-eslint/no-explicit-any */
const getSpeechRecognition = () => {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null;
};

export function TitleScreen() {
  const { navigate, state, setState } = useJourney();
  const [menuOpen, setMenuOpen] = useState(false);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const msgs = state.chatHistory;

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg = { id: `u${Date.now()}`, role: "user" as const, text: text.trim(), ts: new Date().toISOString() };
    const replies = [
      "Interesting! Every coin you save brings you closer to your goal.",
      "That's a wise question, traveler. Let me think about your route...",
      "Remember: small steps on the path lead to great treasures!",
      "Your commitment is your shield against impulse spending!",
      "The mountain pass grows closer with each day of discipline.",
    ];
    const guideMsg = { id: `g${Date.now()}`, role: "guide" as const, text: replies[Math.floor(Math.random() * replies.length)], ts: new Date().toISOString() };
    setState(prev => ({ ...prev, chatHistory: [...prev.chatHistory, userMsg, guideMsg] }));
    setInput("");
  };

  const toggleMic = () => {
    const SR = getSpeechRecognition();
    if (!SR) return;
    if (listening) { setListening(false); return; }
    setListening(true);
    const rec = new SR();
    rec.lang = "en-US"; rec.continuous = false;
    rec.onresult = (e: any) => { const t = e.results[0][0].transcript; setInput(t); setListening(false); };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  };

  return (
    <div className="flex h-full flex-col" style={{ background: "linear-gradient(180deg, #87CEEB 0%, #5BA3D9 30%, #4a8e4a 30%, #3d7a3d 100%)" }}>
      {/* Sky + Landscape header */}
      <div className="relative" style={{ height: 120 }}>
        {/* Clouds */}
        <svg style={{ position: "absolute", top: 8, left: 10, animation: "float-cloud 12s linear infinite", opacity: 0.9 }}>
          <ellipse cx="20" cy="10" rx="20" ry="8" fill="white" /><ellipse cx="35" cy="8" rx="14" ry="6" fill="white" />
        </svg>
        <svg style={{ position: "absolute", top: 18, right: 20, animation: "float-cloud 18s linear infinite", opacity: 0.7 }}>
          <ellipse cx="18" cy="9" rx="18" ry="7" fill="white" /><ellipse cx="30" cy="7" rx="12" ry="5" fill="white" />
        </svg>
        {/* Mountains */}
        <svg viewBox="0 0 320 50" style={{ position: "absolute", bottom: 0, width: "100%" }} preserveAspectRatio="none">
          <polygon points="0,50 40,15 80,50" fill="#7E57C2" opacity="0.6" />
          <polygon points="60,50 110,8 160,50" fill="#9575CD" opacity="0.5" />
          <polygon points="140,50 190,12 240,50" fill="#7E57C2" opacity="0.6" />
          <polygon points="220,50 270,18 320,50" fill="#9575CD" opacity="0.5" />
          <polygon points="100,50 130,25 170,50" fill="#6A1B9A" opacity="0.3" />
        </svg>
        {/* Trees */}
        {[15, 55, 105, 170, 230, 275].map((x, i) => (
          <div key={i} style={{ position: "absolute", bottom: 0, left: x, animation: `sway ${2 + i * 0.3}s ease-in-out infinite` }}>
            <div style={{ width: 10, height: 14, backgroundColor: i % 2 === 0 ? "#2d7a2d" : "#1e6e1e", borderRadius: "50% 50% 0 0", margin: "0 auto" }} />
            <div style={{ width: 3, height: 6, backgroundColor: "#5a3a1e", margin: "0 auto" }} />
          </div>
        ))}
        {/* Title */}
        <div style={{ position: "absolute", top: 35, width: "100%", textAlign: "center" }}>
          <h1 className="text-shadow-gold" style={{ fontSize: 16, color: "#ffd700", letterSpacing: 4 }}>JOURNEY</h1>
          <p style={{ fontSize: 5, color: "#fff8e7", marginTop: 4, letterSpacing: 2 }}>YOUR FINANCIAL ADVENTURE</p>
        </div>
        {/* Hero sprite */}
        <div style={{ position: "absolute", bottom: 6, left: "48%", animation: "hero-bob 0.6s ease-in-out infinite" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#ffd700", margin: "0 auto" }} />
          <div style={{ width: 10, height: 10, backgroundColor: "#4169E1", margin: "0 auto", borderRadius: 2 }} />
          <div style={{ width: 10, height: 4, display: "flex", gap: 2, margin: "0 auto" }}>
            <div style={{ width: 4, height: 4, backgroundColor: "#2a1a0e" }} /><div style={{ width: 4, height: 4, backgroundColor: "#2a1a0e" }} />
          </div>
        </div>
      </div>

      {/* Menu bar */}
      <div className="flex items-center justify-between" style={{ backgroundColor: "rgba(42,26,14,0.95)", padding: "6px 10px", borderTop: "2px solid #8b5e3c", borderBottom: "2px solid #8b5e3c" }}>
        <div className="flex gap-2">
          <RpgButton variant="primary" onClick={() => navigate("world")} style={{ fontSize: 6, padding: "4px 8px" }}>MY ROUTE</RpgButton>
          <RpgButton variant="secondary" onClick={() => navigate("decision")} style={{ fontSize: 6, padding: "4px 8px" }}>LOG</RpgButton>
        </div>
        <RpgButton variant="secondary" onClick={() => setMenuOpen(true)} style={{ fontSize: 6, padding: "4px 8px" }}>MENU</RpgButton>
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col" style={{ backgroundColor: "rgba(26,18,10,0.92)", minHeight: 0 }}>
        <div className="flex-1 overflow-y-auto p-2" style={{ minHeight: 0 }}>
          {msgs.map(m => (
            <div key={m.id} className={`mb-2 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "guide" && (
                <div style={{ width: 20, height: 20, backgroundColor: "#ffd700", borderRadius: "50%", marginRight: 4, flexShrink: 0, border: "2px solid #8b6508", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 8 }}>*</span>
                </div>
              )}
              <div style={{
                backgroundColor: m.role === "guide" ? "rgba(58,110,58,0.7)" : "rgba(100,80,50,0.7)",
                border: `1px solid ${m.role === "guide" ? "#4a8e4a" : "#8b6508"}`,
                padding: "6px 8px", maxWidth: "80%", fontSize: 7, lineHeight: 1.6, color: "#fff8e7",
              }}>
                {m.text}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Quick prompts */}
        <div className="flex gap-1 overflow-x-auto px-2 pb-1">
          {["How am I doing?", "Next milestone?", "Tips to save"].map(q => (
            <button key={q} type="button" onClick={() => sendMessage(q)}
              style={{ backgroundColor: "rgba(58,110,58,0.5)", border: "1px solid #4a8e4a", padding: "3px 6px", fontSize: 5, color: "#a0d8a0", whiteSpace: "nowrap", cursor: "pointer", fontFamily: "'Press Start 2P',monospace" }}>
              {q}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <div className="flex gap-1 p-2" style={{ borderTop: "2px solid #5a3a1e" }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage(input)}
            placeholder="Ask the Guide..."
            style={{ flex: 1, backgroundColor: "rgba(42,26,14,0.8)", border: "2px solid #5a3a1e", padding: "6px 8px", fontSize: 7, color: "#fff8e7", fontFamily: "'Press Start 2P',monospace", outline: "none" }}
          />
          <button type="button" onClick={toggleMic}
            style={{ width: 32, height: 32, backgroundColor: listening ? "#8b3a3a" : "rgba(58,110,58,0.7)", border: `2px solid ${listening ? "#ff6666" : "#4a8e4a"}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={listening ? "#ff6666" : "#a0d8a0"} strokeWidth="2">
              <rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0" /><line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          </button>
          <RpgButton variant="primary" onClick={() => sendMessage(input)} style={{ fontSize: 6, padding: "4px 10px" }}>SEND</RpgButton>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="flex gap-2 p-2" style={{ backgroundColor: "rgba(42,26,14,0.95)", borderTop: "2px solid #8b5e3c" }}>
        <RpgButton variant="primary" className="flex-1 text-center" onClick={() => navigate("setup")}>NEW JOURNEY</RpgButton>
        <RpgButton variant="secondary" className="flex-1 text-center" onClick={() => navigate("world")}>VIEW MAP</RpgButton>
      </div>

      <GameMenu open={menuOpen} onClose={() => setMenuOpen(false)} currentScreen="title" />
    </div>
  );
}
