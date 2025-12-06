// src/utils/sanitizeMessage.js
// North Star: Radical Transparency + Data Safety

const getRandomId = () => {
  const platformCrypto = typeof globalThis !== "undefined" ? globalThis.crypto : null;
  if (platformCrypto && typeof platformCrypto.randomUUID === "function") {
    return platformCrypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function sanitizeMessage(raw) {
  if (!raw) return null;

  const msg =
    typeof raw === "string"
      ? raw
      : raw?.message ?? raw?.text ?? null;
  if (!msg || typeof msg !== "string") return null;

  const trimmed = msg.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("[echo]")) return null;

  return {
    id: getRandomId(),
    body: trimmed,
    timestamp: Number.isFinite(raw?.timestamp) ? raw.timestamp : Date.now(),
    author: raw?.author ?? raw?.sender ?? "unknown",
  };
}

export default sanitizeMessage;
