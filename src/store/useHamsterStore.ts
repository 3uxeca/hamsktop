// A.1 store skeleton — types only, no logic. Lifecycle/mood/persistence
// behavior is implemented in milestones C and D.
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
}

export interface HamsterActions {
  setName: (name: string) => void;
  // Placeholders — real implementations land in milestones C-D.
  reset: () => void;
}

const initialState: HamsterState = {
  name: null,
  stage: "baby",
  mood: "neutral",
  moodScore: 100,
  accumulatedActiveSeconds: 0,
};

export const useHamsterStore = create<HamsterState & HamsterActions>((set) => ({
  ...initialState,
  setName: (name) => set({ name }),
  reset: () => set(initialState),
}));
