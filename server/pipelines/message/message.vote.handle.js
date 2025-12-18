import { voteStateStore } from "./message.vote.state.js";
import { voteBroadcast } from "./message.vote.broadcast.js";

const ALLOWED = new Set(["up", "down", "none"]);

export function handleVoteIntent({ io, socket, payload }) {
  const { messageId, voteState } = payload || {};
  const participantId = socket.id;

  if (!messageId || !ALLOWED.has(voteState)) return;

  const current = voteStateStore.getVote(participantId, messageId);
  if (current === voteState) return;

  voteStateStore.setVote(participantId, messageId, voteState);

  voteBroadcast.broadcastVoteUpdate({
    io,
    messageId,
    participantId,
    voteState,
  });
}
