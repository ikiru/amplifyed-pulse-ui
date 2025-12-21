import React from "react";
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

export function ThreadItem({
  node,
  depth = 0,
  replyToId,
  setReplyToId,
  replyDrafts,
  setReplyDrafts,
  handleSubmitReply,
  voteTotals,
  voteTotalsMap,
  emitVoteIntent,
  showVoteControls = true,
  showReplyControls = true,
}) {
  const isReplyOpen = replyToId === node.messageId;

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

  return (
    <div className="thread-item" data-depth={String(Math.min(depth, 3))}>
      <div className="thread-message">
        <div className="message-row">
          {showVoteControls && emitVoteIntent && (
            <button
              type="button"
              className="vote-btn down"
              onClick={() => emitVoteIntent(node.messageId, "down")}
              aria-label="Downvote"
            >
              ▼
            </button>
          )}

          <div className="message-content">{node.text}</div>

          {showVoteControls && emitVoteIntent && (
            <button
              type="button"
              className="vote-btn up"
              onClick={() => emitVoteIntent(node.messageId, "up")}
              aria-label="Upvote"
            >
              ▲
            </button>
          )}
        </div>

        {voteTotals && (
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

      {node.replies?.length > 0 && (
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
              emitVoteIntent={emitVoteIntent}
              showVoteControls={showVoteControls}
              showReplyControls={showReplyControls}
            />
          ))}
        </div>
      )}
    </div>
  );
}
