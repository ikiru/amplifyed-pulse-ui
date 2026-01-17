import { useEffect, useMemo, useState } from "react";

const DEFAULT_FOCUS_ID = "focus:open_conversation";
const DEFAULT_FOCUS_TEXT = "Open Conversation";

/**
 * useFocusState
 * 
 * Focus Box state for TrainerView (trainer-only list + active focus)
 *
 * - Add creates an INACTIVE entry (server-authoritative)
 * - Activate sets Active Focus atomically (broadcasts to audience via focus:update)
 * - Clear is Reset to Default ("Open Conversation")
 * - Editing supports explicit modes: edit-in-place and revise-by-new
 * 
 * @param {object} params
 * @param {function} params.emit - Socket emit function from useSocket
 * @param {function} params.onEvent - Socket onEvent subscription (from SocketContext)
 * @param {function} params.offEvent - Socket offEvent cleanup (from SocketContext)
 */
export function useFocusState({ emit, onEvent, offEvent }) {
  // Legacy active focus text (still updated by useTrainerSocket focus:update handler)
  const [focus, setFocus] = useState(null);
  const [focusInput, setFocusInput] = useState("");
  const [entries, setEntries] = useState(() => [
    { focusId: DEFAULT_FOCUS_ID, text: DEFAULT_FOCUS_TEXT },
  ]);
  const [activeFocusId, setActiveFocusId] = useState(DEFAULT_FOCUS_ID);
  const [defaultFocusId, setDefaultFocusId] = useState(DEFAULT_FOCUS_ID);

  const activeFocusText = useMemo(() => {
    return (
      entries.find((e) => e.focusId === activeFocusId)?.text ??
      DEFAULT_FOCUS_TEXT
    );
  }, [entries, activeFocusId]);

  /**
   * Trainer-only state sync
   */
  useEffect(() => {
    if (!onEvent || !offEvent) return;

    const handleTrainerState = (payload) => {
      const nextEntries = Array.isArray(payload?.entries) ? payload.entries : null;
      const nextActive = typeof payload?.activeFocusId === "string" ? payload.activeFocusId : null;
      const nextDefault = typeof payload?.defaultFocusId === "string" ? payload.defaultFocusId : null;

      if (nextEntries) setEntries(nextEntries);
      if (nextActive) setActiveFocusId(nextActive);
      if (nextDefault) setDefaultFocusId(nextDefault);
    };

    onEvent("focus:trainer:state", handleTrainerState);
    return () => offEvent("focus:trainer:state", handleTrainerState);
  }, [onEvent, offEvent]);

  /**
   * Add focus (inactive by default on server)
   */
  const handleAddFocus = (event) => {
    event?.preventDefault?.();
    const text = focusInput.trim();
    if (!text) return;
    emit("focus:entry:add", { text });
    setFocusInput("");
  };

  const handleActivateFocus = (focusId) => {
    if (!focusId) return;
    emit("focus:activate", { focusId });
  };

  const handleResetToDefault = () => {
    emit("focus:reset_default", {});
  };

  const handleReorder = (orderedFocusIds) => {
    emit("focus:reorder", { orderedFocusIds });
  };

  const handleEditInPlace = ({ focusId, text }) => {
    emit("focus:edit_in_place", { focusId, text });
  };

  const handleReviseByNew = ({ focusId, text }) => {
    emit("focus:revise_by_new", { focusId, text });
  };

  return {
    // State
    focus,
    setFocus,
    focusInput,
    setFocusInput,
    entries,
    activeFocusId,
    defaultFocusId,
    activeFocusText,

    // Handlers
    handleAddFocus,
    handleActivateFocus,
    handleResetToDefault,
    handleReorder,
    handleEditInPlace,
    handleReviseByNew,
  };
}
