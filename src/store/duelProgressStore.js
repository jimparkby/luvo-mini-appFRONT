import { create } from "zustand";

const DUEL_COUNT_KEY = "duels_count_v1";
const DUEL_LIMIT_KEY = "duels_limit_until_v1";
const TOTAL = 15;
const MS_IN_24H = 24 * 60 * 60 * 1000;

const readNumber = (key, fallback = 0) => {
  if (typeof window === "undefined") return fallback;
  const v = parseInt(localStorage.getItem(key) || String(fallback), 10);
  return Number.isFinite(v) ? v : fallback;
};

export const useDuelProgressStore = create((set, get) => {
  // initial read from localStorage
  const storedCount = readNumber(DUEL_COUNT_KEY, 0);
  const storedLimitUntil = readNumber(DUEL_LIMIT_KEY, 0);
  const now = Date.now();

  // if there's active limit, treat as blocked
  const activeLimit =
    storedLimitUntil && now < storedLimitUntil ? storedLimitUntil : 0;
  const isBlocked = !!activeLimit;

  return {
    total: TOTAL,
    current: isBlocked ? TOTAL : Math.min(storedCount, TOTAL),
    limitUntil: activeLimit,
    isBlocked,

    // increment and persist; if reaches TOTAL -> set limitUntil for 24h
    increment: () => {
      const { current, total, isBlocked: blocked } = get();
      if (blocked) return; // ignore when blocked

      const next = Math.min(current + 1, total);
      localStorage.setItem(DUEL_COUNT_KEY, String(next));

      if (next >= total) {
        const until = Date.now() + MS_IN_24H;
        localStorage.setItem(DUEL_LIMIT_KEY, String(until));
        set({ current: total, limitUntil: until, isBlocked: true });
      } else {
        set({ current: next });
      }
    },

    // reset (useful after limit expired)
    reset: () => {
      localStorage.setItem(DUEL_COUNT_KEY, "0");
      localStorage.removeItem(DUEL_LIMIT_KEY);
      set({ current: 0, limitUntil: 0, isBlocked: false });
    },

    // force re-sync store state from localStorage (call on mount)
    refreshFromStorage: () => {
      const storedCount2 = readNumber(DUEL_COUNT_KEY, 0);
      const storedLimit2 = readNumber(DUEL_LIMIT_KEY, 0);
      const now2 = Date.now();
      if (storedLimit2 && now2 < storedLimit2) {
        set({ current: TOTAL, limitUntil: storedLimit2, isBlocked: true });
      } else {
        // limit expired -> clear
        if (storedLimit2 && now2 >= storedLimit2) {
          localStorage.removeItem(DUEL_LIMIT_KEY);
          localStorage.setItem(DUEL_COUNT_KEY, "0");
          set({ current: 0, limitUntil: 0, isBlocked: false });
        } else {
          set({
            current: Math.min(storedCount2, TOTAL),
            limitUntil: 0,
            isBlocked: false,
          });
        }
      }
    },
  };
});
