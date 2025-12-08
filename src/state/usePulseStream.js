import { create } from "zustand";

export const usePulseStream = create((set) => ({
  participants: {},
  participantStates: {},
  votes: { engaged: 0, neutral: 0, frustrated: 0 },
  lastVoteAt: null,
  eventLog: [],

  recordEvent: (evt) =>
    set((state) => ({
      eventLog: [...state.eventLog, evt],
    })),

  applyPulseUpdate: (payload) =>
    set(() => ({
      ...payload,
    })),
}));
