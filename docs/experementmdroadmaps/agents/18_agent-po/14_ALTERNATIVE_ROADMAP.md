# 14 — ALTERNATIVE ROADMAP (Plan B: autonomous-governor philosophy)

> Second philosophy + trade-offs vs Plan A.

## Philosophy

Plan A is **capability-first, human-triggered** (PO stays a tool the human invokes). Plan B is **autonomy-first**: promote `agent-po` to a _standing_ Scope Governor that passively observes ConversationCore/Debate streams and intervenes on scope/priority signals — pushing PO from "invoked persona" to "ambient guardian."

## Shape of Plan B

- **B-trigger:** a permanent subscriber (new `ScopeGovernorService`) on `conversation:*` + `debate:*` events that detects scope-drift / priority keywords and raises a PO intervention (a synthetic turn or a UI flag).
- **B-decision:** PO emits structured `ScopeVerdict` (in-scope / out-of-scope / reprioritize) consumed by Director/Debate.
- **B-memory:** always-on backlog memory (Plan A P3.2 but permanent).

## Trade-offs vs Plan A

| Dimension             | Plan A (capability-first)  | Plan B (autonomy-first)                                           |
| --------------------- | -------------------------- | ----------------------------------------------------------------- |
| Authority model       | Matches D6 (human invokes) | Risks D6 (agent acts without explicit invoke)                     |
| Risk                  | Low (config + UI)          | High (new always-on subscriber, event-storm, false interventions) |
| Reuse                 | 100% existing              | Needs new subscriber + verdict contract                           |
| Time to value         | Days–weeks                 | Weeks–months                                                      |
| Failure mode          | PO just underused          | PO spams scope warnings, annoys users                             |
| Fit with architecture | Perfect (dispatch model)   | Tensions with D5 (engine=dispatch, not autonomous)                |

## Recommendation (OPINION)

Plan B should **NOT** be built as autonomous. It violates D6 (authority=human) and D5 (engine is thin dispatch, not an autonomous actor). If "ambient" value is wanted, the **safe** variant is: PO as an _opt-in_ standing participant in a Director scenario (Plan A P4 + P3.1), not a silent event subscriber. Plan B's only salvageable idea is the `ScopeVerdict` structured output — which Plan A P3.1 already delivers without autonomy.

→ **Choose Plan A.** Plan B is documented only to record the rejected philosophy and its trade-offs.
