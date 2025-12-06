import { create } from "zustand";
import usePulseHistory from "./usePulseHistory";

const usePulseIngestion = create((set, get) => ({
  handleIncomingPulse: (packet = {}) => {
    console.log("[INGESTION] pulse:roomstate received:", packet);

    const { addPulse } = usePulseHistory.getState();
    addPulse({
      counts: packet.counts ?? {},
      score: packet.score ?? 0,
      timestamp: packet.timestamp ?? Date.now(),
    });
  },
}));

export default usePulseIngestion;
