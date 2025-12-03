import { useCallback } from "react";
import useSocket from "../socket/useSocket";
import EVENTS from "../socket/events";
import usePulseHistory from "./usePulseHistory";

/**
 * -----------------------------------------------------------------------
 *  NORTH STAR — SINGLE SOURCE OF TRUTH GUARANTEE
 *
 *  This hook is the ONLY allowed ingestion point for pulse events.
 *  Do not create variants such as:
 *     - usePulseIngestion.jsx
 *     - usePulseIngestion.old.js
 *     - usePulseIngestion-copy.js
 *     - local copies inside pages or components
 *
 *  All pulse normalization, clamping, timestamping, and batching must
 *  route through this file so TrainerView, AudienceInput, LiveRoomView,
 *  InsightLine, and PulseTimeline stay in sync.
 *
 *  If additional logic is ever required (e.g., smoothing, thresholds,
 *  or safety filtering), add it here, not in consuming components.
 * -----------------------------------------------------------------------
 */

// Safety: guarantee event payload shape before forwarding
const safeNormalize = (evt = {}) => {
  const timestamp = evt.timestamp || Date.now();
  const emotion = evt.emotion ?? evt.type ?? null;
  const value = Number.isFinite(evt.value) ? evt.value : null;

  return {
    timestamp,
    emotion,
    value,
    raw: evt,
  };
};

export default function usePulseIngestion() {
  const addPulse = usePulseHistory((s) => s.addPulse);

  /**
   * ingest(evt)
   * Single call site for normalized pulse events.
   * Components call ingest() and the hook handles the rest.
   */
  const ingest = useCallback(
    (evt) => {
      if (!evt || typeof evt !== "object") return null;

      const normalized = safeNormalize(evt);
      if (!normalized.emotion) return null;

      addPulse(normalized);
      return normalized;
    },
    [addPulse]
  );

  useSocket({
    [EVENTS.AUDIENCE_PULSE]: (payload) => {
      console.log("[INGEST] pulse event →", payload);
      ingest(payload);
    },
  });

  return { ingest };
}
