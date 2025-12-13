/**
 * Phase 3.7 — Trainer Insight Generation
 * Design: pull-based, aggregate, non-directive
 */

const CATEGORY_MODIFIERS = {
  pace: 0.0,
  clarity: -0.05,
  cognitive_load: -0.10,
  alignment: +0.05,
  energy: -0.05
};

const MIN_CONFIDENCE = 0.70;

export function generateTrainerInsights(moment) {
  if (!moment?.interpretation) return [];

  const { category, confidence, stable, signals } = moment.interpretation;

  if (!stable) return [];
  if (!CATEGORY_MODIFIERS.hasOwnProperty(category)) return [];

  const adjustedConfidence =
    confidence + CATEGORY_MODIFIERS[category];

  if (adjustedConfidence < MIN_CONFIDENCE) return [];

  return [
    {
      id: `${category}_signal`,
      category,
      confidence: Number(adjustedConfidence.toFixed(2)),
      severity: adjustedConfidence >= 0.85 ? "moderate" : "low",
      language: insightLanguage(category, adjustedConfidence),
      supportingSignals: signals || []
    }
  ];
}

function insightLanguage(category, confidence) {
  const soft = confidence < 0.80;

  const copy = {
    pace: [
      "Some participants may be finding the pace challenging.",
      "There appears to be a sustained signal that the pace may be fast for part of the room."
    ],
    clarity: [
      "Some concepts may benefit from additional clarification.",
      "Participants may be uncertain about expectations in this moment."
    ],
    cognitive_load: [
      "This moment may feel dense for some participants.",
      "Participants appear to be experiencing increased cognitive load."
    ],
    alignment: [
      "Participants appear aligned with the content.",
      "This moment seems to be landing well across the room."
    ],
    energy: [
      "Energy may be dipping slightly.",
      "The room’s momentum appears lower than earlier moments."
    ]
  };

  return soft ? copy[category][0] : copy[category][1];
}
