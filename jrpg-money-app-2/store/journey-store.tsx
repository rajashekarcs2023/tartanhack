"use client";
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { ScreenId, AppState, JourneyState } from "@/types/journey";

const BLANK_JOURNEY: JourneyState = {
  currentTile: 3,
  previousTile: 0,
  totalTiles: 15,
  lastVisitTimestamp: "2026-02-05T12:00:00.000Z",
  savingsToTarget: 0.22,
  dayStreak: 5,
};

const DEMO_STATE: AppState = {
  profile: { id: "demo", name: "Hero", avatarClass: "warrior", createdAt: "2026-01-15T12:00:00.000Z" },
  goal: { id: "g1", label: "Emergency Fund", targetAmount: 5000, currentAmount: 1100, deadline: "2026-08-01" },
  journey: { ...BLANK_JOURNEY },
  commitments: [
    { id: "c1", label: "Pack lunch 4x/week", category: "food", amountPerMonth: 200, isActive: true, createdAt: "2026-01-15T12:00:00.000Z" },
    { id: "c2", label: "No impulse buys > $30", category: "shopping", amountPerMonth: 150, isActive: true, createdAt: "2026-01-15T12:00:00.000Z" },
  ],
  incomeLog: [
    { id: "i1", amount: 3200, source: "Salary", date: "2026-02-01T12:00:00.000Z" },
  ],
  friends: [],
  chatHistory: [
    { id: "m1", role: "guide", text: "Welcome, traveler! I'm your Guide Fairy. Ask me anything about your financial journey!", ts: "2026-01-15T12:00:00.000Z" },
  ],
  lore: [
    { id: "l1", title: "The First Step", body: "Every great journey begins with a single coin saved. You took that step when you set your first goal.", unlockedAt: "2026-01-15T12:00:00.000Z" },
    { id: "l2", title: "The Commitment Pact", body: "By making a commitment, you forge a magical bond. Each day you honor it, you grow stronger.", unlockedAt: "2026-01-15T12:00:00.000Z" },
    { id: "l3", title: "The Mountain Pass", body: "Only those who resist the siren call of impulse spending may cross the Mountain Pass.", unlockedAt: null },
    { id: "l4", title: "Payday Tides", body: "Income events push you forward like a favorable wind. Timing your big decisions after payday keeps the journey smooth.", unlockedAt: null },
  ],
};

interface StoreCtx {
  screen: ScreenId;
  navigate: (s: ScreenId) => void;
  state: AppState;
  setState: (fn: (prev: AppState) => AppState) => void;
  status: "loading" | "success" | "error";
  mounted: boolean;
  demoMode: boolean;
  setDemoMode: (v: boolean) => void;
  tilesGained: number;
  clearTilesGained: () => void;
}

const Ctx = createContext<StoreCtx | null>(null);

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<ScreenId>("title");
  const [state, setStateRaw] = useState<AppState>(DEMO_STATE);
  const [demoMode, setDemoMode] = useState(true);
  const [tilesGained, setTilesGained] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage + time-based auto-advance AFTER mount (avoids hydration mismatch)
  useEffect(() => {
    let loaded = DEMO_STATE;
    try {
      const raw = localStorage.getItem("journey_v8_state");
      if (raw) loaded = JSON.parse(raw);
    } catch { /* noop */ }

    // Time-based auto-advance
    const last = new Date(loaded.journey.lastVisitTimestamp).getTime();
    const now = Date.now();
    const daysPassed = Math.floor((now - last) / 86400000);
    if (daysPassed > 0) {
      const gain = Math.min(daysPassed, 3, loaded.journey.totalTiles - loaded.journey.currentTile);
      if (gain > 0) {
        setTilesGained(gain);
        loaded = {
          ...loaded,
          journey: {
            ...loaded.journey,
            previousTile: loaded.journey.currentTile,
            currentTile: Math.min(loaded.journey.currentTile + gain, loaded.journey.totalTiles),
            lastVisitTimestamp: new Date().toISOString(),
            dayStreak: loaded.journey.dayStreak + daysPassed,
          }
        };
      }
    }

    setStateRaw(loaded);
    setMounted(true);
    try { localStorage.setItem("journey_v8_state", JSON.stringify(loaded)); } catch { /* noop */ }
  }, []);

  const navigate = useCallback((s: ScreenId) => setScreen(s), []);

  const setState = useCallback((fn: (prev: AppState) => AppState) => {
    setStateRaw(prev => {
      const next = fn(prev);
      try { localStorage.setItem("journey_v8_state", JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  }, []);

  const clearTilesGained = useCallback(() => setTilesGained(0), []);

  return (
    <Ctx.Provider value={{ screen, navigate, state, setState, status: "success", mounted, demoMode, setDemoMode, tilesGained, clearTilesGained }}>
      {children}
    </Ctx.Provider>
  );
}

export function useJourney() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useJourney must be inside JourneyProvider");
  return ctx;
}
