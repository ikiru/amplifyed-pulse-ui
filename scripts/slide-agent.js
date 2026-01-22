#!/usr/bin/env node
/**
 * Slide Control Agent (macOS)
 *
 * Real Local Slide Controller Agent: finds Chrome windows with Google Slides,
 * binds to one, and sends Prev/Next keystrokes via macOS Accessibility.
 * Requires: Google Chrome, macOS Accessibility for the process running this script
 * (e.g. Terminal, iTerm, or Cursor).
 *
 * Contract: docs/SLIDE CONTROL PIPELINE CONTRACT (v1)
 *
 * Usage: node scripts/slide-agent.js [port]
 *   port defaults to 4011 or SLIDE_AGENT_PORT.
 *
 * Endpoints:
 *   GET  /permission     -> { status: "PERMISSION_OK" | "PERMISSION_MISSING" }
 *   POST /bind/list      -> { targets: [{ id, label }] } (Chrome windows with docs.google.com/presentation)
 *   POST /bind/select    -> { ack, bindingId?, boundTargetLabel? }
 *   POST /bind/unbind    -> { ack: "ACK_EXECUTED" }
 *   POST /command        -> { ack: "ACK_EXECUTED" | "REJECTED_*" }
 */

import { createServer } from "http";
import { execSync } from "child_process";

const PORT = Number(process.env.SLIDE_AGENT_PORT) || 4011;
const port = Number(process.argv[2]) || PORT;
const IS_MAC = process.platform === "darwin";
const RATE_LIMIT_MS = 250;
const RECENT_COMMAND_IDS_MAX = 100;

let bound = null; // { bindingId, boundTargetLabel }
let lastCommandAt = 0;
const recentCommandIds = new Set();

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function send(res, status, body) {
  cors(res);
  res.setHeader("Content-Type", "application/json");
  res.writeHead(status);
  res.end(JSON.stringify(body));
}

function parseBody(req) {
  return new Promise((resolve) => {
    let b = "";
    req.on("data", (c) => { b += c; });
    req.on("end", () => {
      try { resolve(b ? JSON.parse(b) : {}); } catch { resolve({}); }
    });
  });
}

function osascript(script) {
  try {
    const out = execSync("osascript -e " + JSON.stringify(script), {
      encoding: "utf8",
      timeout: 8000,
    });
    return { ok: true, out: (out || "").trim() };
  } catch (e) {
    const stderr = (e.stderr || e.message || "").toLowerCase();
    return { ok: false, err: stderr };
  }
}

// --- Permission: requires Accessibility (System Events) ---
function checkPermission() {
  if (!IS_MAC) return "PERMISSION_OK";
  const r = osascript('tell application "System Events" to get name of first process');
  if (r.ok) return "PERMISSION_OK";
  if (r.err && (r.err.includes("not authorized") || r.err.includes("assistive") || r.err.includes("accessibility"))) {
    return "PERMISSION_MISSING";
  }
  return "PERMISSION_MISSING";
}

// --- List: Chrome windows whose active tab URL contains docs.google.com/presentation ---
function listTargets() {
  if (!IS_MAC) return { targets: [] };
  const script = `
    set out to ""
    tell application "Google Chrome"
      repeat with w in every window
        try
          set u to URL of active tab of w
          if u contains "docs.google.com/presentation" then
            set wid to (id of w as text)
            set t to (title of active tab of w) as text
            set AppleScript's text item delimiters to return
            set t to (text items of t) as text
            set AppleScript's text item delimiters to tab
            set t to (text items of t) as text
            set AppleScript's text item delimiters to ""
            set out to out & wid & tab & t & return
          end if
        end try
      end repeat
    end tell
    return out
  `;
  const r = osascript(script);
  if (!r.ok) return { targets: [] };
  const targets = [];
  const lines = (r.out || "").split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    const i = line.indexOf("\t");
    if (i === -1) continue;
    const id = line.slice(0, i).trim();
    const label = line.slice(i + 1).trim() || "Google Slides";
    if (id) targets.push({ id, label });
  }
  return { targets };
}

