import type { AppState } from "@/types/journey";

export interface JourneyRepository {
  load(): Promise<AppState | null>;
  save(state: AppState): Promise<void>;
}

export class MockRepository implements JourneyRepository {
  async load(): Promise<AppState | null> {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("journey_state");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
  async save(state: AppState): Promise<void> {
    if (typeof window === "undefined") return;
    try { localStorage.setItem("journey_state", JSON.stringify(state)); } catch { /* noop */ }
  }
}

// Placeholder for future Supabase integration
export class SupabaseRepository implements JourneyRepository {
  async load(): Promise<AppState | null> { return null; }
  async save(_state: AppState): Promise<void> { /* TODO */ }
}
