import { create } from "zustand";


/**
 * Phase 2 — Full Analytics Pulse Engine
 * --------------------------------------
 * This store provides the canonical pulse state for the entire app.
 *
 * Scoring:
 *   engaged    →  +1
 *   neutral    →   0
 *   frustrated →  -1
 *
 * Rules:
 *  - One vote per participant (socketId)
 *  - Changing your vote updates the score (no spamming)
 *  - Participants tracked on connect/disconnect
 *  - Non-voters are tracked separately for analytics
 *  - History is event-based (not continuous)
 */

const emotionToScore = {
  engaged: +1,
  neutral: 0,
  frustrated: -1,
};

export const usePulseStream = create((set, get) => ({
  /** ACTIVE STATE ------------------------------------------------------- */

  participants: new Set(),
  votes: new Map(),
  lastVoteAt: new Map(),
  participantStates: new Map(),

  score: 0,

  /** HISTORY ------------------------------------------------------------ */

  scoreHistory: [],
  participantHistory: [],
  nonVoterHistory: [],
  eventLog: [],

  /** INTERNAL HELPERS --------------------------------------------------- */

  _recordEvent: (event) => {
    set((state) => ({
      eventLog: [...state.eventLog, { timestamp: Date.now(), ...event }],
    }));
  },

  _updateHistory: () => {
    const state = get();
    const timestamp = Date.now();

    set((s) => ({
      scoreHistory: [...s.scoreHistory, { timestamp, score: state.score }],
    }));

    const nonVoters = [...state.participants].filter(
      (id) => !state.votes.has(id)
    );

    set((s) => ({
      nonVoterHistory: [
        ...s.nonVoterHistory,
        { timestamp, nonVoters },
      ],
    }));
  },

  /** PUBLIC API --------------------------------------------------------- */

  recordEvent: (event) => {
    get()._recordEvent(event);
  },

  addParticipant: (socketId) => {
    set((state) => {
      const participants = new Set(state.participants);
      participants.add(socketId);

      return { participants };
    });

    get()._recordEvent({ event: "join", socketId });
    get()._updateHistory();
  },

  removeParticipant: (socketId) => {
    set((state) => {
      const participants = new Set(state.participants);
      participants.delete(socketId);

      const votes = new Map(state.votes);
      const lastVoteAt = new Map(state.lastVoteAt);
      const participantStates = new Map(state.participantStates);

      let newScore = state.score;
      if (votes.has(socketId)) {
        newScore -= votes.get(socketId);
      }

      votes.delete(socketId);
      lastVoteAt.delete(socketId);
      participantStates.delete(socketId);

      return {
        participants,
        votes,
        lastVoteAt,
        score: newScore,
        participantStates,
      };
    });

    get()._recordEvent({ event: "leave", socketId });
    get()._updateHistory();
  },

  updateParticipant: (socketId, emotion) => {
    set((state) => {
      const participantStates = new Map(state.participantStates);
      participantStates.set(socketId, emotion);

      return { participantStates };
    });
  },

  castVote: (socketId, emotion) => {
    const scoreValue = emotionToScore[emotion] ?? 0;
    const timestamp = Date.now();

    set((state) => {
      const votes = new Map(state.votes);
      const lastVoteAt = new Map(state.lastVoteAt);

      let newScore = state.score;

      if (votes.has(socketId)) {
        newScore -= votes.get(socketId);
      }

      votes.set(socketId, scoreValue);
      newScore += scoreValue;

      lastVoteAt.set(socketId, timestamp);

      return {
        votes,
        lastVoteAt,
        score: newScore,
      };
    });

    get()._recordEvent({
      event: "vote",
      socketId,
      emotion,
      value: scoreValue,
    });

    get()._updateHistory();
  },

  applyPulse: (socketId, emotion) => {
    const scoreValue = emotionToScore[emotion] ?? 0;
    const timestamp = Date.now();

    set((state) => {
      const votes = new Map(state.votes);
      const lastVoteAt = new Map(state.lastVoteAt);

      let newScore = state.score;

      if (votes.has(socketId)) {
        newScore -= votes.get(socketId);
      }

      votes.set(socketId, scoreValue);
      newScore += scoreValue;

      lastVoteAt.set(socketId, timestamp);

      return {
        votes,
        lastVoteAt,
        score: newScore,
      };
    });

    get()._updateHistory();
  },

  reset: () =>
    set({
      participants: new Set(),
      votes: new Map(),
      lastVoteAt: new Map(),
      participantStates: new Map(),
      score: 0,
      scoreHistory: [],
      participantHistory: [],
      nonVoterHistory: [],
      eventLog: [],
    }),
}));
