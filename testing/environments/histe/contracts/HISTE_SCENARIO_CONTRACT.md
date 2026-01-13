# HISTE Scenario Contract

Governed by:
- docs/TESTING_ENVIRONMENTS.md
- server/contracts/Human Interaction Stress Testing Environment (HISTE).md

Scenario files describe **declarative, data-only instructions** for simulated audience behavior.
They may include the following fields (all optional):

| Field | Description |
| --- | --- |
| `participantCount` | Range object `{ min, max }` controlling how many simulated participants are scheduled. Defaults to `{ min: 3, max: 5 }`. |
| `participants` | Alias for `participantCount`. |
| `tempo` | Range object `{ min, max }` in milliseconds describing how long each participant waits before emitting a message. Defaults to `{ min: 200, max: 800 }`. |
| `messageTempo` | Alias for `tempo`. |
| `messageTexts` | Array of string messages that participants will rotate through. |
| `messages` | Alias for `messageTexts`. |
| `description` | Human-readable description for documentation only. |
| `focusEvents` | Array of focus change events. See Focus Events section below. |

Scenarios must remain purely descriptive. They do not contain executable logic, references to system internals, or references to instrumentation.

---

## Focus Events (Optional)

Scenarios may define focus changes that trainers would naturally make during a session.

Each focus event in the `focusEvents` array must include:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `delayMs` | number | Yes | Milliseconds from scenario start when this focus event should occur |
| `action` | string | Yes | Either `"set"` (activate a focus) or `"clear"` (clear current focus) |
| `text` | string | Conditional | Required when `action` is `"set"`. The focus text to display. |

**Example:**

```json
{
  "focusEvents": [
    { "delayMs": 0, "action": "set", "text": "Opening discussion" },
    { "delayMs": 5000, "action": "set", "text": "Deep dive into topic" },
    { "delayMs": 10000, "action": "clear" }
  ]
}
```

**Governance Constraints:**

Focus events must respect the **Phase 8 Focus Governance** contract:
- Only trainers may set/clear focus (simulated trainer socket will be used)
- Focus is explicit, not inferred
- One focus active at a time (setting new focus deactivates previous)
- Clearing focus results in no active focus (valid state)

**Interaction Boundary:**

Focus events are executed through the same `focus:set` and `focus:clear` socket events that a real trainer would use. No privileged or internal paths are permitted.

The HISTE simulated trainer must join the session with `role: "trainer"` to have permission to emit focus events.
