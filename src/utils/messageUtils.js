/**
 * Message Utilities
 * 
 * Utility functions for message processing and tree building.
 */

/**
 * Adds sibling position metadata to messages for iOS-style bubble styling
 * @param {Array} siblings - Array of sibling messages
 */
function annotateSiblingPositions(siblings) {
  if (!Array.isArray(siblings) || siblings.length === 0) return;
  
  siblings.forEach((msg, index) => {
    msg.hasPreviousSibling = index > 0;
    msg.hasNextSibling = index < siblings.length - 1;
    
    // Recursively annotate nested replies
    if (msg.replies && msg.replies.length > 0) {
      annotateSiblingPositions(msg.replies);
    }
  });
}

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

  // Annotate sibling positions for iOS-style message bubble corners
  roots.forEach((root) => {
    if (root.replies && root.replies.length > 0) {
      annotateSiblingPositions(root.replies);
    }
  });

  return roots;
}
