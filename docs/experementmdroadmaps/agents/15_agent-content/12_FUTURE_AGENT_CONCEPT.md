# 12 — FUTURE AGENT CONCEPT (realized from EXISTING capabilities)

> A concrete, buildable concept that uses ONLY capabilities already present in the repo. No new subsystem required.

## Concept: "Lena's Editorial Desk" — a content workspace built from existing primitives

**Thesis.** `agent-content` already has everything needed to be a useful _content operator_ except composition. "Lena's Editorial Desk" composes existing pieces into a coherent experience without writing any new agent runtime.

### Existing capabilities it reuses (VERIFIED)

| Need                           | Existing primitive                                      | Evidence                                                     |
| ------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------ |
| Identity "Lena Petrova"        | curated `AGENT_PROFILES` + `normalizeAgentIdentity`     | agent-profiles.ts:162; topology-defaults.ts:91-119           |
| Drafting                       | single LLM turn via OrchestrationService / ChatExecutor | orchestration-service.ts:414; agent-service.ts:337           |
| Multi-pass (draft→review→edit) | Director `TurnProposal` + `HybridPolicy`                | conversation-orchestrator.ts; contracts/conversation/turn.ts |
| Human trigger                  | RoomPanel invocation                                    | phase21-invocation.ts:44-109                                 |
| Quality signal                 | `COGNITIVE_STEP_COMPLETED` listener (heuristic scorer)  | memory-engine.ts:181 pattern                                 |
| History                        | `agentJournalService.listByAgent`                       | agent-journal-service.ts:253                                 |
| Continuity                     | memory `source:nodeId` (filter by agent)                | memory-engine.ts:188                                         |
| Publishing surface             | Forum topics/posts                                      | forum-service (AGENTS.md Module 6)                           |
| Peer review                    | Debate participants                                     | debate-agent-executor.ts; persona-selector.ts                |
| Grouping                       | `Creative` audit group                                  | prompt-audit-service.ts:23                                   |

### The realized workflow (no new code, just configuration + light UI)

1. **Brief.** Human opens RoomPanel, picks Lena, chooses a content preset (QW-4) → Invocation → Director scenario (chat).
2. **Draft.** Director runs `agent-content` with a `DRAFT` objective (MED-2 new objective type — tiny contract addition).
3. **Score.** A `COGNITIVE_STEP_COMPLETED` listener computes readability/SEO (QW-1) and emits `cognitive:decision:made` (fixes dead event, 07).
4. **Review.** Director loops `agent-critic` REVIEW → `agent-content` EDIT. (MED-2 template.)
5. **Publish/Queue.** Final draft posted to Forum as a topic for human + agent review (forum-service), or saved to memory with `source:'agent-content', type:'content'` (MED-1) for later retrieval.
6. **Portfolio.** AgentDetailPanel "Editorial Desk" tab shows journal + scored drafts (MED-4).

### Why this is the RIGHT concept

- **Zero new runtime.** Every step maps to a shipped service. The only _additions_ are: 2-3 `TurnProposal.objective.type` values, 1 `PersonaSelector` variant, 1 heuristic scorer listener, and UI tabs. All additive, all backward-compatible.
- **Honors architecture.** Agents stay topology nodes; behavior stays shared infra. "Lena" is a _composition_ of prompt + model + tools + scenario + memory + UI, exactly as AGENTS.md prescribes.
- **Incremental.** Each of the 5 QUICK WINS and 5 MEDIUM items in 11_OPPORTUNITIES is independently shippable; the Desk emerges from them.

### What it deliberately does NOT become

- Not a new `ContentAgentService` (would violate "no agent-specific service").
- Not a separate content database (reuses memory + journal + forum).
- Not autonomous publishing without human authority (D6 in INVOCATION_ENGINE.md).

### Success metric

A user can go from "write a post about X" → a scored, reviewed, publishable draft attributed to Lena, with a visible history of her past work — using only compositions of existing services.
