/**
 * Message Pipeline — broadcastMessage (Placeholder)
 */
import { getSessionMessages } from "./message.state.js";

// Thin transport layer. Sends whatever shape was composed upstream.
export function broadcastAudienceMessage(io, message) {
  io.emit("message:audience", message);
}

/**
 * Broadcast authoritative message state snapshot
 */
export function broadcastMessageState({ io, sessionId }) {
  if (!io || !sessionId) return;

  const messages = getSessionMessages(sessionId);

  const payload = {
    sessionId,
    messages,
  };

  // Session-scoped (trainer + joined audience)
  io.to(sessionId).emit("message.state.update", payload);

  // Global fallback (unjoined audience clients)
  io.emit("message.state.update", payload);
}
