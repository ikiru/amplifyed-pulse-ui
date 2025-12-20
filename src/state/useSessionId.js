import { useMemo } from "react";

const DEFAULT_SESSION_ID = "session:default";

export function useSessionId() {
  return useMemo(() => {
    if (typeof window === "undefined") {
      return DEFAULT_SESSION_ID;
    }

    const params = new URLSearchParams(window.location.search);
    const candidate = params.get("sessionId")?.trim();
    return candidate || DEFAULT_SESSION_ID;
  }, []);
}
