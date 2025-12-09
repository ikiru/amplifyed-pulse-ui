import { useContext } from "react";
import { SocketProvider, SocketContext } from "./SocketContext.jsx";

export { SocketProvider, SocketContext };

export function useSocketContext() {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error("useSocketContext must be used inside <SocketProvider>");
  }
  return ctx;
}
