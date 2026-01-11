import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import "./AudienceInput.css";
export function buildMessageTree(messages) {
  const map = {};
  const roots = [];

  messages.forEach((msg) => {
    if (!msg || typeof msg.messageId !== "string") return;
    map[msg.messageId] = { ...msg, replies: [] };
  });

  messages.forEach((msg) => {
    if (!msg || typeof msg.messageId !== "string") return;
    if (msg.parentMessageId && map[msg.parentMessageId]) {
      map[msg.parentMessageId].replies.push(map[msg.messageId]);
    } else if (map[msg.messageId]) {
      roots.push(map[msg.messageId]);
    }
  });

  return roots;
}

const RESOLUTION_DROPDOWN_LABELS = {
  clarified: "Clarified",
  example: "Example",
  reframed: "Reframed",
};

export function ConfusionMeter({ confusionScore }) {
  const MAX_BARS = 8;
  const normalizedScore = confusionScore ?? 0;
  const filled = Math.max(0, Math.min(normalizedScore, MAX_BARS));

  return (
    <div className="confusion-meter" aria-hidden="true">
      <div className="confusion-bars">
        {Array.from({ length: MAX_BARS }).map((_, i) => (
          <span
            key={i}
            className={i < filled ? "bar filled" : "bar empty"}
          />
        ))}
      </div>
    </div>
  );
}

export function ThreadItem(props) {
  const depth = props.depth ?? 0;
  if (depth === 0) {
    return <AnchorThreadItem {...props} />;
  }

  return <ThreadItemContent {...props} />;
}

function AnchorThreadItem(props) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  return (
    <ThreadConnectorOverlay
      {...props}
      isAnchor
      isCollapsed={isCollapsed}
      onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
    />
  );
}

