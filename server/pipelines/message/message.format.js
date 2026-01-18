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
  focusId = null,
  focusText = null,
}) {
  return {
    envelope: {
      messageId,
      sessionId,
      authorRole,
      timestamp,
      parentMessageId,
      focusId,
      focusText,
    },
    payload: {
      content,
    },
  };
}
