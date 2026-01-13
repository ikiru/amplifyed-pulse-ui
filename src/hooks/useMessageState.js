import { useState } from "react";

/**
 * useMessageState
 * 
 * Manages message-related state for TrainerView:
 * - Messages array
 * - Vote totals per message
 * - Reply drafts (message ID → draft text)
 * - Current reply target (which message is being replied to)
 * - Trainer input (top-level message input)
 * 
 * Provides handlers for:
 * - Submitting top-level messages
 * - Submitting replies to existing messages
 * - Managing reply drafts
 * 
 * @param {object} params
 * @param {function} params.emit - Socket emit function from useSocket
 */
export function useMessageState({ emit }) {
  const [messages, setMessages] = useState([]);
  const [voteTotals, setVoteTotals] = useState({});
  const [trainerInput, setTrainerInput] = useState("");
  const [trainerReplyToId, setTrainerReplyToId] = useState(null);
  const [trainerReplyDrafts, setTrainerReplyDrafts] = useState({});

  /**
   * Emit a trainer message (either top-level or reply)
   * @param {object} params
   * @param {string} params.text - Message text
   * @param {string|null} params.parentMessageId - Parent message ID for replies
   * @returns {boolean} - true if message was sent, false otherwise
   */
  const emitTrainerMessage = ({ text, parentMessageId = null }) => {
    const trimmed = text?.trim();
    if (!trimmed) {
      return false;
    }

    emit("message:trainerReply", {
      content: { type: "text", text: trimmed },
      parentMessageId,
    });

    return true;
  };

  /**
   * Handle submission of top-level trainer message
   */
  const handleTrainerSubmit = (event) => {
    event.preventDefault();
    if (emitTrainerMessage({ text: trainerInput })) {
      setTrainerInput("");
    }
  };

  /**
   * Handle submission of reply to a specific message
   */
  const handleTrainerReplySubmit = (parentMessageId) => {
    const draft = trainerReplyDrafts[parentMessageId] ?? "";
    if (!emitTrainerMessage({ text: draft, parentMessageId })) {
      return;
    }

    setTrainerReplyDrafts((prev) => {
      const next = { ...prev };
      delete next[parentMessageId];
      return next;
    });
    setTrainerReplyToId(null);
  };

  return {
    // State
    messages,
    setMessages,
    voteTotals,
    setVoteTotals,
    trainerInput,
    setTrainerInput,
    trainerReplyToId,
    setTrainerReplyToId,
    trainerReplyDrafts,
    setTrainerReplyDrafts,

    // Handlers
    handleTrainerSubmit,
    handleTrainerReplySubmit,
  };
}
