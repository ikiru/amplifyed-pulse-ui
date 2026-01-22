/**
 * Slide Control Client (v1)
 *
 * Talks to the Local Slide Controller Agent on localhost (HTTP).
 * On connection failure or timeout, returns REJECTED_NOT_CONNECTED or REJECTED_UNKNOWN.
 * Contract: docs/SLIDE CONTROL PIPELINE CONTRACT (v1)
 */

const DEFAULT_PORT = 4011;
const REQUEST_TIMEOUT_MS = 5000;

function getBaseUrl() {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_SLIDE_AGENT_PORT) {
    const port = Number(import.meta.env.VITE_SLIDE_AGENT_PORT);
    if (Number.isFinite(port)) {
      return `http://127.0.0.1:${port}`;
    }
  }
  const envPort = typeof process !== "undefined" && process.env?.SLIDE_AGENT_PORT;
  const port = envPort ? Number(envPort) : DEFAULT_PORT;
  return `http://127.0.0.1:${Number.isFinite(port) ? port : DEFAULT_PORT}`;
}

function fetchWithTimeout(url, options = {}, ms = REQUEST_TIMEOUT_MS) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...options, signal: ctrl.signal }).finally(() => clearTimeout(id));
}

function isNetworkError(err) {
  if (!err) return false;
  const m = err?.message || "";
  return (
    err.name === "AbortError" ||
    m.includes("Failed to fetch") ||
    m.includes("NetworkError") ||
    m.includes("Load failed")
  );
}

/**
 * @param {{ baseUrl?: string }} [opts]
 * @returns {{ listTargets, selectTarget, unbind, command, getPermission }}
 */
export function createSlideControlClient(opts = {}) {
  const base = opts.baseUrl || getBaseUrl();

  async function post(path, body = {}) {
    try {
      const res = await fetchWithTimeout(`${base}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        return { ack: "REJECTED_UNKNOWN", reason: `HTTP ${res.status}` };
      }
      return res.json();
    } catch (e) {
      if (isNetworkError(e)) {
        return { ack: "REJECTED_NOT_CONNECTED", reason: "Agent unreachable" };
      }
      return { ack: "REJECTED_UNKNOWN", reason: String(e?.message || e) };
    }
  }

  async function get(path) {
    try {
      const res = await fetchWithTimeout(`${base}${path}`);
      if (!res.ok) {
        return { status: "PERMISSION_MISSING" };
      }
      return res.json();
    } catch (e) {
      if (isNetworkError(e)) {
        return { status: "PERMISSION_MISSING" };
      }
      return { status: "PERMISSION_MISSING" };
    }
  }

  return {
    async listTargets() {
      const out = await post("/bind/list", {});
      if (out.ack && out.ack.startsWith("REJECTED_")) {
        return out;
      }
      return { targets: Array.isArray(out.targets) ? out.targets : [] };
    },

    async selectTarget(targetId) {
      return post("/bind/select", { targetId });
    },

    async unbind() {
      return post("/bind/unbind", {});
    },

    async command(type, { commandId, issuedAt, sessionId, bindingId }) {
      return post("/command", {
        type,
        commandId,
        issuedAt,
        sessionId: sessionId ?? "",
        bindingId: bindingId ?? "",
      });
    },

    async getPermission() {
      const out = await get("/permission");
      return { status: out.status === "PERMISSION_OK" ? "PERMISSION_OK" : "PERMISSION_MISSING" };
    },
  };
}
