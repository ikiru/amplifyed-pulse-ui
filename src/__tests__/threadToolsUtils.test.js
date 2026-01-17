import { describe, expect, it } from "vitest";
import {
  TOPIC_STATE,
  computeTopicState,
  countReplies,
  didChangeValue,
  didCrossUpwardThreshold,
  getLatestThreadTimestampMs,
} from "../utils/threadToolsUtils.js";

describe("threadToolsUtils", () => {
  it("countReplies counts all descendants (excluding the root)", () => {
    const root = {
      messageId: "root",
      replies: [
        { messageId: "a", replies: [] },
        {
          messageId: "b",
          replies: [{ messageId: "b1", replies: [{ messageId: "b1a", replies: [] }] }],
        },
      ],
    };

    expect(countReplies(root)).toBe(4);
  });

  it("getLatestThreadTimestampMs returns the max timestamp across the thread", () => {
    const root = {
      messageId: "root",
      envelope: { timestamp: 10 },
      replies: [
        { messageId: "a", envelope: { timestamp: 20 }, replies: [] },
        {
          messageId: "b",
          createdAt: new Date(30).toISOString(),
          replies: [{ messageId: "b1", envelope: { timestamp: 25 }, replies: [] }],
        },
      ],
    };

    expect(getLatestThreadTimestampMs(root)).toBe(30);
  });

  it("computeTopicState marks thread off_topic if any message is labeled off_focus", () => {
    const root = {
      messageId: "root",
      replies: [
        { messageId: "a", replies: [] },
        { messageId: "b", label: "off_focus", replies: [] },
      ],
    };

    expect(computeTopicState(root)).toBe(TOPIC_STATE.OFF_TOPIC);
  });

  it("computeTopicState marks thread on_topic when no off_focus label is present", () => {
    const root = {
      messageId: "root",
      replies: [{ messageId: "a", replies: [] }],
    };

    expect(computeTopicState(root)).toBe(TOPIC_STATE.ON_TOPIC);
  });

  it("didCrossUpwardThreshold detects threshold crossings (exclusive below → inclusive at/above)", () => {
    expect(didCrossUpwardThreshold(4, 5, 5)).toBe(true);
    expect(didCrossUpwardThreshold(5, 6, 5)).toBe(false);
    expect(didCrossUpwardThreshold(3, 4, 5)).toBe(false);
    expect(didCrossUpwardThreshold(null, 5, 5)).toBe(false);
  });

  it("didChangeValue detects changes but ignores undefined/null as previous state", () => {
    expect(didChangeValue("on_topic", "off_topic")).toBe(true);
    expect(didChangeValue("on_topic", "on_topic")).toBe(false);
    expect(didChangeValue(null, "off_topic")).toBe(false);
  });
});

