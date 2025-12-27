// Centralized passive confusion phrase library
// Behavior-neutral extraction (Step 7.3)

export const CONFUSION_PHRASES = [
  "confused",
  "i am confused",
  "i don't understand",
  "i dont understand",
  "i'm confused",
  "im confused",
  "this is confusing",
  "i'm lost",
  "im lost",
  "can you explain",
  "what does this mean",
  "i don't get it",
  "i dont get it",
];

export function detectConfusionFromText(text) {
  if (!text || typeof text !== "string") return false;

  const normalized = text.toLowerCase();
  return CONFUSION_PHRASES.some((phrase) =>
    normalized.includes(phrase)
  );
}
