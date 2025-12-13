/**
 * Focus Pipeline — broadcastFocusUpdate (Placeholder)
 */
export function broadcastFocus(io, sessionId, focus) {
  io.to(sessionId).emit("focus:update", {
    sessionId,
    focus,
  });
}

export function broadcastFocusCleared(io, sessionId) {
  io.to(sessionId).emit("focus:cleared", {
    sessionId,
  });
}
