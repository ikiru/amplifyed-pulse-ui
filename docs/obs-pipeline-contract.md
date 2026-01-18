# Status: Canonical
# Owner: TBD
# Last reviewed: 2026-01-18

# 📜 OBS Pipeline Contract

*Pixel-Capture Only · Source-Agnostic · Composition-Free · Codex-Ready*

---

## TL;DR (Guarantees)

- **Browser owns pixels**: capture uses `getDisplayMedia`; the MediaStream never becomes server data.
- **Server owns state**: backend tracks a session-scoped capture lifecycle and broadcasts status.
- **No composition / no semantics**: this pipeline never interprets content or alters room meaning.
- **Lifecycle is explicit** via socket events (`obs:capture:*`) and session broadcasts (`obs:status_changed`).

## 0. Purpose

The **OBS Pipeline** exists to capture an externally rendered visual surface and output a **stable, time-ordered video stream** that may later be composed into LiveView.

The pipeline is intentionally narrow in scope. It is infrastructure, not product logic.

It exists to:

* capture pixels produced by external systems
* normalize them into a reliable video stream
* fail gracefully without semantic side effects

It explicitly does **not** decide meaning, control presentations, or shape the room experience.

---

## 1. Core Principle (Non-Negotiable)

### 1.1 Pixels In, Pixels Out

The OBS Pipeline treats all input as **pixels over time**.

It has **no concept** of:

* slides
* pages
* documents
* presenters
* audiences
* meaning

It must never:

* parse presentation formats (PPTX, PDF, etc.)
* infer slide boundaries, slide numbers, or slide state
* interpret content, topics, sentiment, or intent
* apply annotations, highlights, or overlays

The pipeline outputs frames. Nothing more.

---

## 2. Scope Boundary

### 2.1 What the OBS Pipeline Owns

The OBS Pipeline owns:

* initiating and stopping capture
* user-mediated source selection

## Implementation Pointers (Code)

**Client:**
- Capture client (browser-only): `src/obs/obsCaptureClient.js`
- Trainer UI controls: `src/pages/TrainerView.jsx` (Start/Stop buttons)

**Server:**
- Pipeline state machine + broadcasts: `server/pipelines/obs/obsPipeline.js`
- Router wiring (trainer-only events): `server/routers/eventRouter.js`

**Key events (observed):**
- Trainer emit → server: `obs:capture:request`, `obs:capture:started`, `obs:capture:stopped`, `obs:capture:interrupted`, `obs:capture:permission_denied`, `obs:capture:not_supported`, `obs:capture:error`
- Server broadcast → session: `obs:status_changed` (plus capture lifecycle events)
* maintaining a stable video stream
* reporting capture lifecycle state
* detecting and surfacing capture interruption

### 2.2 What the OBS Pipeline Does Not Own

The OBS Pipeline must not:

* compose multiple layers
* render Pulse
* render messages, threads, or lenses
* know about LiveView
* know about trainers or participants
* decide what the room should see

Anything room-facing belongs to **LiveView Composition**, not here.

---

## 3. Inputs

### 3.1 Allowed Input Sources

The pipeline may capture **only** from externally rendered, user-selected surfaces, including:

* OS window capture (desktop applications)
* browser tab capture (web applications)
* full screen capture (fallback only)

Source selection must be:

* explicit
* user-initiated
* repeatable

The pipeline must not attempt automatic source discovery or inference.

### 3.2 Tool Independence

The pipeline must not contain tool-specific logic.

It must not:

* special-case PowerPoint
* special-case Google Slides
* special-case Prezi

If a surface can be captured, it is supported.

---

## 4. Outputs

### 4.1 Primary Output

The pipeline outputs a **MediaStream** containing:

* a required video track
* no audio tracks (see Section 7.4)

This stream is suitable as an input to a downstream composition system.

### 4.2 Output Stability Requirements

The pipeline must:

* preserve the source aspect ratio
* avoid unintended cropping or scaling
* maintain reasonable frame timing
* prefer quality-preserving defaults

If quality degrades, the pipeline must surface this as a neutral state change, not a failure.

---

## 5. Lifecycle & Recovery

### 5.1 Explicit Lifecycle

Capture must have:

* an explicit start action
* an explicit stop action

Capture must never begin automatically.

### 5.2 Interruption Handling

If the capture source:

* closes
* is minimized
* loses permission
* ends its video track

The pipeline must:

* enter a recoverable `interrupted` state
* surface a neutral explanation
* provide a single action to reselect a source

