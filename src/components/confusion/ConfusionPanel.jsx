import React from "react";
import { ConfusionMeter } from "../messages/ConfusionMeter.jsx";
import { scrollToThreadRoot } from "../../utils/threadUtils.js";

/**
 * ConfusionPanel
 * 
 * Displays threads with confusion scores in the left column.
 * Allows clicking to scroll to the thread in the message stream.
 * 
 * @param {object} props
 * @param {Array} props.confusionThreads - Array of {root, confusion} objects
 * @param {function} props.onScrollToThread - Callback to scroll to thread (emits socket event)
 */
export function ConfusionPanel({ confusionThreads, onScrollToThread }) {
  const handleClick = (rootMessageId) => {
    // Scroll locally
    scrollToThreadRoot(rootMessageId);
    // Emit socket event if callback provided (to scroll LiveView)
    if (onScrollToThread) {
      onScrollToThread(rootMessageId);
    }
  };

  return (
    <div className="trainer-confusion-panel">
      <h3 className="trainer-section-heading trainer-confusion-heading">
        Confusion
      </h3>
      <div className="trainer-confusion-list">
        {confusionThreads.length ? (
          confusionThreads.map(({ root, confusion }) => (
            <div
              key={root.messageId}
              onClick={() => handleClick(root.messageId)}
              className="trainer-confusion-thread"
            >
              <div className="trainer-confusion-thread-heading">
                <span className="trainer-confusion-thread-title">
                  {root.text ?? root.messageId}
                </span>
              </div>
              <ConfusionMeter confusionScore={confusion.confusionScore} />
            </div>
          ))
        ) : (
          <div className="trainer-confusion-empty">
            No threads currently surfaced
          </div>
        )}
      </div>
    </div>
  );
}
