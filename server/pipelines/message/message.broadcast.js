/**
 * Message Pipeline — broadcastMessage (Placeholder)
 */

// Thin transport layer. Sends whatever shape was composed upstream.
export function broadcastAudienceMessage(io, message) {
  io.emit("message:audience", message);
}
