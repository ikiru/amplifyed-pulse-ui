/**
 * Pulse Utilities
 * 
 * Utility functions for pulse data processing and vote counting.
 */

/**
 * Computes summary counts of pulse votes (engaged, neutral, frustrated)
 * Filters to only count audience members (not trainers)
 * @param {Object} livePulse - Live pulse data object with votes
 * @param {Object} canonicalParticipants - Map of participant data
 * @returns {Object} - Object with engaged, neutral, frustrated counts
 */
export function computePulseSummaryCounts(livePulse, canonicalParticipants) {
  const counts = { engaged: 0, neutral: 0, frustrated: 0 };
  if (!livePulse || !livePulse.votes || typeof livePulse.votes !== "object") {
    return counts;
  }

  const participantsMap =
    canonicalParticipants && typeof canonicalParticipants === "object"
      ? canonicalParticipants
      : livePulse.participants;
  const hasParticipantData =
    participantsMap && typeof participantsMap === "object";

  Object.entries(livePulse.votes).forEach(([voterId, vote]) => {
    const participant = hasParticipantData ? participantsMap[voterId] : null;
    const participantRole = participant?.actorRole ?? participant?.role;
    if (hasParticipantData && (!participant || participantRole !== "audience")) {
      return;
    }

    if (vote === "engaged") {
      counts.engaged += 1;
    } else if (vote === "neutral") {
      counts.neutral += 1;
    } else if (vote === "frustrated") {
      counts.frustrated += 1;
    }
  });

  return counts;
}
