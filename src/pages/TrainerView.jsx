import React, { useEffect } from "react";
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
  const pulses = usePulseHistory((s) => s.pulses);
  const addPulse = usePulseHistory((s) => s.addPulse);

  const addMessage = useMessageStream((s) => s.addMessage);
  const messages = useMessageStream((s) => s.messages);

  const focus = useSessionFocus((s) => s.focus);
  const setFocus = useSessionFocus((s) => s.setFocus);

  const { socket, connectionStatus } = useSocket();

  useEffect(() => {
    if (!socket) return undefined;

    const handleMessageNew = (msg) => {
      console.log("[TRAINER] message:new", msg);
      addMessage(msg);
    };

    const handleFocusUpdate = (focusPayload) => {
      console.log("[TRAINER] focus:update", focusPayload);
      setFocus(focusPayload?.id ?? focusPayload?.messageId ?? null);
    };

    const handleRoomState = (packet) => {
      console.log("[TRAINER] pulse:roomstate", packet);
      addPulse({
        counts: packet.counts ?? {},
        score: packet.score ?? 0,
        timestamp: packet.timestamp ?? Date.now(),
      });
    };

    socket.on("message:new", handleMessageNew);
    socket.on("focus:update", handleFocusUpdate);
    socket.on("pulse:roomstate", handleRoomState);

    return () => {
      socket.off("message:new", handleMessageNew);
      socket.off("focus:update", handleFocusUpdate);
      socket.off("pulse:roomstate", handleRoomState);
    };
  }, [socket, addMessage, setFocus, addPulse]);

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
          <div className="session-focus-frame">
            <SessionFocus focus={focus} />
          </div>
          <div className="slides-panel">
            <SlidesPanel />
          </div>
          <div className="message-stream">
            <MessageStream messages={messages} />
          </div>
          <div className="trainer-composer">
            <TrainerComposer />
          </div>
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
