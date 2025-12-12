import { create } from "zustand";

export const usePulseStream = create((set, get) => ({
  // Canonical server state
  participants: {}, // socketId -> pulse
  votes: { engaged: 0, neutral: 0, frustrated: 0 },
  lastVoteAt: null,
  eventLog: [],
  moment: null,

  // Client-side analytics (incremental)
  score: 0,
  scoreHistory: [], // [{ timestamp, score }]
  participantChanges: [], // [{ socketId, from, to, timestamp }]
  nonVoters: [],

  recordEvent: (evt) =>
    set((state) => ({
      eventLog: [...state.eventLog, evt],
    })),
  setMoment: (moment) => set({ moment }),

  //------------------------------------------------------------------
  // updateVotes — server canonical votes
  //------------------------------------------------------------------
  updateVotes: (votes) =>
    set((state) => ({
      ...state,
      votes: { ...votes },
    })),

  //------------------------------------------------------------------
  // updateParticipants — detect diffs + record participantChanges
  //------------------------------------------------------------------
  updateParticipants: (serverParticipants, timestamp) =>
    set((state) => {
      const oldParticipants = state.participants;
      const newParticipants = { ...serverParticipants };

      const participantChanges = [...state.participantChanges];

      for (const socketId of Object.keys(newParticipants)) {
        const newPulse = newParticipants[socketId];
        const oldPulse = oldParticipants[socketId];

        if (!oldPulse) {
          participantChanges.push({
            socketId,
            from: null,
            to: newPulse,
            timestamp,
          });
        } else if (oldPulse !== newPulse) {
          participantChanges.push({
            socketId,
            from: oldPulse,
            to: newPulse,
            timestamp,
          });
        }
      }

      return {
        ...state,
        participants: newParticipants,
        participantChanges,
      };
    }),

  //------------------------------------------------------------------
  // updateScore — simple pulse score: engaged - frustrated
  //------------------------------------------------------------------
  updateScore: () =>
    set((state) => {
      const score =
        (state.votes.engaged || 0) - (state.votes.frustrated || 0);
      return { ...state, score };
    }),

  //------------------------------------------------------------------
  // updateScoreHistory — append incremental score entries
  //------------------------------------------------------------------
  updateScoreHistory: (timestamp) =>
    set((state) => ({
      ...state,
      scoreHistory: [
        ...state.scoreHistory,
        { timestamp, score: state.score },
      ],
    })),

  //------------------------------------------------------------------
  // updateEventLog — append only new events
  //------------------------------------------------------------------
  updateEventLog: (serverEventLog = []) =>
    set((state) => {
      const existing = state.eventLog;

      const isDuplicate = (evt) =>
        existing.some(
          (e) =>
            e.timestamp === evt.timestamp &&
            e.socketId === evt.socketId &&
            e.type === evt.type
        );

      const merged = [
        ...existing,
        ...serverEventLog.filter((evt) => !isDuplicate(evt)),
      ];

      return { ...state, eventLog: merged };
    }),

  //------------------------------------------------------------------
  // updateNonVoters — anyone not appearing in participants map
  //------------------------------------------------------------------
  updateNonVoters: () =>
    set((state) => {
      const allSocketIds = Object.keys(state.participants);
      const nonVoters = allSocketIds.filter(
        (id) => !state.participants[id]
      );

      return { ...state, nonVoters };
    }),

  //------------------------------------------------------------------
  // applyPulseUpdate — orchestrates all transformer steps
  //------------------------------------------------------------------
  applyPulseUpdate: (payload) => {
    const {
      votes,
      participants,
      eventLog,
      lastVoteAt,
      timestamp,
    } = payload;

    const {
      updateVotes,
      updateParticipants,
      updateScore,
      updateScoreHistory,
      updateEventLog,
      updateNonVoters,
    } = get();

    updateVotes(votes);
    updateParticipants(participants, timestamp);

    updateScore();
    updateScoreHistory(timestamp);
    updateEventLog(eventLog);
    updateNonVoters();

    set(() => ({ lastVoteAt }));
  },
}));
