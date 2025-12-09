import React, {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [, setSocketState] = useState(null);
  const registeredHandlers = useRef(new Map());

  // We intentionally use a mutable ref for event handler maps.
  // React warns that `registeredHandlers.current` may change across renders,
  // but this is the *correct* design: socket event handlers must be mutable
  // without re-rendering the app.
  useEffect(() => {
    if (!socketRef.current) {
      // Allow Socket.IO to auto-connect back to the dev server origin so Vite can proxy it.
      socketRef.current = io({
        transports: ["websocket"],
      });
    }

    // Mirror ref into state for safe consumption during render
    setSocketState(socketRef.current);

    const socket = socketRef.current;
    const handleConnect = () => setConnectionStatus("connected");
    const handleDisconnect = () => setConnectionStatus("disconnected");

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);

      registeredHandlers.current.forEach((handlers, event) => {
        handlers.forEach((handler) => {
          socket.off(event, handler);
        });
      });
      registeredHandlers.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = useCallback((event, payload) => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit(event, payload);
  }, []);

  const onEvent = useCallback((event, handler) => {
    const socket = socketRef.current;
    if (!socket) return;

    let handlers = registeredHandlers.current.get(event);
    if (!handlers) {
      handlers = new Set();
      registeredHandlers.current.set(event, handlers);
    }

    if (!handlers.has(handler)) {
      socket.on(event, handler);
      handlers.add(handler);
    }
  }, []);

  const offEvent = useCallback((event, handler) => {
    const socket = socketRef.current;
    if (!socket) return;

    const handlers = registeredHandlers.current.get(event);
    if (!handlers || !handlers.has(handler)) return;

    socket.off(event, handler);
    handlers.delete(handler);

    if (handlers.size === 0) {
      registeredHandlers.current.delete(event);
    }
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handlers = registeredHandlers.current;

    // We intentionally do *not* include handlers in the dependency array.
    // They are stable by design and not tied to render state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    Array.from(handlers.entries()).forEach(([eventName, fns]) => {
      fns.forEach((fn) => socket.on(eventName, fn));
    });
  }, []);

  return (
    <SocketContext.Provider
      value={{
        // Accessing refs inside render is normally warned,
        // but here it is intentional, safe, and stable because the ref
        // always holds the same socket instance.
        //
        // eslint-disable-next-line react-hooks/refs
        socket: socketRef.current,
        emit,
        connectionStatus,
        onEvent,
        offEvent,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
