import { create } from "zustand";

// Hard cap to prevent runaway memory
const MAX_MESSAGES = 300;

const safe = (value) => (value !== undefined && value !== null ? value : "");

const normalizeTimestamp = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : Date.now();
};

const buildMessage = (payload = {}) => {
  const normalizedMessage = payload.message ?? payload.text;
  return {
    id: safe(payload.id) || crypto.randomUUID(),
    message: safe(normalizedMessage),
    timestamp: normalizeTimestamp(payload.timestamp),
    author: safe(payload.author || payload.sender || payload.role || "audience"),
    role: safe(payload.role || "participant"),
  };
};

export const useMessageStream = create((set, get) => ({
  messages: [],

  addMessage(payload) {
    const msg = buildMessage(payload);
    const list = get().messages;

    const next = [...list, msg];
    const trimmed =
      next.length > MAX_MESSAGES ? next.slice(next.length - MAX_MESSAGES) : next;

    set({ messages: trimmed });
  },

  clearMessages() {
    set({ messages: [] });
  },
}));

export default useMessageStream;
