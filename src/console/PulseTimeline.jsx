// src/console/PulseTimeline.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  clamp01,
  movingAverage,
  exponentialSmooth,
} from "../shared/smoothing";
import useSocket from "../socket/useSocket";
import "./pulseTimeline.styles.js";

export default function PulseTimeline() {
  const { socket } = useSocket();
  // 4 channels
  const CHANNEL_COUNT = 4;

  const historyRef = useRef(
    Array.from({ length: CHANNEL_COUNT }, () => [])
  );
  const [smoothedHistory, setSmoothedHistory] = useState(
    Array.from({ length: CHANNEL_COUNT }, () => [])
  );


  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const resizeObserver = useRef(null);

  const MAX_POINTS = 300;
  const SMOOTH_ALPHA = 0.35;
  const MA_WINDOW = 4;

  // Colors for each channel
  const COLORS = [
    "rgba(59,130,246,1)",   // blue
    "rgba(168,85,247,1)",   // purple
    "rgba(16,185,129,1)",   // green
    "rgba(245,158,11,1)",   // amber
  ];

  // 🔥 SOCKET LISTENER
  useEffect(() => {
    if (!socket) return;

    const handler = (payload) => {
      const values = payload.values || [];
      const sanitized = values.map((v) => clamp01(Number(v)));

      // clone
      const newHistory = historyRef.current.map((h) => [...h]);

      sanitized.forEach((value, idx) => {
        const arr = newHistory[idx];
        const prev = arr[arr.length - 1];

        const exp = exponentialSmooth(prev, value, SMOOTH_ALPHA);
        const next = movingAverage([...arr, exp], MA_WINDOW);

        arr.push(next);

        if (arr.length > MAX_POINTS) arr.shift();
      });

      historyRef.current = newHistory;
      setSmoothedHistory(newHistory.map((c) => [...c]));
    };

    socket.on("pulse:update", handler);
    return () => socket.off("pulse:update", handler);
  }, [socket]);

  // 🔥 DRAW MULTI-CHANNEL
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const histories = historyRef.current;
    const step = width / (MAX_POINTS - 1);

    histories.forEach((line, channelIdx) => {
      if (!line || line.length < 2) return;

      ctx.lineWidth = 2;
      ctx.strokeStyle = COLORS[channelIdx];

      ctx.beginPath();
      line.forEach((v, i) => {
        const x = i * step;
        const y = height - v * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // soft fade trail
      ctx.fillStyle = COLORS[channelIdx].replace("1)", "0.15)");
      line.forEach((v, i) => {
        const x = i * step;
        const y = height - v * height;
        ctx.fillRect(x - 1, y - 1, 2, 2);
      });
    });
  };

  // 🔥 ANIMATION LOOP
  const loop = () => {
    draw();
    animationRef.current = requestAnimationFrame(loop);
  };

  // 🔥 INIT CANVAS
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;

    const resize = () => {
      canvas.width = parent.clientWidth;
      canvas.height = 140;
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
    <div className="pulseTimelineContainer">
      <div className="pulseTimelineTitle">Pulse Timeline</div>

      <div className="pulseCanvasWrapper">
        <canvas ref={canvasRef} className="pulseCanvas" />
      </div>

      {/* 🔧 DEBUG */}
      <div className="pulseDebugBox">
        {smoothedHistory.map((ch, i) => (
          <div key={i}>
            <strong>Channel {i}:</strong>{" "}
            {ch.slice(-5).map((n) => n.toFixed(3)).join(", ")}
          </div>
        ))}
      </div>
    </div>
  );
}
