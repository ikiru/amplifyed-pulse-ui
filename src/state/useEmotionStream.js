import { create } from "zustand";

export const useEmotionStream = create((set) => ({
  emotionEnvelope: null,

  setEmotionEnvelope: (envelope) =>
    set(() => ({
      emotionEnvelope: envelope ?? null,
    })),

  clearEmotion: () =>
    set(() => ({
      emotionEnvelope: null,
    })),
}));
