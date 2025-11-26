// src/console/InsightLine.jsx
import React, { useEffect, useRef } from "react";
import useSocket from "../socket/useSocket";

export default function InsightLine() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const resizeObserver = useRef(null);

  const historyRef = useRef([]);

  const MAX_POINTS = 300;
  const LINE_COLOR = "rgba(255, 255, 255, 0.8)";
  const LINE_WIDTH = 2;

  const socket = useSocket();

  // ----- SOCKET LISTENER -------------------------------------------------
  useEffect(() => {
    if (!socket) return;

    const handler = (payload) => {
      const raw =
        payload?.value ??
        payload?.insight ??
        payload?.score ??
        0;

      const next = Math.max(0, Math.min(1, Number(raw)));

      const newHistory = [...historyRef.current, next];
      if (newHistory.length > MAX_POINTS) newHistory.shift();
      historyRef.current = newHistory;
    };

    socket.on("insight:update", handler);
    return () => socket.off("insight:update", handler);
  }, [socket]);

  // ----- DRAW ------------------------------------------------------------
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const data = historyRef.current;
    if (data.length < 2) return;

    const step = width / (MAX_POINTS - 1);

    ctx.lineWidth = LINE_WIDTH;
    ctx.strokeStyle = LINE_COLOR;
    ctx.beginPath();

    data.forEach((value, index) => {
      const x = index * step;
      const y = height - value * height;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();
  };

  // ----- LOOP ------------------------------------------------------------
  const loop = () => {
    draw();
    animationRef.current = requestAnimationFrame(loop);
  };

  // ----- INIT ------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;

    const resize = () => {
      canvas.width = parent.clientWidth;
      canvas.height = 80;
    };

    resize();

    resizeObserver.current = new ResizeObserver(resize);
    resizeObserver.current.observe(parent);

    animationRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationRef.current);
      resizeObserver.current?.disconnect();
    };
  }, []);

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.1)",
        padding: "0.5rem",
        borderRadius: "6px",
        marginBottom: "1rem",
      }}
    >
      <div
        style={{
          fontSize: "0.85rem",
          opacity: 0.7,
          marginBottom: "0.25rem",
        }}
      >
        Insight Line
      </div>
      <canvas ref={canvasRef} style={{ width: "100%", display: "block" }} />
    </div>
  );
}
