import React, { useState } from "react";
import { useSocketContext } from "../socket/SocketContext.jsx";

export default function AudienceInput() {
  const [message, setMessage] = useState("");
  const { emit } = useSocketContext();

  // Correct pulse sender
  const sendPulse = (pulse) => {
    console.log("[AUDIENCE] pulse:", pulse);
    emit("audience:pulse", { pulse });
  };

  // Message sender (no pulse here!)
  const handleMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    emit("message:audience", {
      content: {
        type: "text",
        text: message.trim(),
      },
    });

    setMessage("");
  };

  return (
    <div>

      <div>
        <button onClick={() => sendPulse("pulse_1")} aria-label="Pulse option 1" />
        <button onClick={() => sendPulse("pulse_2")} aria-label="Pulse option 2" />
        <button onClick={() => sendPulse("pulse_3")} aria-label="Pulse option 3" />
      </div>

      <form onSubmit={handleMessage} style={{ marginTop: 16 }}>
        <input
          placeholder=""
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="submit" aria-label="Submit message" />
      </form>
    </div>
  );
}
