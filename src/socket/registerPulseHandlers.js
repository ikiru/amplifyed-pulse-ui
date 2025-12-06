import usePulseHistory from "../utils/usePulseHistory.js";

const ENGINE_INSIGHT_FLAG = Symbol("engine:insight:handled");

const handlers = {
  handleEngineInsight(payload = {}) {
    try {
      if (payload && payload[ENGINE_INSIGHT_FLAG]) {
        return;
      }

      if (payload && typeof payload === "object") {
        payload[ENGINE_INSIGHT_FLAG] = true;
      }

      const entry = {
        type: "engine",
        signal: "insight",
        value: payload?.value,
        timestamp: payload?.timestamp || Date.now(),
      };
      usePulseHistory.getState().addPulse(entry);
    } catch (err) {
      console.error("[ENGINE] error handling insight:", err);
    }
  },
  register(socket) {
    if (!socket?.on) return;
    socket.on("engine:insight", handlers.handleEngineInsight);
  },
  unregister(socket) {
    if (!socket?.off) return;
    socket.off("engine:insight", handlers.handleEngineInsight);
  },
};

export default handlers;
