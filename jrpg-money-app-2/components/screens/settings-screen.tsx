"use client";
import { useState } from "react";
import { useJourney } from "@/store/journey-store";
import { RpgPanel, RpgButton } from "@/components/rpg/rpg-panel";
import { GameMenu } from "@/components/rpg/game-menu";

export function SettingsScreen() {
  const { navigate, state, demoMode } = useJourney();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative flex h-full flex-col" style={{ background: "linear-gradient(180deg, #2d5a1e 0%, #1a3a0e 100%)" }}>
      <div className="flex items-center justify-between" style={{ backgroundColor: "rgba(42,26,14,0.95)", padding: "6px 10px", borderBottom: "2px solid #8b5e3c" }}>
        <RpgButton variant="secondary" onClick={() => navigate("title")} style={{ fontSize: 6 }}>HOME</RpgButton>
        <p style={{ fontSize: 7, color: "#ffd700" }}>SETTINGS</p>
        <RpgButton variant="secondary" onClick={() => setMenuOpen(true)} style={{ fontSize: 6 }}>MENU</RpgButton>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <RpgPanel className="mb-3">
          <p style={{ fontSize: 6, color: "#ffd700", marginBottom: 6 }}>PROFILE</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between" style={{ padding: "4px 6px", backgroundColor: "rgba(58,110,58,0.3)", border: "1px solid #3a6e3a" }}>
              <span style={{ fontSize: 6, color: "#a0d8a0" }}>NAME</span>
              <span style={{ fontSize: 7, color: "#ffd700" }}>{state.profile?.name ?? "Unknown"}</span>
            </div>
            <div className="flex items-center justify-between" style={{ padding: "4px 6px", backgroundColor: "rgba(58,110,58,0.3)", border: "1px solid #3a6e3a" }}>
              <span style={{ fontSize: 6, color: "#a0d8a0" }}>MODE</span>
              <span style={{ fontSize: 7, color: "#ffd700" }}>{demoMode ? "DEMO" : "LIVE"}</span>
            </div>
          </div>
        </RpgPanel>
        <RpgPanel>
          <p style={{ fontSize: 6, color: "#ffd700", marginBottom: 6 }}>ABOUT</p>
          <p style={{ fontSize: 5, color: "#fff8e7", lineHeight: 2 }}>
            Journey is a JRPG-styled financial decision companion. Log your spending, track your savings quest, and watch your hero travel through beautiful lands as you reach your goals.
          </p>
        </RpgPanel>
      </div>
      <GameMenu open={menuOpen} onClose={() => setMenuOpen(false)} currentScreen="settings" />
    </div>
  );
}
