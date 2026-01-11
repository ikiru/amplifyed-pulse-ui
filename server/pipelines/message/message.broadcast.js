/**
 * Message Pipeline — broadcastMessage (Placeholder)
 */
import { getSessionMessages } from "./message.state.js";
import { assignThreadColors } from "../../../shared/threadColors.js";

// Thin transport layer. Sends whatever shape was composed upstream.
export function broadcastAudienceMessage(io, message) {
  // DISABLED: Incremental audience message broadcast
  // Rendering must rely exclusively on authoritative state snapshots
  // via `message.state.update`
  return;
}

/**
 * Broadcast authoritative message state snapshot
 */
export function broadcastMessageState({ io, sessionId }) {
  if (!io || !sessionId) return;

  const messages = getSessionMessages(sessionId);
  const messagesWithColors = attachThreadColors(messages);

  io.to(sessionId).emit("message.state.update", {
    sessionId,
    messages: messagesWithColors,
  });
}

function attachThreadColors(messages = []) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return messages;
  }

  const rootCandidates = messages.filter(
    (message) => !message?.envelope?.parentMessageId
  );
  const rootSummaries = rootCandidates
    .map((message) => ({
      messageId: message?.envelope?.messageId,
    }))
    .filter((root) => typeof root.messageId === "string");
  const assignments = assignThreadColors(rootSummaries);
  if (assignments.size === 0) {
    return messages;
  }

  const messageLookup = new Map(
    messages
      .map((message) => [message?.envelope?.messageId, message])
      .filter(([id]) => typeof id === "string")
  );

  const rootColorLookup = new Map(assignments);

  return messages.map((message) => {
    const messageId = message?.envelope?.messageId;
    if (!messageId) {
      return message;
    }
    let threadColor = assignments.get(messageId);
    if (!threadColor) {
      const rootId = resolveRootId(message, messageLookup);
      if (rootId && rootColorLookup.has(rootId)) {
        threadColor = rootColorLookup.get(rootId);
      }
    }
    if (message.threadColor === threadColor) {
      return message;
    }
    return threadColor ? { ...message, threadColor } : message;
  });
}

function resolveRootId(message, lookup) {
  if (!message || !lookup) {
    return null;
  }
  let current = message;
  while (current) {
    const parentId = current?.envelope?.parentMessageId;
    if (!parentId) {
      return current?.envelope?.messageId ?? null;
    }
    const parent = lookup.get(parentId);
    if (!parent) {
      return parentId;
    }
    current = parent;
  }
  return null;
}
