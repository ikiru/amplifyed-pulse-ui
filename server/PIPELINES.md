# AmplifyEd Server Pipelines Architecture

This document defines responsibilities and boundaries for each server pipeline.

## Audit Scope & Order (As-Built, Option B)

We are treating **running code as the source of truth** (Option B). This doc must describe the system as it exists today.

Audit order:
1. **Event Router** (`server/routers/eventRouter.js`) — canonical inbound event surface + session scoping
2. **Session Pipeline** (`server/pipelines/session/`)
3. **Focus Pipeline** (`server/pipelines/focus/`)
4. **Message Pipeline** (`server/pipelines/message/`)
5. **Confusion Pipeline** (`server/pipelines/confusion/`)
6. **Pulse Pipeline** (`server/pipelines/pulse/`)
7. **Moment Pipeline** (`server/pipelines/moment/`)
8. **Trainer Pipeline** (`server/pipelines/trainer/`)
9. **OBS Pipeline** (`server/pipelines/obs/`)
10. **Audience Drift** (`server/pipelines/audienceDrift/`)
11. **Safety / Emotion** (`server/pipelines/safety/`, `server/pipelines/emotion/`) — document current wiring state (may be disabled)

When docs and code disagree:
- Prefer updating this document first (to stop drift).
- Then decide whether we want to tighten architecture (future work).

## Allowed Exploration Tiers (Policy)

To keep the system stable while we explore improvements:

- **Tier 1 (Safe)**: internal refactors and doc/test hardening with **no public event changes**.
- **Tier 2 (Controlled)**: add new events/fields **behind a feature gate**, document them in advance, and keep backwards-compat.
- **Tier 3 (Breaking / Rethink)**: rename events, re-scope broadcasts, or reassign pipeline responsibilities. Requires an explicit migration plan and compatibility window.

## Session Pipeline
Owns:
- participants
- join/leave lifecycle
- user metadata

Never:
- modifies pulse votes or message votes
- touches pulse scoring
- reads emotion/safety internals

Inbound (router):
- `session:join`
- `session:leave`
- `session:reconnect`
- `session:request_metadata`

Outbound (observed):
- `session:joined` / `session:error` (ack to the calling socket)
- participant count updates (emitted session-scoped; triggered via SessionPipeline integration points)

## Pulse Pipeline
Owns:
- pulse votes (`audience:pulse`)
- eventLog
- vote scoring

Reads:
- participants (from SessionPipeline)

Never:
- stores participants
- modifies session state

Inbound (router):
- `audience:pulse`

Outbound (observed):
- `pulse:update` (session-scoped; global emit exists as backwards-compat if sessionId is missing)

## Safety Pipeline
Owns:
- soft-flag classification
- vote risk evaluation

Never:
- reads participants
- modifies votes or session state

Current wiring:
- Safety pipeline is currently **not wired** (`safetyPipeline = null` in `server/server.js`).
- Router still accepts `safety:softFlag` and `safety:pattern` for scaffolding/compat, but behavior may be a no-op.

## Emotion Pipeline
Owns:
- emotional scoring
- trendline hooks

Never:
- reads participants
- modifies session or pulse state

Current wiring:
- Emotion pipeline exists under `server/pipelines/emotion/` but is currently **not wired** in `server/server.js`.
- Moment pipeline supports an optional `emotionPipeline.applyEmotion()` hook when provided.

Outbound (when wired):
- `emotion:update` (trainer-room scoped; global emit exists as backwards-compat if sessionId is missing)

## Trainer Pipeline (Phase 2.3.7)
Owns:
- trainer-issued meta signals (nudge, slowdown, speedup, break, checkin)
- normalization of trainer commands via `trainerSignalExtractor.js`
- contributing trainerSignal into `momentBuilder.addTrainer()`

Never:
- reads pulse/emotion/session state
- stores trainer state
- performs scoring
- modifies lifecycle or safety data

Boundary Rules:
- TrainerPipeline is **write-only** into MomentBuilder.
- Must never depend on audience data, participant lists, or pulse state.
- Dev-mode boundary guard prevents misrouted pulse/emotion/session events.

