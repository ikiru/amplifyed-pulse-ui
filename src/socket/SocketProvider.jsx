// src/socket/SocketProvider.jsx
import React, { useMemo, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { SocketContext } from "./SocketContext.jsx";

export default function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = io("http://localhost:5174");
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  const value = useMemo(() => {
    if (!socket) {
      return {
        socket: null,
        emit: () => {},
        on: () => {},
        off: () => {},
      };
    }

    return {
      socket,
      emit: (event, payload) => socket.emit(event, payload),
      on: (event, handler) => socket.on(event, handler),
      off: (event, handler) => socket.off(event, handler),
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}
