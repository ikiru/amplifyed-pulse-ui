import { useEffect } from "react";

/**
 * useObsCaptureState
 *
 * Subscribes to OBS pipeline status updates from the server.
 * Event: obs:status_changed
 */
export function useObsCaptureState({ onEvent, offEvent, setObsCapture }) {
  useEffect(() => {
    if (!onEvent || !offEvent || typeof setObsCapture !== "function") {
      return undefined;
    }

    const handleStatus = (payload) => {
      setObsCapture({
        status: payload?.status ?? "idle",
        reason: payload?.reason ?? null,
        metrics: payload?.metrics ?? null,
        captureSessionId: payload?.captureSessionId ?? null,
        ts: payload?.ts ?? null,
      });
    };

    onEvent("obs:status_changed", handleStatus);
    return () => offEvent("obs:status_changed", handleStatus);
  }, [onEvent, offEvent, setObsCapture]);
}

