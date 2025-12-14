/**
 * Message Pipeline — formatMessage (Placeholder)
 */

// Canonical constructor for message transport shape.
export function formatMessage({
  messageId,
  sessionId,
  authorRole,
  timestamp,
  parentMessageId = null,
  content,
}) {
  return {
    envelope: {
      messageId,
      sessionId,
      authorRole,
      timestamp,
      parentMessageId,
    },
    payload: {
      content,
    },
  };
}
