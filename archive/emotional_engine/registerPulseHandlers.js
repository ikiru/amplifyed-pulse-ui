/**
 * (ARCHIVED)
 * Legacy emotional-engine pulse handler (Phase 1)
 * ------------------------------------------------
 * Retained only for historical reference.
 */

import { usePulseHistory } from "../../src/utils/usePulseHistory";
import { useSocket } from "../../src/socket/useSocket";

export function registerPulseHandlers() {
  const { getSocket } = useSocket();
  const socket = getSocket();
  const addPulse = usePulseHistory((s) => s.addPulse);

  if (!socket) return;

  socket.on("engine:insight", (payload) => {
    console.log("[Handler] emotional engine insight:", payload);

    const pulse = {
      value: payload?.value,
      timestamp: payload?.timestamp ?? Date.now(),
      emotion: payload?.emotion ?? "neutral",
    };

    addPulse(pulse);
  });

  return () => {
    socket.off("engine:insight");
  };
}
