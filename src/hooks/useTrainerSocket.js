import { useEffect, useRef } from "react";
import { getAudienceLabelDisplay } from "../utils/confusionUtils.js";
import { adaptMessage } from "../pages/messageHelpers.js";

const TRACE_ENABLED = false;

/**
 * useTrainerSocket
 * 
 * Manages all socket event subscriptions for TrainerView.
 * Handles:
 * - pulse:update
 * - audience:drift:update
 * - audience:label:update
 * - message.state.update
 * - message.vote.update
 * - moment:update (insights)
 * - confusion:update
 * - focus events (focus:update, focus:set, focus:cleared)
 * 
 * @param {object} params
 * @param {object} params.socket - Socket instance from useSocket
 * @param {function} params.onEvent - Event subscription function
 * @param {function} params.offEvent - Event unsubscription function
 * @param {function} params.setLivePulse - State setter for pulse data
 * @param {function} params.setDriftProjection - State setter for drift score
 * @param {function} params.setMessages - State setter for messages array
 * @param {function} params.setVoteTotals - State setter for vote totals
 * @param {function} params.setHiddenInsights - State setter for insights
 * @param {function} params.setConfusionAdvisory - State setter for confusion data
 * @param {function} params.setFocus - State setter for focus text
 */
export function useTrainerSocket({
  socket,
  onEvent,
  offEvent,
  setLivePulse,
  setDriftProjection,
  setMessages,
  setVoteTotals,
  setHiddenInsights,
  setConfusionAdvisory,
  setFocus,
}) {
  const audienceLabelsRef = useRef({});

  // Wire test logging (development)
  useEffect(() => {
    if (!socket) {
      console.warn("[WIRE_TEST][CLIENT] socket is NULL at mount");
      return;
    }

    console.log("[WIRE_TEST][CLIENT] socket connected", {
      id: socket.id,
      connected: socket.connected,
    });

    return () => {
      console.log("[WIRE_TEST][CLIENT] socket unmounted", {
        id: socket.id,
      });
    };
  }, [socket]);

  // Wire test: audience:drift:update listener
  useEffect(() => {
    if (!socket) return;

    const wireTestHandler = (payload) => {
      console.log("[WIRE_TEST][CLIENT_RECEIVE][AUDIENCE_DRIFT]", payload);
    };

    console.log("[WIRE_TEST][CLIENT] registering audience:drift:update listener");

    socket.on("audience:drift:update", wireTestHandler);

    return () => {
      console.log("[WIRE_TEST][CLIENT] removing audience:drift:update listener");
      socket.off("audience:drift:update", wireTestHandler);
    };
  }, [socket]);

  // Wire test: catch-all event logger
  useEffect(() => {
    if (!socket || typeof socket.onAny !== "function") return;

    const anyHandler = (event, payload) => {
      if (event.includes("drift")) {
        console.log("[WIRE_TEST][CLIENT_ANY_EVENT]", event, payload);
      }
    };

    socket.onAny(anyHandler);

    return () => {
      socket.offAny(anyHandler);
    };
  }, [socket]);

  // pulse:update handler
  useEffect(() => {
    const handlePulse = (payload) => {
      if (!payload) {
        setLivePulse(null);
        return;
      }

      const { participants } = payload;
      const explicitParticipantsCount = payload.participantsCount;
      const derivedParticipantsCount = participants
        ? Object.values(participants).reduce(
            (count, participant) =>
              participant?.actorRole === "audience" ? count + 1 : count,
            0
          )
        : undefined;
      const canonicalParticipantCount = derivedParticipantsCount;

      if (TRACE_ENABLED) {
        console.groupCollapsed("[TRACE] pulse:update received");
        console.log("raw participants:", participants);
        console.log("explicit participantsCount:", explicitParticipantsCount);
        console.log("derived count:", derivedParticipantsCount);
        console.log("canonicalParticipantCount:", canonicalParticipantCount);
        console.groupEnd();
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

      if (process.env.NODE_ENV !== "production") {
        const explicitCount = nextPulse?.participantsCount;
        const derivedCount = nextPulse?.participants
          ? Object.keys(nextPulse.participants).length
          : undefined;

        const canonicalParticipantCount =
          explicitCount ?? derivedCount ?? undefined;

        if (TRACE_ENABLED) {
          console.groupCollapsed("[TRACE] pulse:update payload");
          console.log("livePulse:", nextPulse);
          console.log("participants:", nextPulse?.participants);
          console.log("participantsCount (explicit):", explicitCount);
          console.log("participantsCount (derived):", derivedCount);
          console.log("canonicalParticipantCount:", canonicalParticipantCount);
          console.groupEnd();
        }
      }
    };

    onEvent("pulse:update", handlePulse);
    return () => offEvent("pulse:update", handlePulse);
  }, [onEvent, offEvent, setLivePulse]);

  // audience:drift:update handler
  useEffect(() => {
    const handleDriftUpdate = (payload) => {
      console.log(
        "[WIRE_TEST][CLIENT_RECEIVE][AUDIENCE_DRIFT]",
        payload
      );
      if (payload?.status === "paused") {
        setDriftProjection({
          status: "paused",
          reason: payload?.reason ?? null,
          score: 0,
        });
        return;
      }
      if (typeof payload?.score === "number") {
        console.log("[WIRE_TEST][SET_DRIFT_PROJECTION]", {
          incomingScore: payload.score,
          next: payload.score,
        });
        setDriftProjection(
          payload?.projection && typeof payload.projection === "object"
            ? payload.projection
            : { score: payload.score }
        );
        console.log("[WIRE_TEST][METER_STATE_APPLIED]", payload.score);
      }
    };

    onEvent("audience:drift:update", handleDriftUpdate);
    return () => offEvent("audience:drift:update", handleDriftUpdate);
  }, [onEvent, offEvent, setDriftProjection]);

  // audience:label:update handler
  useEffect(() => {
    const handleLabelUpdate = (payload) => {
      if (!payload || !payload.messageId) {
        return;
      }

      const nextLabels = {
        ...audienceLabelsRef.current,
        [payload.messageId]: {
          label: payload.label,
          labelDisplay: getAudienceLabelDisplay(payload.label),
          source: payload.source,
          timestamp: payload.timestamp,
        },
      };
      audienceLabelsRef.current = nextLabels;

      setMessages((prev) =>
        prev.map((message) =>
          message.messageId === payload.messageId
            ? {
                ...message,
                label: payload.label,
                labelDisplay: getAudienceLabelDisplay(payload.label),
                labelSource: payload.source,
              }
            : message
        )
      );
    };

    onEvent("audience:label:update", handleLabelUpdate);
    return () => offEvent("audience:label:update", handleLabelUpdate);
  }, [onEvent, offEvent, setMessages]);

  // message.state.update, moment:update, confusion:update handlers
  useEffect(() => {
    const handleMessageStateUpdate = ({ messages: canonicalMessages }) => {
      if (!Array.isArray(canonicalMessages)) return;

      const adapted = canonicalMessages
        .map(adaptMessage)
        .filter(Boolean);

      const enriched = adapted.map((message) => {
        const labelInfo = audienceLabelsRef.current[message.messageId];
        if (!labelInfo) {
          return message;
        }
        return {
          ...message,
          label: labelInfo.label,
          labelDisplay:
            labelInfo.labelDisplay ?? getAudienceLabelDisplay(labelInfo.label),
          labelSource: labelInfo.source,
        };
      });

      setMessages(enriched);
    };

    const handleMomentUpdate = (payload) => {
      if (!payload) {
        setHiddenInsights(null);
        return;
      }

      if (Array.isArray(payload.insights)) {
        setHiddenInsights(payload.insights);
      } else {
        setHiddenInsights(null);
      }
    };

    const handleConfusionUpdate = (payload) => {
      if (!payload) {
        setConfusionAdvisory(null);
        return;
      }

      setConfusionAdvisory(payload);
    };

    onEvent("message.state.update", handleMessageStateUpdate);
    onEvent("moment:update", handleMomentUpdate);
    onEvent("confusion:update", handleConfusionUpdate);

    return () => {
      offEvent("message.state.update", handleMessageStateUpdate);
      offEvent("moment:update", handleMomentUpdate);
      offEvent("confusion:update", handleConfusionUpdate);
    };
  }, [onEvent, offEvent, setMessages, setHiddenInsights, setConfusionAdvisory]);

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

  // focus events handler
  useEffect(() => {
    const handleFocusUpdate = (payload) => {
      console.log("[FOCUS] raw payload received:", payload);

      if (!payload) {
        console.log("[FOCUS] payload empty → clearing focus");
        setFocus(null);
        return;
      }

      // Most common / expected
      if (typeof payload === "string") {
        console.log("[FOCUS] normalized string:", payload);
        setFocus(payload);
        return;
      }

      // focus:update payload shape
      if (typeof payload.text === "string") {
        console.log("[FOCUS] normalized payload.text:", payload.text);
        setFocus(payload.text);
        return;
      }

      // Defensive: nested focus object
      if (payload.focus && typeof payload.focus.text === "string") {
        console.log(
          "[FOCUS] normalized payload.focus.text:",
          payload.focus.text
        );
        setFocus(payload.focus.text);
        return;
      }

      // Unknown shape — do not render garbage
      console.log("[FOCUS] unknown payload shape → clearing", payload);
      setFocus(null);
    };

    const handleFocusCleared = () => {
      console.log("[FOCUS] focus:cleared event received");
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

  return {
    audienceLabelsRef,
  };
}
