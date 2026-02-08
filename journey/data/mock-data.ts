import type { AppState } from "@/types/journey";

export const DEMO_SAVE: AppState = {
  profile: { id: "demo", name: "Hero", avatarClass: "warrior", createdAt: "2026-01-15T12:00:00.000Z" },
  goal: { id: "g1", label: "Emergency Fund", targetAmount: 5000, currentAmount: 1100, deadline: "2026-08-01" },
  journey: { currentTile: 3, previousTile: 0, totalTiles: 15, lastVisitTimestamp: "2026-02-05T12:00:00.000Z", savingsToTarget: 0.22, dayStreak: 5 },
  commitments: [
    { id: "c1", label: "Pack lunch 4x/week", category: "food", amountPerMonth: 200, isActive: true, createdAt: "2026-01-15T12:00:00.000Z" },
    { id: "c2", label: "No impulse buys > $30", category: "shopping", amountPerMonth: 150, isActive: true, createdAt: "2026-01-15T12:00:00.000Z" },
  ],
  incomeLog: [{ id: "i1", amount: 3200, source: "Salary", date: "2026-02-01T12:00:00.000Z" }],
  friends: [],
  chatHistory: [{ id: "m1", role: "guide", text: "Welcome, traveler! I'm your Guide Fairy. Ask me anything about your financial journey!", ts: "2026-01-15T12:00:00.000Z" }],
  lore: [
    { id: "l1", title: "The First Step", body: "Every great journey begins with a single coin saved.", unlockedAt: "2026-01-15T12:00:00.000Z" },
    { id: "l2", title: "The Commitment Pact", body: "By making a commitment, you forge a magical bond.", unlockedAt: "2026-01-15T12:00:00.000Z" },
    { id: "l3", title: "The Mountain Pass", body: "Only those who resist impulse spending may cross.", unlockedAt: null },
    { id: "l4", title: "Payday Tides", body: "Income pushes you forward like a favorable wind.", unlockedAt: null },
  ],
};