// --- Select: verify window exists and store binding ---
function selectTarget(targetId) {
  if (!IS_MAC) return { ack: "REJECTED_UNSUPPORTED_PLATFORM" };
  const perm = checkPermission();
  if (perm === "PERMISSION_MISSING") return { ack: "REJECTED_PERMISSION_DENIED" };
  const escaped = String(targetId).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const script = `
    tell application "Google Chrome"
      repeat with w in every window
        try
          if (id of w as text) is "${escaped}" then
            set u to URL of active tab of w
            if u contains "docs.google.com/presentation" then
              return (title of active tab of w) as text
            end if
            return "__invalid"
          end if
        end try
      end repeat
    end tell
    return "__notfound"
  `;
  const r = osascript(script);
  if (!r.ok) return { ack: "REJECTED_UNKNOWN" };
  if (r.out === "__notfound") return { ack: "REJECTED_TARGET_NOT_FOUND" };
  if (r.out === "__invalid") return { ack: "REJECTED_TARGET_NOT_FOUND" };
  const label = (r.out || "Google Slides").replace(/\s+/g, " ").trim();
  bound = { bindingId: String(targetId), boundTargetLabel: label || "Google Slides" };
  return { ack: "ACK_EXECUTED", bindingId: bound.bindingId, boundTargetLabel: bound.boundTargetLabel };
}

// --- Command: bring window to front and send key (123=Left/Prev, 124=Right/Next) ---
function runCommand(type, commandId, bindingId) {
  if (!IS_MAC) return { ack: "REJECTED_UNSUPPORTED_PLATFORM" };
  const perm = checkPermission();
  if (perm === "PERMISSION_MISSING") return { ack: "REJECTED_PERMISSION_DENIED" };
  if (!bound || bound.bindingId !== bindingId) return { ack: "REJECTED_NOT_BOUND" };

  const now = Date.now();
  if (now - lastCommandAt < RATE_LIMIT_MS) return { ack: "REJECTED_RATE_LIMIT" };
  if (recentCommandIds.has(commandId)) return { ack: "ACK_EXECUTED" };
  if (recentCommandIds.size >= RECENT_COMMAND_IDS_MAX) {
    const [first] = recentCommandIds;
    recentCommandIds.delete(first);
  }
  recentCommandIds.add(commandId);

  const keyCode = type === "SLIDE_NEXT" ? 124 : 123;
  const escaped = String(bindingId).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const script = `
    tell application "Google Chrome"
      set idx to 0
      repeat with i from 1 to (count of every window)
        try
          if (id of window i as text) is "${escaped}" then
            set idx to i
            exit repeat
          end if
        end try
      end repeat
      if idx is 0 then return "NOT_FOUND"
      set index of window idx to 1
    end tell
    delay 0.12
    tell application "System Events" to tell process "Google Chrome" to key code ${keyCode}
    return "OK"
  `;
  const r = osascript(script);
  lastCommandAt = Date.now();
  if (!r.ok) return { ack: "REJECTED_UNKNOWN" };
  if (r.out === "NOT_FOUND") return { ack: "REJECTED_TARGET_NOT_FOUND" };
  return { ack: "ACK_EXECUTED" };
}

// --- Server ---
const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    cors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url || "/";
  const path = url.split("?")[0];

  if (req.method === "GET" && path === "/permission") {
    const status = checkPermission();
    send(res, 200, { status });
    return;
  }

  if (req.method === "POST" && path === "/bind/list") {
    if (!IS_MAC) {
      send(res, 200, { targets: [] });
      return;
    }
    if (checkPermission() === "PERMISSION_MISSING") {
      send(res, 200, { ack: "REJECTED_PERMISSION_DENIED" });
      return;
    }
    const { targets } = listTargets();
    send(res, 200, { targets });
    return;
  }

  if (req.method === "POST" && path === "/bind/select") {
    const body = await parseBody(req);
    const targetId = body.targetId;
    if (!targetId) {
      send(res, 200, { ack: "REJECTED_UNKNOWN" });
      return;
    }
    const result = selectTarget(targetId);
    send(res, 200, result);
    return;
  }

  if (req.method === "POST" && path === "/bind/unbind") {
    bound = null;
    send(res, 200, { ack: "ACK_EXECUTED" });
    return;
  }

  if (req.method === "POST" && path === "/command") {
    const body = await parseBody(req);
    const { type, commandId } = body;
    if (!type || !commandId) {
      send(res, 200, { ack: "REJECTED_UNKNOWN" });
      return;
    }
    if (type !== "SLIDE_NEXT" && type !== "SLIDE_PREV") {
      send(res, 200, { ack: "REJECTED_UNKNOWN" });
      return;
    }
    const bindingId = body.bindingId ?? bound?.bindingId ?? "";
    const result = runCommand(type, String(commandId), bindingId);
    send(res, 200, result);
    return;
  }

  send(res, 404, { error: "Not found" });
});

server.listen(port, "127.0.0.1", () => {
  console.log("[slide-agent] Listening on http://127.0.0.1:" + port);
  if (!IS_MAC) {
    console.log("[slide-agent] Non-macOS: key delivery disabled; bind/list will return empty.");
  } else {
    console.log("[slide-agent] macOS: requires Google Chrome and Accessibility for this terminal.");
  }
});
