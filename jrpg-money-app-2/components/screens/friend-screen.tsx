"use client";
import { useState } from "react";
import { useJourney } from "@/store/journey-store";
import { RpgPanel, RpgButton } from "@/components/rpg/rpg-panel";
import { GameMenu } from "@/components/rpg/game-menu";

export function FriendScreen() {
  const { navigate, state, setState } = useJourney();
  const [menuOpen, setMenuOpen] = useState(false);
  const [code, setCode] = useState("");
  const [cheered, setCheered] = useState<string | null>(null);

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
    }));
    setTimeout(() => setCheered(null), 2000);
  };

  return (
    <div className="relative flex h-full flex-col" style={{ background: "linear-gradient(180deg, #2d5a1e 0%, #1a3a0e 100%)" }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ backgroundColor: "rgba(42,26,14,0.95)", padding: "6px 10px", borderBottom: "2px solid #8b5e3c" }}>
        <RpgButton variant="secondary" onClick={() => navigate("title")} style={{ fontSize: 6 }}>HOME</RpgButton>
        <p style={{ fontSize: 7, color: "#ffd700" }}>GUILD HALL</p>
        <RpgButton variant="secondary" onClick={() => setMenuOpen(true)} style={{ fontSize: 6 }}>MENU</RpgButton>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {/* Guild banner */}
        <div className="pixel-border mb-3 flex flex-col items-center p-3" style={{ backgroundColor: "rgba(42,26,14,0.85)", textAlign: "center" }}>
          <div style={{ width: 30, height: 34, position: "relative", marginBottom: 4 }}>
            <div style={{ width: 30, height: 24, backgroundColor: "#8b3a3a", border: "2px solid #6e2222", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 10, color: "#ffd700" }}>*</span>
            </div>
            <div style={{ width: 0, height: 0, borderLeft: "15px solid #8b3a3a", borderRight: "15px solid #8b3a3a", borderBottom: "10px solid transparent" }} />
          </div>
          <p style={{ fontSize: 6, color: "#ffd700" }}>COMPANIONS GUILD</p>
          <p style={{ fontSize: 5, color: "#8b7355", marginTop: 2 }}>{state.friends.length} member{state.friends.length !== 1 ? "s" : ""}</p>
        </div>

        {/* Add companion */}
        <RpgPanel className="mb-3">
          <p style={{ fontSize: 6, color: "#ffd700", marginBottom: 6 }}>RECRUIT COMPANION</p>
          <div className="flex gap-2">
            <input value={code} onChange={e => setCode(e.target.value)} placeholder="Friend name or code..."
              style={{ flex: 1, backgroundColor: "rgba(42,26,14,0.8)", border: "2px solid #5a3a1e", padding: "6px 8px", fontSize: 7, color: "#fff8e7", fontFamily: "'Press Start 2P',monospace", outline: "none" }} />
            <RpgButton variant="primary" onClick={addFriend} style={{ fontSize: 6 }}>ADD</RpgButton>
          </div>
        </RpgPanel>

        {/* Friends list */}
        {state.friends.length === 0 ? (
          <RpgPanel>
            <div className="flex flex-col items-center gap-2 py-4" style={{ textAlign: "center" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", backgroundColor: "#3a3a3a", border: "2px solid #555", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 10, color: "#666" }}>?</span>
              </div>
              <p style={{ fontSize: 6, color: "#8b7355" }}>No companions yet</p>
              <p style={{ fontSize: 5, color: "#666", lineHeight: 1.8 }}>Share your code to journey together! Companions can cheer you on and compare progress.</p>
            </div>
          </RpgPanel>
        ) : state.friends.map(f => (
          <RpgPanel key={f.id} className="mb-2">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "#4169E1", border: "2px solid #2a3a8a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 8, color: "#ffd700" }}>{f.name[0].toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <p style={{ fontSize: 7, color: "#ffd700" }}>{f.name}</p>
                <p style={{ fontSize: 4, color: "#8b7355" }}>Joined {new Date(f.joinedAt).toLocaleDateString()}</p>
                {f.lastCheerAt && <p style={{ fontSize: 4, color: "#a0d8a0" }}>Last cheer: {new Date(f.lastCheerAt).toLocaleDateString()}</p>}
              </div>
              <RpgButton variant={cheered === f.id ? "primary" : "secondary"} onClick={() => cheer(f.id)} style={{ fontSize: 5 }}>
                {cheered === f.id ? "SENT!" : "CHEER"}
              </RpgButton>
            </div>
          </RpgPanel>
        ))}

        {/* Your share code */}
        <RpgPanel className="mt-3">
          <p style={{ fontSize: 6, color: "#ffd700", marginBottom: 4 }}>YOUR GUILD CODE</p>
          <div className="flex items-center justify-between" style={{ backgroundColor: "rgba(58,110,58,0.3)", border: "1px solid #3a6e3a", padding: "6px 8px" }}>
            <span style={{ fontSize: 8, color: "#a0d8a0", letterSpacing: 2 }}>{state.profile?.name?.toUpperCase().slice(0, 4) ?? "HERO"}-{Math.floor(Math.random() * 9000 + 1000)}</span>
            <RpgButton variant="secondary" style={{ fontSize: 5, padding: "2px 6px" }}>COPY</RpgButton>
          </div>
        </RpgPanel>
      </div>

      <GameMenu open={menuOpen} onClose={() => setMenuOpen(false)} currentScreen="friend" />
    </div>
  );
}
