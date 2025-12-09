# AmplifyEd Server Pipelines Architecture

This document defines responsibilities and boundaries for each server pipeline.

## Session Pipeline
Owns:
- participants
- join/leave lifecycle
- user metadata

Never:
- modifies votes
- touches pulse scoring
- reads emotion/safety internals

## Pulse Pipeline
Owns:
- votes
- eventLog
- vote scoring

Reads:
- participants (from SessionPipeline)

Never:
- stores participants
- modifies session state

## Safety Pipeline
Owns:
- soft-flag classification
- vote risk evaluation

Never:
- reads participants
- modifies votes or session state

## Emotion Pipeline
Owns:
- emotional scoring
- trendline hooks

Never:
- reads participants
- modifies session or pulse state

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

## Event Router
Acts as:
- the sole dispatcher of socket events
- connector between pipelines, but never logic owner

Never:
- touches participant or vote state directly.
