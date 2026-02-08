"use client";
import { useJourneyStore } from "@/store/journey-store";
import { RpgPanel, RpgButton } from "@/components/terrain/rpg-panel";
import type { ScreenId } from "@/types/journey";

const MENU_ITEMS: { label: string; screen: ScreenId }[] = [
  { label: "HOME", screen: "title" },
  { label: "MY ROUTE", screen: "world" },
  { label: "LOG SPENDING", screen: "decision" },
  { label: "ROUTE STATS", screen: "inventory" },
  { label: "ASK GUIDE", screen: "guide" },
  { label: "BANK VAULT", screen: "bank" },
  { label: "COMPANION", screen: "friend" },
  { label: "LORE BOOK", screen: "lore" },
  { label: "SETTINGS", screen: "settings" },
];

export function GameMenu({ open, onClose, currentScreen }: { open: boolean; onClose: () => void; currentScreen: ScreenId }) {
  const navigate = useJourneyStore((s) => s.navigate);
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <RpgPanel className="mx-6 w-full" onClick={(e) => e.stopPropagation()}>
        <p className="mb-2 text-center" style={{ fontSize: 8, color: "#ffd700", fontFamily: "'Press Start 2P',monospace" }}>MENU</p>
        {MENU_ITEMS.filter(i => i.screen !== currentScreen).map(item => (
          <RpgButton key={item.screen} variant="secondary" className="mb-1 w-full text-center" onClick={() => { navigate(item.screen); onClose(); }}>{item.label}</RpgButton>
        ))}
        <RpgButton variant="danger" className="mt-2 w-full text-center" onClick={onClose}>CLOSE</RpgButton>
      </RpgPanel>
    </div>
  );
}
