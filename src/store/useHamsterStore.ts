// Store skeleton extended with three player-visible stats (hunger / happiness /
// affinity) so action clicks have an immediate, observable consequence in the
// UI. Real time-decay + lifecycle integration lands in milestones C and D.
import { create } from "zustand";

export type LifeStage = "baby" | "adult" | "senior" | "dead";

export type Mood = "happy" | "neutral" | "sad" | "sleep";

export interface HamsterState {
  name: string | null;
  stage: LifeStage;
  mood: Mood;
  // Numeric mood score (0-100). UI buckets it into Mood enum.
  moodScore: number;
  accumulatedActiveSeconds: number;
  // Player-facing gauges (0-100). Each action restores its matching stat.
  hunger: number; // 먹이 — full when high, hungry when low
  happiness: number; // 쓰담 — happy when high
  affinity: number; // 놀기 — bonded when high
}

export type StatKey = "hunger" | "happiness" | "affinity";

export interface HamsterActions {
  setName: (name: string) => void;
  bumpStat: (key: StatKey, delta: number) => void;
  // Placeholders — real implementations land in milestones C-D.
  reset: () => void;
}

const initialState: HamsterState = {
  name: null,
  stage: "baby",
  mood: "neutral",
  moodScore: 100,
  accumulatedActiveSeconds: 0,
  hunger: 70,
  happiness: 70,
  affinity: 60,
};

const clampStat = (n: number) => Math.max(0, Math.min(100, n));

export const useHamsterStore = create<HamsterState & HamsterActions>((set) => ({
  ...initialState,
  setName: (name) => set({ name }),
  bumpStat: (key, delta) =>
    set((state) => ({ [key]: clampStat(state[key] + delta) }) as Partial<HamsterState>),
  reset: () => set(initialState),
}));
