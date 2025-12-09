// src/components/console/PulseTimeline.jsx
import React from "react";
import { usePulseHistory } from "../../utils/usePulseHistory.js";

const emotionLabel = {
  engaged: "Engaged",
  neutral: "Neutral",
  frustrated: "Frustrated",
};

const PulseTimeline = () => {
  // IMPORTANT: read pulses, not the store object
  const { pulses } = usePulseHistory();

  const recentEvents = pulses.slice(-20);

  if (!recentEvents.length) {
    return (
      <div className="pulse-timeline">
        <div className="pulse-timeline-header">
          <div className="pulse-timeline-title">Emotional Momentum</div>
          <div className="pulse-timeline-subtitle">
            Based on incoming messages
          </div>
        </div>

        <div className="pulse-timeline-empty">
          <span className="pulse-timeline-empty-label">
            Emotional data initializing…
          </span>
        </div>
      </div>
    );
  }

  const counts = recentEvents.reduce(
    (acc, evt) => {
      if (evt.emotion === "engaged") acc.engaged++;
      else if (evt.emotion === "neutral") acc.neutral++;
      else if (evt.emotion === "frustrated") acc.frustrated++;
      return acc;
    },
    { engaged: 0, neutral: 0, frustrated: 0 }
  );

  const scores = recentEvents.reduce((acc, evt) => {
    const v =
      typeof evt.value === "number"
        ? evt.value
        : typeof evt.delta === "number"
        ? evt.delta
        : 0;

    const prev = acc.length ? acc[acc.length - 1] : 0;
    acc.push(prev + v);
    return acc;
  }, []);

  const maxAbsScore =
    scores.reduce((max, v) => Math.max(max, Math.abs(v)), 0) || 1;

  const width = 100;
  const height = 40;

  const pathD =
    scores.length > 1
      ? scores
          .map((s, i) => {
            const x =
              scores.length === 1
                ? width
                : (i / (scores.length - 1)) * width;
            const norm = s / maxAbsScore;
            const y = height / 2 - norm * (height / 2 - 2);
            return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
          })
          .join(" ")
      : `M 0 ${height / 2} L ${width} ${height / 2}`;

  return (
    <div className="pulse-timeline">
      <div className="pulse-timeline-header">
        <div className="pulse-timeline-title">Emotional Momentum</div>
        <div className="pulse-timeline-subtitle">
          Based on incoming messages
        </div>
      </div>

      <div className="pulse-timeline-trendline">
        <svg
          className="pulse-timeline-trendline-svg"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          <path d={pathD} fill="none" stroke="#0066ff" strokeWidth="1.5" />
        </svg>
      </div>

      <div className="pulse-timeline-counts">
        <div>engaged: {counts.engaged}</div>
        <div>neutral: {counts.neutral}</div>
        <div>frustrated: {counts.frustrated}</div>
      </div>

      <div className="pulse-timeline-list">
        {recentEvents.map((evt, i) => (
          <div key={i} className="pulse-timeline-item">
            <span className={`pulse-timeline-emotion pulse-${evt.emotion}`}>
              {emotionLabel[evt.emotion] ?? evt.emotion ?? "Unknown"}
            </span>
            <span className="pulse-timeline-value">
              {evt.delta > 0 ? `+${evt.delta}` : evt.delta}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PulseTimeline;
