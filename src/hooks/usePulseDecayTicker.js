// src/hooks/usePulseDecayTicker.js
import { useEffect } from "react";
import { usePulseStream } from "../state/usePulseStream";
import { DECAY_RATE, t } from "../utils/emotionalMath";

export default function usePulseDecayTicker() {
  // Pull stable functions — not reactive values
  const decayAll = usePulseStream((state) => state.decayAll);
  const appendHistory = usePulseStream((state) => state.appendHistory);

  // Direct state accessor (non-reactive)
  const getCurrent = usePulseStream.getState;

  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Apply decay
      decayAll(DECAY_RATE);

      // 2. Read latest state (direct read, no subscription)
      const { engaged, neutral, frustrated } = getCurrent().current;

      // 3. Append decayed values into history
      appendHistory("engaged", { t: t(), v: engaged });
      appendHistory("neutral", { t: t(), v: neutral });
      appendHistory("frustrated", { t: t(), v: frustrated });
    }, 1000);

    // Cleanup
    return () => clearInterval(interval);
  }, []); // Run ONCE
}
