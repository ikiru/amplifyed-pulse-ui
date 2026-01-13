/**
 * Confusion Utilities
 * 
 * Utility functions for confusion detection, thread classification,
 * and off-topic marker detection.
 */

const OFF_TOPIC_PATTERN = /off[-_\s]?topic/i;

const AUDIENCE_LABEL_DISPLAY = {
  off_focus: "Off Focus",
  on_topic: "On Topic",
};

/**
 * Recursively checks if a value matches off-topic patterns
 * @param {*} value - Value to check (can be boolean, string, array, or object)
 * @returns {boolean} - True if value indicates off-topic
 */
export function matchesOffTopicValue(value) {
  if (value === true) {
    return true;
  }
  if (typeof value === "string") {
    return OFF_TOPIC_PATTERN.test(value);
  }
  if (Array.isArray(value)) {
    return value.some(matchesOffTopicValue);
  }
  if (value && typeof value === "object") {
    return Object.values(value).some(matchesOffTopicValue);
  }
  return false;
}

/**
 * Checks if a source object has off-topic markers in common fields
 * @param {Object} source - Object to check for off-topic markers
 * @returns {boolean} - True if off-topic markers found
 */
export function hasOffTopicMarker(source) {
  if (!source || typeof source !== "object") {
    return false;
  }
  return (
    matchesOffTopicValue(source.offTopic ?? source.isOffTopic) ||
    matchesOffTopicValue(source.topicStatus ?? source.classification) ||
    matchesOffTopicValue(source.labels ?? source.tags ?? source.flags)
  );
}

/**
 * Determines if a thread is off-topic based on root message and confusion signal
 * @param {Object} root - Root message object
 * @param {Object} confusionSignal - Confusion signal data
 * @returns {boolean} - True if thread is off-topic
 */
export function isThreadOffTopic(root, confusionSignal) {
  if (hasOffTopicMarker(confusionSignal)) {
    return true;
  }
  if (hasOffTopicMarker(root?.payload?.meta)) {
    return true;
  }
  if (hasOffTopicMarker(root?.payload?.content?.meta)) {
    return true;
  }
  if (hasOffTopicMarker(root?.payload)) {
    return true;
  }
  if (hasOffTopicMarker(root?.payload?.content)) {
    return true;
  }
  return false;
}

/**
 * Gets display-friendly label text for audience labels
 * @param {string} label - Internal label identifier
 * @returns {string|null} - Display text or null
 */
export function getAudienceLabelDisplay(label) {
  if (!label) return null;
  return AUDIENCE_LABEL_DISPLAY[label] ?? label;
}

/**
 * Summarizes confusion state for a thread
 * Calculates confusion metrics and determines display properties
 * @param {Object} root - Root message object
 * @param {Object} confusionByRootId - Map of confusion signals by root ID
 * @returns {Object} - Confusion summary with score, visibility flags, etc.
 */
export function summarizeThreadConfusion(root, confusionByRootId) {
  const confusionSignal = confusionByRootId?.[root.messageId];
  const contributorValue = confusionSignal?.contributors;
  const contributorCountFromSignal = Array.isArray(contributorValue)
    ? contributorValue.length
    : typeof contributorValue === "number"
      ? contributorValue
      : contributorValue && typeof contributorValue === "object"
        ? Object.keys(contributorValue).length
        : undefined;
  const contributorCount = Math.max(
    0,
    contributorCountFromSignal ??
      (typeof confusionSignal?.confusionScore === "number"
        ? confusionSignal.confusionScore
        : 0)
  );
  const confusionScore =
    typeof confusionSignal?.confusionScore === "number"
      ? confusionSignal.confusionScore
      : contributorCount;
  const resolutionType = confusionSignal?.resolutionType;
  const isRoot = !root.parentMessageId;
  const hasConfusionSignal = contributorCount > 0;
  const threadIsOffTopic = isThreadOffTopic(root, confusionSignal);
  const showConfusionRow = isRoot && hasConfusionSignal && !threadIsOffTopic;

  return {
    confusionSignal,
    contributorCount,
    confusionScore,
    resolutionType,
    showConfusionRow,
    threadIsOffTopic,
    isRoot,
  };
}
