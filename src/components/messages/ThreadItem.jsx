/**
 * ThreadItem Component
 * 
 * Renders a threaded message with support for:
 * - Nested replies (hierarchical indentation)
 * - Voting (upvote/downvote)
 * - Confusion signals
 * - Reply composition
 * - Collapse/expand for anchors
 * 
 * Used by both TrainerView and AudienceInput for displaying message threads.
 */

import { useEffect, useRef, useState } from "react";

const RESOLUTION_DROPDOWN_LABELS = {
  clarified: "Clarified",
  example: "Example",
  reframed: "Reframed",
};

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
    <ThreadItemContent
      {...props}
      isAnchor
      isCollapsed={isCollapsed}
      onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
    />
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
}) {
  const viewerRole = actorRole ?? role ?? "audience";
  const selectedVote = voteSelectionMap?.[node.messageId] ?? null;
  const isReplyOpen = replyToId === node.messageId;
  const canToggleCollapse = isAnchor && typeof onToggleCollapse === "function";
  const repliesVisible = !isAnchor || !isCollapsed;
  const isTrainerMessage = node?.actorRole === "trainer";
  const isReply = depth > 0;
  const messageRef = useRef(null);
  
  // Local state for confusion and off-focus signals
  const [localConfusionSignaled, setLocalConfusionSignaled] = useState(false);
  const [localOffFocusSignaled, setLocalOffFocusSignaled] = useState(false);
  const [localResolutionType, setLocalResolutionType] = useState(null);
  const [localResolvedBy, setLocalResolvedBy] = useState(null);
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
  
  // Message bubble position for dynamic corner roundness
  // This creates iOS-style message bubbles
  const hasPreviousSibling = depth > 0 && node?.hasPreviousSibling;
  const hasNextSibling = depth > 0 && node?.hasNextSibling;
  
  if (depth > 0) {
    // Reply messages get dynamic corners based on stack position
    if (hasPreviousSibling && hasNextSibling) {
      // Middle of stack - both top and bottom corners on spine side are less rounded
      threadMessageClassNames.push("thread-message-middle");
    } else if (hasPreviousSibling) {
      // Last in stack - only bottom corner on spine side is less rounded
      threadMessageClassNames.push("thread-message-last");
    } else if (hasNextSibling) {
      // First in stack - only top corner on spine side is less rounded
      threadMessageClassNames.push("thread-message-first");
    } else {
      // Standalone - only bottom corner on spine side is less rounded
      threadMessageClassNames.push("thread-message-standalone");
    }
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
  // Use local resolution state if available, otherwise use server state
  const effectiveResolutionType = localResolutionType || resolutionType;
  const effectiveResolvedBy = localResolvedBy || resolutionBy;
  
  const resolutionActorRaw =
    typeof effectiveResolvedBy === "string"
      ? effectiveResolvedBy
      : typeof node?.actorRole === "string"
        ? node.actorRole
        : null;
  const resolutionActor =
    typeof resolutionActorRaw === "string"
      ? resolutionActorRaw.toLowerCase()
      : null;
  const resolutionAttribution =
    effectiveResolutionType && resolutionActor
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

  const handleConfusionClick = () => {
    setLocalConfusionSignaled(true);
    onConfusionSignal(node.messageId);
  };

  const handleOffFocusClick = () => {
    setLocalOffFocusSignaled(true);
    onOffFocusSignal(node.messageId);
  };

  const handleResolutionChange = (event) => {
    const resolution = event.target.value;
    if (resolution) {
      setLocalResolutionType(resolution);
      setLocalResolvedBy(viewerRole);
      // Signal resolution - you may want to add a separate handler for this
      console.log('[RESOLUTION]', { messageId: node.messageId, resolution, resolvedBy: viewerRole });
    }
  };

  const handleReopenConfusion = () => {
    if (viewerRole === "audience") {
      setLocalResolutionType(null);
      setLocalResolvedBy(null);
      console.log('[REOPEN_CONFUSION]', { messageId: node.messageId });
    }
  };

  useEffect(() => {
    if (!registerMessageRef) {
      return undefined;
    }
    const parentId = node?.parentMessageId ?? null;
    registerMessageRef(node.messageId, parentId, messageRef.current);
    return () => registerMessageRef(node.messageId, parentId, null);
  }, [registerMessageRef, node.messageId, node.parentMessageId]);

  return (
    <div className="thread-item">
      <div
        className={threadMessageClassNames.join(" ")}
        ref={messageRef}
      >
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
              ▼
            </button>
          )}
          {showTrainerVoteTallies && trainerDownCount > 0 && (
            <span className="trainer-vote-ledger trainer-vote-down">
              ▼ {trainerDownCount}
            </span>
          )}

          <div className="message-content">
            {node.text}
            {node.labelDisplay && (
              <span
                className={`thread-message-label thread-message-label--${node.label}`}
              >
                {node.labelDisplay}
              </span>
            )}
          </div>

          {showTrainerVoteTallies && trainerUpCount > 0 && (
            <span className="trainer-vote-ledger trainer-vote-up">
              ▲ {trainerUpCount}
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
              ▲
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
            {(showConfusionRow || localConfusionSignaled) && allowConfusionRow && !isOffFocus && !localOffFocusSignaled && (
              <div className="thread-confusion-row">
                <div className="thread-confusion-center">
                  <div className="thread-confusion-line">
                    <span className="thread-confusion-indicator">[ Confused ]</span>
                    <div className="thread-confusion-right">
                      {effectiveResolutionType ? (
                        <div className="thread-resolution-display">
                          <span className="thread-resolution-label">
                            Resolution: {RESOLUTION_DROPDOWN_LABELS?.[effectiveResolutionType] ?? effectiveResolutionType}
                          </span>
                          {viewerRole === "audience" && (
                            <button
                              className="thread-resolution-reopen"
                              onClick={handleReopenConfusion}
                              aria-label="Reopen confusion"
                              title="Click to change resolution"
                            >
                              ↻
                            </button>
                          )}
                        </div>
                      ) : (
                        <select 
                          className="thread-resolution-select" 
                          value={localResolutionType || ""}
                          onChange={handleResolutionChange}
                          disabled={viewerRole === "trainer"}
                        >
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

            {isAnchor && allowConfusionAnchors && !showConfusionRow && !localConfusionSignaled && !isOffFocus && !localOffFocusSignaled && (
              <div className="thread-confusion-actions">
                <button
                  className={`confusion-anchor ${localConfusionSignaled ? 'active' : ''}`}
                  onClick={handleConfusionClick}
                  aria-label="This topic is confusing"
                >
                  Confused
                </button>
                <button
                  className={`confusion-anchor ${localOffFocusSignaled ? 'active' : ''}`}
                  onClick={handleOffFocusClick}
                  aria-label="This topic is off focus"
                >
                  Off Focus
                </button>
              </div>
            )}

            {(isOffFocus || localOffFocusSignaled) && allowConfusionRow && (
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
          {node.replies.map((child) => (
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
              registerMessageRef={registerMessageRef}
            />
          ))}
        </div>
      )}
    </div>
  );
}
