# 14_ALTERNATIVE_ROADMAP — Philosophy B: specialize the agent as a first-class QA subsystem

Contrast with **Philosophy A** (13_ROADMAP): activate the _existing_ `agent-quality` node via shared seams. Philosophy B instead treats QA as a **dedicated subsystem** with agent-quality as its front-end.

## Core difference

- **A:** one node, behaviour from persona/lens/invocation/director/memory + display events. Minimal new code; consistent with 25-node model.
- **B:** a `QualityAssuranceService` that owns QA-specific state machines (test-plan lifecycle, coverage model, gate evaluation), with `agent-quality` as the conversational face. More powerful, more code, more divergence from the shared-infra principle.

## Trade-offs vs A

| Axis                        | A (seams)                   | B (subsystem)                               |
| --------------------------- | --------------------------- | ------------------------------------------- |
| Code volume                 | Low (additive, ~few files)  | High (new service + state + store)          |
| Consistency w/ other agents | High (same patterns)        | Lower (QA becomes special)                  |
| Capability ceiling          | Medium (design/review/gate) | High (real test orchestration, coverage DB) |
| Regression risk             | Low                         | Med-High (new aggregate, new bus risk)      |
| Time to value               | Fast (QW1-5 in days)        | Slow (weeks)                                |
| Maintenance                 | Shared infra owners         | Dedicated QA owner                          |

## When B is justified

Only if the team wants `agent-quality` to **actually execute tests** (call a runner, parse results, maintain a coverage DB) and to be a **policy enforcer** across debates/conversations/workflows — i.e. a quality _platform_, not a participant. That requires:

- a test-runner adapter (new infra — explicitly out of Philosophy A scope),
- a coverage store (new Dexie table — A reuses `service-backed-memory`),
- a gate-evaluation engine (new service — A reuses Director turn + display event).

## Recommendation

**Adopt A now; keep B as a future option.** A delivers 80% of user value (visible, invocable, gating QA) with ~10% of the code and zero architecture divergence. Revisit B only if metric "QA verdicts must block deploys automatically" is prioritised — and even then, build B _on top of_ A's seams (persona/lens/invocation/director/memory) rather than replacing them.

## Phase sketch for B (if chosen later)

- B-P0: `QualityAssuranceService` (test-plan CRUD + coverage model) over `service-backed-memory`.
- B-P1: test-runner adapter (external) + result parsing.
- B-P2: gate-evaluation hooked into Director `completed` and Builder deploy.
- B-P3: autonomous QA scheduler over `AgentJournalService`.
- Risk: high (new aggregate + potential second bus); Deps: all of A first.
