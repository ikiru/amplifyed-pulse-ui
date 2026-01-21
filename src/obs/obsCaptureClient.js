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

const OBS_CAPTURE_SINGLETON_KEY = "__OBS_CAPTURE_V1__";

function getCaptureSingleton() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!window[OBS_CAPTURE_SINGLETON_KEY]) {
    window[OBS_CAPTURE_SINGLETON_KEY] = {
      active: null, // { stream, captureSessionId }
      stopping: false,
      emit: null,
      unloadHookInstalled: false,
    };
  }

  return window[OBS_CAPTURE_SINGLETON_KEY];
}

export function createObsCaptureClient({ emit }) {
  // Persist active capture across Vite HMR/reloads by storing it on window.
  // This ensures Stop can always stop the current shared track.
  const singleton = getCaptureSingleton();
  if (singleton) {
    singleton.emit = emit;
  }

  const safeEmit = (eventName, payload = {}) => {
    const s = getCaptureSingleton();
    const fn = s?.emit ?? emit;
    if (typeof fn !== "function") return;
    fn(eventName, payload);
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
    const s = getCaptureSingleton();
    const active = s?.active ?? null;
    if (!active?.stream) return;

    if (s) s.stopping = true;
    safeEmit("obs:capture:stopped", {
      captureSessionId: active.captureSessionId,
      reason: "stopped",
      ts: Date.now(),
    });
    stopTracks(active.stream);
    if (s) {
      s.active = null;
      s.stopping = false;
    }
  };

  const startCapture = async () => {
    const s = getCaptureSingleton();
    const existing = s?.active?.stream ?? null;
    if (existing) {
      // v1: single-session; no re-prompt. Just return.
      return existing;
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

      if (s) {
        s.active = { stream, captureSessionId };
      }

      safeEmit("obs:capture:started", {
        captureSessionId,
        metrics,
        sourceHint,
        ts: Date.now(),
      });

      // Track ended (user stopped sharing via browser UI or source ended)
      track?.addEventListener?.("ended", () => {
        const s = getCaptureSingleton();
        const active = s?.active ?? null;
        if (!active?.stream) return;
        if (s?.stopping) return;

        safeEmit("obs:capture:stopped", {
          captureSessionId: active.captureSessionId ?? captureSessionId,
          reason: "track_ended",
          ts: Date.now(),
        });
        if (s) {
          s.active = null;
        }
      });

      // Optional hardening: stop capture tracks on tab close/reload.
      if (s && !s.unloadHookInstalled && typeof window !== "undefined") {
        s.unloadHookInstalled = true;
        window.addEventListener(
          "pagehide",
          () => {
            const active = getCaptureSingleton()?.active ?? null;
            if (active?.stream) {
              stopTracks(active.stream);
              const s = getCaptureSingleton();
              if (s) s.active = null;
            }
          },
          { capture: true }
        );
      }

      return stream;
    } catch (err) {
      // Permission denied / cancelled
      safeEmit("obs:capture:permission_denied", { ts: Date.now() });
      return null;
    }
  };

  const getStream = () => getCaptureSingleton()?.active?.stream ?? null;

  return {
    startCapture,
    stopCapture,
    getStream,
  };
}

