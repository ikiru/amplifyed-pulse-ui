import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for managing session join state and logic
 * 
 * @param {Object} params
 * @param {Function} params.emit - Socket emit function
 * @param {Object} params.socket - Socket instance
 * @param {Function} params.onEvent - Socket event listener registration
 * @param {Function} params.offEvent - Socket event listener cleanup
 * @returns {Object} Session join state and methods
 */
export function useSessionJoin({ emit, socket, onEvent, offEvent }) {
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState(null);
  const [sessionData, setSessionData] = useState(null);

  // Check if already joined (based on socket.sessionId)
  useEffect(() => {
    if (socket?.sessionId && socket.sessionId !== 'session:default') {
      setIsJoined(true);
      setSessionData({
        sessionId: socket.sessionId,
      });
    }
  }, [socket]);

  // Listen for session:joined success event
  useEffect(() => {
    const handleSessionJoined = (payload) => {
      console.log('[useSessionJoin] session:joined received:', payload);
      
      setIsJoining(false);
      setIsJoined(true);
      setError(null);
      setSessionData({
        sessionId: payload.sessionId,
        accessCode: payload.accessCode,
        participant: payload.participant,
      });
    };

    const handleSessionError = (payload) => {
      console.warn('[useSessionJoin] session:error received:', payload);
      
      setIsJoining(false);
      setError(payload.message || 'Failed to join session');
    };

    onEvent('session:joined', handleSessionJoined);
    onEvent('session:error', handleSessionError);

    return () => {
      offEvent('session:joined', handleSessionJoined);
      offEvent('session:error', handleSessionError);
    };
  }, [onEvent, offEvent]);

  /**
   * Join a session with an access code
   * 
   * @param {string} accessCode - Session access code (e.g., "ABCD-1234")
   * @param {Object} options - Optional participant data
   * @param {string} options.name - Optional display name
   * @param {string} options.role - Optional role (defaults to "audience")
   */
  const joinSession = useCallback((accessCode, options = {}) => {
    if (!accessCode) {
      setError('Please enter a session code');
      return;
    }

    if (isJoining) {
      return;
    }

    console.log('[useSessionJoin] Joining session:', accessCode);

    setIsJoining(true);
    setError(null);

    emit('session:join', {
      accessCode: accessCode.trim().toUpperCase(),
      role: options.role || 'audience',
      name: options.name || null,
      metadata: options.metadata || {},
    });
  }, [emit, isJoining]);

  /**
   * Leave the current session
   */
  const leaveSession = useCallback(() => {
    if (!isJoined) {
      return;
    }

    console.log('[useSessionJoin] Leaving session');

    emit('session:leave', {});
    
    setIsJoined(false);
    setSessionData(null);
    setError(null);
  }, [emit, isJoined]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isJoined,
    isJoining,
    error,
    sessionData,
    joinSession,
    leaveSession,
    clearError,
  };
}
