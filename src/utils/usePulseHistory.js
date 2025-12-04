import { create } from "zustand";

const usePulseHistory = create((set, get) => ({
  // Always initialize as an empty array
  pulses: [],

  // Add new pulse safely
  addPulse: (pulse) =>
    set((state) => ({
      pulses: [...state.pulses, pulse]
    })),

  // Optional: clear pulses (for future buttons or debugging)
  clear: () => set({ pulses: [] })
}));

export default usePulseHistory;
