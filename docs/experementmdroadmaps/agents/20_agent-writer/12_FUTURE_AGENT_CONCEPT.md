# 12_FUTURE_AGENT_CONCEPT — Realized concept from EXISTING capabilities

> A realized (not speculative) concept: what `agent-writer` becomes if we wire **only** what already exists, with no new subsystems.

## Concept: "Clara, the Documentation Concierge"

Today Clara is a passive, generic LLM node. The **entire** concept below is achievable by composing existing services — no new engine, no new event family, no new agent.

### The realized capability chain

```
Human (RoomPanel)
  └─ picks "Clara Bengtsson — Technical Writer"
  └─ Mode: Document (Q1)  ──reuses──> InvocationEngine.invoke (phase21-invocation.ts)
        └─ policy: human-mention (already seeded)  ──reuses──> AgentResolverDirectory → agentService
        └─ delegate: ConversationCore chat  ──reuses──> ChatExecutor → agentService.resolveAgent('agent-writer')
              └─ emits conversation:* (B4)  ──reuses──> DirectorStore / RoomPanel live feed
              └─ emits COGNITIVE_STEP_COMPLETED(nodeId)  ──reuses──> AgentService stats, AgentJournal, MemoryEngine
        └─ on done: sessionRef set  ──reuses──> RoomPanel "Open Session" → /director?session=…
```

### What she can ALREADY do (verified)

- Be invoked by a human with a writing brief (Invocation, RoomPanel). `[VERIFIED]`
- Speak with her pinned groq/llama-3.1-8b-instant identity + Technical Writer prompt. `[VERIFIED]`
- Participate in debates (as a generic persona) and Director scenarios (if named). `[VERIFIED]`
- Accrue stats, journal entries, health monitoring. `[VERIFIED]`
- Surface in every agent UI (card, detail, chip, badge, board). `[VERIFIED]`

### What the concept ADDS (small, existing-infra only)

1. **A `document` mode in RoomPanel** (Q1) — 1 new policy match + 1 button. No kernel change.
2. **Expertise pre-select** (Q2) — policy `match.expertise:['Documentation']`. No engine change.
3. **A Documentation activity strip** (Q3) — display-only over `getStats`.
4. **Optional grounding tool** (M1) — node `tools` already extensible.

### The "concierge" behavior, realized

> A user opens RoomPanel, types "Write an onboarding tutorial for the Invocation Engine", picks Clara (auto-suggested), clicks Invoke. Clara drafts the tutorial via ConversationCore (chat delegate), the live `conversation:*` feed shows her writing in RoomPanel, stats accrue, and "Open Session" jumps to the Director view of that session. If `documents` store (M2) exists, the draft is persisted and versioned; doc-simplifier can then refine it.

### Why this is "realized" and not "speculative"

Every arrow in the chain maps to a file:line already in the repo:

- Invocation: `phase21-invocation.ts`, `invocation-engine-service.ts`, `AgentResolverDirectory`.
- Identity: `agent-service.ts:337`, `agent-identity.ts:62`.
- Execution: `ChatExecutor`, `ConversationOrchestrator`, `conversation-director-service.ts`.
- Events: `event-registry.ts` (`conversation:*`, `COGNITIVE_STEP_COMPLETED`), `directorStore.ts`.
- UI: `RoomPanel`, `DirectorPanel/RunTab`, `AgentsPanel/AgentCard`.
- Persistence (optional): `crystal-repository.ts`/`scenario-repository.ts` DAL pattern.

No new framework. The "concierge" is the writer node + Invocation + RoomPanel + existing events, stitched by configuration and a few UI controls.
