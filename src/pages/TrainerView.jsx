import React, { useMemo } from "react";
import { useSocket } from "../socket/useSocket";

// Left Column Components
import SignalDeck from "../components/console/SignalDeck.jsx";
import PulseTimeline from "../components/console/PulseTimeline.jsx";
import InsightLine from "../components/console/InsightLine.jsx";

// Center Column Components
import SessionFocus from "../components/trainer/SessionFocus.jsx";
import SlidesPanel from "../components/trainer/SlidesPanel.jsx";
import MessageStream from "../components/trainer/MessageStream.jsx";
import TrainerComposer from "../components/trainer/TrainerComposer.jsx";

// Right Column Components
import CameraPanel from "../components/trainer/CameraPanel.jsx";
import SetFocusInput from "../components/trainer/SetFocusInput.jsx";
import QuickActions from "../components/trainer/QuickActions.jsx";

// Correct Stores
import usePulseHistory from "../utils/usePulseHistory";
import useMessageStream from "../state/useMessageStream";
import useSessionFocus from "../state/useSessionFocus";

// Styles
import "./TrainerView.css";

export default function TrainerView() {

  /* -------------------------------
     STATE STORES
  --------------------------------*/
  const addPulse = usePulseHistory((s) => s.addPulse);
  const pulses = usePulseHistory((s) => s.pulses);

  const addMessage = useMessageStream((s) => s.addMessage);
  const messages = useMessageStream((s) => s.messages);

  const focus = useSessionFocus((s) => s.focus);
  const setFocus = useSessionFocus((s) => s.setFocus);

  /* -------------------------------
     SOCKET HANDLERS
  --------------------------------*/
  const handlePulse = (payload) => {
    console.log("[TRAINER] audience:pulse IN:", payload);
    addPulse(payload);
  };

  const handlePulseUpdate = (payload) => {
    console.log("[TRAINER] pulse:update IN:", payload);
    addPulse(payload);
  };

  const handleAudienceMessage = (payload) => {
    console.log("[TRAINER] audience:message IN:", payload);
    addMessage(payload);
  };

  // NEW — handles server-side trainer messages
  const handleTrainerMessage = (payload) => {
    console.log("[TRAINER] trainer:message IN:", payload);

    // Normalize: ensure a consistent shape
    const normalized = {
      id: payload.id ?? Date.now(),
      author: payload.author ?? "Trainer",
      text: payload.text ?? payload.message ?? "",
      timestamp: payload.timestamp ?? Date.now(),
    };

    addMessage(normalized);
  };

  // NEW — handles audience messages relayed by server
  const handleMessageUpdate = (payload) => {
    console.log("[TRAINER] message:update IN:", payload);

    const normalized = {
      id: payload.id ?? Date.now(),
      author: payload.author ?? "Audience",
      text: payload.text ?? payload.message ?? "",
      timestamp: payload.timestamp ?? Date.now(),
    };

    addMessage(normalized);
  };

  // NEW: handle trainer:setFocus
  const handleTrainerSetFocus = (payload) => {
    console.log("[TRAINER] trainer:setFocus IN:", payload);
    if (payload?.focus) setFocus(payload.focus);
  };

  /* -------------------------------
     REGISTER SOCKET
  --------------------------------*/
  const handlers = useMemo(
    () => ({
      "audience:pulse": handlePulse,
      "pulse:update": handlePulseUpdate,
      // OLD EVENT (kept for backward compatibility)
      "audience:message": handleAudienceMessage,

      // NEW: correct active events
      "trainer:message": handleTrainerMessage,
      "message:update": handleMessageUpdate,
      "trainer:setFocus": handleTrainerSetFocus,  // <-- FIX ADDED HERE
    }),
    []
  );

  const { connectionStatus } = useSocket(handlers);

  /* -------------------------------
     RENDER LAYOUT
  --------------------------------*/
  return (
    <div className="trainer-view">
      <div className="socket-status">Socket: {connectionStatus}</div>

      <div className="trainer-grid">

        {/* LEFT COLUMN — Signals */}
        <aside className="col-left">
          <SignalDeck pulses={pulses} />
          <PulseTimeline pulses={pulses} />
          <InsightLine pulses={pulses} />
        </aside>

        {/* CENTER COLUMN — Focus + Slides + Messages */}
        <main className="col-center">
          <SessionFocus focus={focus} />
          <SlidesPanel />
          <MessageStream messages={messages} />
          <TrainerComposer />
        </main>

        {/* RIGHT COLUMN — Trainer Console */}
        <aside className="col-right">
          <CameraPanel />
          <SetFocusInput />
          <QuickActions />
        </aside>

      </div>
    </div>
  );
}