function ThreadConnectorOverlay({
  node,
  depth = 0,
  threadColor,
  registerMessageRef: _registerMessageRef,
  ...props
}) {
  if (!node || typeof node.messageId !== "string") {
    return null;
  }
  const rowRef = useRef(null);
  const messageRefs = useRef(new Map());
  const [rowNode, setRowNode] = useState(null);
  const [connectorPaths, setConnectorPaths] = useState([]);
  const [overlaySize, setOverlaySize] = useState({ width: 0, height: 0 });
  const [messageRegistryVersion, setMessageRegistryVersion] = useState(0);

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
    messageRefs.current.forEach(({ node: messageNode, parentId }, messageId) => {
      if (!messageNode || !parentId) {
        return;
      }
      const parentEntry = messageRefs.current.get(parentId);
      if (!parentEntry?.node) {
        return;
      }
      const parentRect = parentEntry.node.getBoundingClientRect();
      const parentX = parentRect.left - rowRect.left;
      const parentY = parentRect.bottom - rowRect.top;
      const replyRect = messageNode.getBoundingClientRect();
      const childX = replyRect.left - rowRect.left;
      const childY =
        replyRect.top + replyRect.height / 2 - rowRect.top;
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
    (messageId, parentMessageId, element) => {
      if (element) {
        messageRefs.current.set(messageId, {
          node: element,
          parentId: parentMessageId,
        });
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
      observer = new ResizeObserver(() => updatePath());
      const nodesToObserve = new Set([rowNode]);
      messageRefs.current.forEach(({ node }) => {
        if (node) {
          nodesToObserve.add(node);
        }
      });
      nodesToObserve.forEach((node) => {
        if (node) {
          observer.observe(node);
        }
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
  const resolvedThreadColor =
    typeof threadColor === "string"
      ? threadColor
      : typeof node?.threadColor === "string"
        ? node.threadColor
        : "#e63946";
  const themeStyle = { "--thread-color": resolvedThreadColor };

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
      <div
        id={`thread-root-${node.messageId}`}
        className="trainer-thread-wrapper"
      >
        <ThreadItemContent
          {...props}
          node={node}
          depth={depth}
          registerMessageRef={registerMessageRef}
        />
      </div>
    </div>
  );
}

function ThreadItemContent({
  node,
  depth = 0,
  replyToId,
  setReplyToId,
  replyDrafts,
  setReplyDrafts,
  handleSubmitReply,
  voteTotals,
  voteTotalsMap,
  confusionByRootId,
  onConfusionSignal = () => {},
  onOffFocusSignal = () => {},
  emitVoteIntent,
  voteSelectionMap,
  showVoteControls = true,
  showVoteTotals = true,
  showReplyControls = true,
  isAnchor = false,
  isCollapsed = false,
  onToggleCollapse,
  actorRole,
  role,
  showConfusionRow = false,
  allowConfusionAnchors = true,
  allowConfusionRow = true,
  confusionScore,
  resolutionType,
  showVoteReadOnly = false,
  resolutionBy,
  registerMessageRef,
  showLineageBar = false,
}) {
  const viewerRole = actorRole ?? role ?? "audience";
  const selectedVote = voteSelectionMap?.[node.messageId] ?? null;
  const isReplyOpen = replyToId === node.messageId;
  const canToggleCollapse = isAnchor && typeof onToggleCollapse === "function";
  const repliesVisible = !isAnchor || !isCollapsed;
  const isTrainerMessage = node?.actorRole === "trainer";
  const isReply = depth > 0;
  const messageRef = useRef(null);
  const threadMessageClassNames = ["thread-message"];
  if (isTrainerMessage) {
    threadMessageClassNames.push("trainer-message");
  }
  if (isReply) {
    threadMessageClassNames.push("thread-message-reply");
  }
  const hasReplies = Array.isArray(node?.replies) && node.replies.length > 0;
  if (hasReplies) {
    threadMessageClassNames.push("thread-message-has-replies");
  }
  const normalizedLabel =
    typeof node?.label === "string" ? node.label.toLowerCase() : "";
  const normalizedLabelDisplay =
    typeof node?.labelDisplay === "string"
      ? node.labelDisplay.toLowerCase()
      : "";
  const isOffFocus =
    normalizedLabel === "off_focus" ||
    normalizedLabel === "off focus" ||
    normalizedLabelDisplay === "off focus";
  const resolutionActorRaw =
    typeof resolutionBy === "string"
      ? resolutionBy
      : typeof node?.actorRole === "string"
        ? node.actorRole
        : null;
  const resolutionActor =
    typeof resolutionActorRaw === "string"
      ? resolutionActorRaw.toLowerCase()
      : null;
  const threadColor = node?.threadColor;
  const threadStyle =
    typeof threadColor === "string"
      ? { "--thread-color": threadColor }
      : undefined;
  const resolutionAttribution =
    resolutionType && resolutionActor
      ? `by ${resolutionActor}`
      : null;
  const handleReplyToggle = () => {
    if (!setReplyToId) return;
    setReplyToId(isReplyOpen ? null : node.messageId);
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();
    if (handleSubmitReply) {
      handleSubmitReply(node.messageId);
    }
  };

  const replyDraftValue = replyDrafts?.[node.messageId] ?? "";
  const hasVoteHandler = typeof emitVoteIntent === "function";
  const canVote = hasVoteHandler && viewerRole === "audience";
  const shouldShowVotes =
    showVoteControls && (viewerRole === "audience" || showVoteReadOnly);
  const totalVoteCount =
    (voteTotals?.up ?? 0) + (voteTotals?.down ?? 0);
  const showTrainerVoteTallies =
    viewerRole === "trainer" && voteTotals && totalVoteCount > 0;
  const trainerDownCount = voteTotals?.down ?? 0;
  const trainerUpCount = voteTotals?.up ?? 0;

  const handleVoteClick = (voteType) => {
    if (!emitVoteIntent) return;
    emitVoteIntent(node.messageId, voteType);
  };

  const handleCollapseToggle = () => {
    if (!onToggleCollapse) return;
    onToggleCollapse();
  };

  useEffect(() => {
    if (!registerMessageRef) {
      return undefined;
    }
    const parentId = node?.parentMessageId ?? null;
    if (node?.messageId) {
      registerMessageRef(node.messageId, parentId, messageRef.current);
    }
    return () => registerMessageRef(node.messageId, parentId, null);
  }, [registerMessageRef, node.messageId, node.parentMessageId]);

  return (
    <div className="thread-item">
      <div
        className={threadMessageClassNames.join(" ")}
        ref={messageRef}
        style={threadStyle}
      >
        {showLineageBar && (
          <div className="trainer-message-lineage-gutter" aria-hidden="true">
            <div
              className="trainer-message-lineage-bar"
              aria-hidden="true"
              role="presentation"
            />
          </div>
        )}
        {isTrainerMessage && (
          <div className="thread-message-trainer-badge">Trainer</div>
        )}
        <div className="message-row">
          {shouldShowVotes && viewerRole === "audience" && (
            <button
              type="button"
              className={`vote-btn down ${
                selectedVote === "down" ? "selected" : ""
              }`}
              onClick={() => handleVoteClick("down")}
              aria-label="Downvote"
              aria-pressed={selectedVote === "down"}
              disabled={!canVote}
            >
            </button>
          )}
          {showTrainerVoteTallies && trainerDownCount > 0 && (
            <span className="trainer-vote-ledger trainer-vote-down">
              {trainerDownCount}
            </span>
          )}

          <div className="message-content">
            {node.text}
          </div>

          {showTrainerVoteTallies && trainerUpCount > 0 && (
            <span className="trainer-vote-ledger trainer-vote-up">
              {trainerUpCount}
            </span>
          )}
          {shouldShowVotes && viewerRole === "audience" && (
              <button
                type="button"
                className={`vote-btn up ${
                  selectedVote === "up" ? "selected" : ""
                }`}
                onClick={() => handleVoteClick("up")}
                aria-label="Upvote"
                aria-pressed={selectedVote === "up"}
                disabled={!canVote}
              >
              </button>
          )}
        </div>

        <div className="thread-card-row">
          <div className="thread-card-left">
            {canToggleCollapse && (
              <button
                type="button"
                className="thread-collapse-toggle"
                onClick={handleCollapseToggle}
                aria-expanded={!isCollapsed}
                aria-label={isCollapsed ? "Show replies" : "Hide replies"}
              >
                {isCollapsed ? "▶" : "▼"}
              </button>
            )}
          </div>
          <div className="thread-card-center">
            {showConfusionRow && allowConfusionRow && !isOffFocus && (
              <div className="thread-confusion-row">
                <div className="thread-confusion-center">
                  <div className="thread-confusion-line">
                    <span className="thread-confusion-indicator">[ Confused ]</span>
                    <div className="thread-confusion-right">
                      {resolutionType ? (
                        <span className="thread-resolution-label">
                          Resolution: {RESOLUTION_DROPDOWN_LABELS?.[resolutionType] ?? resolutionType}
                        </span>
                      ) : (
                        <select className="thread-resolution-select" defaultValue="">
                          <option value="" disabled hidden>
                            Resolution ▾
                          </option>
                          <option value="clarified">Clarified</option>
                          <option value="example">Example</option>
                          <option value="reframed">Reframed</option>
                        </select>
                      )}
                    </div>
                  </div>
                  {resolutionAttribution && (
                    <div className="thread-resolution-attribution">
                      {resolutionAttribution}
                    </div>
                  )}
                </div>
              </div>
            )}

            {isOffFocus && allowConfusionRow && (
              <div className="thread-confusion-row thread-off-focus-row">
                <span className="thread-off-focus-label">
                  [ {node.labelDisplay ?? "Off Focus"} ]
                </span>
              </div>
            )}
          </div>
          <div className="thread-card-right">
            {showReplyControls && setReplyToId && (
              <div className="thread-actions">
                <button
                  type="button"
                  className="thread-reply-button"
                  onClick={handleReplyToggle}
                >
                  Reply
                </button>
              </div>
            )}
          </div>
        </div>

        {showVoteTotals && voteTotals && viewerRole === "audience" && (
          <div className="thread-vote-totals">
            <span>▲ {voteTotals.up ?? 0}</span>
            <span>▼ {voteTotals.down ?? 0}</span>
          </div>
        )}

      </div>

      {showReplyControls && isReplyOpen && (
        <div className="thread-replies">
          <form className="message-input-bar" onSubmit={handleFormSubmit}>
            <input
              type="text"
              placeholder="Write a reply…"
              value={replyDraftValue}
              onChange={(event) =>
                setReplyDrafts?.((prev) => ({
                  ...prev,
                  [node.messageId]: event.target.value,
                }))
              }
            />
            <button type="submit">Reply</button>
          </form>
        </div>
      )}

      {repliesVisible && node.replies?.length > 0 && (
        <div className="thread-replies">
          {node.replies.map((child, index) => (
            <ThreadItem
              key={child.messageId}
              node={child}
              depth={depth + 1}
              replyToId={replyToId}
              setReplyToId={setReplyToId}
              replyDrafts={replyDrafts}
              setReplyDrafts={setReplyDrafts}
              handleSubmitReply={handleSubmitReply}
              voteTotals={voteTotalsMap?.[child.messageId]}
              voteTotalsMap={voteTotalsMap}
              confusionByRootId={confusionByRootId}
              confusionLevel={confusionByRootId?.[child.messageId] ?? null}
              emitVoteIntent={emitVoteIntent}
              voteSelectionMap={voteSelectionMap}
              actorRole={actorRole}
              showVoteControls={showVoteControls}
              showReplyControls={showReplyControls}
              showVoteTotals={showVoteTotals}
              onConfusionSignal={onConfusionSignal}
              allowConfusionAnchors={allowConfusionAnchors}
              allowConfusionRow={allowConfusionRow}
              showLineageBar={showLineageBar}
              registerMessageRef={registerMessageRef}
            />
          ))}
        </div>
      )}
    </div>
  );
}
