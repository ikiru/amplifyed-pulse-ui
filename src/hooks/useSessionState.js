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
  const [accessCode, setAccessCode] = useState(null);
  const [participantCount, setParticipantCount] = useState(0);

  // Listen for session metadata updates
  useEffect(() => {
    const handleSessionMetadata = (payload) => {
      console.log('[useSessionState] session:metadata received:', payload);
      
      if (payload.accessCode) {
        setAccessCode(payload.accessCode);
      }
      
      if (typeof payload.participantCount === 'number') {
        setParticipantCount(payload.participantCount);
      }
    };

    const handleParticipantCount = (payload) => {
      console.log('[useSessionState] session:participant_count received:', payload);
      
      if (typeof payload.count === 'number') {
        setParticipantCount(payload.count);
      }
    };

    onEvent('session:metadata', handleSessionMetadata);
    onEvent('session:participant_count', handleParticipantCount);

    return () => {
      offEvent('session:metadata', handleSessionMetadata);
      offEvent('session:participant_count', handleParticipantCount);
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
    accessCode,
    participantCount,
  };
}
