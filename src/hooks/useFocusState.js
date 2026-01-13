import { useState } from "react";

/**
 * useFocusState
 * 
 * Manages focus-related state for TrainerView:
 * - Current focus text (set by trainer)
 * - Focus input field value
 * 
 * Provides handlers for:
 * - Setting focus
 * - Clearing focus
 * 
 * @param {object} params
 * @param {function} params.emit - Socket emit function from useSocket
 */
export function useFocusState({ emit }) {
  const [focus, setFocus] = useState(null);
  const [focusInput, setFocusInput] = useState("");

  /**
   * Handle setting a new focus
   */
  const handleSetFocus = (event) => {
    event.preventDefault();
    const text = focusInput.trim();
    if (!text) return;

    emit("focus:set", { text });
    setFocusInput("");
  };

  /**
   * Handle clearing the current focus
   */
  const handleClearFocus = () => {
    emit("focus:cleared");
  };

  return {
    // State
    focus,
    setFocus,
    focusInput,
    setFocusInput,

    // Handlers
    handleSetFocus,
    handleClearFocus,
  };
}
