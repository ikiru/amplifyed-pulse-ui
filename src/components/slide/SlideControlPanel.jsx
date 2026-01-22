import React, { useState } from "react";
import { ackToHuman } from "../../utils/slideCopy.js";

/**
 * Slide Control Panel (v1)
 *
 * Contract §12: Prev/Next, Bind/Rebind/Unbind, agent status, bound target,
 * last result, permission notice, Recheck Permissions, Preflight.
 * No optimistic updates; no implicit hotkeys.
 */

export function SlideControlPanel({
  agentStatus,
  bindingId,
  boundTargetLabel,
  lastResult,
  pending,
  permissionStatus,
  handlePrev,
  handleNext,
  handleBindList,
  handleBindSelect,
  handleUnbind,
  handleRebind,
  handleRecheckPermissions,
  handlePreflight,
}) {
  const [bindTargets, setBindTargets] = useState([]);
  const [bindOpen, setBindOpen] = useState(false);
  const [preflightResult, setPreflightResult] = useState(null);

  const disabled = agentStatus === "disconnected" || pending || !bindingId;
  const permissionMissing = permissionStatus === "PERMISSION_MISSING";

  const onBindClick = async () => {
    const out = await handleBindList();
    if (out.targets && out.targets.length) {
      setBindTargets(out.targets);
      setBindOpen(true);
    }
  };

  const onRebindClick = async () => {
    const out = await handleRebind();
    if (out.targets && out.targets.length) {
      setBindTargets(out.targets);
      setBindOpen(true);
    }
  };

  const onSelectTarget = async (id) => {
    await handleBindSelect(id);
    setBindOpen(false);
    setBindTargets([]);
  };

  const onPreflightClick = async () => {
    const res = await handlePreflight();
    setPreflightResult(res);
  };

  const lastResultText = lastResult
    ? ackToHuman(lastResult.ack, lastResult.reason)
    : "";

  return (
    <section className="trainer-panel-card">
      <h3 className="trainer-section-heading">Slide Control</h3>

      {permissionMissing && (
        <div
          className="trainer-panel-note"
          style={{
            background: "#fef3e2",
            border: "1px solid #e0b050",
            borderRadius: 4,
            padding: 10,
            marginBottom: 10,
          }}
        >
          <p style={{ margin: "0 0 8px 0", fontWeight: 600 }}>
            macOS Accessibility permission required
          </p>
          <p style={{ margin: 0, fontSize: "0.9em" }}>
            The slide control agent needs Accessibility access to send keys to the
            slides window. Enable it in <strong>System Settings → Privacy &amp; Security → Accessibility</strong> and add your terminal or the agent app.
          </p>
          <button
            type="button"
            className="trainer-focus-button"
            style={{ marginTop: 8 }}
            onClick={handleRecheckPermissions}
          >
            Recheck Permissions
          </button>
        </div>
      )}

      {agentStatus === "disconnected" && !permissionMissing && (
        <p className="trainer-text-muted trainer-panel-note" style={{ marginBottom: 10 }}>
          Manual slide control required. Start the slide control agent on this machine.
        </p>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button
          type="button"
          className="trainer-focus-button"
          disabled={disabled}
          onClick={handlePrev}
          title="Previous slide"
        >
          Prev
        </button>
        <button
          type="button"
          className="trainer-focus-button"
          disabled={disabled}
          onClick={handleNext}
          title="Next slide"
        >
          Next
        </button>
      </div>

      <div style={{ marginBottom: 10 }}>
        <p style={{ margin: 0, fontSize: "0.75rem", color: "#666", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Binding
        </p>
        <p style={{ margin: "4px 0 0 0", fontWeight: 600 }}>
          {boundTargetLabel || "Not bound"}
        </p>
        <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
          <button
            type="button"
            className="trainer-focus-button trainer-focus-button--secondary"
            disabled={agentStatus === "disconnected"}
            onClick={onBindClick}
          >
            Bind
          </button>
          <button
            type="button"
            className="trainer-focus-button trainer-focus-button--secondary"
            disabled={agentStatus === "disconnected"}
            onClick={onRebindClick}
          >
            Rebind
          </button>
          <button
            type="button"
            className="trainer-focus-button trainer-focus-button--secondary"
            disabled={agentStatus === "disconnected" || !bindingId}
            onClick={handleUnbind}
          >
            Unbind
          </button>
        </div>
      </div>

      {bindOpen && bindTargets.length > 0 && (
        <div
          style={{
            border: "1px solid #e0e0e0",
            borderRadius: 4,
            padding: 8,
            marginBottom: 10,
            background: "#fafafa",
          }}
        >
          <p style={{ margin: "0 0 6px 0", fontSize: "0.85em" }}>Select target:</p>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {bindTargets.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className="trainer-focus-button trainer-focus-button--secondary"
                  style={{ margin: "2px 0" }}
                  onClick={() => onSelectTarget(t.id)}
                >
                  {t.label || t.id}
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="trainer-focus-button trainer-focus-button--secondary"
            style={{ marginTop: 6 }}
            onClick={() => { setBindOpen(false); setBindTargets([]); }}
          >
            Cancel
          </button>
        </div>
      )}

      <div style={{ marginBottom: 10 }}>
        <p style={{ margin: 0, fontSize: "0.75rem", color: "#666", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Agent
        </p>
        <p style={{ margin: "4px 0 0 0", fontWeight: 600 }}>
          {agentStatus === "connected" ? "Connected" : agentStatus === "stale" ? "Stale" : "Disconnected"}
        </p>
      </div>

      {lastResultText && (
        <div style={{ marginBottom: 10 }}>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "#666", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Last result
          </p>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.9em" }}>{lastResultText}</p>
        </div>
      )}

      <div>
        <button
          type="button"
          className="trainer-focus-button trainer-focus-button--secondary"
          disabled={agentStatus === "disconnected" || !bindingId}
          onClick={onPreflightClick}
        >
          Run Preflight
        </button>
        {preflightResult && (
          <span style={{ marginLeft: 8, fontSize: "0.9em" }}>
            {preflightResult.ok ? "Preflight OK" : `Preflight failed: ${preflightResult.step}`}
          </span>
        )}
      </div>
    </section>
  );
}
