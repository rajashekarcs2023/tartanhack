"use client";
import { useJourney } from "@/store/journey-store";
import React from "react"

import type { ScreenId } from "@/types/journey";
import { RpgPanel, RpgButton } from "./rpg-panel";

const ITEMS: { label: string; screen: ScreenId }[] = [
  { label: "HOME", screen: "title" },
  { label: "MY ROUTE", screen: "world" },
  { label: "LOG SPENDING", screen: "decision" },
  { label: "ROUTE STATS", screen: "inventory" },
  { label: "ASK GUIDE", screen: "guide" },
  { label: "COMPANION", screen: "friend" },
  { label: "LORE BOOK", screen: "lore" },
  { label: "SETTINGS", screen: "settings" },
];

export function GameMenu({ open, onClose, currentScreen }: { open: boolean; onClose: () => void; currentScreen: ScreenId }) {
  const { navigate } = useJourney();
  if (!open) return null;
  const filtered = ITEMS.filter(i => i.screen !== currentScreen);
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.65)" }} onClick={onClose}>
      <RpgPanel className="mx-4 w-full" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <p style={{ fontSize: 8, color: "#ffd700", textAlign: "center", marginBottom: 8, letterSpacing: 2 }}>MENU</p>
        <div className="flex flex-col gap-2">
          {filtered.map(i => (
            <RpgButton key={i.screen} variant="secondary" className="w-full text-center"
              onClick={() => { navigate(i.screen); onClose(); }}>
              {i.label}
            </RpgButton>
          ))}
          <RpgButton variant="danger" className="mt-1 w-full text-center" onClick={onClose}>CLOSE</RpgButton>
        </div>
      </RpgPanel>
    </div>
  );
}
