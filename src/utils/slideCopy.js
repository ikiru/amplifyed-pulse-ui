/**
 * Human-facing text for slide control acks and rejections.
 * Contract §12.3: rejection reasons shown verbatim (mapped to human text).
 */

export function ackToHuman(ack, reason) {
  if (!ack) return "";
  const r = reason ? ` — ${reason}` : "";
  const map = {
    ACK_EXECUTED: "Done",
    REJECTED_NOT_CONNECTED: "Agent not connected. Start the slide control agent on this machine.",
    REJECTED_NOT_BOUND: "Not bound. Select a slide target.",
    REJECTED_TARGET_NOT_FOUND: "Target lost. Rebind to the slides window.",
    REJECTED_PERMISSION_DENIED: "macOS Accessibility permission required. Enable in System Settings > Privacy & Security > Accessibility.",
    REJECTED_RATE_LIMIT: "Too soon. Wait a moment.",
    REJECTED_BUSY: "A command is in progress.",
    REJECTED_UNSUPPORTED_PLATFORM: "This platform is not supported.",
    REJECTED_UNKNOWN: "Something went wrong.",
  };
  return (map[ack] || ack) + r;
}
