import { create } from "zustand";

const usePulseHistory = create((set, get) => ({
  pulses: [],
  score: 0,

  addPulse: (pulse = {}) => {
    const { pulses, score } = get();

    const incomingScore =
      typeof pulse.score === "number" ? pulse.score : score;
    const delta = incomingScore - score;

    const counts = pulse.counts ?? {};

    const engaged = counts.engaged ?? 0;
    const neutral = counts.neutral ?? 0;
    const frustrated = counts.frustrated ?? 0;

    let dominantEmotion = "neutral";
    if (engaged >= neutral && engaged >= frustrated) dominantEmotion = "engaged";
    else if (frustrated > engaged && frustrated >= neutral)
      dominantEmotion = "frustrated";

    const entry = {
      ...pulse,
      counts,
      delta,
      emotion: dominantEmotion,
      score: incomingScore,
    };

    console.log(
      "[PULSE_HISTORY] delta:",
      delta,
      "new score:",
      incomingScore,
      "counts:",
      counts
    );

    set({
      pulses: [...pulses, entry],
      score: incomingScore,
    });
  },
}));

export default usePulseHistory;
