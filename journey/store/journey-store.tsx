"use client";
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ScreenId, AppState, JourneyState, DemonEncounter, BankAccount } from "@/types/journey";
import { MOCK_BANK_ACCOUNT, LINKED_BANK_ACCOUNT } from "@/data/mock-bank";
import type { ReactNode } from "react";

/* ─── Demo data (fixed timestamps prevent hydration mismatch) ─── */
const DEMONS: DemonEncounter[] = [
  { id: "d1", name: "Impulse Imp", hp: 100, maxHp: 100, tile: 2, defeated: true, reward: "+1 Tile", sprite: "shadow" },
  { id: "d2", name: "Subscription Wraith", hp: 100, maxHp: 100, tile: 4, defeated: false, reward: "+2 Tiles", sprite: "flame" },
  { id: "d3", name: "Fast Food Fiend", hp: 150, maxHp: 150, tile: 6, defeated: false, reward: "+1 Tile & 50 Gold", sprite: "ice" },
  { id: "d4", name: "Late Fee Lich", hp: 200, maxHp: 200, tile: 8, defeated: false, reward: "+2 Tiles & 100 Gold", sprite: "skull" },
  { id: "d5", name: "Debt Dragon", hp: 300, maxHp: 300, tile: 11, defeated: false, reward: "+3 Tiles & 200 Gold", sprite: "dragon" },
  { id: "d6", name: "Overdraft Ogre", hp: 180, maxHp: 180, tile: 13, defeated: false, reward: "+2 Tiles & 150 Gold", sprite: "flame" },
];

const BLANK_JOURNEY: JourneyState = {
  currentTile: 3, previousTile: 0, totalTiles: 15,
  lastVisitTimestamp: "2026-02-05T12:00:00.000Z",
  savingsToTarget: 0.22, dayStreak: 5,
  xp: 120, level: 2, demons: DEMONS, pendingBattle: null, battleLog: [], goldCoins: 75,
};

const DEMO_STATE: AppState = {
  profile: { id: "demo", name: "Hero", avatarClass: "warrior", createdAt: "2026-01-15T12:00:00.000Z" },
  goal: { id: "g1", label: "Emergency Fund", targetAmount: 5000, currentAmount: 1100, deadline: "2026-08-01" },
  journey: { ...BLANK_JOURNEY },
  commitments: [
    { id: "c1", label: "Pack lunch 4x/week", category: "food", amountPerMonth: 200, isActive: true, createdAt: "2026-01-15T12:00:00.000Z" },
    { id: "c2", label: "No impulse buys > $30", category: "shopping", amountPerMonth: 150, isActive: true, createdAt: "2026-01-15T12:00:00.000Z" },
  ],
  incomeLog: [{ id: "i1", amount: 3200, source: "Salary", date: "2026-02-01T12:00:00.000Z" }],
  friends: [],
  bankAccount: MOCK_BANK_ACCOUNT,
  chatHistory: [
    { id: "m1", role: "guide", text: "Welcome, traveler! I'm your Guide Fairy. Ask me anything about your financial journey!", ts: "2026-01-15T12:00:00.000Z" },
  ],
  lore: [
    { id: "l1", title: "The First Step", body: "Every great journey begins with a single coin saved. You took that step when you set your first goal.", unlockedAt: "2026-01-15T12:00:00.000Z" },
    { id: "l2", title: "The Commitment Pact", body: "By making a commitment, you forge a magical bond. Each day you honor it, you grow stronger.", unlockedAt: "2026-01-15T12:00:00.000Z" },
    { id: "l3", title: "The Mountain Pass", body: "Only those who resist the siren call of impulse spending may cross the Mountain Pass.", unlockedAt: null },
    { id: "l4", title: "Payday Tides", body: "Income events push you forward like a favorable wind.", unlockedAt: null },
  ],
};

/* ─── Context shape (Zustand-compatible API) ─── */
export interface SpendPenalty {
  verdict: "DETOUR" | "WRONG_TURN";
  tileDelta: number;
  reason: string;
}

interface StoreShape {
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
  defeatDemon: (demonId: string) => void;
  startBattle: (demon: DemonEncounter) => void;
  endBattle: () => void;
  linkBank: () => void;
  unlinkBank: () => void;
  addSavings: (amount: number) => { tilesAdvanced: number; demonTriggered: DemonEncounter | null; leveledUp: boolean; newLevel: number };
  addDayStreak: () => void;
  spendPenalty: SpendPenalty | null;
  setSpendPenalty: (p: SpendPenalty) => void;
  clearSpendPenalty: () => void;
}

