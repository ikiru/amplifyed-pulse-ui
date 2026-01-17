/**
 * OBS Capture Client (v1)
 *
 * Browser-only pixels capture via getDisplayMedia. No composition. No server streaming.
 * Emits lifecycle events to the backend pipeline over socket emit().
 */

function computeMetricsFromTrack(track) {
  const settings = track?.getSettings?.() ?? {};
  const width = settings.width;
  const height = settings.height;
  const frameRate = settings.frameRate;
  const aspectRatio =
    typeof width === "number" && typeof height === "number" && height > 0
      ? width / height
      : undefined;

  return {
    width,
    height,
    frameRate,
    aspectRatio,
  };
}

function computeSourceHint(track) {
  const settings = track?.getSettings?.() ?? {};
  // Chromium may provide displaySurface: 'browser' | 'window' | 'monitor'
  const surface = settings.displaySurface;
  if (surface === "window") return "window";
  if (surface === "browser") return "tab";
  if (surface === "monitor") return "screen";
  return "unknown";
}

export function createObsCaptureClient({ emit }) {
  let active = null; // { stream, captureSessionId }
  let stopping = false;

  const safeEmit = (eventName, payload = {}) => {
    if (typeof emit !== "function") return;
    emit(eventName, payload);
  };

  const stopTracks = (stream) => {
    stream?.getTracks?.().forEach((t) => {
      try {
        t.stop();
      } catch (_) {
        // ignore
      }
    });
  };

  const stopCapture = () => {
    if (!active?.stream) return;
    stopping = true;
    safeEmit("obs:capture:stopped", {
      captureSessionId: active.captureSessionId,
      reason: "stopped",
      ts: Date.now(),
    });
    stopTracks(active.stream);
    active = null;
    stopping = false;
  };

  const startCapture = async () => {
    if (active?.stream) {
      // v1: single-session; no re-prompt. Just return.
      return active.stream;
    }

    if (!navigator?.mediaDevices?.getDisplayMedia) {
      safeEmit("obs:capture:not_supported", { ts: Date.now() });
      return null;
    }

    safeEmit("obs:capture:request", { ts: Date.now() });

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });

      const track = stream.getVideoTracks?.()?.[0] ?? null;
      const metrics = computeMetricsFromTrack(track);
      const sourceHint = computeSourceHint(track);
      const captureSessionId = `cap_${Date.now()}_${Math.random()
        .toString(16)
        .slice(2)}`;

      active = { stream, captureSessionId };

      safeEmit("obs:capture:started", {
        captureSessionId,
        metrics,
        sourceHint,
        ts: Date.now(),
      });

      // Track ended (user stopped sharing via browser UI or source ended)
      track?.addEventListener?.("ended", () => {
        if (!active?.stream) return;
        if (stopping) return;

        safeEmit("obs:capture:stopped", {
          captureSessionId,
          reason: "track_ended",
          ts: Date.now(),
        });
        active = null;
      });

      return stream;
    } catch (err) {
      // Permission denied / cancelled
      safeEmit("obs:capture:permission_denied", { ts: Date.now() });
      return null;
    }
  };

  const getStream = () => active?.stream ?? null;

  return {
    startCapture,
    stopCapture,
    getStream,
  };
}

