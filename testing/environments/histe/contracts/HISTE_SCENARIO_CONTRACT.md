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

Scenarios must remain purely descriptive. They do not contain executable logic, references to system internals, or references to instrumentation.
