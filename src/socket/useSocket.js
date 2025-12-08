import { useContext, useEffect } from "react";
import { SocketContext } from "./SocketContext.jsx";

export function useSocket(handlers = {}) {
  const ctx = useContext(SocketContext);

  if (!ctx) {
    console.warn("useSocket: No SocketContext found");
    return { socket: null, emit: () => {}, connectionStatus: "disconnected" };
  }

  const { socket, emit, connectionStatus } = ctx;

  useEffect(() => {
    if (!socket) return;

    Object.entries(handlers).forEach(([event, fn]) => {
      socket.on(event, fn);
    });

    return () => {
      Object.entries(handlers).forEach(([event, fn]) => {
        socket.off(event, fn);
      });
    };
  }, [socket]);

  return { socket, emit, connectionStatus };
}

export default useSocket;
