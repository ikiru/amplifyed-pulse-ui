/**
 * Message Utilities
 * 
 * Utility functions for message processing and tree building.
 */

/**
 * Builds a hierarchical tree structure from flat message array
 * @param {Array} messages - Flat array of message objects
 * @returns {Array} - Array of root messages with nested replies
 */
export function buildMessageTree(messages) {
  const map = {};
  const roots = [];

  messages.forEach((msg) => {
    if (!msg || typeof msg.messageId !== "string") return;
    map[msg.messageId] = { ...msg, replies: [] };
  });

  messages.forEach((msg) => {
    if (!msg || typeof msg.messageId !== "string") return;
    if (msg.parentMessageId && map[msg.parentMessageId]) {
      map[msg.parentMessageId].replies.push(map[msg.messageId]);
    } else if (map[msg.messageId]) {
      roots.push(map[msg.messageId]);
    }
  });

  return roots;
}
