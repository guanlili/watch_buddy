import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EmotionLogEntry, FlagRecord, UserProfile } from "./types";

interface AppState {
  profile: UserProfile | null;
  setProfile: (p: UserProfile) => void;

  // current match runtime
  logs: EmotionLogEntry[];
  flags: FlagRecord[];
  score: { ours: number; theirs: number };
  matchSeconds: number;
  matchEnded: boolean;
  finalResult: "win" | "loss" | "draw" | null;

  addLog: (entry: EmotionLogEntry) => void;
  addFlag: (flag: FlagRecord) => void;
  resolveFlag: (id: string, hit: boolean, atSeconds: number) => void;
  setScore: (s: { ours: number; theirs: number }) => void;
  setMatchSeconds: (s: number) => void;
  endMatch: (result: "win" | "loss" | "draw") => void;
  resetMatch: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      profile: null,
      setProfile: (p) => set({ profile: p }),

      logs: [],
      flags: [],
      score: { ours: 0, theirs: 0 },
      matchSeconds: 0,
      matchEnded: false,
      finalResult: null,

      addLog: (entry) => set((s) => ({ logs: [...s.logs, entry] })),
      addFlag: (flag) => set((s) => ({ flags: [...s.flags, flag] })),
      resolveFlag: (id, hit, atSeconds) =>
        set((s) => ({
          flags: s.flags.map((f) =>
            f.id === id
              ? { ...f, status: hit ? "hit" : "miss", resolvedMinute: Math.round(atSeconds / 60) }
              : f,
          ),
        })),
      setScore: (s) => set({ score: s }),
      setMatchSeconds: (s) => set({ matchSeconds: s }),
      endMatch: (result) => set({ matchEnded: true, finalResult: result }),
      resetMatch: () =>
        set({
          logs: [],
          flags: [],
          score: { ours: 0, theirs: 0 },
          matchSeconds: 0,
          matchEnded: false,
          finalResult: null,
        }),
    }),
    { name: "esports-buddy-state" },
  ),
);
