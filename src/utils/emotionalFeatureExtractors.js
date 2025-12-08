// Emotional Feature Extractors (ET-1.1)
// ------------------------------------------------------
// All feature scores return values in the range 0–1.
// These are intentionally lightweight heuristics designed
// to support real-time emotional trend calculations.
// ------------------------------------------------------

import { clamp01 } from "./smoothing";

// Simple keyword lists for heuristic scoring.
const POSITIVE_WORDS = ["great", "good", "yes", "love", "helpful", "clear"];
const NEGATIVE_WORDS = ["bad", "no", "hate", "terrible", "awful"];

const CONFUSION_PATTERNS = [
  /what/i,
  /wait/i,
  /hold on/i,
  /i'?m not sure/i,
  /don'?t follow/i,
  /lost/i,
  /confused/i
];

const FRUSTRATION_PATTERNS = [
  /ugh/i,
  /annoy/i,
  /seriously/i,
  /this (doesn'?t|does not) make sense/i,
  /why is/i
];

// ------------------------------------------------------
// Sentiment (0–1)
// ------------------------------------------------------
export function computeSentiment(text = "") {
  const lower = text.toLowerCase();

  let pos = 0;
  let neg = 0;

  POSITIVE_WORDS.forEach((w) => {
    if (lower.includes(w)) pos += 1;
  });

  NEGATIVE_WORDS.forEach((w) => {
    if (lower.includes(w)) neg += 1;
  });

  const total = pos + neg;
  if (total === 0) return 0.5; // neutral baseline

  const raw = pos / total; // more pos → closer to 1
  return clamp01(raw);
}

// ------------------------------------------------------
// Confusion (0–1)
// ------------------------------------------------------
export function computeConfusion(text = "") {
  return clamp01(
    CONFUSION_PATTERNS.some((p) => p.test(text)) ? 1 : 0
  );
}

// ------------------------------------------------------
// Frustration (0–1)
// ------------------------------------------------------
export function computeFrustration(text = "") {
  return clamp01(
    FRUSTRATION_PATTERNS.some((p) => p.test(text)) ? 1 : 0
  );
}

// ------------------------------------------------------
// Cognitive Load (0–1)
// Heuristics: very short, clipped, or noisy messages.
// ------------------------------------------------------
export function computeCogLoad(text = "") {
  const trimmed = text.trim();
  if (!trimmed) return 0;

  const wordCount = trimmed.split(/\s+/).length;

  // Heuristic: clipped messages (1–3 words) → higher load
  if (wordCount <= 3) return 0.8;

  // Slight load for punctuation clusters
  if (/[!?]{2,}/.test(trimmed)) return 0.4;

  return 0.1; // minimal default load
}

// ------------------------------------------------------
// Dominance (0–1)
// Based on whether the same author is speaking repeatedly.
// history is an array of prior messages.
// ------------------------------------------------------
export function computeDominance(currentMsg, history = []) {
  if (history.length < 2) return 0;

  const lastAuthor = history[history.length - 1]?.author;
  const secondLastAuthor = history[history.length - 2]?.author;

  if (
    lastAuthor &&
    secondLastAuthor &&
    lastAuthor === secondLastAuthor &&
    currentMsg.author === lastAuthor
  ) {
    return 1; // strong dominance signal
  }

  return 0;
}

// ------------------------------------------------------
// Stall (0–1)
// Light heuristic: if fewer than X messages over recent window.
// ------------------------------------------------------
export function computeStall(history = [], windowSize = 10) {
  if (history.length < windowSize) return 0;
  const recent = history.slice(-windowSize);
  const uniqueAuthors = new Set(recent.map((m) => m.author)).size;

  // Few unique authors → stalling participation
  if (uniqueAuthors <= 2) return 0.7;

  return 0.1;
}

// ------------------------------------------------------
// Weighted Composite Emotional Score (0–1)
// ------------------------------------------------------
export function computeCompositeEmotion({
  sentiment,
  confusion,
  frustration,
  cogLoad,
  stall,
  dominance
}) {
  const raw =
    0.45 * sentiment -
    0.25 * frustration -
    0.20 * confusion -
    0.10 * cogLoad -
    0.10 * stall -
    0.10 * dominance;

  return clamp01(raw);
}
