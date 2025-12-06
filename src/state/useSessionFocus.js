import { create } from "zustand";

const useSessionFocus = create((set) => ({
  focus: null,
  setFocus: (focus) => set({ focus }),
}));

export default useSessionFocus;
