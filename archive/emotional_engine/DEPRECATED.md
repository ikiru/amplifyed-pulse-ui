# DEPRECATED EMOTIONAL ENGINE (Do Not Use)

This directory contains legacy emotional engine code from the early
prototype of AmplifyEd (pre–Pipeline architecture).

## Why This Folder Exists
These files represent an experimental emotional model from Phase 0–1:
- direct emotional scoring tied to raw pulses
- UI-level emotional trend rendering
- early smoothing experiments
- monolithic emotional logic not aligned with pipelines
- a pre–moment pipeline "pulseLogic" system

The folder is preserved temporarily **for historical context only** so
future phases can reference early ideas without reintroducing old bugs.

## Why It Must Not Be Used
This system:
- violates pipeline boundaries  
- computes emotion directly in the UI  
- mixes pulse state with emotional scoring  
- conflicts with the modern emotionPipeline  
- contains deprecated delta-math and state shapes  
- breaks psychological safety and data-separation rules  

Using or importing anything from this directory will cause drift in the
modern architecture and destabilize Pulse, Moment, and Emotion pipelines.

**No active code should import from this directory.**

## Replacement System
All emotional logic must now be implemented within:


This includes:
- feature extraction
- emotional scoring
- smoothing
- state mapping
- emotion → moment envelope integration

The UI may only consume **moment envelopes**, not raw pulse or
legacy emotional calculations.

## When This Folder Will Be Removed
The directory will be deleted after:

1. Phase 3 emotional scoring is complete  
2. smoothing + state map engine are stable  
3. emotion signals are fully integrated into momentBuilder  
4. TrainerView consumes final emotional moments  
5. All internal references to legacy emotional code are verified as gone  

Once these conditions are met, the directory will be removed safely to
prevent future drift.

## Current Status
**Archived. DO NOT USE.**  
Safe to ignore until formal deletion in Phase 3.5.
