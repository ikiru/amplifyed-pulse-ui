import { useEffect } from "react";

/**
 * useStageExecutorState
 *
 * Subscribes to Stage Executor pipeline status updates from the server.
 * Event: stage:executor:status
 */
export function useStageExecutorState({ onEvent, offEvent, setExecutorState }) {
  useEffect(() => {
    if (!onEvent || !offEvent || typeof setExecutorState !== "function") {
      return undefined;
    }

    const handleStatus = (payload) => {
      // payload = { status, reasons, capture, media, ts }
      setExecutorState((prev) => ({
        ...prev,
        status: payload?.status ?? "idle",
        reasons: payload?.reasons ?? [],
        capture: payload?.capture ?? { status: "idle" },
        media: payload?.media ?? { status: "stopped" },
        ts: payload?.ts ?? null,
      }));
    };

    onEvent("stage:executor:status", handleStatus);
    return () => offEvent("stage:executor:status", handleStatus);
  }, [onEvent, offEvent, setExecutorState]);
}
