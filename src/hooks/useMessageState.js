import { useState, useCallback } from "react";

/**
 * useMessageState
 * 
 * Manages message-related state:
 * - Messages array
 * - Vote totals per message
 * - Reply drafts (message ID → draft text)
 * - Current reply target (which message is being replied to)
 * - Message input (top-level message input)
 * 
 * Provides handlers for:
 * - Submitting top-level messages
 * - Submitting replies to existing messages
 * - Managing reply drafts
 * 
 * Role-agnostic: works for any participant role.
 * 
 * @param {object} params
 * @param {function} params.emit - Socket emit function from useSocket
 */
export function useMessageState({ emit }) {
  const [messages, setMessages] = useState([]);
  const [voteTotals, setVoteTotals] = useState({});
  const [messageInput, setMessageInput] = useState("");
  const [replyToId, setReplyToId] = useState(null);
  const [replyDrafts, setReplyDrafts] = useState({});

  /**
   * Emit a message (either top-level or reply)
   * @param {object} params
   * @param {string} params.text - Message text
   * @param {string|null} params.parentMessageId - Parent message ID for replies
   * @returns {boolean} - true if message was sent, false otherwise
   */
  const emitMessage = useCallback(({ text, parentMessageId = null }) => {
    const trimmed = text?.trim();
    if (!trimmed) {
      return false;
    }

    emit("message:trainerReply", {
      content: { type: "text", text: trimmed },
      parentMessageId,
    });

    return true;
  }, [emit]);

  /**
   * Handle submission of top-level message
   */
  const handleMessageSubmit = useCallback((event) => {
    event.preventDefault();
    if (emitMessage({ text: messageInput })) {
      setMessageInput("");
    }
  }, [messageInput, emitMessage, setMessageInput]);

  /**
   * Handle submission of reply to a specific message
   */
  const handleReplySubmit = useCallback((parentMessageId) => {
    const draft = replyDrafts[parentMessageId] ?? "";
    if (!emitMessage({ text: draft, parentMessageId })) {
      return;
    }

    setReplyDrafts((prev) => {
      const next = { ...prev };
      delete next[parentMessageId];
      return next;
    });
    setReplyToId(null);
  }, [replyDrafts, emitMessage, setReplyDrafts, setReplyToId]);

  return {
    // State
    messages,
    setMessages,
    voteTotals,
    setVoteTotals,
    messageInput,
    setMessageInput,
    replyToId,
    setReplyToId,
    replyDrafts,
    setReplyDrafts,

    // Handlers
    handleMessageSubmit,
    handleReplySubmit,
  };
}
