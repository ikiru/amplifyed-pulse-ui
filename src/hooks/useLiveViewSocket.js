import { useEffect } from "react";
import { adaptMessage } from "../pages/messageHelpers.js";

/**
 * useLiveViewSocket
 * 
 * Manages socket event subscriptions for LiveView (projection display).
 * LiveView displays the same data as TrainerView (read-only):
 * - pulse:update
 * - message.state.update
 * - message.vote.update (vote totals)
 * - confusion:update (confusion advisory)
 * - focus:update, focus:cleared
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
 * @param {function} params.setMessages - State setter for messages array
 * @param {function} params.setVoteTotals - State setter for vote totals
 * @param {function} params.setConfusionAdvisory - State setter for confusion data
 * @param {function} params.setFocus - State setter for focus text
 */
export function useLiveViewSocket({
  socket,
  onEvent,
  offEvent,
  setLivePulse,
  setMessages,
  setVoteTotals,
  setConfusionAdvisory,
  setFocus,
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

  // message.state.update handler
  useEffect(() => {
    const handleMessageStateUpdate = ({ messages: canonicalMessages }) => {
      if (!Array.isArray(canonicalMessages)) return;

      const adapted = canonicalMessages
        .map(adaptMessage)
        .filter(Boolean);

      setMessages(adapted);
    };

    onEvent("message.state.update", handleMessageStateUpdate);
    return () => offEvent("message.state.update", handleMessageStateUpdate);
  }, [onEvent, offEvent, setMessages]);

  // message.vote.update handler
  useEffect(() => {
    const handleVoteUpdate = ({ messageId, totals }) => {
      if (!messageId || !totals) {
        return;
      }

      setVoteTotals((prev) => ({
        ...prev,
        [messageId]: totals,
      }));
    };

    onEvent("message.vote.update", handleVoteUpdate);
    return () => offEvent("message.vote.update", handleVoteUpdate);
  }, [onEvent, offEvent, setVoteTotals]);

  // confusion:update handler
  useEffect(() => {
    const handleConfusionUpdate = (payload) => {
      setConfusionAdvisory(payload || null);
    };

    onEvent("confusion:update", handleConfusionUpdate);
    return () => offEvent("confusion:update", handleConfusionUpdate);
  }, [onEvent, offEvent, setConfusionAdvisory]);

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
}
