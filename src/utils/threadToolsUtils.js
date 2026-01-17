/**
 * Thread Tools Utilities (trainer-local)
 *
 * Pure helper functions to summarize a message thread for lensing.
 * Intentionally meaning-light: only counts, timestamps, and discrete topic states.
 */

export const TOPIC_STATE = Object.freeze({
  ON_TOPIC: "on_topic",
  OFF_TOPIC: "off_topic",
});

export function getMessageTimestampMs(node) {
  const ts = node?.envelope?.timestamp;
  if (typeof ts === "number" && Number.isFinite(ts)) {
    return ts;
  }
  const createdAt = node?.createdAt;
  if (typeof createdAt === "string") {
    const parsed = Date.parse(createdAt);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

export function walkThread(root, visitor) {
  if (!root) return;
  visitor(root);
  const replies = Array.isArray(root.replies) ? root.replies : [];
  replies.forEach((child) => walkThread(child, visitor));
}

export function countReplies(root) {
  let count = 0;
  const replies = Array.isArray(root?.replies) ? root.replies : [];
  replies.forEach((child) => {
    walkThread(child, (node) => {
      if (node?.messageId) {
        count += 1;
      }
    });
  });
  return count;
}

export function computeTopicState(root) {
  let isOffTopic = false;
  walkThread(root, (node) => {
    const label =
      typeof node?.label === "string" ? node.label.toLowerCase() : "";
    if (label === "off_focus" || label === "off focus") {
      isOffTopic = true;
    }
  });
  return isOffTopic ? TOPIC_STATE.OFF_TOPIC : TOPIC_STATE.ON_TOPIC;
}

export function getLatestThreadTimestampMs(root) {
  let latest = null;
  walkThread(root, (node) => {
    const ts = getMessageTimestampMs(node);
    if (typeof ts === "number") {
      latest = latest === null ? ts : Math.max(latest, ts);
    }
  });
  return latest;
}

export function summarizeThread(root) {
  const rootMessageId =
    typeof root?.messageId === "string" ? root.messageId : null;
  return {
    rootMessageId,
    latestMessageTsMs: getLatestThreadTimestampMs(root),
    replyCount: countReplies(root),
    topicState: computeTopicState(root),
  };
}

export function computeActivityPulseUpdates(prevLatestTsByRootId = {}, summaries = [], nowMs) {
  const now = typeof nowMs === "number" ? nowMs : Date.now();
  const nextPrev = { ...(prevLatestTsByRootId ?? {}) };
  const activityAtUpdates = {};

  summaries.forEach((summary) => {
    const rootId = summary?.rootMessageId;
    if (!rootId) return;
    const latest = summary.latestMessageTsMs;
    if (typeof latest !== "number") return;
    const prevLatest = nextPrev[rootId];
    if (typeof prevLatest === "number" && latest > prevLatest) {
      activityAtUpdates[rootId] = now;
    }
    nextPrev[rootId] = latest;
  });

  return { nextPrevLatestTsByRootId: nextPrev, activityAtUpdates, nowMs: now };
}

export function didCrossUpwardThreshold(prevValue, nextValue, threshold) {
  if (typeof threshold !== "number") return false;
  if (typeof prevValue !== "number" || typeof nextValue !== "number") {
    return false;
  }
  return prevValue < threshold && nextValue >= threshold;
}

export function didChangeValue(prevValue, nextValue) {
  if (prevValue === null || prevValue === undefined) return false;
  if (nextValue === null || nextValue === undefined) return false;
  return prevValue !== nextValue;
}

