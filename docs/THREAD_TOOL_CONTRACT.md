
# 📜 THREAD TOOLS CONTRACT

*Trainer-Local · Tractability-Oriented · Meaning-Safe*

---

## 0. Purpose

The **Thread Tools** toolbox exists to support **trainer orientation, tractability, and shared sense‑making** in live, scaled conversations.

Its purpose is to allow a trainer to **view and, when explicitly chosen, share a structural lens on the canonical thread map**, in order to surface meaningful conversational patterns without mutating shared meaning, altering canonical state, or introducing evaluative judgment.

Thread Tools are **navigation and amplification aids**, not moderation instruments, analytics, or decision engines.

---

## 1. Core Principles (Non-Negotiable)

### 1.1 Navigation, Not Interpretation

Thread Tools must support **looking**, not **concluding**.

They may answer:

* “What’s new?”
* “What grew?”
* “What changed category?”

They must never answer:

* “What matters?”
* “What is important?”
* “What should I do?”

---

### 1.2 Trainer-Local First, Shareable by Promotion

By default, all Thread Tools operate **locally to the trainer view**.

They must not, by default:

* alter the canonical LiveView
* change shared ordering or state
* hide content from the room
* create divergent realities between participants

However, a Thread Tool **may be explicitly promoted** to a **Shared Structural Lens**, making its structural emphasis visible to the room under the constraints defined in this contract.

Thread Tools affect *how the trainer sees* by default, and *how the room looks together* only when deliberately promoted.

---

### 1.3 One Lens at a Time

At most **one Thread Tool lens** may be active at any time.

* Activating a new lens clears the previous lens
* Stacking or composing lenses is prohibited
* The active lens must be clearly indicated in the Messages area

This prevents compound views that are difficult to reason about or explain.

---

### 1.4 Threads Are the Unit of Operation

Thread Tools operate **only at the thread level**.

They must not:

* surface individual messages in isolation
* privilege authors or identities
* evaluate tone, sentiment, or quality

Thread Tools must not change canonical message content, authorship, or chronology. Threading/indentation remains as defined by the LiveView contract; lenses may only apply structural emphasis at the thread level.

---

### 1.4.1 Thread Presentation (TrainerView + AudienceInput)

In trainer-local views (TrainerView and AudienceInput), threads may be **collapsed by default** for tractability:

* The thread root remains visible
* Replies are hidden until the user expands the thread
* Collapsing is a navigation affordance and must not imply importance, neglect, or evaluation

This is a UI presentation choice and does not alter canonical message state. LiveView behavior remains governed by the LiveView contract and may differ.

---

### 1.4.2 Ephemeral Thread Activity Pulse (TrainerView + AudienceInput)

Trainer-local views (TrainerView and AudienceInput) may render a brief, neutral **activity pulse** on a thread’s **structural chrome** (e.g., the lineage bar) when a new message arrives in that thread.

Constraints:

* The pulse must be **ephemeral** (on the order of ~1 second) and **non-accumulating**
* The pulse must not imply importance, priority, urgency, neglect, or “unread” state
* The pulse must be visual-only and must not change canonical ordering, visibility, or content

This mechanism exists to preserve a “live document” feel without introducing semantic meaning.

---

### 1.5 Normative Definitions (Binding)

* **Thread**: a root message and all of its descendant replies. Thread identity is the root message id (`rootMessageId`).
* **Reply count**: number of replies in the thread excluding the root message.
* **Canonical order**: the canonical LiveView message order (chronological). Shared lenses must not reorder it.
* **Recent window**: a fixed, system-set lookback window used only for discrete boundary crossing detection (not trainer-configurable).

---

### 1.6 System-Set Defaults (Non-Configurable)

* **Threads That Grew**: 300s window; boundary crossing is **reply count** moving from ≤ 4 to ≥ 5.
* **Topic Changes**: 120s window; eligible changes are reversible transitions between system-recognized on-topic/off-topic states.
* **New Since Last View**: uses trainer-local “last view” timestamp (not time-windowed).

---

## 2. Allowed Thread Tools (Explicit Allowlist)

Only the following tools are permitted.

No additional Thread Tools may be introduced without amending this contract.

---

### 2.1 New Since Last View

**Trainer intent supported:**

> “What’s new since I last looked?”

