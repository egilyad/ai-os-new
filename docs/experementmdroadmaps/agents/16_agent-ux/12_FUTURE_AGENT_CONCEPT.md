# 12_FUTURE_AGENT_CONCEPT — Realized Concept from EXISTING capabilities

> A concrete, buildable concept for `agent-ux` that uses **only** infrastructure already in the repo (no new buses/adapters/facades, per AGENTS.md discipline).

## Concept: "The User Advocate" — a reusable UX-review & research concierge

`agent-ux` becomes the system's standing **user-centered reasoning layer**, realized by composing five existing primitives:

1. **Persona** (`persona-selector.ts`) — a `ux_researcher` variant (Q3) makes debate turns genuinely UX-framed.
2. **Lens** (`lens-engine` + `lens-library.ts`) — a `lens:ux` perspective (M1) reusable in Synthesis, Debate, and Director reviews.
3. **Scenario** (`conversation-director-service` B3 + `ScenarioEditor`) — a seeded "UX Review" scenario (Q1) gives one-click, replayable reviews.
4. **Memory** (`memory-engine`) — a `agent:agent-ux` namespace (M3) persists findings + user personas (B3) so the agent accumulates UX knowledge.
5. **Invocation** (`phase21-invocation.ts`) — RoomPanel + expertise-match policy (Q5) lets any human route UX tasks to it with zero code for routing.

## How it works end-to-end (no new architecture)

```
Human in RoomPanel picks "Theo Nakamura — UX Researcher"
   → Invocation Engine (expertise policy suggests) → mode=chat/scenario
   → ScenarioRepository.create("UX Review") → ConversationDirector.run()
   → Turn 1: agent-ux applies lens:ux + ux_researcher persona to the product text
   → Turn 2: agent-designer responds; agent-ux synthesizes prioritized fixes
   → Each TurnResult recorded (RecordingExecutionEngine)
   → UX findings written to MemoryService (tag agent:agent-ux, type:ux-finding)
   → COGNITIVE_STEP_COMPLETED → AgentService stats + LiveActivityStream
   → Optional: findings exported to CrystalVault (Module 2) / Forum (Module 6)
```

## What changes vs today

| Today                                       | Concept                                           |
| ------------------------------------------- | ------------------------------------------------- |
| Generic analyst with "UX researcher" prompt | User Advocate with UX lens + persona + memory     |
| Cold every run                              | Accumulates UX findings/personas                  |
| Debate = mismatched generic persona         | Debate = consistent usability/accessibility voice |
| No discoverability                          | One-click "Run UX Review" + expertise suggestion  |

## Why this is the right shape

- **Reuses** every module the repo already built (Lenses, Director, Memory, Invocation, Crystal, Forum).
- **No new contracts** beyond optional `lens:ux` + 1 persona variant.
- **Authority stays human** (invocation D6), agent never self-invokes.
- **Engine remains the sole writer** of its own state; UI stays a consumer.

**[OPINION]** This concept is achievable in roughly 2-3 sprints of mostly additive, low-risk work and converts `agent-ux` from a labeled prompt into a genuinely differentiated system agent.
