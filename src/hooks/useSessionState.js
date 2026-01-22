import { useState, useEffect } from 'react';

/**
 * Hook for managing session metadata (trainer view)
 * 
 * Fetches and tracks session access code and participant count.
 * 
 * @param {Object} params
 * @param {Object} params.socket - Socket instance
 * @param {Function} params.emit - Socket emit function
 * @param {Function} params.onEvent - Socket event listener registration
 * @param {Function} params.offEvent - Socket event listener cleanup
 * @returns {Object} Session metadata
 */
export function useSessionState({ socket, emit, onEvent, offEvent }) {
  const [sessionId, setSessionId] = useState(null);
  const [accessCode, setAccessCode] = useState(null);
  const [participantCount, setParticipantCount] = useState(0);

  // Listen for session:joined (primary source for sessionId) and session:metadata
  useEffect(() => {
    const handleSessionJoined = (payload) => {
      if (typeof payload?.sessionId === "string") {
        setSessionId(payload.sessionId);
      }
      if (payload?.accessCode) {
        setAccessCode(payload.accessCode);
      }
    };

    const handleSessionMetadata = (payload) => {
      if (payload?.sessionId) {
        setSessionId(payload.sessionId);
      }
      if (payload?.accessCode) {
        setAccessCode(payload.accessCode);
      }
      if (typeof payload?.participantCount === "number") {
        setParticipantCount(payload.participantCount);
      }
    };

    const handleParticipantCount = (payload) => {
      if (typeof payload?.count === "number") {
        setParticipantCount(payload.count);
      }
    };

    onEvent("session:joined", handleSessionJoined);
    onEvent("session:metadata", handleSessionMetadata);
    onEvent("session:participant_count", handleParticipantCount);

    return () => {
      offEvent("session:joined", handleSessionJoined);
      offEvent("session:metadata", handleSessionMetadata);
      offEvent("session:participant_count", handleParticipantCount);
    };
  }, [onEvent, offEvent]);

  // Request session metadata on mount and when socket connects
  useEffect(() => {
    if (socket?.connected && emit) {
      console.log('[useSessionState] Requesting session metadata');
      emit('session:request_metadata', {});
    }
  }, [socket?.connected, emit]);

  return {
    sessionId,
    accessCode,
    participantCount,
  };
}
