import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import { useDevToolsBus } from "../utils/useDevToolsBus.js";
import { useInteractionIntents } from "../state/useInteractionIntents";
import { useEmotionStream } from "../state/useEmotionStream";


export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const lastDisconnectedSocketIdRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [socketState, setSocketState] = useState(null);
  // Phase 8 — Focus state
  const isDev = process.env.NODE_ENV !== "production";
  // Phase 8.1 — Focus (authoritative session state)
  const [focus, setFocus] = useState(null);
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
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 4000,
      });
    }

    // Mirror ref into state for safe consumption during render
    setSocketState(socketRef.current);

    const socket = socketRef.current;

    // ------------------------------------------------------
    // PHASE 2.10: TEMPORARY DEBUG EXPOSURE
    // Lets the browser inspect the live socket instance:
    //    window.__SOCKET__
    // Remove this after baseline validation passes.
    // ------------------------------------------------------
    if (typeof window !== "undefined") {
      window.__SOCKET__ = socket;
    }
    const handleConnect = () => {
      setConnectionStatus("connected");
      lastDisconnectedSocketIdRef.current = null;
    };

    const handleDisconnect = () => {
      setConnectionStatus("disconnected");
      lastDisconnectedSocketIdRef.current = socket.id;
    };

    const handleReconnect = (attemptNumber) => {
      if (!isDev) return;
      const previousId = lastDisconnectedSocketIdRef.current;
      const currentId = socket.id;
      const logPayload = {
        attempt: attemptNumber,
        previousId,
        currentId,
      };
      if (previousId && previousId !== currentId) {
        console.warn("[socket] reconnect changed socket.id", logPayload);
      } else {
        console.log("[socket] reconnect completed", logPayload);
      }
      lastDisconnectedSocketIdRef.current = null;
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    if (isDev) {
      socket.on("reconnect", handleReconnect);
    }

    // ---- Focus events (Phase 8.2 fix) ----
    socket.on("focus:update", (payload) => {
      console.log("[socket] focus:update received", payload);
      const nextFocus = payload?.focus ?? payload ?? null;

      if (
        process.env.NODE_ENV !== "production" &&
        nextFocus &&
        typeof nextFocus.text !== "string"
      ) {
        console.warn("[focus] malformed focus payload received:", payload);
      }

      setFocus(nextFocus);
    });

    socket.on("focus:cleared", () => {
      console.log("[socket] focus:cleared received");
      setFocus(null);
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);

      socket.off("focus:update");
      socket.off("focus:cleared");

      if (isDev) {
        socket.off("reconnect", handleReconnect);
      }

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

    // Phase 8.2 — optimistic focus update
    if (event === "focus:set") {
      setFocus(payload ?? null);
    }

    if (event === "focus:clear") {
      setFocus(null);
    }

    socket.emit(event, payload);
  }, []);

  const emitEvent = useCallback((eventType, payload) => {
    useDevToolsBus.getState().push({
      type: eventType,
      payload,
    });
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

  useEffect(() => {
    const socket = socketState;
    if (!socket) return;

    // ---- Focus events (Phase 8.3) ----
    const handleFocusSet = (payload) => {
      const sliced = payload?.focus ?? payload ?? null;
      setFocus(sliced);
      emitEvent("focus:update", sliced);
    };

    const handleFocusUpdate = (payload) => {
      const sliced = payload?.focus ?? payload ?? null;
      setFocus(sliced);
      emitEvent("focus:update", sliced);
    };

    const handleFocusCleared = () => {
      setFocus(null);
      emitEvent("focus:cleared", null);
    };

    socket.on("focus:set", handleFocusSet);
    socket.on("focus:update", handleFocusUpdate);
    socket.on("focus:cleared", handleFocusCleared);

    return () => {
      socket.off("focus:set", handleFocusSet);
      socket.off("focus:update", handleFocusUpdate);
      socket.off("focus:cleared", handleFocusCleared);
    };
  }, [socketState, emitEvent]);

  return (
    <SocketContext.Provider
      value={{
        // Accessing refs inside render is normally warned,
        // but here it is intentional, safe, and stable because the ref
        // always holds the same socket instance.
        //
        // eslint-disable-next-line react-hooks/refs
        socket: socketState,
        emit,
        connectionStatus,
        onEvent,
        offEvent,
        focus,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error("useSocketContext must be used inside <SocketProvider>");
  }

  return context;
}

export function useSocket() {
  return useSocketContext();
}
