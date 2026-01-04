import { useState } from "react";
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
}) {
  const viewerRole = actorRole ?? role ?? "audience";
  const selectedVote = voteSelectionMap?.[node.messageId] ?? null;
  const isReplyOpen = replyToId === node.messageId;
  const canToggleCollapse = isAnchor && typeof onToggleCollapse === "function";
  const repliesVisible = !isAnchor || !isCollapsed;
  const isTrainerMessage = node?.actorRole === "trainer";
  const threadMessageClassNames = ["thread-message"];
  if (isTrainerMessage) {
    threadMessageClassNames.push("trainer-message");
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

  return (
    <div className="thread-item" data-depth={String(Math.min(depth, 3))}>
      <div className={threadMessageClassNames.join(" ")}>
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
          {isAnchor && allowConfusionAnchors && (
            <>
              <button
                className="confusion-anchor"
                onClick={() => onConfusionSignal(node.messageId)}
                aria-label="This topic is confusing"
              >
                Confused
              </button>
              <button
                className="confusion-anchor"
                onClick={() => onOffFocusSignal(node.messageId)}
                aria-label="This topic is off focus"
              >
                Off Focus
              </button>
            </>
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
