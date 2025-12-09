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

## Trainer Pipeline (future)
Owns:
- trainer-issued signals (break, nudge, focus)

Never:
- modifies lifecycle, session, or safety state

## Event Router
Acts as:
- the sole dispatcher of socket events
- connector between pipelines, but never logic owner

Never:
- touches participant or vote state directly.
