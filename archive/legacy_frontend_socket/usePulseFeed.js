import { useEffect } from "react";
import { useSocket } from "../socket/useSocket";
import { usePulseStream } from "../state/usePulseStream";

export function usePulseFeed() {
  const { applyPulseUpdate, recordEvent } = usePulseStream();
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handlePulseUpdate = (payload) => {
      if (!payload) return;
      console.log("[PulseFeed] pulse update:", payload);
      applyPulseUpdate(payload);
    };

    const handlePulseEvent = (evt) => {
      console.log("[PulseFeed] event:", evt);
      recordEvent(evt);
    };

    socket.on("pulse:update", handlePulseUpdate);
    socket.on("pulse:event", handlePulseEvent);

    return () => {
      socket.off("pulse:update", handlePulseUpdate);
      socket.off("pulse:event", handlePulseEvent);
    };
  }, [socket, applyPulseUpdate, recordEvent]);

  return null;
}
