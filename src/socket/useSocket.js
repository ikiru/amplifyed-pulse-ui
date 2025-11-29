import { useContext, useEffect } from "react";
import { SocketContext } from "./SocketProvider";

export function useSocket(handlers = {}) {
  const socket = useContext(SocketContext);

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

  return socket;
}

export default useSocket;
