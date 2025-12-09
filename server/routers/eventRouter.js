/**
 * eventRouter.js
 * --------------------------------------------------
 * Unified event routing system for ALL realtime pipelines.
 *
 * Responsibilities:
 *  - Listen to socket events
 *  - Forward them to the correct pipeline entry function
 *  - Remain pipeline-agnostic (no pulse/emotion/focus imports)
 *
 * Pipelines are injected by the server at startup:
 *
 *    eventRouter(io, {
 *      pulsePipeline,
 *      emotionPipeline,
 *      focusPipeline
 *    });
 *
 * This architecture allows expansion without rewriting handlers.
 */

export default function eventRouter(io, pipelines = {}) {
  const {
    pulsePipeline = null,
    emotionPipeline = null,
    focusPipeline = null,
  } = pipelines;

  io.on("connection", (socket) => {
    console.log("[ROUTER] client connected:", socket.id);

    /**
     * --------------------------------------------------
     * AUDIENCE: PULSE
     * --------------------------------------------------
     * Still supported exactly as before. Just routed through
     * the new architecture.
     */
    socket.on("audience:pulse", (payload = {}) => {
      if (!pulsePipeline?.handlePulse) return;

      pulsePipeline.handlePulse({
        socketId: socket.id,
        pulse: payload.pulse,
        timestamp: Date.now(),
      });
    });

    /**
     * --------------------------------------------------
     * Future event types (emotion, focus, camera, etc.)
     *
     * Example shape (not active yet):
     *
     * socket.on("audience:emotion", (payload) => {
     *   emotionPipeline.handleEmotion({...});
     * });
     */

    socket.on("disconnect", () => {
      if (pulsePipeline?.handleDisconnect) {
        pulsePipeline.handleDisconnect(socket.id);
      }
      if (emotionPipeline?.handleDisconnect) {
        emotionPipeline.handleDisconnect(socket.id);
      }
      if (focusPipeline?.handleDisconnect) {
        focusPipeline.handleDisconnect(socket.id);
      }

      console.log("[ROUTER] client disconnected:", socket.id);
    });
  });
}
