import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? "http://localhost:3000";

export function useSocket(eventHandlers = {}) {
  const socketRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  if (!socketRef.current) {
    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket"],
    });
  }

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!socketRef.current) return;

    const socket = socketRef.current;

    const handleConnect = () => {
      setConnectionStatus("connected");
      const id = socket.id;
      console.log("[Socket] Connected:", id);
      if (typeof eventHandlers.connect === "function") {
        eventHandlers.connect(id);
      }
    };

    const handleDisconnect = () => {
      setConnectionStatus("disconnected");
      const id = socket.id;
      console.log("[Socket] Disconnected:", id);
      if (typeof eventHandlers.disconnect === "function") {
        eventHandlers.disconnect(id);
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    const customHandlers = Object.entries(eventHandlers).filter(
      ([event]) => event !== "connect" && event !== "disconnect"
    );

    customHandlers.forEach(([event, handler]) => {
      if (typeof handler === "function") {
        socket.on(event, handler);
      }
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      customHandlers.forEach(([event, handler]) => {
        if (typeof handler === "function") {
          socket.off(event, handler);
        }
      });
    };
  }, [eventHandlers]);

  const emit = (event, payload) => {
    socketRef.current?.emit(event, payload);
  };

  return {
    socket: socketRef.current,
    emit,
    connectionStatus,
  };
}

export default useSocket;