The pipeline must not cascade failure into downstream systems.

---

## 6. Environment Constraints

### 6.1 Capability Gating

The OBS Pipeline must be disabled unless required capabilities are present:

* `navigator.mediaDevices.getDisplayMedia`
* `MediaStreamTrack` (video)
* MediaStream playback in a video element

If capabilities are missing, the pipeline must surface `error_not_supported`.

### 6.2 Supported Environments

For reliability, the pipeline may be restricted to Chromium-based browsers (e.g. Chrome, Edge).

This restriction must be communicated clearly and without blame.

---

## 7. Build Spec (Codex-Ready)

This section is **normative** for the v1 implementation. Codex must follow this section exactly and must not infer additional behavior.

### 7.1 Public Interface (Minimum)

The pipeline must expose the following interface (names may vary; behavior must not):

* `startCapture(options): Promise<CaptureSession>`
* `stopCapture(sessionId?): Promise<void>`
* `getStream(sessionId?): MediaStream | null`
* `getStatus(sessionId?): CaptureStatus`
* `getActiveSession(): CaptureSession | null`
* `on(eventName, handler)`

#### 7.1.1 Single-Session Authority (v1)

The OBS Pipeline supports **exactly one** active CaptureSession at a time.

Compatibility note:
- The public interface may accept an optional `sessionId`, but v1 has only one active session slot.

Required behavior:
- **Start while active:** If status is `capturing` and `startCapture()` is called, the pipeline MUST return the existing active CaptureSession **without** prompting the user again.
- **Stop without id:** If `stopCapture()` is called with no `sessionId`, it MUST stop the active session if one exists.
- **Stale id handling:** If a `sessionId` is provided and does not match the active session id:
  - `stopCapture(sessionId)` MUST be a no-op.
  - `getStream(sessionId)` MUST return null.
  - `getStatus(sessionId)` MUST return `idle`.

**CaptureSession** must include:

* `id: string`
* `stream: MediaStream`
* `sourceHint: 'window' | 'tab' | 'screen' | 'unknown'`

### 7.2 State Machine

The pipeline must implement the following explicit states:

* `idle`
* `requesting_permission`
* `capturing`
* `interrupted`
* `ended`
* `error_already_capturing`
* `error_permission_denied`
* `error_not_supported`
* `error_unknown`

Transitions must be explicit and evented:

* `idle → requesting_permission` on start
* `requesting_permission → capturing` on success
* `requesting_permission → error_permission_denied` on cancel/deny
* `capturing → interrupted` on unexpected track end
* `capturing → ended` on stop
* `interrupted → requesting_permission` on reselect

Silent transitions are forbidden.

#### 7.2.1 Ended vs Interrupted (v1 Clarification)

`capturing → ended` MUST be used for:
- explicit `stopCapture()`
- user-initiated stop via browser sharing UI (treat as ended)

`capturing → interrupted` MUST be used for:
- capture source vanishes (e.g., captured window closes)
- permission is revoked
- track ends unexpectedly (non-user-stop)

### 7.3 Video Defaults

* Preferred resolution: 1920×1080 @ 30fps
* Minimum acceptable: 1280×720 @ 15fps

The pipeline must fall back gracefully if preferred settings are unavailable.

### 7.4 Audio Policy (v1)

* Capture must request `audio: false`.
* No audio toggle may be exposed in v1.
* The pipeline must not capture, mix, or route microphone audio.

### 7.5 Lifecycle Events

The pipeline must emit events for:

* `status_changed` (on EVERY state transition; payload includes `status`, `reason`, `sessionId | null`)
* `capture_started`
* `capture_stopped`
* `capture_interrupted`
* `capture_permission_denied`
* `capture_not_supported`
* `capture_error`

### 7.6 Neutral Messaging

All messaging must be neutral, mechanical, and blame-free.

Examples:

* Not supported: “Capture isn’t available in this browser. Use Chrome or Edge.”
* Permission denied: “Capture was not started. Choose a window or tab to continue.”
* Interrupted: “Capture was interrupted. Reselect a window or tab to continue.”
* Unknown: “Capture hit an unexpected error. Try reselecting the source.”

### 7.7 Stream Metrics (Pixels-Only)

The pipeline MUST expose basic observed stream metrics for downstream layout without semantic inference:

* `getMetrics(sessionId?): { width?: number, height?: number, frameRate?: number, aspectRatio?: number } | null`

