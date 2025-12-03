import { useEffect } from "react";
import useSocket from "../socket/useSocket";
import useEmotionalStream from "../state/useEmotionalStream";

export default function useEmotionalFeed() {
  const socket = useSocket();
  const emotional = useEmotionalStream();

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (evt) => {
      if (!evt) return;
      const { emotion, value, timestamp } = evt;
      if (typeof emotion !== "string" || typeof value !== "number") return;

      emotional.applyPulse(emotion, value, timestamp);
      emotional.appendHistory(emotion, {
        value,
        timestamp: timestamp ?? Date.now(),
      });
    };

    socket.on("emotional:update", handleUpdate);

    return () => {
      socket.off("emotional:update", handleUpdate);
    };
  }, [socket, emotional.applyPulse, emotional.appendHistory]);

  return emotional;
}
