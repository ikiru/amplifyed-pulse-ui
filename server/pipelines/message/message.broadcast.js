/**
 * Message Pipeline — broadcastMessage (Placeholder)
 */
import { getSessionMessages } from "./message.state.js";

// Thin transport layer. Sends whatever shape was composed upstream.
export function broadcastAudienceMessage(io, message) {
  io.emit("message:audience", message);
}

export function broadcastMessageState({ io, sessionId }) {
  if (!sessionId) return;

  const messages = getSessionMessages(sessionId);

  io.to(sessionId).emit("message.state.update", {
    sessionId,
    messages,
  });
}