Inbound (router):
- `trainer:action`
- `trainer:command`
- `trainer:nudge`

Outbound (observed):
- `trainer:signal` (trainer-room scoped; global emit exists as backwards-compat if sessionId is missing)


### Unified Moment Flow (Pulse + Safety + Emotion + Message + Trainer)

```
audience:pulse      → pulsePipeline      ┐
audience:message    → messagePipeline    │
trainer:action      → trainerPipeline    │   all contribute
safety events       → safetyPipeline     │   fragments into
emotion scoring     → emotionPipeline    │   MomentBuilder
                                             ↓
                                momentBuilder.finalize()
                                             ↓
                                 buildMomentEnvelope()
                                             ↓
                             InsightLine / TrainerView
```

Trainer signals are short-lived annotations, not state.

## Focus Pipeline
Owns:
- the **active focus** per session (authoritative)
- trainer-only focus entries list + ordering + edit modes

Reads:
- trainer participants (via SessionPipeline) for emitting trainer-only focus state

Never:
- evaluates audience behavior
- blocks or restricts message/pulse submission

Inbound (router):
- `focus:set` (legacy alias)
- `focus:clear` (legacy alias)
- `focus:entry:add`
- `focus:activate`
- `focus:reset_default`
- `focus:edit_in_place`
- `focus:revise_by_new`
- `focus:reorder`

Outbound (observed):
- `focus:update`
- `focus:cleared`
- `focus:trainer:state` (trainer-only)
- `session:event` (focus-related session events)

## Message Pipeline
Owns:
- canonical message storage per session (threaded by `parentMessageId`)
- authoritative message state broadcast (`message.state.update`)
- message vote totals storage + broadcasts (`message.vote.update` / `message:vote:update`)

Reads:
- active focus (from Focus state) to stamp messages with focus metadata

Never:
- reads participants (Session state) or pulse state
- determines semantic “meaning” of messages (beyond emitting derived signals)

Inbound (router):
- `message:audience`
- `message:trainerReply` (trainer-only; router enforces trainer role)
- `message:vote:intent`
- `self-report:signal` (used for audience drift gating; routed here today)
- `message.state.update` (dev-only debug passthrough)

Outbound (observed):
- `message.state.update` (authoritative snapshot)
- `message.vote.update` and `message:vote:update` (both emitted for compatibility)
- `audience:drift:update` / `audience:label:update` (meter + classification outputs)

## Confusion Pipeline
Owns:
- thread-scoped confusion envelopes (session-scoped, ephemeral)
- trainer-facing advisory broadcast (`confusion:update`)

Never:
- exposes per-participant confusion as UI truth
- mutates message state

Inbound (router):
- `confusion:signal`
- `confusion:clear`
- `trainer:resolve_confusion` (trainer-only)

Outbound (observed):
- `confusion:update`

## Audience Drift (Message-Adjacent)
Owns:
- drift scoring derived from message/focus alignment (feature-gated)

Inbound (by integration):
- called from Message Pipeline / router gates, not a standalone router event surface

Outbound (observed):
- `audience:drift:update`
- `audience:label:update`

## Moment Pipeline
Owns:
- rolling per-session moment history buffer
- trainer-room dispatch of unified envelopes

Inbound (by integration):
- receives moment fragments via MomentBuilder (from Pulse/Message/Trainer, and optionally Emotion)

Outbound (observed):
- `moment:update` (trainer-room scoped: `${sessionId}:trainers`)

## OBS Pipeline
Owns:
- server-side capture status state machine (session-scoped)

Never:
- receives pixels/media; browser owns the MediaStream

Inbound (router):
- `obs:capture:request`
- `obs:capture:started`
- `obs:capture:stopped`
- `obs:capture:interrupted`
- `obs:capture:permission_denied`
- `obs:capture:not_supported`
- `obs:capture:error`

Outbound (observed):
- `obs:status_changed`
- `obs:capture:*` lifecycle notifications (session-scoped)

## Event Router
Acts as:
- the sole dispatcher of socket events
- connector between pipelines, but never logic owner

Never:
- touches participant or vote state directly.