**Definition:**
Displays threads that have received new messages since the trainer last viewed the thread map (trainer-local timestamp).

**Constraints:**

* “Last view” is trainer-local and ephemeral (single timestamp; no per-thread read/unread state)
* No canonical read/unread state is created
* No implication of importance, urgency, or neglect
* No automatic expansion, isolation, or surfacing of individual messages outside their thread context

This tool exists solely for **orientation recovery**.

---

### 2.2 Threads That Grew

**Trainer intent supported:**

> “Which conversations accumulated more discussion?”

**Definition:**
Displays threads that crossed the system-set growth boundary within the system-set recent window:

* **Window**: last 300 seconds
* **Boundary**: reply count crosses from ≤ 4 to ≥ 5

**Constraints:**

* Growth is measured only by **reply count** (discrete boundary crossing)
* No rates, trends, velocity, or comparisons are allowed
* Thresholds are fixed and not trainer-configurable
* Growth does not imply quality, interest, or priority

This tool describes **structural accumulation**, not significance.

---

### 2.3 Topic Changes

**Trainer intent supported:**

> “Did anything move off topic or come back?”

**Definition:**
Displays threads that transitioned between on-topic and off-topic states within the system-set recent window:

* **Window**: last 120 seconds

**Constraints:**

* Only reversible, system-recognized topic states are used
* No attribution, blame, or permanence is implied
* State transitions must already be visible elsewhere in the system

This tool reflects **categorical movement**, not evaluation.

---

## 3. Shared Structural Lenses (Integrated)

### 3.1 Definition

A **Shared Structural Lens** is a Thread Tool whose structural emphasis has been **explicitly promoted by the trainer** to be visible in LiveView.

Shared Structural Lenses allow the room to **look together at one structural aspect of its own conversation**, without hiding, suppressing, or judging any part of it.

They do not replace canonical LiveView. They overlay it.

---

### 3.2 Amplification Through Visibility

Shared Structural Lenses exist to **amplify audience voices** by revealing collective patterns that emerge at scale.

They may:

* highlight threads
* group threads (without reordering canonical order)
* annotate structural change
* visually emphasize accumulation or categorization

They must never:

* declare importance
* select winners
* imply urgency or neglect
* suppress non‑emphasized content
* filter, hide, or reorder the canonical thread map while shared

Nothing disappears.

---

### 3.3 Allowed Shared Lenses

Only Thread Tools explicitly allowed in this contract may be promoted to Shared Structural Lenses.

At present, the following tools are eligible for promotion:

* **New Since Last View**
* **Threads That Grew**
* **Topic Changes**

No new promotable lenses may be introduced without revising this contract.

---

### 3.4 Trainer Authority & Responsibility

Promotion of a Thread Tool to a Shared Structural Lens:

* must be an explicit trainer action
* must be clearly visible to the room
* must be reversible in a single action
* must be non‑persistent

The trainer chooses *when* the room looks together. The system never promotes lenses automatically.

---

### 3.5 Alignment While Shared (Non‑Negotiable)

When a Shared Structural Lens is active, **the trainer view and the room view must remain aligned**.

This means:

* The trainer and the room are looking through the same structural lens
* The trainer may not privately switch to a different lens while sharing is active
* Any change in lens requires the shared lens to be explicitly unshared first

This rule ensures that shared framing is honest, symmetric, and trust‑preserving.

Shared attention must never be guided by unseen structure.

---

### 3.6 Visibility & Meaning Constraints

When a Shared Structural Lens is active:

* LiveView must clearly indicate that a lens is applied
* The lens must be named in neutral, descriptive language
* The system must not narrate interpretation or intent

Shared Structural Lenses must not imply:

* importance
* quality
* correctness
* consensus
* conflict
* obligation

They answer only:

> “What does the conversation look like through this structural aspect?”

---

## 4. Explicit Prohibitions

Thread Tools must not:

* Rank threads by importance, quality, or value
* Surface sentiment, tone, or emotional interpretation
* Track or display trainer acknowledgment
* Suggest that action is required
* Evaluate participant behavior
* Persist effects beyond the active view
* Operate on multiple lenses simultaneously

Any tool that answers “what should the trainer do?” is invalid.

---

## 5. Measurement Constraints

Thread Tools may recognize change **only when a thread crosses a predefined, discrete boundary** in a system-defined property.

