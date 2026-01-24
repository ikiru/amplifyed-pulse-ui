/**
 * Session Pipeline
 * 
 * Authoritative participant state and session lifecycle management.
 * Implements docs/session-contract.md specifications.
 */

import { validateAccessCode, normalizeAccessCode } from './session.accessCode.js';
import * as SessionState from './session.state.js';
import * as StagingState from '../../staging/staging.state.js';
import { calculateReadiness } from '../../staging/staging.state.js';

const DEFAULT_SESSION_ID = 'session:default';

export function createSessionPipeline(io, { stagingPipeline, focusPipeline } = {}) {
  const allowTrainerRole =
    process.env.ALLOW_TRAINER_ROLE === "true" ||
    (process.env.NODE_ENV !== "production" &&
      process.env.ALLOW_TRAINER_ROLE !== "false");
  
  // Store dependencies for orchestrator pattern
  const dependencies = { stagingPipeline, focusPipeline };
  
  // Ensure default session exists
  if (!SessionState.sessionExists(DEFAULT_SESSION_ID)) {
    SessionState.createSession(DEFAULT_SESSION_ID);
  }

  /**
   * Handle session join - can accept accessCode or sessionId
   * 
   * @param {Object} params
   * @param {string} params.socketId - Socket identifier
   * @param {Object} params.payload - Join payload
   * @param {string} params.payload.accessCode - Optional access code
   * @param {string} params.payload.sessionId - Optional session ID
   * @param {string} params.payload.role - Optional role (defaults to "audience")
   * @param {string} params.payload.name - Optional display name
   * @returns {Object} Join result with status and session info
   */
  function handleJoin({ socketId, payload = {}, pulsePipeline }) {
    const { accessCode, sessionId: requestedSessionId, role, name, metadata } = payload;
    const requestedRole = role || 'audience';
    const effectiveRole =
      requestedRole === "trainer" && !allowTrainerRole
        ? "audience"
        : requestedRole;
    if (requestedRole === "trainer" && effectiveRole !== "trainer") {
      console.warn("[sessionPipeline] trainer role denied (ALLOW_TRAINER_ROLE not enabled)", {
        socketId,
      });
    }

    let sessionId = null;
    let session = null;

    // Try to resolve session by access code first
    if (accessCode) {
      const normalized = normalizeAccessCode(accessCode);
      
      if (!validateAccessCode(normalized)) {
        return {
          status: 'error',
          error: 'invalid_code',
          message: 'Invalid access code format',
        };
      }

      session = SessionState.getSessionByCode(normalized);
      
      if (!session) {
        return {
          status: 'error',
          error: 'session_not_found',
          message: 'Session not found for this code',
        };
      }

      sessionId = session.sessionId;
    } 
    // Fall back to sessionId (for existing connections)
    else if (requestedSessionId) {
      sessionId = requestedSessionId;
      session = SessionState.getSessionById(sessionId);
      
      // Create session if it doesn't exist (for backwards compatibility)
      if (!session) {
        session = SessionState.createSession(sessionId);
      }
    } 
    // Default to default session
    else {
      sessionId = DEFAULT_SESSION_ID;
      session = SessionState.getSessionById(sessionId);
    }

    // Add participant to session
    const participant = SessionState.addParticipant(sessionId, socketId, {
      actorRole: effectiveRole,
      name: name || null,
      metadata: metadata || {},
      joinedAt: Date.now(),
    });

    if (!participant) {
      return {
        status: 'error',
        error: 'join_failed',
        message: 'Failed to join session',
      };
    }

    // Note: participant count broadcast moved to eventRouter (after socket joins room)
    console.log(`[sessionPipeline] Participant joined: ${socketId} → ${sessionId} (${session.accessCode})`);

    // Broadcast pulse update with updated participant count (for graph scaling)
    if (pulsePipeline?.broadcastPulseUpdate) {
      const participants = SessionState.getParticipants(sessionId);
      console.log(`[sessionPipeline] Broadcasting pulse update after join: ${Object.keys(participants).length} participants`);
      pulsePipeline.broadcastPulseUpdate(sessionId, participants);
    }

    return {
      status: 'ok',
      sessionId,
      accessCode: session.accessCode,
      participant,
    };
  }

  /**
   * Handle session leave/disconnect
   * 
   * @param {Object} params
   * @param {string} params.socketId - Socket identifier
   * @param {Object} params.pulsePipeline - Optional pulse pipeline for cleanup
   */
  function handleLeave({ socketId, pulsePipeline }) {
    // Fast lookup: get session ID for this socket
    const sessionId = SessionState.getSessionIdBySocket(socketId);
    
    if (!sessionId) {
      console.log(`[sessionPipeline] Socket ${socketId} not found in any session`);
      return;
    }

    // Remove participant from session
    const removed = SessionState.removeParticipant(sessionId, socketId);
    
    if (!removed) {
      console.warn(`[sessionPipeline] Failed to remove ${socketId} from ${sessionId}`);
      return;
    }

    // Clean up pulse vote if pulse pipeline is available
    if (pulsePipeline?.removeUserPulse) {
      pulsePipeline.removeUserPulse(sessionId, socketId);
    }

    // Broadcast pulse update with authoritative participants
    if (pulsePipeline?.broadcastPulseUpdate) {
      const participants = SessionState.getParticipants(sessionId);
      pulsePipeline.broadcastPulseUpdate(sessionId, participants);
    }

    // Broadcast participant count update
    broadcastParticipantCount(sessionId);

    console.log(`[sessionPipeline] Participant left: ${socketId} from ${sessionId}`);
  }

  /**
   * Handle reconnect - sync state to rejoining client
   * 
   * @param {Object} params
   * @param {string} params.socketId - Socket identifier
   * @param {Object} params.payload - Reconnect payload
   */
  function handleReconnect({ socketId, payload = {} }) {
    const { sessionId } = payload;
    
    if (!sessionId) {
      console.warn(`[sessionPipeline] Reconnect without sessionId: ${socketId}`);
      return;
    }

    const session = SessionState.getSessionById(sessionId);
    
    if (!session) {
      console.warn(`[sessionPipeline] Reconnect to non-existent session: ${sessionId}`);
      return;
    }

    console.log(`[sessionPipeline] Participant reconnecting: ${socketId} to ${sessionId}`);
    
    // Note: State synchronization is handled by eventRouter calling sync methods
  }

  /**
   * Broadcast participant count update
   * 
   * @param {string} sessionId - Session identifier
   */
  function broadcastParticipantCount(sessionId) {
    const count = SessionState.getParticipantCount(sessionId);
    const accessCode = SessionState.getAccessCode(sessionId);
    
    console.log(`[sessionPipeline] Broadcasting participant count: ${count} for session: ${sessionId}`);
    
    io.to(sessionId).emit('session:participant_count', {
      sessionId,
      count,
    });

    // Also send full metadata (for trainer view)
    io.to(sessionId).emit('session:metadata', {
      sessionId,
      accessCode,
      participantCount: count,
    });
  }

  /**
   * Get all participants in a session
   * 
   * @param {string} sessionId - Session identifier (optional, defaults to DEFAULT)
   * @returns {Object} Participants map
   */
  function getParticipants(sessionId = DEFAULT_SESSION_ID) {
    return SessionState.getParticipants(sessionId);
  }

  /**
   * Get specific participant
   * 
   * @param {string} socketId - Socket identifier
   * @param {string} sessionId - Session identifier (optional)
   * @returns {Object|null} Participant data or null
   */
  function getParticipant(socketId, sessionId) {
    if (sessionId) {
      return SessionState.getParticipant(sessionId, socketId);
    }
    
    // Search all sessions if sessionId not provided
    const allSessionIds = SessionState.getAllSessionIds();
    for (const sid of allSessionIds) {
      const participant = SessionState.getParticipant(sid, socketId);
      if (participant) {
        return participant;
      }
    }
    
    return null;
  }

  /**
   * Get all participants (alias for backwards compatibility)
   */
  function getAllParticipants(sessionId = DEFAULT_SESSION_ID) {
    return getParticipants(sessionId);
  }

  /**
   * Get access code for a session
   * 
   * @param {string} sessionId - Session identifier
   * @returns {string|null} Access code
   */
  function getAccessCode(sessionId) {
    return SessionState.getAccessCode(sessionId);
  }

  /**
   * Get participant count for a session
   * 
   * @param {string} sessionId - Session identifier
   * @returns {number} Participant count
   */
  function getParticipantCount(sessionId) {
    return SessionState.getParticipantCount(sessionId);
  }

  /**
   * Get session by access code
   * 
   * @param {string} accessCode - Access code
   * @returns {Object|null} Session data
   */
  function getSessionByCode(accessCode) {
    return SessionState.getSessionByCode(accessCode);
  }

  /**
   * Handle session state get query
   * 
   * @param {Object} params
   * @param {Object} params.socket - Socket instance
   * @param {string} params.sessionId - Session identifier
   */
  function handleStateGet({ socket, sessionId } = {}) {
    if (!sessionId) {
      socket.emit('session:state:response', {
        sessionId: null,
        state: null,
        error: 'sessionId required',
      });
      return;
    }

    // Ensure session exists
    let session = SessionState.getSessionById(sessionId);
    if (!session) {
      session = SessionState.createSession(sessionId);
    }

    // Get or create staging state
    const stagingState = StagingState.getOrCreateStagingState(sessionId);
    
    // Calculate readiness if not already set
    const readinessState = stagingState.state || calculateReadiness(stagingState);
    if (stagingState.state !== readinessState) {
      StagingState.updateStagingState(stagingState.stagingId, {
        state: readinessState,
      });
    }

    // Get current session state (DRAFT/STAGED/LIVE)
    const sessionState = SessionState.getSessionState(sessionId) || readinessState;

    // Build staging payload (only if not LIVE)
    let stagingPayload = null;
    if (sessionState !== 'LIVE') {
      stagingPayload = {
        focusCues: stagingState.focusCues,
        mediaCues: stagingState.mediaCues,
        entryState: stagingState.entryState,
        requirements: stagingState.requirements,
        validation: stagingState.validation,
        readinessState: stagingState.state,
      };
    }

    socket.emit('session:state:response', {
      sessionId,
      state: sessionState,
      stagingPayload,
    });
  }

  /**
   * Handle Live Begin (Orchestrator)
   * 
   * @param {Object} params
   * @param {Object} params.socket - Socket instance
   * @param {string} params.sessionId - Session identifier
   */
  function handleLiveBegin({ socket, sessionId } = {}) {
    if (!sessionId) {
      socket.emit('session:live:error', {
        sessionId: null,
        code: 'SESSION_ID_REQUIRED',
        message: 'sessionId is required',
      });
      return;
    }

    try {
      // Get staging state
      const stagingState = StagingState.getStagingStateBySessionId(sessionId);
      if (!stagingState) {
        socket.emit('session:live:error', {
          sessionId,
          code: 'STAGING_STATE_NOT_FOUND',
          message: 'Staging state not found',
        });
        return;
      }

      // Validate gating rules (check readiness)
      const readinessState = calculateReadiness(stagingState);
      if (readinessState !== 'STAGED') {
        socket.emit('session:live:error', {
          sessionId,
          code: 'NOT_READY',
          message: `Session is not ready. Current state: ${readinessState}. Must be STAGED to go live.`,
        });
        return;
      }

      // Create snapshot (atomic operation)
      const snapshot = StagingState.createSnapshot(stagingState.stagingId);

      // Initialize focus pipeline from snapshot (use dependency from closure)
      if (dependencies.focusPipeline?.initializeFromSnapshot) {
        dependencies.focusPipeline.initializeFromSnapshot(sessionId, {
          focusCues: snapshot.focusCues,
          entryState: snapshot.entryState,
        });
      } else {
        console.warn('[sessionPipeline] focusPipeline.initializeFromSnapshot not available');
      }

      // Set session state to LIVE
      SessionState.setSessionState(sessionId, 'LIVE');

      // Broadcast state update to all clients
      io.emit('session:state:update', {
        sessionId,
        state: 'LIVE',
      });

      // Emit ACK to requester
      socket.emit('session:live:ack', {
        sessionId,
        state: 'LIVE',
        snapshotId: snapshot.snapshotId,
      });

      console.log(`[sessionPipeline] Session went LIVE: ${sessionId} (snapshot: ${snapshot.snapshotId})`);
    } catch (err) {
      console.error(`[sessionPipeline] Error transitioning to Live: ${err.message}`);
      socket.emit('session:live:error', {
        sessionId,
        code: 'INTERNAL_ERROR',
        message: err.message,
      });
    }
  }

  return {
    handleJoin,
    handleLeave,
    handleReconnect,
    handleStateGet,
    handleLiveBegin,
    getParticipants,
    getParticipant,
    getAllParticipants,
    getAccessCode,
    getParticipantCount,
    getSessionByCode,
    broadcastParticipantCount, // Export for eventRouter to call after socket joins room
  };
}
