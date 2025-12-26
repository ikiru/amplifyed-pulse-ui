import { useState } from "react";
import "./AudienceInput.css";
import ConfusionFootprint from "./ConfusionFootprint.jsx";

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
  confusionLevel = null,
  onConfusionSignal = () => {},
  emitVoteIntent,
  voteSelectionMap,
  showVoteControls = true,
  showVoteTotals = true,
  showReplyControls = true,
  isAnchor = false,
  isCollapsed = false,
  onToggleCollapse,
  renderRootExtras,
}) {
  const selectedVote = voteSelectionMap?.[node.messageId] ?? null;
  const shouldShowConfusionFootprint =
    isAnchor && typeof confusionLevel === "string";
  const isReplyOpen = replyToId === node.messageId;
  const canToggleCollapse = isAnchor && typeof onToggleCollapse === "function";
  const repliesVisible = !isAnchor || !isCollapsed;

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
  const canVote = Boolean(emitVoteIntent);

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
      <div className="thread-message">
        <div className="message-row">
          {showVoteControls && (
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

          <div className="message-content">{node.text}</div>

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

          {showVoteControls && (
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
          {isAnchor && (
            <button
              className="confusion-anchor"
              onClick={() => onConfusionSignal(node.messageId)}
              aria-label="This topic is confusing"
            >
              Confused
            </button>
          )}
        </div>

        {shouldShowConfusionFootprint && (
          <ConfusionFootprint level={confusionLevel} />
        )}

        {showVoteTotals && voteTotals && (
          <div className="thread-vote-totals">
            <span>▲ {voteTotals.up ?? 0}</span>
            <span>▼ {voteTotals.down ?? 0}</span>
          </div>
        )}

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

      {renderRootExtras?.()}

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
              showVoteControls={showVoteControls}
              showReplyControls={showReplyControls}
              showVoteTotals={showVoteTotals}
              onConfusionSignal={onConfusionSignal}
            />
          ))}
        </div>
      )}
    </div>
  );
}
