import { useEffect } from "react";

/**
 * useLiveViewSocket
 * 
 * Manages socket event subscriptions for LiveView (projection display).
 * LiveView (vNext) displays a projection subset (read-only):
 * - pulse:update
 * - focus:update, focus:cleared
 * - session:metadata (participant count)
 * 
 * OBS status is handled by useObsCaptureState (obs:status_changed).
 * 
 * Does NOT subscribe to trainer-only control events:
 * - audience:drift:update (trainer-private analytics)
 * - insights (trainer-private)
 * - audience:label:update (trainer action)
 * 
 * @param {object} params
 * @param {object} params.socket - Socket instance from useSocket
 * @param {function} params.onEvent - Event subscription function
 * @param {function} params.offEvent - Event unsubscription function
 * @param {function} params.setLivePulse - State setter for pulse data
 * @param {function} params.setFocus - State setter for focus text
 * @param {function} params.setParticipantCount - State setter for participant count (session metadata)
 * @param {function} params.setSessionError - State setter for session join errors
 */
export function useLiveViewSocket({
  socket,
  onEvent,
  offEvent,
  setLivePulse,
  setFocus,
  setParticipantCount,
  setSessionError,
}) {
  // pulse:update handler
  useEffect(() => {
    const handlePulse = (payload) => {
      if (!payload) {
        setLivePulse(null);
        return;
      }

      const nextPulse = {
        ...payload,
        participants:
          payload.participants && typeof payload.participants === "object"
            ? { ...payload.participants }
            : payload.participants,
        eventLog: Array.isArray(payload.eventLog)
          ? payload.eventLog.map((entry) => (entry ? { ...entry } : entry))
          : payload.eventLog,
      };

      setLivePulse(nextPulse);
    };

    onEvent("pulse:update", handlePulse);
    return () => offEvent("pulse:update", handlePulse);
  }, [onEvent, offEvent, setLivePulse]);

  // focus events handler
  useEffect(() => {
    const handleFocusUpdate = (payload) => {
      if (!payload) {
        setFocus(null);
        return;
      }

      // String payload
      if (typeof payload === "string") {
        setFocus(payload);
        return;
      }

      // focus:update payload shape
      if (typeof payload.text === "string") {
        setFocus(payload.text);
        return;
      }

      // Defensive: nested focus object
      if (payload.focus && typeof payload.focus.text === "string") {
        setFocus(payload.focus.text);
        return;
      }

      // Unknown shape
      setFocus(null);
    };

    const handleFocusCleared = () => {
      setFocus(null);
    };

    onEvent("focus:update", handleFocusUpdate);
    onEvent("focus:set", handleFocusUpdate); // alias safety
    onEvent("focus:cleared", handleFocusCleared);

    return () => {
      offEvent("focus:update", handleFocusUpdate);
      offEvent("focus:set", handleFocusUpdate);
      offEvent("focus:cleared", handleFocusCleared);
    };
  }, [onEvent, offEvent, setFocus]);

  // session:metadata handler (participant count)
  useEffect(() => {
    const handleSessionMetadata = (payload) => {
      if (typeof payload?.participantCount === "number") {
        setParticipantCount(payload.participantCount);
      }
    };

    const handleParticipantCount = (payload) => {
      if (typeof payload?.count === "number") {
        setParticipantCount(payload.count);
      }
    };

    onEvent("session:metadata", handleSessionMetadata);
    onEvent("session:participant_count", handleParticipantCount);

    return () => {
      offEvent("session:metadata", handleSessionMetadata);
      offEvent("session:participant_count", handleParticipantCount);
    };
  }, [onEvent, offEvent, setParticipantCount]);

  // session:error handler (join failures)
  useEffect(() => {
    const handleSessionError = (payload) => {
      const message = payload?.message ?? payload?.error ?? "Failed to join session";
      setSessionError(message);
    };

    onEvent("session:error", handleSessionError);
    return () => offEvent("session:error", handleSessionError);
  }, [onEvent, offEvent, setSessionError]);
}
