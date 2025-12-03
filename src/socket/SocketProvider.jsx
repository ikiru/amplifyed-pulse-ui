import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { SocketContext } from "./SocketContext.jsx";

export default function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = io("http://localhost:3000", {
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    const handleConnect = () => {
      setReady(true);
    };

    const handleError = (err) => {
      console.warn("[Socket] connection error →", err?.message);
    };

    s.on("connect", handleConnect);
    s.on("connect_error", handleError);

    setSocket(s);

    return () => {
      s.off("connect", handleConnect);
      s.off("connect_error", handleError);
      s.disconnect();
      setReady(false);
      setSocket(null);
    };
  }, []);

  if (!socket || !ready) {
    return null;
  }

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}
