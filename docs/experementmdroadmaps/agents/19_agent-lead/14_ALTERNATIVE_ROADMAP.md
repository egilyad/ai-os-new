# 14_ALTERNATIVE_ROADMAP — Philosophy B: "Coordinator" as a cross-cutting service

> Second philosophy vs A. Trade-offs explicit. OPINION.

## Philosophy A (13_ROADMAP): activate semantics in-place

- agent-lead _becomes_ the coordinator by wiring its `specializations` into existing seams (meta-agent, policy, groups, invocation).
- Pros: zero new services; reuses everything; low risk; ships incrementally.
- Cons: coordination logic is _distributed_ across meta-agent/policy/groups; no single owner; harder to reason about; lead behavior invisible to other "coordination" agents (agent-pm also qualifies).

## Philosophy B: a dedicated `CoordinatorService` (cross-cutting)

- New thin service that _owns_ coordination policy: given a set of agents + a goal, it decides who leads, inserts synthesis turns, assigns debate moderator, manages handoffs — reusing `AgentResolverDirectory` + `MetaAgentController` + `HybridPolicy` as libraries, but centralizing the _decision_.
- Pros: single ownership; can apply to ANY agent with `Coordination` specialization (not just agent-lead); testable in isolation; clean separation.
- Cons: new service + DI registration (phase); more upfront effort (L); risk of over-engineering a 25-agent hobbyist OS; may conflict with "no new facades" discipline (AGENTS.md kernel rules: contracts at boundaries, no circular deps).

## Trade-off summary

| Axis                | A (in-place)                  | B (service)                         |
| ------------------- | ----------------------------- | ----------------------------------- |
| New code            | Minimal (roles/policies/tags) | New `CoordinatorService` + contract |
| Risk                | Low (additive)                | Med (new surface, lifecycle)        |
| Reuse               | Max (all seams)               | Max (same seams, wrapped)           |
| Generality          | lead-only                     | any coordination agent              |
| Time to first value | Days                          | Weeks                               |
| Architectural fit   | Fits "no new facades"         | Straddles boundary (needs care)     |

## Recommendation (OPINION)

Start with **A** through Phase 2 (cheap, proves value). If coordination proves popular and other agents (agent-pm, agent-po) also need it, **extract B** from the A code as a refactor — not upfront. This avoids building a 26th framework before confirming demand (see 15_DO_NOT_BUILD_YET).

## Hybrid middle path

- Keep A's distributed activation, but add a _pure function_ `selectCoordinator(agents)` in `agent-identity.ts` (no service, no DI) that returns the best Coordination agent. Reused by meta-agent, policy, groups. Gives B's generality at A's cost. **Preferred.**
