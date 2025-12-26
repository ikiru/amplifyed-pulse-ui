// ------------------------------------------------------------------
// Trainer Pipeline (Phase 2.3.7)
// ------------------------------------------------------------------
// Owns:
//   Trainer actions ("nudge", "slowdown", etc.)
//   Normalizes trainer signal
//   Contributes trainerSignal → Moment Builder
//
// Never:
//   Reads pulse state
//   Reads participant lists
//   Updates session state
// TrainerPipeline MUST NOT read pulse/emotion/session data; signals are transient only.
// ------------------------------------------------------------------

import { extractTrainerSignal } from "./trainerSignalExtractor.js";
import { handleTrainerCommand as registerTrainerCommand } from "./trainer.handleCommand.js";
import { handleTrainerNudge as registerTrainerNudge } from "./trainer.handleNudge.js";

export function createTrainerPipeline(io, momentBuilder = null) {

  function handleTrainerAction({ action, type }) {
    if (!action) return;

    // --------------------------------------------------------------
    // Boundary Guard (dev only)
    // TrainerPipeline MUST NOT receive pulse/emotion/session events.
    // If routing is misconfigured, warn loudly and drop the event.
    // --------------------------------------------------------------
    if (process.env.NODE_ENV !== "production") {
      if (
        type?.startsWith?.("pulse:") ||
        type?.startsWith?.("emotion:") ||
        type?.startsWith?.("session:")
      ) {
        console.warn(
          "[BoundaryViolation] TrainerPipeline received invalid event:",
          type
        );
        return;
      }
    }

    // Normalize trainer signal
    const trainerSignal = extractTrainerSignal(action);
    if (!trainerSignal) return;

    // Push into unified multi-signal moment
    if (momentBuilder) {
      momentBuilder.addTrainer({ trainerSignal });
    }

    // Emit for Trainer UI widgets (future use)
    io.emit("trainer:signal", {
      trainerSignal,
      timestamp: Date.now(),
    });
  }

  function handleAction(payload = {}) {
    return handleTrainerAction(payload);
  }

  function handleCommand(payload = {}) {
    const nextAction = payload.action ?? payload.command;
    return handleTrainerAction({
      action: nextAction,
      type: payload.type,
    });
  }

  function handleNudge(payload = {}) {
    return handleTrainerAction({
      action: payload.action ?? "nudge",
      type: payload.type,
    });
  }

  function handleTrainerCommand(io, socket) {
    if (!registerTrainerCommand) return;
    return registerTrainerCommand(io, socket);
  }

  function handleTrainerNudge(io, socket) {
    if (!registerTrainerNudge) return;
    return registerTrainerNudge(io, socket);
  }

  return {
    handleTrainerAction,
    handleAction,
    handleCommand,
    handleNudge,
    handleTrainerCommand,
    handleTrainerNudge,
  };
}
