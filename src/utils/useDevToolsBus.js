import { create } from "zustand";

export const useDevToolsBus = create((set) => ({
  events: [],
  push: (evt) =>
    set((state) => ({
      events: [
        {
          id: Date.now() + Math.random(),
          ts: new Date().toISOString(),
          ...evt,
        },
        ...state.events.slice(0, 99), // keep last 100
      ],
    })),
}));

export function useDevFeed() {
  const { events } = useDevToolsBus();
  return events;
}