Rules:
- Metrics MUST be derived only from `MediaStreamTrack.getSettings()` and/or video element metadata.
- Metrics MUST NOT be derived by interpreting pixels or inferring content.

---

## 8. Explicit Prohibitions

The OBS Pipeline must never:

* compose layers
* render overlays
* render Pulse
* reference LiveView
* persist semantic state
* infer importance or meaning
* answer the question “what should the room see?”

Any proposal that violates this section is invalid.

---

## 9. Status

This contract is **authoritative and binding**.

Any system built against this contract must treat it as the final source of truth for the OBS Pipeline.

Changes require explicit revision, not incremental drift.

---

## Appendix A — Reference Skeleton (Non‑Normative)

This appendix is provided to reduce implementation drift.
It is **not authoritative**. If it conflicts with Sections 1–9, Sections 1–9 win.

Goals:
- single-session enforcement
- explicit state transitions
- pixels-only capture via `getDisplayMedia`
- `audio: false`
- event emission on transitions

```js
// Reference only. Not normative.

export function createObsCapturePipeline() {
  let status = "idle";
  let activeSession = null; // { id, stream, sourceHint }
  let metrics = null; // { width, height, frameRate, aspectRatio }
  const handlers = new Map(); // eventName -> Set(fn)

  const emit = (eventName, payload) => {
    const set = handlers.get(eventName);
    if (!set) return;
    for (const fn of set) {
      try { fn(payload); } catch {}
    }
  };

  const setStatus = (nextStatus, reason) => {
    status = nextStatus;
    emit("status_changed", {
      status: nextStatus,
      reason,
      sessionId: activeSession?.id ?? null,
      timestamp: Date.now(),
    });
  };

  const on = (eventName, handler) => {
    if (!handlers.has(eventName)) handlers.set(eventName, new Set());
    handlers.get(eventName).add(handler);
    return () => handlers.get(eventName)?.delete(handler);
  };

  const getActiveSession = () => activeSession;

  const getStatus = (sessionId) =>
    sessionId && activeSession?.id !== sessionId ? "idle" : status;

  const getStream = (sessionId) =>
    sessionId && activeSession?.id !== sessionId ? null : activeSession?.stream ?? null;

  const getMetrics = (sessionId) =>
    sessionId && activeSession?.id !== sessionId ? null : metrics;

  const stopCapture = async (sessionId) => {
    if (sessionId && activeSession?.id !== sessionId) return;

    const stream = activeSession?.stream;
    if (!stream) {
      setStatus("idle", "No active capture session.");
      return;
    }

    setStatus("ended", "Capture stopped.");
    stream.getTracks().forEach((t) => t.stop());
    activeSession = null;
    metrics = null;
    emit("capture_stopped", { timestamp: Date.now() });
    setStatus("idle", "Idle.");
  };

  const startCapture = async (options = {}) => {
    // v1: if already capturing, return the active session without re-prompting.
    if (status === "capturing" && activeSession?.stream) return activeSession;

    if (!navigator?.mediaDevices?.getDisplayMedia) {
      setStatus(
        "error_not_supported",
        "Capture isn't available in this browser. Use Chrome or Edge."
      );
      emit("capture_not_supported", { timestamp: Date.now() });
      return null;
    }

    setStatus("requesting_permission", "Choose a window or tab to continue.");

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });

      const track = stream.getVideoTracks?.()?.[0];
      const settings = track?.getSettings?.() ?? {};
      metrics = {
        width: settings.width,
        height: settings.height,
        frameRate: settings.frameRate,
        aspectRatio:
          settings.width && settings.height ? settings.width / settings.height : undefined,
      };

      const id = `cap_${Date.now()}`;
      activeSession = { id, stream, sourceHint: "unknown" };

      track?.addEventListener?.("ended", () => {
        // Default: treat as ended (user stopped sharing).
        activeSession = null;
        metrics = null;
        setStatus("ended", "Capture ended.");
        emit("capture_stopped", { timestamp: Date.now() });
        setStatus("idle", "Idle.");
      });

      setStatus("capturing", "Capture started.");
      emit("capture_started", { sessionId: id, timestamp: Date.now() });
      return activeSession;
    } catch (err) {
      setStatus(
        "error_permission_denied",
        "Capture was not started. Choose a window or tab to continue."
      );
      emit("capture_permission_denied", { timestamp: Date.now() });
      return null;
    }
  };

  return {
    startCapture,
    stopCapture,
    getStream,
    getStatus,
    getActiveSession,
    getMetrics,
    on,
  };
}
```