Allowed measurements include:

* message count thresholds
* state transitions
* time-based recency (fixed windows)

Disallowed measurements include:

* trends
* velocity or acceleration
* inferred importance
* subjective classifications

If a measurement can be reasonably argued about, it is too semantic to surface.

---

## 6. Visibility & Narration

When a Thread Tool is active:

* The Messages area must clearly indicate the active lens
* The indication must be descriptive, not advisory
* Clearing the tool must restore the default canonical view

Example (illustrative only):
`Viewing: New Since Last View`

The trainer must never be unsure which lens is applied.

---

## 7. Trainer Role Boundary

Thread Tools must not rely on trainer judgment to prevent harm.

They are designed to:

* reduce cognitive load
* improve orientation
* preserve dignity under scale

They are not designed to:

* enforce norms
* manage behavior
* adjudicate relevance

The system absorbs complexity so the trainer does not have to.

---

## 8. Status

This contract is **binding** until explicitly revised.

Any future proposal that:

* adds evaluative language
* introduces composable filters
* implies obligation or priority
* or alters canonical meaning

constitutes a violation and must be rejected or amended.

---

# 📜 SHARED STRUCTURAL LENSES CONTRACT

*Room-Facing · Structure-Amplifying · Dignity-Preserving*

---

## 0. Purpose

**Shared Structural Lenses** exist to allow a room to **look together at its own conversation** through a clearly defined, temporary structural lens.

Their purpose is to:

* amplify audience voices by revealing patterns that emerge at scale
* prevent meaningful contributions from being lost in unexamined accumulation
* align trainer and audience understanding of what is happening in the room

Shared Structural Lenses do **not** evaluate, rank, or judge contributions.
They reveal structure that already exists.

---

## 1. Core Principle (Non-Negotiable)

### 1.1 Amplification Through Visibility

A Shared Structural Lens must **amplify audience expression**, not diminish it.

Amplification means:

* making collective patterns visible
* surfacing accumulation, change, or categorization
* helping the room notice what it is already saying

Amplification does **not** mean:

* declaring importance
* selecting winners
* suppressing voices not currently emphasized

---

## 2. Relationship to Canonical LiveView

### 2.1 Canonical Reality Is Never Replaced

Shared Structural Lenses **overlay** the canonical LiveView.

They must not:

* hide threads
* remove messages
* replace the underlying map
* create a new “primary” view

The full conversation remains present at all times.

---

### 2.2 Emphasis, Not Exclusion

A Shared Structural Lens may:

* highlight
* outline
* group
* annotate
* visually emphasize

It must never:

* filter out
* dim into illegibility
* collapse away
* exile content from view

Nothing disappears.

---

## 3. Allowed Shared Lenses (Strict Inheritance)

Shared Structural Lenses may only be promoted from **existing, contract-approved Thread Tools**.

At launch, the allowed shared lenses are:

* **New Since Last View**
* **Threads That Grew**
* **Topic Changes**

No new shared lenses may be introduced without amending both:

* the Thread Tools Contract
* this Shared Structural Lenses Contract

This ensures shared framing never outruns trainer-safe framing.

---

## 4. Trainer Authority & Responsibility

### 4.1 Explicit Promotion

A Shared Structural Lens is activated **only** through an explicit trainer action.

* No automatic promotion
* No system-initiated framing
* No silent escalation from private to shared

The trainer chooses *when* the room looks together.

---

### 4.2 Reversibility

Any Shared Structural Lens must be:

* immediately reversible
* removable in a single action
* non-persistent

When the lens is removed, the room returns to the canonical LiveView without residue.

---

## 5. Visibility & Acknowledgment

### 5.1 The Room Must Know a Lens Is Active

When a Shared Structural Lens is active:

* The LiveView must visibly indicate that a lens is applied
* The lens must be named in plain language
* The indication must be neutral and descriptive

Example (illustrative only):

> Viewing: Threads That Grew

No lens may operate invisibly.

---

### 5.2 No Implicit Narration

The system must not narrate *why* a lens is shown.

Interpretation remains:

* human
* conversational
* social

The system provides the view, not the meaning.

---

## 6. Meaning Constraints

Shared Structural Lenses must not imply:

* importance
* urgency
* quality
* correctness
* consensus
* conflict
* neglect

They answer only:

> “What does the conversation look like through this structural aspect?”

