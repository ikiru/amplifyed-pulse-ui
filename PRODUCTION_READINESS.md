# Production Readiness Tracker

This document is a running list of production blockers, risks, and follow-ups.
It is intentionally concrete: each item should have an owner, priority, and exit criteria.

## Status Legend
- P0 = must fix before any production exposure
- P1 = required for a stable beta
- P2 = important but can ship after beta with monitoring
- P3 = backlog / cleanup

## Release Gate Checklist (top-level)
- [ ] Session isolation is correct (no cross-room leakage)
- [ ] Trainer authority is non-spoofable
- [ ] Production config is safe (CORS, ports, secrets, logging)
- [ ] Observability exists (basic logs/metrics/errors)
- [ ] Data retention policy is explicit (what is stored, where, how long)
- [ ] Test coverage exists for core invariants

---

## P0 — Production Blockers

### Session isolation (Model A requirement)
- [ ] Replace all `io.emit(...)` broadcasts with `io.to(sessionId).emit(...)` (and trainer-only room where needed)
  - Exit criteria: two concurrent sessions never receive each other’s events or state
  - Areas: pulse, moment/insights, vote updates, trainer signals, emotion updates
- [ ] Remove global shared state where it represents per-session truth
  - Exit criteria: pulse votes/eventLog are tracked per session

### Trainer authority / spoofing
- [ ] Server must not trust `payload.role: "trainer"` without verification
  - Decision needed: per-session PIN vs signed token vs external auth
  - Exit criteria: non-trainer socket cannot perform trainer-only actions

### Router gating (server-side)
- [ ] Gate trainer-only events server-side (not just UI)
  - `message:trainerReply`
  - `trainer:resolve_confusion`
  - `trainer:scroll:to:thread`
  - `obs:capture:*`
  - `trainer:*` control events

### Disable debug write-through events in prod
- [ ] Reject `message.state.update` passthrough in production
- [ ] Reject `audience:drift:update` passthrough in production
- [ ] Ensure HISTEAdmin cannot affect production sessions

---

## P1 — Beta Stability

### CORS / network hardening
- [ ] Lock Socket.IO CORS origins (no `origin: "*"`)
- [ ] Decide deployment binding (host/port, TLS termination)

### Rate limiting / abuse controls
- [ ] Basic per-socket rate limits for message/pulse/vote events
- [ ] Flood protection for join/reconnect loops

### Observability
- [ ] Structured logging for key events (join/leave, errors)
- [ ] Error boundary reporting strategy (client + server)

---

## P2 — Product Quality

### Docs correctness
- [ ] README backend port and connection info match reality
- [ ] Deprecate/remove unused entrypoints (e.g., engine wiring) or document them

### Performance / memory
- [ ] Validate message snapshot scaling for large rooms and long sessions
- [ ] Memory growth checks (moment history, message history, vote maps)

---

## Decisions Log
- YYYY-MM-DD: Decision summary + rationale

## Changelog
- YYYY-MM-DD: Added/updated items

