import { useEffect } from "react";
import { useSocket } from "../socket/useSocket";
import { usePulseStream } from "../state/usePulseStream";

export function usePulseFeed() {
  const applyPulse = usePulseStream((s) => s.applyPulse);
  const recordEvent = usePulseStream((s) => s.recordEvent);
  const updateParticipant = usePulseStream((s) => s.updateParticipant);

  const scoreOf = (emotion) => {
    switch (emotion) {
      case "engaged":
        return 1;
      case "frustrated":
        return -1;
      default:
        return 0;
    }
  };

  useSocket({
    "audience:pulse": (payload) => {
      if (!payload) return;

      const { socketId, emotion } = payload;
      const score = scoreOf(emotion);
      const timestamp = Date.now();

      updateParticipant(socketId, emotion);
      applyPulse(socketId, emotion);

      recordEvent({
        type: "pulse",
        socketId,
        emotion,
        score,
        timestamp,
      });
    },
  });

  useEffect(() => {
    return () => {};
  }, []);

  return null;
}
