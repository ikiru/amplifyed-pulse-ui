# CONFUSION CONTRACT
**AmplifyEd TrainerView — Tier-1 Signal**

---

## 1. Purpose

The Confusion system surfaces **where understanding may be breaking down**, so a trainer can decide **what to address next**.

It does **not**:
- judge correctness
- diagnose causes
- rank people
- explain content
- assert failure

It points to **threads**, not answers.

---

## 2. Scope & Principles

### 2.1 What Confusion Measures
Confusion is a **thread-level signal** representing possible misunderstanding of content related to the **current focus**.

It reflects:
- self-reported uncertainty
- peer affirmation of uncertainty
- sustained hesitation patterns

It does **not** reflect:
- quality of discussion
- emotional tone
- engagement
- alignment (handled by Drift)

---

### 2.2 What Confusion Is Not
Confusion is **not**:
- an assessment tool
- an evaluation of participants
- a diagnostic engine
- a replacement for trainer judgment

False positives are acceptable and expected.

---

## 3. Scored Unit

- **Unit of scoring:** Thread / concept
- **Never scored:** Individuals

Each thread maintains an ephemeral internal value:

```ts
thread.confusionScore: number
