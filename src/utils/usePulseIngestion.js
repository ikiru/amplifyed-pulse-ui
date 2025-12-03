import { useEffect } from "react";
import useSocket from "../socket/useSocket";
import usePulseHistory from "./usePulseHistory";

export default function usePulseIngestion() {
  const socket = useSocket();
  const addPulse = usePulseHistory((s) => s.addPulse);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const handler = (payload) => {
      console.log("[INGEST] pulse event →", payload);
      addPulse(payload);
    };

    socket.on("audience:pulse", handler);
    return () => {
      socket.off("audience:pulse", handler);
    };
  }, [socket, addPulse]);
}
