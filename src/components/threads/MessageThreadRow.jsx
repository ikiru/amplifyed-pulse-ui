/**
 * MessageThreadRow Component
 * 
 * Renders a single message thread row with:
 * - SVG connector lines showing reply relationships
 * - Thread color theming (idea-bound color palette)
 * - Lineage gutter for visual thread grouping
 * - Responsive layout with ResizeObserver
 * 
 * This component manages the complex SVG path calculations for drawing
 * visual connectors between parent messages and their replies.
 * 
 * Role-agnostic: displays threads from any participant role.
 */

import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import { ThreadItem } from "../messages/ThreadItem.jsx";
import { THREAD_COLOR_PALETTE } from "../../utils/threadUtils.js";

function MessageThreadRowComponent({
  root,
  confusion,
  confusionByRootId,
  voteTotals,
  voteTotalsMap,
  replyToId,
  setReplyToId,
  replyDrafts,
  setReplyDrafts,
  handleReplySubmit,
  threadColor,
  actorRole = "trainer",
  emitVoteIntent,
  onConfusionSignal,
  onOffFocusSignal,
  voteSelectionMap,
  onScrollToThread,
}) {
  const rowRef = useRef(null);
  const messageRefs = useRef(new Map());
  const [rowNode, setRowNode] = useState(null);
  const [connectorPaths, setConnectorPaths] = useState([]);
  const [overlaySize, setOverlaySize] = useState({ width: 0, height: 0 });
  const [messageRegistryVersion, setMessageRegistryVersion] = useState(0);

  const resolvedThreadColor =
    typeof threadColor === "string"
      ? threadColor
      : THREAD_COLOR_PALETTE[0];
  const themeStyle = { "--thread-color": resolvedThreadColor };

  const updatePath = useCallback(() => {
    const row = rowRef.current;
    if (!row) {
      setOverlaySize({ width: 0, height: 0 });
      setConnectorPaths([]);
      return;
    }
    const rowRect = row.getBoundingClientRect();
    setOverlaySize({ width: rowRect.width, height: rowRect.height });

    const newPaths = [];
    messageRefs.current.forEach(({ node, parentId }, messageId) => {
      if (!node || !parentId) {
        return;
      }
      const parentEntry = messageRefs.current.get(parentId);
      if (!parentEntry?.node) {
        return;
      }
      const parentRect = parentEntry.node.getBoundingClientRect();
      const replyRect = node.getBoundingClientRect();
      
      // Connect at the outer border edge for perfect visual contact
      // With 2px stroke and round linecap, position at exact border edge
      const parentX = parentRect.left - rowRect.left;
      const parentY = parentRect.bottom - rowRect.top;
      
      // Child connection point at left border edge, centered vertically
      const childX = replyRect.left - rowRect.left;
      const childY = replyRect.top + replyRect.height / 2 - rowRect.top;
      
      newPaths.push({
        key: messageId,
        d: `M ${parentX} ${parentY} L ${parentX} ${childY} L ${childX} ${childY}`,
      });
    });

    setConnectorPaths(newPaths);
  }, []);

  const attachRowRef = useCallback((node) => {
    rowRef.current = node;
    setRowNode(node);
  }, []);

  const registerMessageRef = useCallback(
    (messageId, parentMessageId, node) => {
      if (node) {
        messageRefs.current.set(messageId, { node, parentId: parentMessageId });
      } else {
        messageRefs.current.delete(messageId);
      }
      setMessageRegistryVersion((prev) => prev + 1);
      updatePath();
    },
    [updatePath]
  );

  useLayoutEffect(() => {
    updatePath();
    if (!rowNode) {
      return undefined;
    }
    const handleResize = () => updatePath();
    window.addEventListener("resize", handleResize);
    let observer;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(handleResize);
      const nodesToObserve = new Set([rowNode]);
      messageRefs.current.forEach(({ node }) => {
        if (node) nodesToObserve.add(node);
      });
      nodesToObserve.forEach((node) => {
        if (node) observer.observe(node);
      });
    }
    return () => {
      window.removeEventListener("resize", handleResize);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [rowNode, messageRegistryVersion, updatePath]);

  const overlayVisible =
    connectorPaths.length > 0 &&
    overlaySize.width > 0 &&
    overlaySize.height > 0;

  return (
    <div
      className="trainer-message-stream-row"
      ref={attachRowRef}
      style={themeStyle}
    >
      <div className="thread-connector-layer" aria-hidden="true">
        {overlayVisible && (
          <svg
            width={overlaySize.width}
            height={overlaySize.height}
            viewBox={`0 0 ${overlaySize.width} ${overlaySize.height}`}
            preserveAspectRatio="none"
          >
            {connectorPaths.map(({ key, d }) => (
              <path
                key={`connector-${key}`}
                d={d}
                fill="none"
                stroke="var(--thread-color, #e63946)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ))}
          </svg>
        )}
      </div>
      <div className="trainer-message-lineage-gutter">
        <div
          className="trainer-message-lineage-bar"
          aria-hidden="true"
          role="presentation"
        />
      </div>
      <div
        id={`thread-root-${root.messageId}`}
        className="trainer-thread-wrapper"
      >
        <ThreadItem
          node={root}
          depth={0}
          replyToId={replyToId}
          setReplyToId={setReplyToId}
          replyDrafts={replyDrafts}
          setReplyDrafts={setReplyDrafts}
          handleSubmitReply={handleReplySubmit}
          voteTotals={voteTotals}
          voteTotalsMap={voteTotalsMap}
          confusionByRootId={confusionByRootId}
          actorRole={actorRole}
          showVoteControls={true}
          showVoteReadOnly={actorRole === "trainer"}
          showVoteTotals={false}
          allowConfusionAnchors={actorRole === "audience"}
          allowConfusionRow={true}
          showConfusionRow={confusion.showConfusionRow}
          confusionScore={confusion.confusionScore}
          resolutionType={confusion.resolutionType}
          registerMessageRef={registerMessageRef}
          emitVoteIntent={emitVoteIntent}
          onConfusionSignal={onConfusionSignal}
          onOffFocusSignal={onOffFocusSignal}
          voteSelectionMap={voteSelectionMap}
          onScrollToThread={onScrollToThread}
        />
      </div>
    </div>
  );
}

export const MessageThreadRow = React.memo(MessageThreadRowComponent);
