/**
 * Session State Management
 * 
 * Authoritative, in-memory session storage.
 * Manages session lifecycle, participant registry, and access code mappings.
 */

import { generateUniqueAccessCode } from './session.accessCode.js';

// In-memory storage
const sessions = new Map(); // sessionId → SessionData
const codeToSession = new Map(); // accessCode → sessionId
const socketToSession = new Map(); // socketId → sessionId (for fast lookup)

/**
 * Session Data Structure
 * @typedef {Object} SessionData
 * @property {string} sessionId - Unique session identifier
 * @property {string} accessCode - Human-readable access code
 * @property {Object} participants - Map of socketId → ParticipantData
 * @property {number} createdAt - Timestamp when session was created
 */

/**
 * Participant Data Structure
 * @typedef {Object} ParticipantData
 * @property {string} actorRole - "audience" or "trainer"
 * @property {string|null} name - Optional display name
 * @property {Object} metadata - Additional metadata
 * @property {number} joinedAt - Timestamp when participant joined
 * @property {string} status - "active" or "disconnected"
 */

/**
 * Create a new session
 * 
 * @param {string} sessionId - Session identifier
 * @returns {SessionData} Created session data
 */
export function createSession(sessionId) {
  if (sessions.has(sessionId)) {
    return sessions.get(sessionId);
  }

  // Generate unique access code
  const accessCode = generateUniqueAccessCode((code) => codeToSession.has(code));

  const sessionData = {
    sessionId,
    accessCode,
    participants: {},
    createdAt: Date.now(),
  };

  sessions.set(sessionId, sessionData);
  codeToSession.set(accessCode, sessionId);

  console.log(`[session.state] Session created: ${sessionId} → ${accessCode}`);

  return sessionData;
}

/**
 * Get session by sessionId
 * 
 * @param {string} sessionId - Session identifier
 * @returns {SessionData|null} Session data or null if not found
 */
export function getSessionById(sessionId) {
  return sessions.get(sessionId) || null;
}

/**
 * Get session by access code
 * 
 * @param {string} accessCode - Access code (e.g., "ABCD-1234")
 * @returns {SessionData|null} Session data or null if not found
 */
export function getSessionByCode(accessCode) {
  const sessionId = codeToSession.get(accessCode);
  if (!sessionId) {
    return null;
  }
  return sessions.get(sessionId) || null;
}

/**
 * Get access code for a session
 * 
 * @param {string} sessionId - Session identifier
 * @returns {string|null} Access code or null if session not found
 */
export function getAccessCode(sessionId) {
  const session = sessions.get(sessionId);
  return session ? session.accessCode : null;
}

/**
 * Add participant to session
 * 
 * @param {string} sessionId - Session identifier
 * @param {string} socketId - Socket identifier
 * @param {ParticipantData} participantData - Participant information
 * @returns {ParticipantData|null} Added participant or null if session not found
 */
export function addParticipant(sessionId, socketId, participantData) {
  const session = sessions.get(sessionId);
  if (!session) {
    return null;
  }

  // Remove from old session if exists
  const oldSessionId = socketToSession.get(socketId);
  if (oldSessionId && oldSessionId !== sessionId) {
    removeParticipant(oldSessionId, socketId);
  }

  session.participants[socketId] = {
    actorRole: participantData.actorRole || participantData.role || 'audience',
    name: participantData.name || null,
    metadata: participantData.metadata || {},
    joinedAt: participantData.joinedAt || Date.now(),
    status: 'active',
  };

  // Track socket → session mapping
  socketToSession.set(socketId, sessionId);

  return session.participants[socketId];
}

/**
 * Remove participant from session
 * 
 * @param {string} sessionId - Session identifier
 * @param {string} socketId - Socket identifier
 * @returns {boolean} True if participant was removed
 */
export function removeParticipant(sessionId, socketId) {
  const session = sessions.get(sessionId);
  if (!session || !session.participants[socketId]) {
    return false;
  }

  delete session.participants[socketId];
  
  // Clean up socket → session mapping
  socketToSession.delete(socketId);
  
  console.log(`[session.state] Participant removed: ${socketId} from ${sessionId}`);
  
  return true;
}

/**
 * Get all participants in a session
 * 
 * @param {string} sessionId - Session identifier
 * @returns {Object} Participants map (socketId → ParticipantData)
 */
export function getParticipants(sessionId) {
  const session = sessions.get(sessionId);
  return session ? session.participants : {};
}

/**
 * Get specific participant
 * 
 * @param {string} sessionId - Session identifier
 * @param {string} socketId - Socket identifier
 * @returns {ParticipantData|null} Participant data or null
 */
export function getParticipant(sessionId, socketId) {
  const session = sessions.get(sessionId);
  if (!session) {
    return null;
  }
  return session.participants[socketId] || null;
}

/**
 * Get participant count for a session
 * 
 * @param {string} sessionId - Session identifier
 * @returns {number} Number of active participants
 */
export function getParticipantCount(sessionId) {
  const participants = getParticipants(sessionId);
  return Object.keys(participants).length;
}

/**
 * Delete a session (cleanup)
 * 
 * @param {string} sessionId - Session identifier
 * @returns {boolean} True if session was deleted
 */
export function deleteSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) {
    return false;
  }

  // Remove access code mapping
  codeToSession.delete(session.accessCode);
  
  // Remove session
  sessions.delete(sessionId);

  console.log(`[session.state] Session deleted: ${sessionId}`);

  return true;
}

/**
 * Check if session exists
 * 
 * @param {string} sessionId - Session identifier
 * @returns {boolean} True if session exists
 */
export function sessionExists(sessionId) {
  return sessions.has(sessionId);
}

/**
 * Get all session IDs (for debugging/admin)
 * 
 * @returns {string[]} Array of session IDs
 */
export function getAllSessionIds() {
  return Array.from(sessions.keys());
}

/**
 * Get session count (for debugging/admin)
 * 
 * @returns {number} Number of active sessions
 */
export function getSessionCount() {
  return sessions.size;
}

/**
 * Get sessionId for a socketId (fast lookup)
 * 
 * @param {string} socketId - Socket identifier
 * @returns {string|null} Session ID or null if not found
 */
export function getSessionIdBySocket(socketId) {
  return socketToSession.get(socketId) || null;
}
