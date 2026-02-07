"use client";
import { useJourney } from "@/store/journey-store";
import { TitleScreen } from "@/components/screens/title-screen";
import { SetupScreen } from "@/components/screens/setup-screen";
import { WorldScreen } from "@/components/screens/world-screen";
import { DecisionScreen } from "@/components/screens/decision-screen";
import { GuideScreen } from "@/components/screens/guide-screen";
import { FriendScreen } from "@/components/screens/friend-screen";
import { SettingsScreen } from "@/components/screens/settings-screen";
import { InventoryScreen } from "@/components/screens/inventory-screen";
import { LoreScreen } from "@/components/screens/lore-screen";

const SCREENS = {
  title: TitleScreen,
  setup: SetupScreen,
  world: WorldScreen,
  decision: DecisionScreen,
  guide: GuideScreen,
  friend: FriendScreen,
  settings: SettingsScreen,
  inventory: InventoryScreen,
  lore: LoreScreen,
};

export default function Page() {
  const { screen, mounted } = useJourney();
  const ScreenComponent = SCREENS[screen];
  return (
    <main className="mx-auto" style={{ maxWidth: 430, height: "100dvh", position: "relative", overflow: "hidden", backgroundColor: "#1a1a0e" }}>
      {mounted ? <ScreenComponent /> : (
        <div className="flex h-full items-center justify-center">
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "#ffd700", animation: "pulse 1.5s ease-in-out infinite" }}>Loading adventure...</p>
        </div>
      )}
    </main>
  );
}
