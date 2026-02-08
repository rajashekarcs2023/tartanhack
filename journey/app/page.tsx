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
import { BankScreen } from "@/components/screens/bank-screen";

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
  bank: BankScreen,
};

export default function Page() {
  const { screen, mounted } = useJourney();
  const ScreenComponent = SCREENS[screen];

  if (!mounted) {
    return (
      <main className="mx-auto flex items-center justify-center" style={{ maxWidth: 430, height: "100dvh", backgroundColor: "#1a1a0e" }}>
        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: "#ffd700" }}>Loading...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto" style={{ maxWidth: 430, height: "100dvh", position: "relative", overflow: "hidden", backgroundColor: "#1a1a0e" }}>
      <ScreenComponent />
    </main>
  );
}
