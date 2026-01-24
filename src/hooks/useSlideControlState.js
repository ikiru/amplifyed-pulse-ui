import { useState, useCallback, useRef, useEffect } from "react";
import { createSlideControlClient } from "../slide/slideControlClient.js";

function generateCommandId() {
  return `slide_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/**
 * useSlideControlState
 *
 * Manages slide control: local Agent client, server events (slide:ack, slide:state,
 * slide:agent_status), and handlers for Prev/Next, Bind, Unbind, Rebind, Preflight.
 * Contract: docs/SLIDE CONTROL PIPELINE CONTRACT (v1)
 *
 * @param {{ emit: (e: string, p?: object) => void, onEvent: (e: string, fn: (p: any) => void) => void, offEvent: (e: string, fn: (p: any) => void) => void, sessionId: string | null }} opts
 */
export function useSlideControlState({ emit, onEvent, offEvent, sessionId }) {
  const [agentStatus, setAgentStatus] = useState("disconnected");
  const [bindingId, setBindingId] = useState(null);
  const [boundTargetLabel, setBoundTargetLabel] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [pending, setPending] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(null);

  const clientRef = useRef(null);
  if (!clientRef.current) {
    clientRef.current = createSlideControlClient();
  }
  const client = clientRef.current;

  const pendingCommandIdRef = useRef(null);
  const lastHeartbeatRef = useRef(null);
  const missedHeartbeatsRef = useRef(0);
  const heartbeatIntervalRef = useRef(null);
  const commandTimeoutRef = useRef(null);
  const lastCommandAtRef = useRef(0);
  const sid = sessionId || "";

  const HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds
  const STALE_THRESHOLD = 3; // 3 missed heartbeats = 90 seconds
  const COMMAND_TIMEOUT_MS = 5000; // 5 seconds (Contract §9.3)
  const MIN_COMMAND_INTERVAL_MS = 200; // Minimum 200ms between commands (Contract §9.2)

  const emitAgentStatus = useCallback(
    (status, bind = {}) => {
      if (typeof emit !== "function") return;
      emit("slide:agent_status", {
        agentStatus: status,
        bindingId: bind.bindingId !== undefined ? bind.bindingId : bindingId,
        boundTargetLabel: bind.boundTargetLabel !== undefined ? bind.boundTargetLabel : boundTargetLabel,
      });
    },
    [emit, bindingId, boundTargetLabel]
  );

  // Heartbeat monitoring (Contract §10.1)
  const checkHeartbeat = useCallback(async () => {
    try {
      const result = await client.heartbeat();
      if (result.ok) {
        lastHeartbeatRef.current = Date.now();
        missedHeartbeatsRef.current = 0;
        // If we were stale/disconnected and now have heartbeat, mark as connected
        if (agentStatus !== "connected") {
          setAgentStatus("connected");
          emitAgentStatus("connected");
        }
      } else {
        // Heartbeat failed
        missedHeartbeatsRef.current += 1;
        if (missedHeartbeatsRef.current >= STALE_THRESHOLD) {
          setAgentStatus("stale");
          emitAgentStatus("stale");
        }
      }
    } catch (e) {
      // Network error - agent unreachable
      missedHeartbeatsRef.current += 1;
      if (missedHeartbeatsRef.current >= STALE_THRESHOLD) {
        setAgentStatus("stale");
        emitAgentStatus("stale");
      } else if (missedHeartbeatsRef.current === 1) {
        // First failure - mark as disconnected
        setAgentStatus("disconnected");
        emitAgentStatus("disconnected");
      }
    }
  }, [client, agentStatus, emitAgentStatus]);

  // Subscribe to server broadcasts
  useEffect(() => {
    if (!onEvent || !offEvent) return;

    const onAck = (p) => {
      setLastResult(p?.reason != null ? { ack: p.ack, reason: p.reason } : { ack: p.ack });
      if (p?.commandId === pendingCommandIdRef.current) {
        setPending(false);
        pendingCommandIdRef.current = null;
        // Clear timeout if ack received
        if (commandTimeoutRef.current) {
          clearTimeout(commandTimeoutRef.current);
          commandTimeoutRef.current = null;
        }
      }
    };

    const onState = (p) => {
      if (p?.lastResult) setLastResult(p.lastResult);
      if (p?.bindingId !== undefined) setBindingId(p.bindingId ?? null);
      if (p?.boundTargetLabel !== undefined) setBoundTargetLabel(p.boundTargetLabel ?? null);
    };

    const onAgentStatus = (p) => {
      if (p?.agentStatus) setAgentStatus(p.agentStatus);
      if (p?.bindingId !== undefined) setBindingId(p.bindingId ?? null);
      if (p?.boundTargetLabel !== undefined) setBoundTargetLabel(p.boundTargetLabel ?? null);
    };

    onEvent("slide:ack", onAck);
    onEvent("slide:state", onState);
    onEvent("slide:agent_status", onAgentStatus);

    return () => {
      offEvent("slide:ack", onAck);
      offEvent("slide:state", onState);
      offEvent("slide:agent_status", onAgentStatus);
    };
  }, [onEvent, offEvent]);

  const handlePrev = useCallback(async () => {
    if (pending) return;
    if (!bindingId) {
      setLastResult({ ack: "REJECTED_NOT_BOUND", reason: "Not bound" });
      if (emit) emit("slide:ack", { ack: "REJECTED_NOT_BOUND", reason: "Not bound", sessionId: sid });
      return;
    }
    // Rate limiting check (Contract §9.2: minimum 200ms between commands)
    const now = Date.now();
    const timeSinceLastCommand = now - lastCommandAtRef.current;
    if (lastCommandAtRef.current > 0 && timeSinceLastCommand < MIN_COMMAND_INTERVAL_MS) {
      setLastResult({ ack: "REJECTED_RATE_LIMIT", reason: `Wait ${MIN_COMMAND_INTERVAL_MS}ms between commands` });
      if (emit) emit("slide:ack", { ack: "REJECTED_RATE_LIMIT", reason: `Wait ${MIN_COMMAND_INTERVAL_MS}ms between commands`, sessionId: sid });
      return;
    }
    const commandId = generateCommandId();
    pendingCommandIdRef.current = commandId;
    lastCommandAtRef.current = now;
    setPending(true);
    if (emit) emit("slide:command", { type: "SLIDE_PREV", commandId, issuedAt: Date.now(), sessionId: sid, bindingId });

    // Set timeout (Contract §9.3: 5 seconds)
    commandTimeoutRef.current = setTimeout(() => {
      if (pendingCommandIdRef.current === commandId) {
        // Timeout expired - mark as failed
        setPending(false);
        pendingCommandIdRef.current = null;
        const timeoutResult = { ack: "REJECTED_UNKNOWN", reason: "Timeout" };
        setLastResult(timeoutResult);
        if (emit) emit("slide:ack", { ...timeoutResult, commandId, sessionId: sid });
      }
    }, COMMAND_TIMEOUT_MS);

    const res = await client.command("SLIDE_PREV", { commandId, issuedAt: Date.now(), sessionId: sid, bindingId });
    
    // Clear timeout if command completed (even if failed)
    if (commandTimeoutRef.current) {
      clearTimeout(commandTimeoutRef.current);
      commandTimeoutRef.current = null;
    }

    if (res.ack === "REJECTED_NOT_CONNECTED") {
      setAgentStatus("disconnected");
      emitAgentStatus("disconnected");
    } else if (res.ack === "ACK_EXECUTED") {
      setAgentStatus("connected");
      lastHeartbeatRef.current = Date.now();
      missedHeartbeatsRef.current = 0;
      emitAgentStatus("connected");
    }
    if (emit) emit("slide:ack", { ack: res.ack, commandId, reason: res.reason, sessionId: sid });
    setLastResult(res.reason != null ? { ack: res.ack, reason: res.reason } : { ack: res.ack });
    setPending(false);
    pendingCommandIdRef.current = null;
  }, [pending, bindingId, sid, emit, client, emitAgentStatus]);

  const handleNext = useCallback(async () => {
    if (pending) return;
    if (!bindingId) {
      setLastResult({ ack: "REJECTED_NOT_BOUND", reason: "Not bound" });
      if (emit) emit("slide:ack", { ack: "REJECTED_NOT_BOUND", reason: "Not bound", sessionId: sid });
      return;
    }
    // Rate limiting check (Contract §9.2: minimum 200ms between commands)
    const now = Date.now();
    const timeSinceLastCommand = now - lastCommandAtRef.current;
    if (lastCommandAtRef.current > 0 && timeSinceLastCommand < MIN_COMMAND_INTERVAL_MS) {
      setLastResult({ ack: "REJECTED_RATE_LIMIT", reason: `Wait ${MIN_COMMAND_INTERVAL_MS}ms between commands` });
      if (emit) emit("slide:ack", { ack: "REJECTED_RATE_LIMIT", reason: `Wait ${MIN_COMMAND_INTERVAL_MS}ms between commands`, sessionId: sid });
      return;
    }
    const commandId = generateCommandId();
    pendingCommandIdRef.current = commandId;
    lastCommandAtRef.current = now;
    setPending(true);
    if (emit) emit("slide:command", { type: "SLIDE_NEXT", commandId, issuedAt: Date.now(), sessionId: sid, bindingId });

    // Set timeout (Contract §9.3: 5 seconds)
    commandTimeoutRef.current = setTimeout(() => {
      if (pendingCommandIdRef.current === commandId) {
        // Timeout expired - mark as failed
        setPending(false);
        pendingCommandIdRef.current = null;
        const timeoutResult = { ack: "REJECTED_UNKNOWN", reason: "Timeout" };
        setLastResult(timeoutResult);
        if (emit) emit("slide:ack", { ...timeoutResult, commandId, sessionId: sid });
      }
    }, COMMAND_TIMEOUT_MS);

    const res = await client.command("SLIDE_NEXT", { commandId, issuedAt: Date.now(), sessionId: sid, bindingId });
    
    // Clear timeout if command completed (even if failed)
    if (commandTimeoutRef.current) {
      clearTimeout(commandTimeoutRef.current);
      commandTimeoutRef.current = null;
    }

    if (res.ack === "REJECTED_NOT_CONNECTED") {
      setAgentStatus("disconnected");
      emitAgentStatus("disconnected");
    } else if (res.ack === "ACK_EXECUTED") {
      setAgentStatus("connected");
      lastHeartbeatRef.current = Date.now();
      missedHeartbeatsRef.current = 0;
      emitAgentStatus("connected");
    }
    if (emit) emit("slide:ack", { ack: res.ack, commandId, reason: res.reason, sessionId: sid });
    setLastResult(res.reason != null ? { ack: res.ack, reason: res.reason } : { ack: res.ack });
    setPending(false);
    pendingCommandIdRef.current = null;
  }, [pending, bindingId, sid, emit, client, emitAgentStatus]);

  const handleBindList = useCallback(async () => {
    const out = await client.listTargets();
    if (out.ack === "REJECTED_NOT_CONNECTED") {
      setAgentStatus("disconnected");
      emitAgentStatus("disconnected");
      return out;
    }
    setAgentStatus("connected");
    lastHeartbeatRef.current = Date.now();
    missedHeartbeatsRef.current = 0;
    emitAgentStatus("connected");
    return out;
  }, [client, emitAgentStatus]);

  const handleBindSelect = useCallback(
    async (targetId) => {
      const res = await client.selectTarget(targetId);
      if (res.ack === "REJECTED_NOT_CONNECTED") {
        setAgentStatus("disconnected");
        emitAgentStatus("disconnected");
        return res;
      }
      if (res.ack === "ACK_EXECUTED" && (res.bindingId != null || res.boundTargetLabel != null)) {
        setBindingId(res.bindingId ?? null);
        setBoundTargetLabel(res.boundTargetLabel ?? null);
        lastHeartbeatRef.current = Date.now();
        missedHeartbeatsRef.current = 0;
        emitAgentStatus("connected", { bindingId: res.bindingId ?? null, boundTargetLabel: res.boundTargetLabel ?? null });
      }
      return res;
    },
    [client, emitAgentStatus]
  );

  const handleUnbind = useCallback(async () => {
    const res = await client.unbind();
    if (res.ack === "REJECTED_NOT_CONNECTED") {
      setAgentStatus("disconnected");
      emitAgentStatus("disconnected");
      return res;
    }
    setBindingId(null);
    setBoundTargetLabel(null);
    emitAgentStatus(agentStatus, { bindingId: null, boundTargetLabel: null });
    return res;
  }, [client, agentStatus, emitAgentStatus]);

  const handleRebind = useCallback(async () => {
    const u = await handleUnbind();
    if (u.ack && u.ack.startsWith("REJECTED_")) return u;
    return handleBindList();
  }, [handleUnbind, handleBindList]);

  const handleRecheckPermissions = useCallback(async () => {
    const out = await client.getPermission();
    setPermissionStatus(out.status);
    if (out.status === "PERMISSION_OK") {
      setAgentStatus("connected");
      lastHeartbeatRef.current = Date.now();
      missedHeartbeatsRef.current = 0;
      emitAgentStatus("connected");
    } else {
      setAgentStatus("disconnected");
      emitAgentStatus("disconnected");
    }
    return out;
  }, [client, emitAgentStatus]);

  const handlePreflight = useCallback(async () => {
    // Contract §17: Preflight MUST verify all conditions:
    // 1. Agent connected
    // 2. Permission OK
    // 3. Target bound
    // 4. One successful test command (SLIDE_NEXT) acknowledged

    // Step 1: Check permission (also verifies agent is reachable)
    const perm = await client.getPermission();
    if (perm.status !== "PERMISSION_OK") {
      return { ok: false, step: "Permission", message: "macOS Accessibility permission required" };
    }
    setPermissionStatus(perm.status);

    // Step 2: Verify agent is connected (via listTargets - lightweight check)
    const list = await client.listTargets();
    if (list.ack && list.ack.startsWith("REJECTED_")) {
      return { ok: false, step: "Agent", message: "Agent not connected or unreachable" };
    }
    setAgentStatus("connected");
    lastHeartbeatRef.current = Date.now();
    missedHeartbeatsRef.current = 0;

    // Step 3: Verify target is bound
    if (!bindingId) {
      return { ok: false, step: "Binding", message: "No slide target bound. Select a target first." };
    }

    // Step 4: Execute test command (SLIDE_NEXT per contract)
    const commandId = generateCommandId();
    const res = await client.command("SLIDE_NEXT", {
      commandId,
      issuedAt: Date.now(),
      sessionId: sid,
      bindingId,
    });
    if (res.ack !== "ACK_EXECUTED") {
      return { 
        ok: false, 
        step: "Test command", 
        message: `Test command failed: ${res.ack}${res.reason ? ` (${res.reason})` : ""}` 
      };
    }

    // All checks passed
    return { ok: true, message: "Preflight OK - all systems ready" };
  }, [client, bindingId, sid]);

  // Initial permission check and optional health
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const p = await client.getPermission();
      if (cancelled) return;
      setPermissionStatus(p.status);
      if (p.status === "PERMISSION_OK") {
        setAgentStatus("connected");
        lastHeartbeatRef.current = Date.now();
        missedHeartbeatsRef.current = 0;
      } else {
        setAgentStatus("disconnected");
      }
    })();
    return () => { cancelled = true; };
  }, [client]);

  // Heartbeat polling (Contract §10.1: every 30 seconds)
  useEffect(() => {
    // Start heartbeat polling
    heartbeatIntervalRef.current = setInterval(() => {
      checkHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    // Initial heartbeat check
    checkHeartbeat();

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      if (commandTimeoutRef.current) {
        clearTimeout(commandTimeoutRef.current);
        commandTimeoutRef.current = null;
      }
    };
  }, [checkHeartbeat]);

  // Binding cleanup on session end or agent disconnect (Contract §6.5)
  useEffect(() => {
    // Clear binding when sessionId changes (session end)
    if (bindingId) {
      setBindingId(null);
      setBoundTargetLabel(null);
      emitAgentStatus(agentStatus, { bindingId: null, boundTargetLabel: null });
    }
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear binding when agent disconnects (Contract §6.5)
  useEffect(() => {
    if (agentStatus === "disconnected" && bindingId) {
      setBindingId(null);
      setBoundTargetLabel(null);
      emitAgentStatus("disconnected", { bindingId: null, boundTargetLabel: null });
    }
  }, [agentStatus, bindingId, emitAgentStatus]);

  return {
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
  };
}
