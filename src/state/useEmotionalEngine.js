// Emotional Engine Store (ET-2.1)
// ------------------------------------------------------
// Maintains:
//   - current emotional value (smoothed)
//   - rolling emotional trendline history
//   - append-only emotional events
//
// This store does NOT modify any existing app behavior.
// It simply waits for emotional events to be added.
// ------------------------------------------------------

import { create } from "zustand";

export const useEmotionalEngine = create((set, get) => ({
  current: 0.5,
  history: [],

  addEmotionalEvent(event) {
    if (!event || typeof event.v !== "number") return;

    const updated = event.v;
    const newHistory = [...get().history, event].slice(-200);

    set({ current: updated, history: newHistory });
  },

  getCurrent() {
    return get().current;
  }
}));

export default useEmotionalEngine;