const Ctx = createContext<StoreShape | null>(null);

export function useJourneyStore<T = StoreShape>(selector?: (s: StoreShape) => T): T {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useJourneyStore must be inside JourneyProvider");
  return selector ? selector(ctx) : (ctx as unknown as T);
}

/** Alias so both import names work */
export const useJourney = useJourneyStore;

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<ScreenId>("title");
  const [state, setStateRaw] = useState<AppState>(DEMO_STATE);
  const [demoMode, setDemoMode] = useState(true);
  const [tilesGained, setTilesGained] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [spendPenalty, setSpendPenaltyRaw] = useState<SpendPenalty | null>(null);

  useEffect(() => {
    let loaded = DEMO_STATE;
    const last = new Date(loaded.journey.lastVisitTimestamp).getTime();
    const now = Date.now();
    const daysPassed = Math.floor((now - last) / 86400000);
    if (daysPassed > 0) {
      const gain = Math.min(daysPassed, 3, loaded.journey.totalTiles - loaded.journey.currentTile);
      if (gain > 0) {
        setTilesGained(gain);
        loaded = { ...loaded, journey: { ...loaded.journey, previousTile: loaded.journey.currentTile, currentTile: Math.min(loaded.journey.currentTile + gain, loaded.journey.totalTiles), lastVisitTimestamp: new Date().toISOString(), dayStreak: loaded.journey.dayStreak + daysPassed } };
      }
    }
    setStateRaw(loaded);
    setMounted(true);
  }, []);

  const navigate = useCallback((s: ScreenId) => setScreen(s), []);
  const setState = useCallback((fn: (prev: AppState) => AppState) => setStateRaw(prev => fn(prev)), []);
  const clearTilesGained = useCallback(() => setTilesGained(0), []);
  const setSpendPenalty = useCallback((p: SpendPenalty) => setSpendPenaltyRaw(p), []);
  const clearSpendPenalty = useCallback(() => setSpendPenaltyRaw(null), []);

  const startBattle = useCallback((demon: DemonEncounter) => {
    setStateRaw(prev => ({ ...prev, journey: { ...prev.journey, pendingBattle: demon } }));
  }, []);

  const endBattle = useCallback(() => {
    setStateRaw(prev => ({ ...prev, journey: { ...prev.journey, pendingBattle: null } }));
  }, []);

  const linkBank = useCallback(() => {
    setStateRaw(prev => ({ ...prev, bankAccount: LINKED_BANK_ACCOUNT }));
  }, []);

  const unlinkBank = useCallback(() => {
    setStateRaw(prev => ({ ...prev, bankAccount: MOCK_BANK_ACCOUNT }));
  }, []);

  /* XP thresholds for leveling up */
  const XP_FOR_LEVEL = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5000];
  const getLevel = (xp: number) => {
    let lvl = 1;
    for (let i = 1; i < XP_FOR_LEVEL.length; i++) { if (xp >= XP_FOR_LEVEL[i]) lvl = i + 1; }
    return lvl;
  };

  /* Add savings: advances tiles based on amount relative to goal, triggers demons, levels up */
  const addSavings = useCallback((amount: number): { tilesAdvanced: number; demonTriggered: DemonEncounter | null; leveledUp: boolean; newLevel: number } => {
    let tilesAdvanced = 0;
    let demonTriggered: DemonEncounter | null = null;
    let leveledUp = false;
    let newLevel = 1;

    setStateRaw(prev => {
      const goalAmt = prev.goal?.targetAmount ?? 5000;
      const newSaved = Math.min((prev.goal?.currentAmount ?? 0) + amount, goalAmt);
      const pctOfGoal = amount / goalAmt;
      // Tiles: 1 tile per ~3% of goal saved, minimum 1
      tilesAdvanced = Math.max(1, Math.round(pctOfGoal * prev.journey.totalTiles));
      const newTile = Math.min(prev.journey.totalTiles, prev.journey.currentTile + tilesAdvanced);

      // Check if any undefeated demon is on tiles we're passing through
      for (let t = prev.journey.currentTile + 1; t <= newTile; t++) {
        const demon = prev.journey.demons.find(d => !d.defeated && d.tile === t);
        if (demon) {
          demonTriggered = demon;
          // Stop just before the demon
          tilesAdvanced = t - 1 - prev.journey.currentTile;
          break;
        }
      }

      const actualNewTile = demonTriggered
        ? Math.max(prev.journey.currentTile, prev.journey.currentTile + tilesAdvanced)
        : newTile;

      // XP for saving
      const xpGain = 20 + Math.floor(amount / 10);
      const newXp = prev.journey.xp + xpGain;
      newLevel = getLevel(newXp);
      const oldLevel = prev.journey.level;
      leveledUp = newLevel > oldLevel;

      // Savings rate for ETA
      const savingsRate = goalAmt > 0 ? newSaved / goalAmt : 0;

      // Unlock lore on milestone tiles
      const lore = [...prev.lore];
      if (actualNewTile >= 5 && !lore[2]?.unlockedAt) {
        lore[2] = { ...lore[2], unlockedAt: new Date().toISOString() };
      }
      if (actualNewTile >= 10 && !lore[3]?.unlockedAt) {
        lore[3] = { ...lore[3], unlockedAt: new Date().toISOString() };
      }

      return {
        ...prev,
        goal: prev.goal ? { ...prev.goal, currentAmount: newSaved } : prev.goal,
        journey: {
          ...prev.journey,
          previousTile: prev.journey.currentTile,
          currentTile: actualNewTile,
          savingsToTarget: savingsRate,
          xp: newXp,
          level: newLevel,
          goldCoins: prev.journey.goldCoins + Math.floor(amount / 50) * 5,
          pendingBattle: demonTriggered,
          lastVisitTimestamp: new Date().toISOString(),
        },
        lore,
      };
    });

    return { tilesAdvanced, demonTriggered, leveledUp, newLevel };
  }, []);

  const addDayStreak = useCallback(() => {
    setStateRaw(prev => ({
      ...prev,
      journey: {
        ...prev.journey,
        dayStreak: prev.journey.dayStreak + 1,
        xp: prev.journey.xp + 10,
        level: getLevel(prev.journey.xp + 10),
      },
    }));
  }, []);

  const defeatDemon = useCallback((demonId: string) => {
    setStateRaw(prev => {
      const demons = prev.journey.demons.map(d => d.id === demonId ? { ...d, defeated: true, hp: 0 } : d);
      const demon = prev.journey.demons.find(d => d.id === demonId);
      const goldBonus = demon?.reward.includes("Gold") ? parseInt(demon.reward.match(/(\d+)\s*Gold/)?.[1] ?? "0") : 0;
      const tileBonus = parseInt(demon?.reward.match(/\+(\d+)\s*Tile/)?.[1] ?? "1");
      const newTile = Math.min(prev.journey.totalTiles, prev.journey.currentTile + tileBonus);

      // XP for defeating demons scales with level
      const xpGain = 50 + (prev.journey.level * 15);
      const newXp = prev.journey.xp + xpGain;
      const newLevel = getLevel(newXp);
      const leveledUp = newLevel > prev.journey.level;

      // Unlock lore based on demon defeated
      const lore = [...prev.lore];
      if (demon?.id === "d3" && lore.length > 2 && !lore[2]?.unlockedAt) {
        lore[2] = { ...lore[2], unlockedAt: new Date().toISOString() };
      }
      if (demon?.id === "d5" && lore.length > 3 && !lore[3]?.unlockedAt) {
        lore[3] = { ...lore[3], unlockedAt: new Date().toISOString() };
      }

      return {
        ...prev,
        journey: {
          ...prev.journey,
          demons,
          pendingBattle: null,
          previousTile: prev.journey.currentTile,
          currentTile: newTile,
          xp: newXp,
          level: newLevel,
          goldCoins: prev.journey.goldCoins + goldBonus,
          battleLog: [
            ...prev.journey.battleLog,
            `Defeated ${demon?.name ?? "demon"}! +${xpGain}XP${goldBonus ? ` +${goldBonus}G` : ""}${leveledUp ? ` LEVEL UP! Lv${newLevel}!` : ""}`,
          ],
        },
        lore,
      };
    });
  }, []);

  return (
    <Ctx.Provider value={{ screen, navigate, state, setState, status: "success", mounted, demoMode, setDemoMode, tilesGained, clearTilesGained, defeatDemon, startBattle, endBattle, linkBank, unlinkBank, addSavings, addDayStreak, spendPenalty, setSpendPenalty, clearSpendPenalty }}>
      {children}
    </Ctx.Provider>
  );
}
