import { create } from "zustand";

const DECAY = 0.85;

const DEFAULT_CURRENT = {
  engaged: 0,
  neutral: 0,
  frustrated: 0,
};

const DEFAULT_HISTORY = {
  engaged: [],
  neutral: [],
  frustrated: [],
};

const safeNum = (value) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

export const useEmotionalStream = create((set, get) => ({
  current: { ...DEFAULT_CURRENT },

  history: {
    ...DEFAULT_HISTORY,
  },

  lastUpdate: Date.now(),

  levels() {
    const state = get();
    const current = state?.current ?? DEFAULT_CURRENT;
    return {
      engaged: safeNum(current.engaged),
      neutral: safeNum(current.neutral),
      frustrated: safeNum(current.frustrated),
    };
  },

  applyPulse(emotion, value, timestamp) {
    const state = get();
    const now = timestamp ?? Date.now();
    const previous = safeNum(state.current?.[emotion]);
    const incoming = safeNum(value);

    const nextValue = previous * DECAY + incoming * (1 - DECAY);

    set({
      current: {
        ...state.current,
        [emotion]: nextValue,
      },
      lastUpdate: now,
    });
  },

  appendHistory(emotion, point) {
    const state = get();
    const bucket = state.history?.[emotion] ?? [];
    const updated = [...bucket, point];
    const trimmed =
      updated.length > 200 ? updated.slice(updated.length - 200) : updated;

    set({
      history: {
        ...state.history,
        [emotion]: trimmed,
      },
    });
  },
}));

export default useEmotionalStream;
