import { useState, useCallback } from "react";

export function useInteractionIntents() {
  const [interactionIntents, setInteractionIntents] = useState({});

  const addInteractionIntent = useCallback((intent) => {
    if (!intent?.interactionId) return;

    setInteractionIntents((prev) => ({
      ...prev,
      [intent.interactionId]: intent,
    }));
  }, []);

  const clearInteractionIntents = useCallback(() => {
    setInteractionIntents({});
  }, []);

  return {
    interactionIntents,
    addInteractionIntent,
    clearInteractionIntents,
  };
}
