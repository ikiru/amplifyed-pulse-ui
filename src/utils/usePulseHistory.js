import { create } from "zustand";

const usePulseHistory = create((set) => ({
  history: [],
  addPulse(pulse) {
    set((state) => ({
      history: [...state.history, pulse],
    }));
  },
  clearHistory() {
    set({ history: [] });
  },
}));

export default usePulseHistory;
export { usePulseHistory };
