"use client";
import { useState } from "react";
import { useJourney } from "@/store/journey-store";
import { RpgPanel, RpgButton } from "@/components/rpg/rpg-panel";
import { GameMenu } from "@/components/rpg/game-menu";

export function LoreScreen() {
  const { navigate, state } = useJourney();
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const sel = state.lore.find(l => l.id === selected);

  return (
    <div className="relative flex h-full flex-col" style={{ background: "linear-gradient(180deg, #2d5a1e 0%, #1a3a0e 100%)" }}>
      <div className="flex items-center justify-between" style={{ backgroundColor: "rgba(42,26,14,0.95)", padding: "6px 10px", borderBottom: "2px solid #8b5e3c" }}>
        <RpgButton variant="secondary" onClick={() => selected ? setSelected(null) : navigate("title")} style={{ fontSize: 6 }}>{selected ? "BACK" : "HOME"}</RpgButton>
        <p style={{ fontSize: 7, color: "#ffd700" }}>LORE BOOK</p>
        <RpgButton variant="secondary" onClick={() => setMenuOpen(true)} style={{ fontSize: 6 }}>MENU</RpgButton>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {sel ? (
          <RpgPanel>
            <p style={{ fontSize: 8, color: "#ffd700", marginBottom: 8, textAlign: "center" }}>{sel.title}</p>
            <p style={{ fontSize: 6, color: "#fff8e7", lineHeight: 2 }}>{sel.body}</p>
          </RpgPanel>
        ) : state.lore.map(l => (
          <RpgPanel key={l.id} className="mb-2">
            {l.unlockedAt ? (
              <button type="button" onClick={() => setSelected(l.id)} className="w-full text-left" style={{ cursor: "pointer", background: "none", border: "none", fontFamily: "'Press Start 2P',monospace" }}>
                <div className="flex items-center gap-2">
                  <div style={{ width: 12, height: 14, backgroundColor: "#c8a24e", border: "1px solid #8b6508", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 6 }}>*</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 7, color: "#ffd700" }}>{l.title}</p>
                    <p style={{ fontSize: 5, color: "#8b7355" }}>Unlocked</p>
                  </div>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-2" style={{ opacity: 0.5 }}>
                <div style={{ width: 12, height: 14, backgroundColor: "#3a3a3a", border: "1px solid #555", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 6, color: "#888" }}>?</span>
                </div>
                <p style={{ fontSize: 7, color: "#666" }}>LOCKED</p>
              </div>
            )}
          </RpgPanel>
        ))}
      </div>
      <GameMenu open={menuOpen} onClose={() => setMenuOpen(false)} currentScreen="lore" />
    </div>
  );
}
