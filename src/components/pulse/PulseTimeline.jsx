/**
 * PulseTimeline Component
 * 
 * Real-time "cardiac monitor" style visualization of audience pulse votes.
 * Displays a scrolling timeline showing net sentiment (engaged vs frustrated)
 * over time with participant-scaled Y-axis.
 * 
 * Features:
 * - Fixed 60-second visible window
 * - Participant-count scaled Y-axis
 * - Real-time animation via requestAnimationFrame
 * - Handles pre-session / zero-participant states gracefully
 */

import { useEffect, useState } from "react";

const VISIBLE_WINDOW_MS = 60_000; // Show roughly one minute of data in the visual "cardiac monitor" window.
const TRACE_ENABLED = false;

export function PulseTimeline(props) {
  const {
    eventLog = [],
    participantsCount,
    scaleMin,
    scaleMax,
    points,
  } = props;
  const participantCount = participantsCount;

  const participantsPending = participantsCount === undefined;

  if (participantsPending) {
    console.debug("[PulseTimeline] participants pending");
  }

  if (process.env.NODE_ENV !== "production") {
    console.assert(
      participantsPending || typeof participantsCount === "number",
      "participantsCount unresolved outside pending state"
    );
  }

  // Normalize participantsCount for early / pre-session renders
  const resolvedParticipantsCount =
    typeof participantsCount === "number"
      ? participantsCount
      : 0;
  const scale = participantsPending ? 1 : resolvedParticipantsCount;
  const scalingProps = {
    participantsCount: resolvedParticipantsCount,
    eventLogLength: Array.isArray(eventLog) ? eventLog.length : undefined,
    pulseHistoryLength: props.pulseHistory?.length,
    scale: props.scale,
  };

  if (process.env.NODE_ENV !== "production") {
    if (TRACE_ENABLED) {
      console.groupCollapsed("[TRACE] PulseTimeline props");
      console.log("resolvedParticipantsCount:", resolvedParticipantsCount);
      console.log("scaleMin:", scaleMin);
      console.log("scaleMax:", scaleMax);
      console.log("points:", points);
      console.groupEnd();
    }

    // Zero is an expected transitional value while the canonical participant count is still pending.
    const resolvedCountIsValid = resolvedParticipantsCount >= 0;
    if (!resolvedCountIsValid) {
      console.warn(
        "[ASSERT] PulseTimeline received invalid resolvedParticipantsCount:",
        resolvedParticipantsCount
      );
    }

    if (TRACE_ENABLED) {
      console.groupCollapsed("[TRACE] PulseTimeline scaling props");
      console.log("scaling props snapshot:", scalingProps);
      console.log("resolvedParticipantsCount:", resolvedParticipantsCount);
      console.groupEnd();
    }
    console.assert(
      resolvedCountIsValid,
      "[ASSERT] PulseTimeline received invalid resolvedParticipantsCount",
      { resolvedParticipantsCount }
    );
  }

  // Source: raw prop from TrainerView's livePulse payload. The timeline defaults to 0 for missing values, so the debug here shines light on when PulseSummary sees `undefined` while PulseTimeline consumes 0.
  const canonicalPulseMap = {
    engaged: 1,
    neutral: 0,
    frustrated: -1,
  };

  const normalizedEvents = (Array.isArray(eventLog) ? eventLog : [])
    .map((entry, index) => {
      if (!entry) {
        return null;
      }

      const rawValue =
        typeof entry.value === "number"
          ? entry.value
          : canonicalPulseMap[entry.value];
      if (
        rawValue === null ||
        rawValue === undefined ||
        (rawValue !== 1 && rawValue !== 0 && rawValue !== -1)
      ) {
        return null;
      }

      return {
        ts: entry.ts ?? entry.timestamp ?? Date.now() + index,
        value: rawValue,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.ts - b.ts);

  const [baselineStartTs] = useState(() => Date.now());
  const [nowTs, setNowTs] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    let rafId;
    const updateNow = () => {
      if (!active) {
        return;
      }
      setNowTs(Date.now());
      rafId = requestAnimationFrame(updateNow);
    };
    rafId = requestAnimationFrame(updateNow);
    return () => {
      active = false;
      cancelAnimationFrame(rafId);
    };
  }, []);

  const timelineEntries = [
    { ts: baselineStartTs, value: 0 },
    ...normalizedEvents,
  ];

  const participantScale = scale;
  // displayCount bottoms out at 1 so a visible ± range exists even with zero/missing participants, and the left labels are strictly diagnostics for verifying that participant-based scaling.
  const displayCount = Math.max(1, participantScale);
  const minY = -displayCount;
  const maxY = displayCount;
  const safeScale = displayCount;

  const timelinePoints = [];
  const startTs = timelineEntries[0]?.ts ?? Date.now();
  timelinePoints.push({ ts: startTs, netValue: 0 });

  let previousVote = 0;
  let netValueTotal = 0;

  for (let i = 1; i < timelineEntries.length; i += 1) {
    const entry = timelineEntries[i];
    const delta = entry.value - previousVote;
    netValueTotal += delta;

    timelinePoints.push({
      ts: entry.ts,
      netValue: netValueTotal,
    });

    previousVote = entry.value;
  }

  const width =
    Math.max(360, Math.max(normalizedEvents.length - 1, 0) * 48 + 80);
  const height = 180;
  const centerY = height / 2;
  const amplitude = centerY - 16;

  const latestHistoryTs =
    timelinePoints[timelinePoints.length - 1]?.ts ?? Date.now();
  const effectiveLatestTs = Math.max(latestHistoryTs, nowTs);
  const windowStartTs = effectiveLatestTs - VISIBLE_WINDOW_MS;

  let netValueBeforeWindow = timelinePoints[0]?.netValue ?? 0;
  for (let i = timelinePoints.length - 1; i >= 0; i -= 1) {
    if (timelinePoints[i].ts < windowStartTs) {
      netValueBeforeWindow = timelinePoints[i].netValue;
      break;
    }
  }

  // Restrict rendering to the most recent window to preserve the fixed-width cardiac monitor feel.
  const pointsInVisibleWindow = timelinePoints.filter(
    (point) => point.ts >= windowStartTs
  );

  const windowedTimelinePoints = [];
  if (pointsInVisibleWindow.length === 0) {
    windowedTimelinePoints.push({
      ts: windowStartTs,
      netValue: netValueBeforeWindow,
    });
  } else {
    if (pointsInVisibleWindow[0].ts > windowStartTs) {
      windowedTimelinePoints.push({
        ts: windowStartTs,
        netValue: netValueBeforeWindow,
      });
    }
    windowedTimelinePoints.push(...pointsInVisibleWindow);
  }

  const span = Math.max(effectiveLatestTs - windowStartTs, 1);

  const xForTs = (ts) => {
    const progress = (ts - windowStartTs) / span;
    return Math.max(0, Math.min(width, progress * width));
  };

  const yForValue = (value) =>
    centerY - (value / safeScale) * amplitude;

  const hasEvents = windowedTimelinePoints.length > 0;
  const baselinePoint = {
    ts: nowTs,
    netValue: 0,
    synthetic: true,
  };
  // Right-anchored neutral baseline keeps the timeline visible before any events arrive.
  const pointsForPath = hasEvents ? windowedTimelinePoints : [baselinePoint];

  const commands = pointsForPath.map((point, index) => {
    const x = xForTs(point.ts);
    const y = yForValue(point.netValue);
    return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  });
  const latestNetValue =
    timelinePoints[timelinePoints.length - 1]?.netValue ?? 0;
  const leadX = xForTs(nowTs);
  const leadY = yForValue(latestNetValue);
  const nowX = leadX.toFixed(2);
  commands.push(`L ${nowX} ${yForValue(latestNetValue).toFixed(2)}`);

  const pathD = commands.join(" ");

  const axisLineValues = [maxY, 0, minY];

  return (
    <div className="pulse-timeline">
      <div className="pulse-timeline-header">
        <div>
          <div className="pulse-timeline-title">PULSE</div>
        </div>
        <div className="pulse-timeline-current">
          👥 {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
        </div>
      </div>
      <div className="pulse-timeline-track">
        <div
          className="pulse-timeline-track-inner"
          style={{ minHeight: height }}
        >
          <div
            className="pulse-timeline-scale-axis"
            style={{ height }}
            aria-hidden="true"
          >
            {[
              { value: maxY, label: maxY >= 0 ? `+${maxY}` : `${maxY}`, key: "max" },
              { value: 0, label: "0", key: "zero" },
              { value: minY, label: `${minY}`, key: "min" },
            ].map(({ value, label, key }) => (
              <span
                key={`scale-label-${key}`}
                className="pulse-timeline-scale-label"
                style={{ top: `${yForValue(value)}px` }}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="pulse-timeline-svg-wrapper">
            <svg
              className="pulse-timeline-svg"
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="none"
            >
              {axisLineValues.map((value) => (
                <line
                  key={`axis-${value}`}
                  x1="0"
                  x2={width}
                  y1={yForValue(value)}
                  y2={yForValue(value)}
                  stroke="#eee"
                  strokeWidth="1"
                />
              ))}
              <line
                x1="0"
                x2={width}
                y1={height - 4}
                y2={height - 4}
                stroke="#ccc"
                strokeWidth="1"
              />
              <path d={pathD} fill="none" stroke="#0066ff" strokeWidth="2" />
              <circle cx={leadX} cy={leadY} r={3} fill="#0066ff" />
            </svg>
          </div>
        </div>
      </div>
      <div className="pulse-timeline-legend">
        <span />
        <span />
        <span />
      </div>
      {windowedTimelinePoints.length > 1 && (
        <div className="pulse-timeline-time-axis">
          <span />
          <span />
        </div>
      )}
    </div>
  );
}
