export type ScreenId =
  | "title" | "setup" | "world" | "decision" | "guide"
  | "friend" | "settings" | "inventory" | "lore";

export interface UserProfile {
  id: string;
  name: string;
  avatarClass: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  label: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
}

export interface Commitment {
  id: string;
  label: string;
  category: string;
  amountPerMonth: number;
  isActive: boolean;
  createdAt: string;
}

export interface IncomeEvent {
  id: string;
  amount: number;
  source: string;
  date: string;
}

export interface DecisionIntent {
  category: string;
  amount: number;
  label: string;
  urgency: "need" | "want" | "impulse";
}

export interface DecisionResult {
  approved: boolean;
  impact: string;
  newTile: number;
  xpGained: number;
  message: string;
}

export interface FriendLink {
  id: string;
  name: string;
  joinedAt: string;
  lastCheerAt: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "guide";
  text: string;
  ts: string;
}

export interface LoreScroll {
  id: string;
  title: string;
  body: string;
  unlockedAt: string | null;
}

export interface JourneyState {
  currentTile: number;
  previousTile: number;
  totalTiles: number;
  lastVisitTimestamp: string;
  savingsToTarget: number;
  dayStreak: number;
}

export interface AppState {
  profile: UserProfile | null;
  goal: Goal | null;
  journey: JourneyState;
  commitments: Commitment[];
  incomeLog: IncomeEvent[];
  friends: FriendLink[];
  chatHistory: ChatMessage[];
  lore: LoreScroll[];
}
