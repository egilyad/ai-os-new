# 14_ALTERNATIVE_ROADMAP — Roadmap B (platform/abstraction-first)

Philosophy contrast: instead of enriching one agent, invest in a **generic "expertise layer"** that all 25 agents benefit from, with `agent-devops` as the reference implementation. Trades short-term agent-specific wins for long-term systemic leverage.

## Core difference vs Roadmap A

- **A** edits `persona-selector`, `agent-journal-service`, `lens-library` for devops specifically.
- **B** generalizes: a single `SpecializationService` + `ExpertiseRegistry` makes _every_ agent's `specializations` (`agent-profiles.ts`) first-class — persona bias, memory tagging, debate seating, and lens suggestion become universal, devops merely the pilot.

## Phase 0 — Platform primitive

| Task                                                              | Reuse                     | UI   | Effort | Risk |
| ----------------------------------------------------------------- | ------------------------- | ---- | ------ | ---- |
| `SpecializationService` reads `AGENT_PROFILES[*].specializations` | `agent-profiles.ts`       | none | M      | Med  |
| Wire into `PersonaSelector` (specialization→variant bias)         | `persona-selector.ts:251` | none | M      | Med  |

## Phase 1 — Universal memory tagging

| Task                                                  | Reuse                      | UI         | Effort | Risk |
| ----------------------------------------------------- | -------------------------- | ---------- | ------ | ---- |
| Journal auto-tags from specializations for ALL agents | `agent-journal-service.ts` | none       | M      | Low  |
| Specialization chips on all AgentCards                | `AgentsPanel`              | card chips | S      | Low  |

## Phase 2 — Expertise registry + routing

| Task                                       | Reuse                                                 | UI        | Effort | Risk |
| ------------------------------------------ | ----------------------------------------------------- | --------- | ------ | ---- |
| `ExpertiseRegistry` indexes 25 agents      | `AgentResolverDirectory` (`phase21-invocation.ts:43`) | none      | M      | Med  |
| Topic→agent routing in Invocation + Debate | `InvocationEngineService`, debate meta-agent          | policy UI | L      | Med  |

## Phase 3 — Reference workflows (devops pilot)

| Task                                                | Reuse                    | UI          | Effort | Risk |
| --------------------------------------------------- | ------------------------ | ----------- | ------ | ---- |
| Incident post-mortem as a _generic_ expert workflow | Builder/Director/Crystal | template    | L      | Med  |
| Devops ops lens (now shared)                        | `lens-library.ts`        | lens picker | M      | Low  |

## Trade-offs (B vs A)

| Dimension                  | A (agent-first)                 | B (platform-first)                 |
| -------------------------- | ------------------------------- | ---------------------------------- |
| Time to first devops value | Fast (Q-wins in days)           | Slower (primitives first)          |
| Leverage                   | 1 agent                         | 25 agents                          |
| Risk                       | Low (localized)                 | Higher (cross-agent regression)    |
| Maintenance                | Some duplication per agent      | Centralized                        |
| Best when                  | devops is the priority use-case | expertise is a core product thesis |

## Recommendation (OPINION)

Start with **A's Phase 0–1** (cheap, contained), then migrate the successful devops bridges into **B's primitives** so the other 24 agents inherit them. This captures quick wins without betting the roadmap on a platform rewrite first.
