# HISTE Extensions Contract

**Purpose:** This document governs how new testing capabilities are added to HISTE while maintaining contract integrity.

**Governed by:**
- docs/testing-environments.md
- server/contracts/Human Interaction Stress Testing Environment (HISTE).md

---

## Extension Principles

All extensions to HISTE must respect the foundational contract:
- Human interaction stress testing, not machine stress
- Interaction only through AudienceInput-equivalent paths
- No privileged system access
- Observational, not prescriptive

---

## 1. Scenario Extensions

New scenario fields must:

### 1.1 Be Optional
- Existing scenarios remain valid without the new field
- Default behavior is defined and documented
- No breaking changes to existing scenarios

### 1.2 Be Declarative
- Data-only, no executable logic
- Describe conditions, not conclusions
- Express timing in milliseconds from scenario start

### 1.3 Not Violate Interaction Boundaries
- Must use same events available to real participants/trainers
- Cannot bypass AudienceInput or TrainerView
- Cannot inject directly into pipelines

### 1.4 Have Clear Temporal Semantics
- When things happen must be explicit
- Timing must be deterministic and replayable
- Cannot depend on runtime state or external conditions

---

## 2. Runtime Adjustments

New runtime adjustments must:

### 2.1 Apply to Future Behavior Only
- No retroactive effects on past events
- Cannot modify existing messages or state
- Changes affect only subsequently scheduled actions

### 2.2 Use Continuous Values
- Prefer 0-1 normalized ranges
- OR meaningful numeric ranges (e.g., participant count)
- Avoid boolean flags that create discontinuities

### 2.3 Have Clear, Observable Effects
- Effect must be perceivable in observation surfaces
- Relationship between adjustment and outcome must be documentable
- No hidden or implicit side effects

### 2.4 Not Bypass Pipeline Authority
- Cannot override pipeline decisions
- Cannot inject privileged context
- Must respect existing contracts (emotion, safety, confusion, etc.)

---

## 3. Observation Surfaces

New observations must:

### 3.1 Be Read-Only
- Cannot trigger actions
- Cannot modify state
- Cannot influence control flow

### 3.2 Reflect Consequences, Not Intentions
- Show what happened, not what should happen
- Use past tense or present continuous
- Never future tense or imperative

### 3.3 Use Descriptive Language
- No prescriptive terms (should, must, error, problem, failed)
- Probabilistic or observational framing
- Acknowledge that silence is a state, not a verdict

### 3.4 Not Claim Authority
- System does not possess judgment authority
- Disagreement with surfaced signals is valid
- Final interpretation exists outside the system

---

## 4. Future Extension Candidates

### 4.1 Approved for Implementation

#### ✅ Focus Events (Implemented)
- **Status:** Complete
- **Alignment:** Phase 8 Focus Governance
- **Interaction Path:** `focus:set` and `focus:clear` via trainer socket
- **Temporal Model:** Scheduled by `delayMs` from scenario start

#### ✅ Self Report Events (Implemented)
- **Rationale:** Allows scenarios to exercise audience self-report paths (e.g., `off_focus`) under load.
- **Interaction Path:** `self-report:signal` via participant socket (AudienceInput-equivalent)
- **Temporal Model:** Scheduled by `delayMs` from scenario start
- **Notes:** Must remain non-privileged and declarative; no direct pipeline injection.

#### 🟡 Emotion Context Events (Under Consideration)
- **Rationale:** Test trainer perception of emotional shifts
- **Requirements:** Must align with emotion pipeline contract
- **Deferred Until:** Emotion pipeline governance is locked

#### 🟡 Safety Boundary Events (Under Consideration)
- **Rationale:** Test safety signal surfacing under stress
- **Requirements:** Must align with safety pipeline contract
- **Deferred Until:** Safety contract explicitly permits testing

---

### 4.2 Under Consideration

#### Thread Dynamics
- Explicit thread creation/response patterns
- Parent-child message relationships
- Conversation branching stress

#### Participation Profiles
- Individual behavior patterns (talkative, silent, sporadic)
- Realistic participant archetypes
- Diversity of expression styles

#### Session Moments
- Trainer-marked significant moments
- Temporal anchors for reflection
- Non-semantic event logging

---

### 4.3 Explicitly Deferred

The following are **not HISTE extensions** and require separate environments:

- **Machine stress testing** (throughput, saturation, performance collapse)
- **Automated interventions** (system-initiated actions)
- **Success/failure scoring** (prescriptive evaluation)
- **Retrospective analysis** (post-session evaluation tools)
- **Real-time pipeline modification** (changing pipeline behavior during tests)

These belong to different testing environments with different contracts.

---

## 5. Extension Approval Process

### 5.1 Proposal Requirements

Any proposed extension must include:

1. **Clear Rationale**
   - What human stress condition does this test?
   - Why existing capabilities are insufficient

2. **Contract Alignment Check**
   - Which pipeline contracts are involved?
   - How does this respect interaction boundaries?

3. **Temporal Model**
   - When do events occur?
   - How is timing specified?

4. **Observation Strategy**
   - What will be surfaced to HISTE Admin?
   - How will this be displayed without interpretation?

5. **Governance Impact**
   - Does this require a new contract?
   - Does this change existing boundaries?

### 5.2 Review Criteria

Extensions are evaluated on:

- **Necessity:** Cannot be achieved with existing capabilities
- **Alignment:** Respects all governing contracts
- **Integrity:** Maintains observational posture
- **Clarity:** Effect is understandable and documentable

### 5.3 Rejection Grounds

Extensions are rejected if they:

- Violate interaction boundaries
- Bypass pipeline authority
- Introduce prescriptive behavior
- Create hidden dependencies
- Claim interpretive authority

---

## 6. Maintenance Commitments

### 6.1 Backward Compatibility
- Existing scenarios remain valid
- No silent behavior changes
- Deprecation requires explicit communication

### 6.2 Documentation
- Every extension updates this contract
- Examples are required, not optional
- Governance alignment must be explicit

### 6.3 Testing
- New extensions must be testable in isolation
- Cannot break existing scenarios
- Must work with or without the extension

---

## 7. Invariants

The following must remain true for all extensions:

1. **Human stress is the primary concern**  
   Not machine stress, not algorithmic correctness

2. **Audience and trainer cognition are distinct and protected**  
   No tool may improve one at the expense of the other

3. **Scenarios describe conditions, not conclusions**  
   Data-only, declarative, replayable

4. **The system surfaces signals, not meaning**  
   Observational, not prescriptive

5. **Nothing assumes it knows what failure looks like**  
   Discovery over correctness, observation over prescription

---

## 8. Version History

| Version | Date | Changes |
| --- | --- | --- |
| 1.0 | 2026-01-13 | Initial contract established |
| 1.1 | 2026-01-13 | Focus events added as first approved extension |

---

## Final Note

This contract exists to protect HISTE's integrity as a **discovery environment**.

Extensions that serve correctness, automation, or prescription belong elsewhere.

HISTE reveals what would otherwise remain invisible.

That is its only purpose.
