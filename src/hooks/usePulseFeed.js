import { useSocket } from "../socket/useSocket";
import { usePulseStream } from "../state/usePulseStream";

export function usePulseFeed() {
  const { applyPulseUpdate, recordEvent } = usePulseStream();

  const handlers = {};

  handlers["pulse:update"] = (payload) => {
    if (!payload) return;

    console.log("[PulseFeed] pulse update:", payload);
    applyPulseUpdate(payload);
  };

  handlers["pulse:event"] = (evt) => {
    console.log("[PulseFeed] event:", evt);
    recordEvent(evt);
  };

  useSocket(handlers);

  return null;
}