They never answer:

> “What should we think about this?”

---

## 7. Dignity Guarantees

Shared Structural Lenses must preserve:

* visibility of all threads
* anonymity of participants
* reversibility of categorization
* equal visual dignity for emphasized and non-emphasized content

A lens must never make a participant feel erased for not being highlighted.

---

## 8. Failure Modes (Explicitly Guarded Against)

This contract explicitly prohibits Shared Structural Lenses that:

* turn the room into a leaderboard
* imply problems or solutions
* replace facilitation with automation
* create an epistemic divide between trainer and audience
* frame silence as absence or irrelevance

If a lens answers “what matters,” it is invalid.

---

## 9. Status

This contract is **binding** until explicitly revised.

Shared Structural Lenses and their controls are considered **power-amplifying system features** and must be treated with the same rigor as any mechanism that shapes collective attention.

---

## 10. Thread Tools UI & Interaction Contract (Binding)

This section governs the **user interface controls and interaction semantics** of the Thread Tools toolbox. These rules are normative and exist to ensure that UI behavior enforces, rather than undermines, the structural and dignity guarantees of this system.

---

### 10.1 Control Intent Mapping (Non-Negotiable)

Each control in the Thread Tools toolbox must map cleanly to a single trainer intent:

* **Lens Selection** answers: *“What structural question am I asking of the conversation?”*
* **Sharing** answers: *“Is the room invited to look through this lens with me?”*
* **Clearing** answers: *“Am I exiting this frame?”*

No control may collapse multiple intents into a single action.

---

### 10.2 Lens Selection Controls

Lens selection must be implemented as **menu-style, single-select controls**.

Requirements:

* Exactly one lens may be selected at a time
* Selecting a lens immediately activates it in the trainer view
* Selecting a different lens replaces the previous one
* Selecting **All Threads** clears any active lens

Prohibited implementations:

* Checkboxes
* Multi-select pills
* Switches
* Dropdowns labeled as “filters”

Lens selection must feel **navigational**, not configurational.

---

### 10.3 Active Lens State Visibility

When a lens is active:

* The active lens must be explicitly named in the toolbox
* The trainer must never be unsure which lens is active
* The active state must be visible without interacting with the lens list

This requirement exists to prevent accidental or forgotten framing.

---

### 10.4 Clearing a Lens

Clearing an active lens must be implemented as a **low-emphasis, inline text action**.

Requirements:

* Clearing must be available whenever a lens is active
* Clearing must be immediate and require no confirmation
* Clearing a lens must automatically unshare it if it is currently shared

Clearing is a normal navigation action, not a corrective or destructive act.

---

### 10.5 Sharing Controls

Sharing a lens with the room must be implemented as a **binary switch**, representing an explicit shared state.

Requirements:

* The switch must have clear OFF and ON states
* The switch must be disabled unless a lens is active
* Turning the switch ON promotes the active lens to a Shared Structural Lens
* Turning the switch OFF immediately unshares the lens

Sharing must be experienced as **entering a mode**, not firing a command.

---

### 10.6 Alignment While Shared (UI-Enforced)

When the sharing switch is ON:

* The trainer and the room must be looking through the same lens
* Lens selection controls must be disabled
* The trainer may not switch lenses without unsharing first

This alignment must be enforced structurally by the UI, not through warnings or training.

---

### 10.7 Canonical View Preservation

While a Shared Structural Lens is active:

* The canonical conversation must remain fully present
* No threads may be removed, hidden, or destroyed
* Structural emphasis must not imply erasure or exclusion

UI affordances must explicitly communicate that shared lenses are **overlays**, not replacements.

---

### 10.8 Prohibited UI Patterns

The following UI patterns are explicitly prohibited within the Thread Tools toolbox:

* Analytics dashboards or reporting visuals
* Controls that imply importance, priority, or obligation
* Multi-lens composition or stacking
* Auto-sharing or system-initiated promotion
* Hidden or implicit shared states

Any UI pattern that allows silent reframing of shared attention constitutes a contract violation.

---

### 10.9 Facilitation Integrity

The Thread Tools UI must support live facilitation by being:

* Fast to operate while speaking
* Legible at a glance
* Honest about state and alignment
* Resistant to accidental misuse

If a control cannot be comfortably used during live facilitation, it violates this contract.
