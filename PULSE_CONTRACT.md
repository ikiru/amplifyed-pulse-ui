# PULSE_CONTRACT.md  
**Canonical Contract for Live Pulse (TrainerView)**

---

## 1. Purpose

Pulse is a **live, observational signal** for facilitators.

It exists to help trainers sense:
- movement vs. stability,
- distribution of participant sentiment,
- and room size,

**without scoring, judgment, optimization, or analytics framing**.

Pulse supports *real-time facilitation*, not evaluation or post-session analysis.

---

## 2. Operating Mode (Scope Lock)

Pulse operates **only** in:

- Live TrainerView
- Real-time sessions
- Moment-to-moment facilitation

Pulse is **not**:
- Analytics
- Replay
- Audit
- Assessment
- Optimization tooling

Any future functionality outside live facilitation **must live in a separate mode** and must not alter this contract.

---

## 3. The Three Questions Pulse Is Allowed to Answer

Pulse answers **only** the following:

1. **Is the room moving or stable?**  
2. **How are signals distributed?**  
3. **How large is the room?**

If a UI element does not directly support one of these questions, it does not belong in Pulse.

---

## 4. What Pulse Must NEVER Show (Hard No’s)

The following are explicitly forbidden in live Pulse:

- ❌ Net scores (e.g. +1, −2)
- ❌ Accumulators or totals
- ❌ Percentages
- ❌ Timestamps (live view)
- ❌ “Last vote” indicators
- ❌ Rankings or leaderboards
- ❌ “Never voted” or silence metrics
- ❌ Gamification language
- ❌ Optimization framing (“improving”, “better”, “worse”)

The graph already encodes direction and state.  
Redundant numbers are removed by design.

---

## 5. Canonical Layout (Wireframe as Truth)

This layout is **authoritative** for live TrainerView Pulse.

┌──────────────────────────────────────────────┐
│ PULSE Room: 2 │
├──────────────────────────────────────────────┤
│ │
│ +2 ┤ │
│ │ │
│ │ │
│ 0 ┼────────────── pulse line ──────────▶ │
│ │ │
│ │ │
│ -2 ┤ │
│ │
├──────────────────────────────────────────────┤
│ Engaged Neutral Frustrated │
│ 1 0 0 │
└──────────────────────────────────────────────┘


### Header
- Left: `PULSE`
- Right: `Room: {audienceCount}`
- No emotion labels
- No scores
- No analytics language

### Body
- Single PulseTimeline
- Visually dominant
- Treated as motion, not a chart
- No legends, captions, or narration

### Footer (Distribution Row)
- Full-width
- Three equal columns:
  - Engaged
  - Neutral
  - Frustrated
- Center-aligned
- Labels quieter than values
- Entire row quieter than the graph
- Contextual, not pressuring

---

## 6. Behavioral Invariants (Non-Negotiable)

The following must always be true in live Pulse:

- PulseTimeline **renders immediately** when `livePulse` exists
- Timeline renders even when:
  - `canonicalParticipantCount === 0`
  - participants are not yet resolved
- A **neutral baseline** is visible on first render
- Timeline **scrolls horizontally** like a cardiac monitor
- Timeline **never compresses** historical data to fit
- The right edge represents **“now”**
- Trainer is **never counted** as audience
- Votes are counted **only** from canonical audience participants
- PulseSummary counts can never exceed room size
- Silence is allowed and visually stable

These are laws, not preferences.

---

## 7. Change Policy

Any change that violates this contract:

- Must be implemented as a **separate mode**  
  (e.g. analytics, replay, audit, collapsed view)
- Must **not** alter live TrainerView Pulse
- Must not reuse Pulse UI elements in ways that imply scoring or judgment

Live Pulse is intentionally constrained.  
Those constraints are the feature.

---

## 8. Reference

Live Pulse behavior is governed by this document.

Code touching PulseTimeline, PulseSummary, or participant gating must comply with this contract.

