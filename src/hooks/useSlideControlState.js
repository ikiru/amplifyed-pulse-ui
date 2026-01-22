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
  const sid = sessionId || "";

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

  // Subscribe to server broadcasts
  useEffect(() => {
    if (!onEvent || !offEvent) return;

    const onAck = (p) => {
      setLastResult(p?.reason != null ? { ack: p.ack, reason: p.reason } : { ack: p.ack });
      if (p?.commandId === pendingCommandIdRef.current) {
        setPending(false);
        pendingCommandIdRef.current = null;
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
    const commandId = generateCommandId();
    pendingCommandIdRef.current = commandId;
    setPending(true);
    if (emit) emit("slide:command", { type: "SLIDE_PREV", commandId, issuedAt: Date.now(), sessionId: sid, bindingId });

    const res = await client.command("SLIDE_PREV", { commandId, issuedAt: Date.now(), sessionId: sid, bindingId });
    if (res.ack === "REJECTED_NOT_CONNECTED") {
      setAgentStatus("disconnected");
      emitAgentStatus("disconnected");
    } else if (res.ack === "ACK_EXECUTED") {
      setAgentStatus("connected");
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
    const commandId = generateCommandId();
    pendingCommandIdRef.current = commandId;
    setPending(true);
    if (emit) emit("slide:command", { type: "SLIDE_NEXT", commandId, issuedAt: Date.now(), sessionId: sid, bindingId });

    const res = await client.command("SLIDE_NEXT", { commandId, issuedAt: Date.now(), sessionId: sid, bindingId });
    if (res.ack === "REJECTED_NOT_CONNECTED") {
      setAgentStatus("disconnected");
      emitAgentStatus("disconnected");
    } else if (res.ack === "ACK_EXECUTED") {
      setAgentStatus("connected");
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
      emitAgentStatus("connected");
    } else {
      setAgentStatus("disconnected");
      emitAgentStatus("disconnected");
    }
    return out;
  }, [client, emitAgentStatus]);

  const handlePreflight = useCallback(async () => {
    const perm = await client.getPermission();
    if (perm.status !== "PERMISSION_OK") {
      return { ok: false, step: "Permission" };
    }
    setAgentStatus("connected");
    setPermissionStatus(perm.status);

    const list = await client.listTargets();
    if (list.ack && list.ack.startsWith("REJECTED_")) {
      return { ok: false, step: "Agent" };
    }

    if (!bindingId) {
      return { ok: false, step: "Binding" };
    }

    const commandId = generateCommandId();
    const res = await client.command("SLIDE_NEXT", {
      commandId,
      issuedAt: Date.now(),
      sessionId: sid,
      bindingId,
    });
    if (res.ack !== "ACK_EXECUTED") {
      return { ok: false, step: "Test command" };
    }
    return { ok: true };
  }, [client, bindingId, sid]);

  // Initial permission check and optional health
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const p = await client.getPermission();
      if (cancelled) return;
      setPermissionStatus(p.status);
      setAgentStatus(p.status === "PERMISSION_OK" ? "connected" : "disconnected");
    })();
    return () => { cancelled = true; };
  }, [client]);

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
