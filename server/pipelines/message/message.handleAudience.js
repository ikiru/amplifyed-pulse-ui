/**
 * Message Pipeline — handleMessageFromAudience (Placeholder)
 */
import { addMessage } from "./message.state.js";
import { formatAudienceMessage } from "./message.format.js";

export function handleMessageFromAudience({ payload } = {}) {
  const { sessionId, actorRole, parentMessageId, content } = payload || {};

  if (!sessionId || !content) {
    console.warn("[MESSAGE][AUDIENCE] missing payload", payload);
    return;
  }

  const formattedMessage = formatAudienceMessage({
    content,
    parentMessageId,
    actorRole,
  });

  // Write to authoritative message state
  addMessage({
    sessionId,
    message: formattedMessage,
  });

  console.log("[MESSAGE][AUDIENCE] stored", {
    sessionId,
    messageId: formattedMessage.messageId,
  });
}
